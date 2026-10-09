import { expect, test, type Page } from "@playwright/test";

const password = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";

async function login(page: Page, email: string, next: string) {
  await page.goto("/auth/login?next=" + encodeURIComponent(next));
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/[.*+?^$()|[\]\\]/g, "\\$&")));
}

test("only admins can view private training signup activation metrics", async ({ browser }) => {
  const adminContext = await browser.newContext();
  const recruiterContext = await browser.newContext();
  try {
    const admin = await adminContext.newPage();
    const path = "/workspace/admin/training/activation";
    await login(admin, "admin.e2e@example.test", path);
    await expect(admin.getByRole("heading", { name: "From training signup to first completion" })).toBeVisible();
    await expect(admin.getByText("Training account activation", { exact: true })).toBeVisible();
    await expect(admin.getByText("First-week course activation", { exact: true })).toBeVisible();
    await expect(admin.getByText("Also created a VA candidate profile", { exact: true })).toBeVisible();
    await expect(admin.getByText("No course start after 72h")).toBeVisible();
    await expect(admin.getByText("Activation metrics unavailable")).toHaveCount(0);

    const recruiter = await recruiterContext.newPage();
    await login(recruiter, "recruiter.e2e@example.test", "/workspace/recruiter/today");
    await recruiter.goto(path);
    await expect(recruiter).toHaveURL(/\/workspace\/recruiter(?:\/|$)/);
    await expect(recruiter.getByRole("heading", { name: "From training signup to first completion" })).toHaveCount(0);
  } finally {
    await Promise.allSettled([adminContext.close(), recruiterContext.close()]);
  }
});
