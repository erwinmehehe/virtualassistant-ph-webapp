import { expect, test } from "@playwright/test";

test("signed-out old browse URL opens the public, indexable course library", async ({ page }) => {
  await page.goto("/workspace/training?browse=1");
  await expect(page).toHaveURL((url) =>
    url.pathname === "/training" && url.hash === "#course-library",
  );
  await expect(
    page.getByRole("heading", { name: "Choose training that matches the work you want to do." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /training login/i }).first()).toBeVisible();
});

test("personalized learner workspace still requires sign-in", async ({ page }) => {
  await page.goto("/workspace/training");
  await expect(page).toHaveURL(/\/auth\/login\?/);
  await page.goto("/workspace/training?browse=personal");
  await expect(page).toHaveURL(/\/auth\/login\?/);
});
