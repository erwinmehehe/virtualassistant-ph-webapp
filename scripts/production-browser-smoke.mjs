import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = String(process.env.PRODUCTION_BASE_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
const outputDir = path.resolve("artifacts/production-browser-smoke");
await fs.mkdir(outputDir, { recursive: true });

const routes = [
  { name: "home", path: "/", status: 200, minText: 200 },
  { name: "hire", path: "/hire", status: 200, minText: 200 },
  { name: "booking", path: "/book-client-call", status: 200, minText: 150 },
  { name: "contact", path: "/contact", status: 200, minText: 120 },
  { name: "proposal-not-found", path: "/proposal/not-found", status: 404, minText: 20 },
];

const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "desktop", width: 1440, height: 1000 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      timezoneId: "America/New_York",
    });

    for (const route of routes) {
      const page = await context.newPage();
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      const response = await page.goto(`${baseUrl}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });

      const status = response?.status() ?? 0;
      const bodyText = (await page.locator("body").innerText()).trim();
      const overlay = await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count();
      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);

      if (status !== route.status) {
        throw new Error(`${route.name} returned HTTP ${status}; expected ${route.status}`);
      }
      if (bodyText.length < route.minText) {
        throw new Error(`${route.name} rendered too little content (${bodyText.length} chars)`);
      }
      if (overlay) throw new Error(`${route.name} rendered a framework error overlay`);
      if (horizontalOverflow) throw new Error(`${route.name} has horizontal overflow on ${viewport.name}`);
      if (pageErrors.length) throw new Error(`${route.name} page errors: ${pageErrors.join(" | ")}`);

      if (route.name === "hire") {
        await page.locator('form[action], form').first().waitFor({ state: "visible", timeout: 15000 });
        await page.locator('input[name="email"]').first().waitFor({ state: "attached", timeout: 15000 });
      }

      if (route.name === "booking") {
        await page.getByRole("heading", { name: /book a discovery call/i }).waitFor({ timeout: 15000 });
        const timezone = page.locator('input[name="timezone"]');
        await timezone.waitFor({ state: "attached", timeout: 15000 });
        await page.waitForFunction(
          () => Boolean(document.querySelector('input[name="timezone"]')?.value),
          { timeout: 15000 },
        );
        if (await page.locator(".booking-time-grid button").count() < 1) {
          throw new Error("booking has no visible appointment times");
        }
      }

      await page.screenshot({
        path: path.join(outputDir, `${route.name}-${viewport.name}.png`),
        fullPage: route.name === "home" || route.name === "hire" || route.name === "booking",
      });

      report.push({
        route: route.path,
        viewport: viewport.name,
        status,
        textLength: bodyText.length,
        horizontalOverflow,
        pageErrors,
      });
      await page.close();
    }

    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(
  path.join(outputDir, "report.json"),
  JSON.stringify({ checkedAt: new Date().toISOString(), baseUrl, report }, null, 2),
);

console.log(JSON.stringify(report, null, 2));
