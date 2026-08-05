"""Writes lib/supabase/types.ts from a Supabase type-generation payload.

The MCP type generator returns JSON, and the generated block does not include
the hand-added aliases the app imports. This re-appends them, so regenerating
after a migration is one command rather than a merge done from memory.

    python scripts/apply-types.py <payload.json>
"""
import io
import json
import sys

data = json.load(io.open(sys.argv[1], encoding="utf-8"))
types = json.loads(data[0]["text"])["types"]

HEAD = '''/**
 * Generated from the live schema - do not edit above the aliases block.
 *
 * Regenerate with the Supabase types tool, then run:
 *   python scripts/apply-types.py <payload.json>
 */
'''

TAIL = '''

/* --------------------------------------------------------------- aliases --
 * Hand-added below the generated block, and re-appended by the script above.
 */
export type Portal = Database["public"]["Enums"]["portal"];
export type AccessLevel = Database["public"]["Enums"]["access_level"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Role = Database["public"]["Tables"]["roles"]["Row"];
'''

io.open("lib/supabase/types.ts", "w", encoding="utf-8").write(HEAD + types + TAIL)
print("lib/supabase/types.ts written")
