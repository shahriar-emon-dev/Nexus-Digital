#!/usr/bin/env node
/**
 * Verifies that every `onConflict` target is backed by a real unique constraint.
 *
 * WHY THIS EXISTS. `saveAssignment()` called
 *
 *   .upsert({...}, { onConflict: "project_id,profile_id" })
 *
 * against a table that had no unique constraint on that pair. Postgres rejects
 * that with 42P10 — "there is no unique or exclusion constraint matching the ON
 * CONFLICT specification" — on every single call. The staff allocation feature
 * had therefore never once succeeded, behind a complete 20 KB UI, and the only
 * visible symptom was an empty table that looked like "nobody has used this
 * yet". It was found by reading `pg_constraint` by hand, months after shipping.
 *
 * Nothing in TypeScript, ESLint or the Next build can catch this: the argument
 * is a string, and the constraint lives in SQL. This pairs the two.
 *
 * Parses the migrations rather than connecting, so it works offline and in CI.
 * A false negative is possible if a constraint is created by a construct this
 * does not parse — it errs toward reporting, because the failure mode it guards
 * is silent and total.
 *
 *   node scripts/check-onconflict.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase/migrations");
const SEARCH = ["lib", "app", "components"];

/* ------------------------------------------------- what the database has -- */

/** Every unique/primary key column-set the migrations create, as sorted keys. */
function loadUniqueSets() {
  const sets = new Set();
  const add = (cols) => {
    const key = cols
      .split(",")
      .map((c) => c.trim().replace(/["`]/g, ""))
      .filter(Boolean)
      .sort()
      .join(",");
    if (key) sets.add(key);
  };

  for (const name of readdirSync(MIGRATIONS)) {
    if (!name.endsWith(".sql")) continue;
    const sql = readFileSync(join(MIGRATIONS, name), "utf8");

    // primary key (a, b) / unique (a, b) — inline or as a table constraint.
    for (const m of sql.matchAll(/\b(?:primary\s+key|unique)\s*\(([^)]+)\)/gi)) {
      add(m[1]);
    }
    // create unique index [if not exists] name on tbl (a, b)
    for (const m of sql.matchAll(/create\s+unique\s+index[^(]*\(([^)]+)\)/gi)) {
      add(m[1]);
    }
    // A single-column PK declared inline: `id uuid primary key ...`
    for (const m of sql.matchAll(/^\s*(\w+)\s+[\w()]+[^,\n]*\bprimary\s+key\b/gim)) {
      add(m[1]);
    }
  }
  return sets;
}

/* ---------------------------------------------------- what the code asks -- */

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === "node_modules" || name.startsWith(".")) continue;
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.tsx?$/.test(path)) out.push(path);
  }
  return out;
}

const uniqueSets = loadUniqueSets();
if (uniqueSets.size === 0) {
  console.error("✗ Could not parse any unique constraints from supabase/migrations.");
  process.exit(1);
}

const problems = [];
let checked = 0;

for (const dir of SEARCH) {
  for (const file of walk(join(ROOT, dir))) {
    const src = readFileSync(file, "utf8");

    for (const m of src.matchAll(/onConflict:\s*["'`]([^"'`]+)["'`]/g)) {
      checked += 1;
      const key = m[1]
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .sort()
        .join(",");

      if (!uniqueSets.has(key)) {
        const line = src.slice(0, m.index).split("\n").length;
        problems.push(
          `${relative(ROOT, file)}:${line}  onConflict "${m[1]}" has no matching unique constraint`
        );
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`✗ onConflict targets: ${problems.length} unbacked upsert(s)\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    "\nPostgres raises 42P10 on every call to these — the upsert silently never\n" +
      "succeeds. Add the constraint in a migration, or fix the column list."
  );
  process.exit(1);
}

console.log(
  `✓ onConflict targets: ${checked} upsert(s), each backed by a unique constraint ` +
    `(${uniqueSets.size} constraint sets known)`
);
