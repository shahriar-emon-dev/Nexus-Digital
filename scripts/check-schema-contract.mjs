#!/usr/bin/env node
/**
 * Verifies that every column named in a PostgREST `.select()` actually exists.
 *
 * WHY THIS EXISTS. `getRevenueSeries` shipped querying
 * `invoice_payments.received_at`. The column is `paid_at`. `tsc --noEmit`
 * passed, `next build` passed, and it would have thrown on the live admin
 * dashboard the first time anybody opened it — because supabase-js parses
 * select strings at the type level only for simple cases, and a miss degrades
 * to `any` rather than to an error.
 *
 * That is a whole class of bug the compiler structurally cannot catch, and it
 * is the single most likely thing to break when a migration renames something.
 * This closes it with a string comparison against the generated types.
 *
 * Deliberately zero dependencies and no database connection: it must be
 * runnable in CI, on a laptop, and before a deploy, in under a second.
 *
 *   node scripts/check-schema-contract.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const TYPES = join(ROOT, "lib/supabase/types.ts");
const SEARCH = ["lib", "app", "components"];

/* ------------------------------------------------------------ the schema -- */

/**
 * Pulls `Row: { ... }` blocks out of the generated types file.
 *
 * Parsing the generated file rather than querying the database keeps this
 * offline and makes it fail loudly when types are stale — which is itself the
 * signal you want, because stale types are how the column drifts in the first
 * place.
 */
function loadSchema() {
  const src = readFileSync(TYPES, "utf8");
  const tables = new Map();

  // Matches:  tablename: {\n  Row: {  ...  }
  const entry =
    /^\s{6}(\w+):\s*\{\s*\n\s{8}Row:\s*\{\s*\n([\s\S]*?)\n\s{8}\}/gm;

  let m;
  while ((m = entry.exec(src)) !== null) {
    const [, table, body] = m;
    const cols = new Set();
    for (const line of body.split("\n")) {
      const col = line.match(/^\s*(\w+)\??:/);
      if (col) cols.add(col[1]);
    }
    if (cols.size > 0) tables.set(table, cols);
  }
  return tables;
}

/* -------------------------------------------------------------- the code -- */

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === "node_modules" || name.startsWith(".")) continue;
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.tsx?$/.test(path)) out.push(path);
  }
  return out;
}

/**
 * Splits a select string into top-level column names.
 *
 * Embedded resources (`invoice:invoices ( status )`) name a RELATION, not a
 * column of the parent, so the alias and its inner list are skipped — checking
 * them would need FK metadata this script deliberately does not load.
 */
function topLevelColumns(select) {
  const out = [];
  let depth = 0;
  let buf = "";

  for (const ch of select) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (ch === "," && depth === 0) {
      out.push(buf);
      buf = "";
      continue;
    }
    if (depth === 0 && ch !== "(" && ch !== ")") buf += ch;
    else if (depth > 0) buf += ch;
  }
  out.push(buf);

  return out
    .map((s) => s.trim())
    .filter(Boolean)
    // An embed carries a paren group; a plain column never does.
    .filter((s) => !s.includes("("))
    // `alias:column` renames — the real column is on the right.
    .map((s) => (s.includes(":") ? s.split(":").pop().trim() : s))
    .filter((s) => s && s !== "*" && !s.startsWith("..."));
}

const schema = loadSchema();
if (schema.size === 0) {
  console.error("✗ Could not parse any tables from lib/supabase/types.ts.");
  process.exit(1);
}

const problems = [];
let checkedCalls = 0;

for (const dir of SEARCH) {
  for (const file of walk(join(ROOT, dir))) {
    const src = readFileSync(file, "utf8");

    // .from("table") … .select("a, b, c"). The gap may span newlines because
    // the codebase formats these across several lines — but it must NOT span
    // another .from()/.rpc(), or a `.update()` on one table would be paired
    // with the next statement's select and report phantom columns. (It did,
    // on the first run of this script: four false positives, all from that.)
    const calls =
      /\.from\(\s*["'](\w+)["']\s*\)((?:(?!\.from\(|\.rpc\()[\s\S]){0,400}?)\.select\(\s*\n?\s*["'`]([^"'`]*)["'`]/g;

    let m;
    while ((m = calls.exec(src)) !== null) {
      const [, table, , select] = m;
      const cols = schema.get(table);

      // A view or an RPC-backed name that the generated types express
      // elsewhere; not something this check can adjudicate.
      if (!cols) continue;

      checkedCalls += 1;
      for (const col of topLevelColumns(select)) {
        if (!cols.has(col)) {
          const line = src.slice(0, m.index).split("\n").length;
          problems.push(
            `${relative(ROOT, file)}:${line}  ${table}.${col} does not exist`
          );
        }
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`✗ Schema contract: ${problems.length} bad column reference(s)\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    "\nIf a migration renamed something, regenerate lib/supabase/types.ts first."
  );
  process.exit(1);
}

console.log(
  `✓ Schema contract: ${checkedCalls} select() calls, every column exists ` +
    `(${schema.size} tables known)`
);
