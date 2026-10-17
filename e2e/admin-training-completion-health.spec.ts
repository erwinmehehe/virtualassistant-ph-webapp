import { expect, test, type Page } from "@playwright/test";
import { disposableLoginHeaders } from "./disposable-login-isolation";

const password = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";

async function login(page: Page, email: string, next: string) {
  await page.goto("/auth/login?next=" + encodeURIComponent(next));
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/[.*+?^$()|[\]\\]/g, "\\$&")));
}

test("admin sees aggregate course and next-lesson completion bottlenecks without learner identities", async ({ page }) => {
  test.setTimeout(90_000);
  await page.context().setExtraHTTPHeaders(disposableLoginHeaders(38));
  await login(page, "admin.training-e2e@example.test", "/workspace/admin/training");

  await expect(page.getByRole("heading", { name: "Where learners get stuck" })).toBeVisible();
  await expect(page.getByText("Course enrolments", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Course-level completion bottlenecks" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Next-lesson bottlenecks" })).toBeVisible();
  await expect(page.getByText("Lesson bottleneck data temporarily unavailable")).toHaveCount(0);
  await expect(page.getByText("No learner names, emails, or automatic outreach", { exact: false })).toBeVisible();
  await expect(page.getByText("Completion data temporarily unavailable")).toHaveCount(0);
  await expect(page.getByText("No learner names or email addresses appear in this report.", { exact: false })).toBeVisible();
});

test("client cannot open administrator training completion diagnostics", async ({ page }) => {
  await page.context().setExtraHTTPHeaders(disposableLoginHeaders(39));
  await login(page, "client.training-e2e@example.test", "/workspace/client/company");
  await page.goto("/workspace/admin/training");
  await expect(page).not.toHaveURL(/\/workspace\/admin\/training/);
  await expect(page.getByRole("heading", { name: "Where learners get stuck" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Next-lesson bottlenecks" })).toHaveCount(0);
});
