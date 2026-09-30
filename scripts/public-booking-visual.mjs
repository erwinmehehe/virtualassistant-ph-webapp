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
  for (const fixture of [
    { name: "mobile-texas", width: 390, height: 844, timeZoneId: "America/Chicago" },
    { name: "desktop-sydney", width: 1440, height: 1000, timeZoneId: "Australia/Sydney" },
  ]) {
    const context = await browser.newContext({
      viewport: { width: fixture.width, height: fixture.height },
      deviceScaleFactor: 1,
      timezoneId: fixture.timeZoneId,
    });
    if (bypassSecret) await context.setExtraHTTPHeaders({ "x-vercel-protection-bypass": bypassSecret });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    const response = await page.goto(`${baseUrl}/book-client-call`, { waitUntil: "networkidle", timeout: 90000 });
    if (!response?.ok()) throw new Error(`Booking page returned HTTP ${response?.status() || "unknown"}.`);

    await page.getByRole("heading", { name: "Book a discovery call" }).waitFor();
    await page.getByRole("heading", { name: "Choose a time" }).waitFor();
    await page.getByRole("link", { name: /Looking for VA work\? Apply here/ }).waitFor();

    const timezoneField = page.locator('input[name="timezone"]');
    await timezoneField.waitFor({ state: "attached" });
    await page.waitForFunction(
      (expected) => document.querySelector('input[name="timezone"]')?.value === expected,
      fixture.timeZoneId,
      { timeout: 15000 },
    );
    if (await timezoneField.inputValue() !== fixture.timeZoneId) {
      throw new Error(`${fixture.name} detected ${await timezoneField.inputValue()} instead of ${fixture.timeZoneId}`);
    }

    if (await page.locator(".booking-show-times").count()) {
      throw new Error("Booking page should show all times without a reveal button.");
    }

    const slotCount = await page.locator(".booking-time-grid button").count();
    if (slotCount < 1) throw new Error(`${fixture.name} has no visible booking times.`);

    await page.screenshot({ path: path.join(outputDir, `booking-${fixture.name}.png`), fullPage: true });

    const firstSlot = page.locator(".booking-time-grid button").first();
    await firstSlot.click();
    await page.locator(".booking-selected-slot").waitFor();
    if (!(await page.locator('input[name="scheduled_at"]').inputValue())) {
      throw new Error(`${fixture.name} did not persist the selected booking slot.`);
    }

    await page.screenshot({ path: path.join(outputDir, `booking-selected-${fixture.name}.png`), fullPage: true });

    if (consoleErrors.length) throw new Error(`${fixture.name} console errors:\n${consoleErrors.join("\n")}`);
    await context.close();
  }
} finally {
  await browser.close();
}
