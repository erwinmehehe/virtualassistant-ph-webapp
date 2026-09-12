import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = String(process.env.VISUAL_BASE_URL || "").replace(/\/$/, "");
const bypassSecret = String(process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "");
if (!baseUrl) throw new Error("VISUAL_BASE_URL is required.");

const outputDir = path.resolve("artifacts/booking-visual");
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "desktop", width: 1440, height: 1000 },
  ]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    if (bypassSecret) await context.setExtraHTTPHeaders({ "x-vercel-protection-bypass": bypassSecret });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    const response = await page.goto(`${baseUrl}/book-client-call`, { waitUntil: "networkidle", timeout: 90000 });
    if (!response?.ok()) throw new Error(`Booking page returned HTTP ${response?.status() || "unknown"}.`);
    await page.getByRole("heading", { name: "Book a focused client discovery call" }).waitFor();
    await page.screenshot({ path: path.join(outputDir, `booking-gate-${viewport.name}.png`), fullPage: true });

    await page.getByRole("radio", { name: /I am hiring/ }).click();
    await page.getByRole("heading", { name: "Choose a time" }).waitFor();
    await page.screenshot({ path: path.join(outputDir, `client-calendar-${viewport.name}.png`), fullPage: true });

    await page.getByRole("radio", { name: /I am a Virtual Assistant/ }).click();
    await page.getByText("this is not the VA interview calendar", { exact: false }).waitFor();
    await page.screenshot({ path: path.join(outputDir, `va-redirect-${viewport.name}.png`), fullPage: true });

    if (consoleErrors.length) throw new Error(`${viewport.name} console errors:\n${consoleErrors.join("\n")}`);
    await context.close();
  }
} finally {
  await browser.close();
}
