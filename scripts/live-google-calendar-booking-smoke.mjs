import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = String(process.env.LIVE_BASE_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
const email = String(process.env.BOOKING_SMOKE_EMAIL || "erwinmehehe@users.noreply.github.com");
const company = `Google Calendar Smoke Test ${new Date().toISOString()}`;
const outputDir = path.resolve("artifacts/booking-visual");
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: "Asia/Manila" });
  const page = await context.newPage();

  const response = await page.goto(`${baseUrl}/book-client-call`, { waitUntil: "networkidle", timeout: 90000 });
  if (!response?.ok()) throw new Error(`Booking page returned HTTP ${response?.status() || "unknown"}.`);

  await page.getByRole("radio", { name: /I am hiring/ }).click();
  await page.getByRole("heading", { name: "Choose a time", exact: true }).waitFor();

  const slotButtons = page.getByRole("radiogroup", { name: /Available times for/ }).getByRole("radio");
  const slotCount = await slotButtons.count();
  if (!slotCount) throw new Error("No discovery slots are available on production.");
  const chosenSlot = slotButtons.first();
  const chosenSlotLabel = (await chosenSlot.innerText()).trim();
  await chosenSlot.click();

  await page.getByLabel("Your name *").fill("Calendar Smoke Test");
  await page.getByLabel("Work email *").fill(email);
  await page.getByLabel("Company *").fill(company);

  await page.screenshot({ path: path.join(outputDir, "live-calendar-before-submit.png"), fullPage: true });
  await page.getByRole("button", { name: "Confirm this time" }).click();

  await page.waitForURL(/\/book-client-call\?booked=1/, { timeout: 90000 });
  await page.getByText("Time confirmed", { exact: true }).waitFor({ timeout: 30000 });
  await page.screenshot({ path: path.join(outputDir, "live-calendar-booked.png"), fullPage: true });

  await fs.writeFile(
    path.join(outputDir, "live-calendar-booking.json"),
    JSON.stringify({ company, email, chosenSlotLabel, finalUrl: page.url(), completedAt: new Date().toISOString() }, null, 2)
  );

  console.log(JSON.stringify({ company, email, chosenSlotLabel, finalUrl: page.url() }));
  await context.close();
} finally {
  await browser.close();
}
