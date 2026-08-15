#!/usr/bin/env node
/**
 * Verifies the migration ledger describes the migration files.
 *
 * WHY THIS EXISTS. Every migration ends with
 *
 *   select private.record_migration('0061', 'assignment_scoped_staff_access');
 *
 * and `public.schema_migrations` is read by the admin Database screen and by
 * anyone asking "is production up to date?". That row is written by hand, by
 * whoever copied the previous migration as a starting point — which is exactly
 * how a file called `0063_manual_payment_instructions.sql` ends up recording
 * itself as `0062`. Nothing fails. The migration applies, the ledger is wrong,
 * and the next person to compare disk against database chases a phantom.
 *
 * The failure is silent, permanent, and only visible by reading two things side
 * by side — which is what this does:
 *
 *   1. the recorded version and name match the filename
 *   2. numbering is contiguous, with no gaps and no duplicates
 *   3. 0000 exists (it defines record_migration; without it nothing else runs)
 *   4. every migration records itself at all
 *
 * Offline and dependency-free. It cannot see whether a migration has actually
 * been APPLIED — that needs a connection, and lives in
 * tests/db/migration-drift.sql.
 *
 *   node scripts/check-migrations.mjs
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), "supabase/migrations");

const files = readdirSync(DIR)
  .filter((n) => n.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error("✗ migrations: no .sql files found in supabase/migrations");
  process.exit(1);
}

const problems = [];
const seen = new Map();

for (const file of files) {
  const named = /^(\d{4})_([a-z0-9_]+)\.sql$/.exec(file);
  if (!named) {
    problems.push(`${file}  filename is not NNNN_lower_snake_case.sql`);
    continue;
  }
  const [, version, name] = named;

  if (seen.has(version)) {
    problems.push(`${file}  duplicate version ${version} (also ${seen.get(version)})`);
  }
  seen.set(version, file);

  const sql = readFileSync(join(DIR, file), "utf8");
  const recorded = /record_migration\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/.exec(sql);

  // 0000 defines the function, so it is the one file allowed not to call it.
  if (!recorded) {
    if (version !== "0000") {
      problems.push(`${file}  never calls private.record_migration — it will not appear in the ledger`);
    }
    continue;
  }

  const [, gotVersion, gotName] = recorded;
  if (gotVersion !== version) {
    problems.push(`${file}  records version '${gotVersion}', filename says '${version}'`);
  }
  if (gotName !== name) {
    problems.push(`${file}  records name '${gotName}', filename says '${name}'`);
  }
}

const versions = [...seen.keys()].map(Number).sort((a, b) => a - b);
if (versions.length > 0) {
  if (versions[0] !== 0) {
    problems.push(`numbering starts at ${String(versions[0]).padStart(4, "0")}; 0000 must exist first`);
  }
  for (let i = 1; i < versions.length; i += 1) {
    const gap = versions[i] - versions[i - 1];
    if (gap > 1) {
      const from = String(versions[i - 1]).padStart(4, "0");
      const to = String(versions[i]).padStart(4, "0");
      problems.push(`gap in numbering between ${from} and ${to} — a migration is missing from the repository`);
    }
  }
}

if (problems.length > 0) {
  console.error(`✗ migrations: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    "\nThe ledger in public.schema_migrations is what everyone reads to decide\n" +
      "whether production is current. A wrong row there is worse than no row."
  );
  process.exit(1);
}

console.log(
  `✓ migrations: ${files.length} files, 0000–${String(versions[versions.length - 1]).padStart(4, "0")} contiguous, ` +
    `each records its own version and name`
);
