import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * The route table, discovered from the filesystem rather than hand-listed.
 *
 * A hand-written list is a list of the routes someone remembered. The gap this
 * suite exists to close was created exactly that way: `routeModuleMap` listed
 * eleven prefixes against a tree of thirty-six admin routes, and everything
 * unlisted fell through to "allowed". Deriving the list from `app/` means a new
 * folder is covered by the auth-wall assertions the moment it is created,
 * whether or not anyone remembers to add it here.
 */

const APP = join(process.cwd(), "app");

/** A dynamic segment stands in for a real id. The wall must hold before the
 *  page ever looks the id up — if a `[id]` route redirects only after a failed
 *  lookup, that is itself the bug. */
const PLACEHOLDER = "e2e-placeholder";

function walk(dir: string, urlPrefix: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  if (entries.includes("page.tsx") || entries.includes("page.ts")) {
    out.push(urlPrefix === "" ? "/" : urlPrefix);
  }

  for (const name of entries) {
    const path = join(dir, name);
    if (!statSync(path).isDirectory()) continue;
    if (name.startsWith("_") || name === "node_modules") continue;

    // (group) folders organise files without appearing in the URL.
    if (name.startsWith("(") && name.endsWith(")")) {
      walk(path, urlPrefix, out);
      continue;
    }
    // Catch-all segments have no single representative URL; the [...slug]
    // route is the CMS fallback and is covered by the public-page specs.
    if (name.startsWith("[...") || name.startsWith("[[...")) continue;

    const segment = name.startsWith("[") && name.endsWith("]") ? PLACEHOLDER : name;
    walk(path, `${urlPrefix}/${segment}`, out);
  }
}

function routesUnder(...prefixes: string[]): string[] {
  const all: string[] = [];
  walk(APP, "", all);
  return all
    .filter((r) => prefixes.some((p) => r === p || r.startsWith(`${p}/`)))
    .sort();
}

/** Every page behind the ADMIN, STAFF and CLIENT portals. */
export const protectedRoutes: string[] = routesUnder("/admin", "/staff", "/client");

/** Public pages with fixed URLs. Dynamic ones are exercised by name elsewhere. */
export const publicRoutes: string[] = [
  "/",
  "/about",
  "/services",
  "/pricing",
  "/case-studies",
  "/blog",
  "/reviews",
  "/contact",
  "/book-meeting",
  "/privacy",
  "/terms",
];

export const portalOf = (route: string): "admin" | "staff" | "client" =>
  route.startsWith("/admin") ? "admin" : route.startsWith("/staff") ? "staff" : "client";
