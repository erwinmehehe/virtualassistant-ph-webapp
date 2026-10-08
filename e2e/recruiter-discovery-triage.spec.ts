import { expect, test } from "@playwright/test";

test("recruiters land on discovery outcome triage and can reach the CRM attention queue", async ({ page }) => {
  await page.goto("/auth/login?next=" + encodeURIComponent("/workspace/recruiter/discovery"));
  await page.getByLabel("Email").fill("recruiter.e2e@example.test");
  await page.getByLabel("Password").fill(process.env.E2E_PASSWORD || "E2e-Only!Pass12345");
  await page.getByRole("button", { name: /^Log in$/ }).click();

  await expect(page).toHaveURL(/\\/workspace\\/recruiter\\/discovery/);
  await expect(page.getByRole("heading", { name: "Discovery calls" })).toBeVisible();
  const actionView = page.locator('nav[aria-label="Discovery views"] a[href="/workspace/recruiter/discovery?view=action"]');
  await expect(actionView).toHaveClass(/activeTab/);
  await expect(page.getByRole("region", { name: "Discovery summary" })).toBeVisible();

  await page.goto("/workspace/recruiter/crm?view=attention");
  await expect(page.getByRole("heading", { name: "Client pipeline" })).toBeVisible();
  await expect(page.locator('nav[aria-label="Pipeline views"] a[href*="view=attention"]')).toBeVisible();
});
