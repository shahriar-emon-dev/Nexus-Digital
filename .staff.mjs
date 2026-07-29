import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://localhost:3111";
const OUT = process.env.SHOT_DIR;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const problems = [];
const routes = ["/staff", "/staff/projects", "/staff/time-tracker", "/staff/meetings"];

for (const theme of ["dark", "light"]) {
  for (const width of [1440, 390]) {
    for (const route of routes) {
      const ctx = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 900 },
      });
      await ctx.addInitScript((t) => localStorage.setItem("nexus-theme", t), theme);
      const page = await ctx.newPage();
      const bag = [];
      page.on("console", (m) => {
        if (m.type() === "error" || m.type() === "warning")
          bag.push(`[${m.type()}] ${m.text().split("\n")[0].slice(0, 150)}`);
      });
      page.on("pageerror", (e) => bag.push(`[pageerror] ${e.message.slice(0, 150)}`));
      await page
        .goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 })
        .catch((e) => bag.push(`[goto] ${e.message}`));
      await page.waitForTimeout(600);
      const o = await page.evaluate(() => ({
        s: document.documentElement.scrollWidth,
        c: document.documentElement.clientWidth,
      }));
      if (o.s > o.c + 1) bag.push(`[overflow] ${o.s} > ${o.c}`);
      if (theme === "dark")
        await page.screenshot({
          path: `${OUT}/st-${width}-${route.replace(/\//g, "_")}.png`,
          fullPage: width === 1440,
        });
      if (bag.length) problems.push({ theme, width, route, logs: [...new Set(bag)] });
      await ctx.close();
    }
  }
}

// Drive the timer and the department switcher.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE + "/staff", { waitUntil: "networkidle" });

const timer = page.getByLabel("Active time tracker");
const t1 = await timer.locator("p[data-tabular]").textContent();
await page.waitForTimeout(2200);
const t2 = await timer.locator("p[data-tabular]").textContent();

await page.getByRole("button", { name: "Pause timer" }).click();
await page.waitForTimeout(1600);
const t3 = await timer.locator("p[data-tabular]").textContent();

// Persists across navigation?
await page.getByRole("link", { name: "Project Kanban Boards" }).click();
await page.waitForTimeout(900);
const timerStillThere = await page.getByLabel("Active time tracker").isVisible();

await page.goto(BASE + "/staff", { waitUntil: "networkidle" });
await page.getByLabel("Department").click().catch(() => {});
await page.waitForTimeout(500);
const deptOptions = await page.getByRole("option").count();
await page.screenshot({ path: `${OUT}/st-dept.png` });

console.log(
  JSON.stringify({ t1, t2, ticked: t1 !== t2, t3, pausedHeld: t2 === t3, timerStillThere, deptOptions })
);
await browser.close();

console.log("\nPROBLEMS:", problems.length);
for (const p of problems) {
  console.log(`--- ${p.theme} @${p.width} ${p.route}`);
  p.logs.forEach((l) => console.log("   ", l));
}
