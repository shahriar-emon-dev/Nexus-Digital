import { expect, test } from "@playwright/test";

import { protectedRoutes } from "./routes";

/**
 * Nothing behind a portal may render to a signed-out visitor.
 *
 * This is the single assertion with the widest blast radius in the suite. It is
 * generated over every page discovered under /admin, /staff and /client, so the
 * coverage cannot drift away from the route tree.
 *
 * It checks three things per route, and the third is the one that matters:
 *
 *   1. the response is a redirect to /auth/login
 *   2. the destination is preserved in ?next=, so sign-in returns you there
 *   3. NO portal content appears in the delivered HTML
 *
 * (3) is separate from (1) on purpose. A page that streams its shell before the
 * redirect resolves has already leaked — client names, invoice numbers, staff
 * lists — and a test that only reads `page.url()` after settling would call
 * that a pass.
 */

test.describe("auth wall", () => {
  test("there are protected routes to check", () => {
    // A silent zero here would make every generated test below vacuous, and the
    // suite would report a wall that was never tested.
    expect(protectedRoutes.length).toBeGreaterThan(50);
  });

  for (const route of protectedRoutes) {
    test(`signed out: ${route} redirects to sign-in`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });

      expect(response, `no response for ${route}`).not.toBeNull();

      const url = new URL(page.url());
      expect(url.pathname, `${route} did not redirect to the sign-in page`).toBe("/auth/login");

      // The destination has to survive the bounce or every deep link in an
      // email lands people on the portal home instead.
      expect(url.searchParams.get("next"), `${route} lost its ?next= destination`).toBe(route);

      // The sign-in form, and only the sign-in form.
      await expect(page.getByLabel("Professional Email")).toBeVisible();

      const html = await page.content();
      for (const marker of ["Sign out", "Log out", "data-portal-shell"]) {
        expect(html, `${route} leaked portal chrome (${marker}) before redirecting`).not.toContain(
          marker
        );
      }
    });
  }
});

test.describe("sign-in", () => {
  /**
   * Next renders an always-present, always-empty `role="alert"` route
   * announcer. Matching on the role alone is a strict-mode violation, and
   * matching `.first()` would silently start asserting against the announcer
   * the day the real alert stops rendering — the exact regression this is for.
   */
  const formAlert = (page: import("@playwright/test").Page) =>
    page.locator('[role="alert"]:not(#__next-route-announcer__)');

  test("a failed sign-in stays on the sign-in page and says why", async ({ page }) => {
    await page.goto("/auth/login");

    await page.getByLabel("Professional Email").fill("nobody@e2e.invalid");
    await page.getByLabel("Access Credential").fill("not-the-password");
    await page.getByRole("button", { name: "Log In" }).click();

    // The form used to resolve a timer and redirect unconditionally, so any
    // input at all signed you in. Staying put is the assertion that matters.
    await expect(formAlert(page)).toBeVisible({ timeout: 20_000 });
    expect(new URL(page.url()).pathname).toBe("/auth/login");

    // And whatever went wrong — bad credential or an unreachable auth host —
    // the visitor gets a sentence, never a parser message. `authErrorMessage`
    // exists because the first run of this suite surfaced
    // `Unexpected token 'H', "Host not i"... is not valid JSON` on this form.
    const text = (await formAlert(page).innerText()).trim();
    expect(text.length).toBeGreaterThan(10);
    expect(text, "a raw parser error reached the sign-in form").not.toMatch(
      /is not valid JSON|Unexpected token|fetch failed|ECONNREFUSED|ENOTFOUND|\bundefined\b/i
    );
  });

  test("validates before contacting the server", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Professional Email").fill("not-an-email");
    await page.getByLabel("Access Credential").fill("x");
    await page.getByRole("button", { name: "Log In" }).click();

    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  });

  test("an unauthenticated visitor can still reach the public site", async ({ page }) => {
    // The counterweight: a middleware that redirects everything would pass every
    // assertion above.
    await page.goto("/");
    expect(new URL(page.url()).pathname).toBe("/");
  });
});
