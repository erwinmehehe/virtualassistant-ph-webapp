import { expect, test } from "@playwright/test";

test.describe("Software hiring directory", () => {
  test("shows its existing guides and navigates to a platform detail page", async ({ page }) => {
    await page.goto("/software");
    await expect(page.getByRole("heading", { name: "Find your platform." })).toBeVisible();
    await expect(page.getByRole("link", { name: "View ApplyOnline virtual assistant guide" })).toBeVisible();
    await page.getByRole("link", { name: "View ApplyOnline virtual assistant guide" }).click();
    await expect(page).toHaveURL(/\/software\/applyonline\/?$/);
  });

  test("filters by software name, then recovers after clearing search", async ({ page }) => {
    await page.goto("/software");
    const search = page.getByRole("searchbox", { name: "Search software or tasks" });
    await search.fill("ApplyOnline");
    await expect(page.getByRole("link", { name: "View ApplyOnline virtual assistant guide" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View PropertyMe virtual assistant guide" })).toHaveCount(0);

    await search.fill("not-a-real-platform-12345");
    await expect(page.getByRole("heading", { name: "No matching software guides" })).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(search).toHaveValue("");
    await expect(page.getByRole("link", { name: "View PropertyMe virtual assistant guide" })).toBeVisible();
  });

  test("combines category and query filters and supports mobile layout", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/software");
    await page.getByRole("button", { name: /Property Management/ }).click();
    await expect(page.getByRole("button", { name: /Property Management/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("link", { name: "View PropertyMe virtual assistant guide" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View ApplyOnline virtual assistant guide" })).toHaveCount(0);
    await page.getByRole("searchbox", { name: "Search software or tasks" }).fill("PropertyMe");
    await expect(page.getByRole("link", { name: "View PropertyMe virtual assistant guide" })).toBeVisible();
    await expect(page.locator("body")).toHaveJSProperty("scrollWidth", await page.evaluate(() => document.body.clientWidth));
  });
});
