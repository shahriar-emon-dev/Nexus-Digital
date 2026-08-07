/**
 * Re-appends the hand-written aliases after `supabase gen types` overwrites
 * lib/supabase/types.ts wholesale.
 *
 * Losing them breaks middleware, auth and the users table at once, and the
 * failure looks like "Module has no exported member 'Portal'" rather than
 * anything to do with regeneration — so this exists to make the step
 * unforgettable rather than remembered.
 *
 * Usage: node scripts/append-type-aliases.mjs <generated.json>
 */
import { readFileSync, writeFileSync } from "node:fs";

const ALIASES = `
/* --------------------------------------------------------------- aliases --
 * Hand-added below the generated block by scripts/append-type-aliases.mjs.
 */
export type Portal = Database["public"]["Enums"]["portal"];
export type AccessLevel = Database["public"]["Enums"]["access_level"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Role = Database["public"]["Tables"]["roles"]["Row"];
`;

const source = process.argv[2];
if (!source) {
  console.error("usage: node scripts/append-type-aliases.mjs <generated.json>");
  process.exit(1);
}

const { types } = JSON.parse(readFileSync(source, "utf8"));
writeFileSync("lib/supabase/types.ts", types + ALIASES, "utf8");
console.log(`wrote lib/supabase/types.ts (${types.length} chars + aliases)`);
