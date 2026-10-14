import { expect, test, type Page } from "@playwright/test";

const password = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";

async function signIn(page: Page, email: string, next: string) {
  await page.goto("/auth/login?next=" + encodeURIComponent(next));
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await expect(page).toHaveURL(new RegExp(next));
}

async function expectNoHorizontalPageOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, "Page should not overflow the viewport horizontally").toBeLessThanOrEqual(2);
}

test("recruiter Today desktop remains readable and CRM is reachable from More", async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 900 });
  await signIn(page, "recruiter.e2e@example.test", "/workspace/recruiter/today");
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Workspace navigation" });
  await expect(nav.locator('a[href="/workspace/recruiter/roles"]')).toBeVisible();
  await expect(nav.locator('a[href="/workspace/recruiter/talent"]')).toBeVisible();
  await expect(nav.locator('a[href="/workspace/recruiter/messages"]')).toBeVisible();
  await nav.locator("details.recruiter-nav-more > summary").click();
  await expect(nav.locator('a[href="/workspace/recruiter/crm"]')).toBeVisible();
  await expectNoHorizontalPageOverflow(page);
});

test("recruiter Today mobile keeps actions, primary nav and More usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "recruiter.e2e@example.test", "/workspace/recruiter/today");
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Mobile workspace navigation" });
  await expect(nav.locator('a[href="/workspace/recruiter/roles"]')).toBeVisible();
  await expect(nav.locator('a[href="/workspace/recruiter/talent"]')).toBeVisible();
  await expect(nav.locator('a[href="/workspace/recruiter/messages"]')).toBeVisible();
  await nav.locator("details.mobile-more > summary").click();
  await expect(nav.locator('a[href="/workspace/recruiter/crm"]')).toBeVisible();
  await expectNoHorizontalPageOverflow(page);
});
