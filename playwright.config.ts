import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// Playwright does not read .env.local; Next does. Without this the backend
// probe in tests/e2e/backend.ts sees no project URL and skips the entire data
// tier on a machine that could in fact reach it — a silent loss of coverage.
loadEnvConfig(process.cwd());

/**
 * End-to-end configuration.
 *
 * Tests run against a PRODUCTION build (`next start`), not `next dev`. Three of
 * the failures this repository has actually shipped — a constant exported from
 * a `"use server"` module, an RSC boundary violation, a client component
 * importing a server-only helper — are invisible in dev and only appear once
 * the build has run. Testing the dev server would test a different application.
 *
 * Set PLAYWRIGHT_BASE_URL to point at a server you started yourself; the
 * managed webServer block then steps aside.
 */

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const managed = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  // Public pages are read-only, so they parallelise freely. The enquiry spec
  // writes, and serialises itself with test.describe.configure.
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],

  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    // A real viewport: several assertions target navigation that collapses
    // behind a menu button below the lg breakpoint.
    viewport: { width: 1280, height: 900 },
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Escape hatch for build environments that ship a Chromium which does
        // not match this Playwright release's pinned revision. Unset — the
        // normal case — Playwright resolves its own download as usual.
        ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
          : {}),
      },
    },
  ],

  ...(managed
    ? {
        webServer: {
          command: "npm run start",
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }
    : {}),
});
