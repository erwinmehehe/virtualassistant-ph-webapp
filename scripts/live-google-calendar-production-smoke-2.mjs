import { chromium } from "playwright";

const baseUrl = "https://virtualassistant.com.ph";
const stamp = new Date().toISOString();
const company = `Google Calendar Production Smoke ${stamp}`;
const email = "erwinmehehe@users.noreply.github.com";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/book-client-call`, { waitUntil: "networkidle", timeout: 90000 });

  await page.getByRole("radio", { name: /I am hiring/i }).click();

  const slotButtons = page.locator('.booking-time-grid button[role="radio"]');
  await slotButtons.first().waitFor({ state: "visible", timeout: 30000 });
  const chosenSlotLabel = (await slotButtons.first().innerText()).trim();
  await slotButtons.first().click();

  await page.getByLabel("Your name *").fill("Calendar Production Smoke Test");
  await page.getByLabel("Work email *").fill(email);
  await page.getByLabel("Company *").fill(company);

  await page.getByRole("button", { name: "Confirm this time" }).click();
  await page.waitForURL(/\/book-client-call\?booked=1/, { timeout: 90000 });

  const finalUrl = page.url();
  console.log(JSON.stringify({ company, email, chosenSlotLabel, finalUrl }));
} finally {
  await browser.close();
}
