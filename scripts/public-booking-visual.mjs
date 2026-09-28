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

    await page.getByRole("heading", { name: "Pick a time that works for you." }).waitFor();
    await page.getByRole("link", { name: /Looking for VA work\? Apply here/ }).waitFor();
    await page.screenshot({ path: path.join(outputDir, `booking-${viewport.name}.png`), fullPage: true });

    const firstSlot = page.locator(".booking-time-grid button").first();
    await firstSlot.waitFor();
    await firstSlot.click();
    await page.locator(".booking-selected-slot").waitFor();
    await page.screenshot({ path: path.join(outputDir, `booking-selected-${viewport.name}.png`), fullPage: true });

    if (consoleErrors.length) throw new Error(`${viewport.name} console errors:\n${consoleErrors.join("\n")}`);
    await context.close();
  }
} finally {
  await browser.close();
}
