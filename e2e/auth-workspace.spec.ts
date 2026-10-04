import { expect, test, type Page } from "@playwright/test";

const password = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
}

async function login(page: Page, email: string, next: string) {
  await page.goto("/auth/login?next=" + encodeURIComponent(next));
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await expect(page).toHaveURL(new RegExp(escapeRegex(next)));
}

test("recruiter can enter recruiter workspace and is blocked from client workspace", async ({ page }) => {
  await login(page, "recruiter.e2e@example.test", "/workspace/recruiter/today");
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

  await page.goto("/workspace/client/company");
  await expect(page).toHaveURL(/\/workspace\/recruiter\/today/);
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
});

test("client can enter client workspace and is blocked from recruiter workspace", async ({ page }) => {
  await login(page, "client.e2e@example.test", "/workspace/client/company");
  await expect(page.getByRole("heading", { name: "Company profile" })).toBeVisible();

  await page.goto("/workspace/recruiter/today");
  await expect(page).toHaveURL(/\/workspace\/client/);
});

test("VA can enter VA workspace and is blocked from recruiter workspace", async ({ page }) => {
  await login(page, "va.e2e@example.test", "/workspace/va/profile");
  await expect(page.getByRole("heading", { name: "Your profile" })).toBeVisible();

  await page.goto("/workspace/recruiter/today");
  await expect(page).toHaveURL(/\/workspace\/va/);
});
