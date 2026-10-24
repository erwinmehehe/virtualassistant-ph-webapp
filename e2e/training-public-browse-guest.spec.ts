import { expect, test } from "@playwright/test";

test("signed-out visitors can browse the public course catalog from an old workspace link", async ({ page }) => {
  await page.goto("/workspace/training?browse=1");
  await expect(page).toHaveURL(/\/training#course-library$/);
  await expect(
    page.getByRole("heading", { name: "Choose training that matches the work you want to do." }),
  ).toBeVisible();
});

test("the personalized learner workspace still requires sign-in", async ({ page }) => {
  await page.goto("/workspace/training");
  await expect(page).toHaveURL(/\/auth\/login\?/);
});
