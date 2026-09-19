import { chromium } from "playwright";

const baseUrl = "https://virtualassistant.com.ph";
const email = "jrvsaccad@gmail.com";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/auth/login?confirm=1&next=%2Fworkspace%2Frecruiter`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });

  await page.getByLabel("Email", { exact: true }).nth(1).fill(email);
  await page.getByRole("button", { name: "Resend email" }).click();

  await page.waitForURL(/\/auth\/login\?/, { timeout: 90000 });
  await page.getByText(/If that account still needs confirmation, we sent a new email/i).waitFor({ timeout: 30000 });

  console.log("Jervis activation resend completed through production recovery form.");
} finally {
  await browser.close();
}
