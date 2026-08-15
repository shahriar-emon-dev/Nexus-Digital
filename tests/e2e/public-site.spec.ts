import { expect, test } from "@playwright/test";

import { publicRoutes } from "./routes";
import { requireBackend } from "./backend";

/**
 * The marketing site: reachable, titled, structured, and free of the errors
 * that only appear once React hydrates.
 */

test.describe("public pages", () => {
  for (const route of publicRoutes) {
    test(`${route} renders`, async ({ page, baseURL }) => {
      // Listeners are attached before navigation: a hydration mismatch fires
      // during the first paint and is missed if you subscribe afterwards.
      const problems: string[] = [];
      const brokenAssets: string[] = [];

      page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));

      page.on("console", (m) => {
        if (m.type() !== "error") return;
        const text = m.text();
        // "Failed to load resource: the server responded with a status of 404"
        // carries no URL, so it cannot be judged here. Resource failures are
        // caught by the response listener below, which knows what failed.
        if (/^Failed to load resource/i.test(text)) return;
        problems.push(`console.error: ${text}`);
      });

      // Same-origin assets only. A third-party image host that this runner
      // cannot reach is an environment fact; a 404 on the site's own CSS,
      // script, icon or font is a bug in the site.
      page.on("response", (r) => {
        if (r.status() < 400) return;
        if (!r.url().startsWith(baseURL ?? "")) return;
        // The optimiser proxies remote images; a failure there is upstream's.
        if (r.url().includes("/_next/image")) return;
        brokenAssets.push(`${r.status()} ${r.url().replace(baseURL ?? "", "")}`);
      });

      const response = await page.goto(route, { waitUntil: "domcontentloaded" });

      expect(response?.status(), `${route} did not return 2xx`).toBeLessThan(400);
      expect(new URL(page.url()).pathname, `${route} redirected away`).toBe(route);

      // Exactly one h1. Zero is a page with no heading; more than one is a
      // document outline that screen readers cannot navigate.
      await expect(page.locator("h1")).toHaveCount(1);

      const title = await page.title();
      expect(title.trim().length, `${route} has no <title>`).toBeGreaterThan(0);

      const description = page.locator('head meta[name="description"]');
      await expect(description, `${route} has no meta description`).toHaveCount(1);

      expect(problems, `${route} logged errors:\n${problems.join("\n")}`).toEqual([]);
      expect(
        brokenAssets,
        `${route} requested same-origin assets that do not exist:\n${brokenAssets.join("\n")}`
      ).toEqual([]);
    });
  }

  test("an unknown path returns 404, not a soft 200", async ({ page }) => {
    // A soft 404 — status 200 with a "not found" body — is the failure mode
    // that quietly fills a search index with dead pages.
    const response = await page.goto("/this-path-does-not-exist-e2e", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(404);
  });

  test("robots.txt and sitemap.xml are served", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("Sitemap");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("<urlset");
  });

  test("the home page carries organisation structured data", async ({ page, baseURL }) => {
    await page.goto("/");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length, "no JSON-LD on the home page").toBeGreaterThan(0);

    // Parsed, not string-matched: malformed JSON-LD is ignored by crawlers and
    // is indistinguishable from correct JSON-LD in a substring assertion.
    const parsed = blocks.map((b) => JSON.parse(b));

    // Organization or any subtype of it. The page emits ProfessionalService,
    // which IS an Organization (Organization → LocalBusiness →
    // ProfessionalService); pinning the literal string would fail the moment
    // someone picked a more specific — and more correct — type.
    const orgTypes = ["Organization", "LocalBusiness", "ProfessionalService", "Corporation"];
    const org = parsed.find((b) => orgTypes.includes(b["@type"]));
    expect(org, `no organisation node in JSON-LD: ${JSON.stringify(parsed)}`).toBeTruthy();

    expect(org["@context"]).toBe("https://schema.org");
    expect(String(org.name ?? "").trim().length).toBeGreaterThan(0);

    // The emitted URL comes from NEXT_PUBLIC_SITE_URL, which is read at BUILD
    // time. A deploy that forgets to set it ships structured data — and
    // canonical tags — pointing at localhost, and Google indexes that.
    expect(() => new URL(org.url), `structured data url is not absolute: ${org.url}`).not.toThrow();

    const servedFrom = new URL(baseURL!).hostname;
    const isLocal = servedFrom === "localhost" || servedFrom === "127.0.0.1";
    if (!isLocal) {
      expect(
        new URL(org.url).hostname,
        "the site is deployed but its structured data still names localhost — NEXT_PUBLIC_SITE_URL was not set when this was built"
      ).not.toMatch(/^(localhost|127\.0\.0\.1)$/);
    }
  });

  test("navigation reaches the contact page", async ({ page }) => {
    await page.goto("/");
    // By href, not by accessible name: the call to action reads "Get Started
    // Now", and a name-based locator would be asserting the copy rather than
    // the navigation.
    await page.locator('a[href="/contact"]').first().click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator("form").getByLabel("Full name")).toBeVisible();
  });
});

test.describe("public pages backed by the database", () => {
  test("the services page lists the real catalogue", async ({ page }) => {
    await requireBackend();
    await page.goto("/services");

    // This page previously rendered a hard-coded grid whose links pointed at
    // service pages that did not exist. Every card must now resolve.
    const links = page.locator('a[href^="/services/"]');
    const count = await links.count();
    expect(count, "/services offers no service links at all").toBeGreaterThan(0);

    const href = await links.first().getAttribute("href");
    const response = await page.goto(href!, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${href} is linked from /services but does not resolve`).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("the booking page either offers slots or says there are none", async ({ page }) => {
    await requireBackend();
    await page.goto("/book-meeting");

    // With no availability_rules published the page must degrade to a request
    // form, not invent times. Either shape is correct; a blank page is not.
    const body = await page.locator("main").innerText();
    expect(body.trim().length).toBeGreaterThan(40);
  });
});
