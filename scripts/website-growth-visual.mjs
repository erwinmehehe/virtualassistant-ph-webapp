import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = String(process.env.VISUAL_BASE_URL || "").replace(/\/$/, "");
if (!baseUrl) throw new Error("VISUAL_BASE_URL is required.");

const routes = [
  ["home", "/"],
  ["services", "/services"],
  ["role-finder", "/tools/what-type-of-va-do-i-need"],
  ["hire", "/hire?category=SEO&hours=20-30&budget=%2410-%2415&start_time=Within+2+weeks"],
  ["about", "/about"],
  ["faq", "/faq"],
];
const outputDir = path.resolve("artifacts/growth-preview");
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "desktop", width: 1440, height: 1000 },
  ]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    for (const [name, route] of routes) {
      const page = await context.newPage();
      const errors = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 90000 });
      const overlay = await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count();
      const textLength = (await page.locator("body").innerText()).trim().length;
      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      await page.screenshot({
        path: path.join(outputDir, `${name}-${viewport.name}.png`),
        fullPage: name === "home" || name === "hire",
      });
      report.push({ viewport: viewport.name, name, status: response?.status(), textLength, overlay, horizontalOverflow, errors });
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(report, null, 2));
if (report.some((item) => !item.status || item.status >= 400 || item.overlay || item.horizontalOverflow || item.errors.length || item.textLength < 100)) {
  process.exitCode = 1;
}
