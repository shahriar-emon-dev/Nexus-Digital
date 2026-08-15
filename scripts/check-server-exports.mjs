#!/usr/bin/env node
/**
 * Verifies that every `"use server"` module exports only async functions.
 *
 * WHY THIS EXISTS. `lib/supabase/availability-actions.ts` exported a plain
 * `WEEKDAYS` array alongside its actions. `tsc --noEmit` was clean and the dev
 * server was happy; `next build` failed with
 *
 *   Error: A "use server" file can only export async functions, found object.
 *
 * — and it failed during page-data collection, several minutes into the build,
 * naming the importing route rather than the offending module. That is an
 * expensive way to learn a one-line rule, and it is exactly the kind of thing
 * that gets discovered on a deploy rather than on a laptop.
 *
 * Types are erased at compile time, so `export type` and `export interface` are
 * always fine. A re-export (`export * from`) is not checked — it cannot be
 * resolved without following the module graph, and the target file gets checked
 * on its own anyway.
 *
 *   node scripts/check-server-exports.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SEARCH = ["lib", "app", "components"];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === "node_modules" || name.startsWith(".")) continue;
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.tsx?$/.test(path)) out.push(path);
  }
  return out;
}

const problems = [];
let serverModules = 0;

for (const dir of SEARCH) {
  for (const file of walk(join(ROOT, dir))) {
    const src = readFileSync(file, "utf8");

    // The directive must be the first statement in the module for Next to
    // treat the file as Server Actions at all.
    if (!/^\s*["']use server["'];?\s*$/m.test(src.split("\n").slice(0, 3).join("\n"))) {
      continue;
    }
    serverModules += 1;

    const lines = src.split("\n");
    lines.forEach((line, i) => {
      const exported = line.match(/^export\s+(?!type\b|interface\b|default\s+async\b)(\w+)/);
      if (!exported) return;

      const kind = exported[1];

      // `export async function foo` — the only unconditionally legal form.
      if (kind === "async") return;

      // `export const foo = async (...)` is legal; `export const foo = [...]`
      // is the bug. Look at what the binding is actually assigned.
      if (kind === "const") {
        const rest = line.slice(line.indexOf("const"));
        if (/=\s*async\b/.test(rest)) return;
        // A multi-line arrow whose `async` sits on the next line.
        if (/=\s*$/.test(rest.trim()) && /^\s*async\b/.test(lines[i + 1] ?? "")) return;
        problems.push(
          `${relative(ROOT, file)}:${i + 1}  export const is not an async function\n      ${line.trim()}`
        );
        return;
      }

      // A synchronous `export function`.
      if (kind === "function") {
        problems.push(
          `${relative(ROOT, file)}:${i + 1}  export function is not async\n      ${line.trim()}`
        );
        return;
      }

      if (kind === "let" || kind === "var" || kind === "class" || kind === "enum") {
        problems.push(
          `${relative(ROOT, file)}:${i + 1}  export ${kind} is not allowed in a "use server" module\n      ${line.trim()}`
        );
      }
    });
  }
}

if (problems.length > 0) {
  console.error(
    `✗ "use server" exports: ${problems.length} illegal export(s)\n`
  );
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    '\nA "use server" module may export only async functions and types.\n' +
      "Move constants to a plain module (see lib/weekdays.ts)."
  );
  process.exit(1);
}

console.log(
  `✓ "use server" exports: ${serverModules} action modules, all exports are async functions or types`
);
