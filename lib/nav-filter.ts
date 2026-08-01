import { accessLevelRank, type AccessLevel } from "@/lib/access-control";
import type { NavItem, NavSection } from "@/components/layout/Sidebar";

/**
 * Permission filtering for navigation.
 *
 * Pure and client-safe on purpose. Nav items carry an `icon` that is a React
 * component, and functions cannot be serialised across the Server → Client
 * boundary — so the filtered sections cannot be computed on the server and
 * passed down as a prop. The server sends the grants, which are plain data, and
 * the sidebar filters its own sections here.
 *
 * The rule is one-directional: an item is hidden only when it carries an
 * explicit `moduleId` AND the held grant falls short. An unannotated item is
 * always shown, so a forgotten annotation leaves an item visible rather than
 * making one silently disappear.
 */

export type Grants = Record<string, AccessLevel>;

function itemAllowed(item: NavItem, grants: Grants): boolean {
  if (!item.moduleId) return true;
  const held = grants[item.moduleId] ?? "none";
  return accessLevelRank[held] >= accessLevelRank[item.minimum ?? "view"];
}

export function filterSections(sections: NavSection[], grants: Grants): NavSection[] {
  // An empty grant set means the account has no role assigned. That is a
  // provisioning gap, not a permission decision — blanking the menu would make
  // the app look broken, so the full set is returned instead.
  if (!grants || Object.keys(grants).length === 0) return sections;

  return sections
    .map((section) => {
      const items = section.items
        .filter((item) => itemAllowed(item, grants))
        .map((item) => {
          if (!item.children?.length) return item;
          return { ...item, children: item.children.filter((c) => itemAllowed(c, grants)) };
        })
        // A group that lost every child would open onto nothing.
        .filter((item) => !item.children || item.children.length > 0 || !item.moduleId);

      return { ...section, items };
    })
    .filter((section) => section.items.length > 0);
}
