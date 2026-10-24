import { expect, test } from "@playwright/test";

test("anonymous visitors see public navigation on desktop and mobile", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".site-header .nav-actions > a.va-nav-account-login")).toHaveText("Log in");
  await expect(page.locator(".site-header .nav-actions > a.header-hire-cta")).toContainText("Hire a Virtual Assistant");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".site-header .va-mobile-drawer > summary").click();
  await expect(page.locator(".site-header .va-mobile-panel").getByRole("link", { name: "Jobs" })).toBeVisible();
  await expect(page.locator(".site-header .va-mobile-panel").getByRole("link", { name: "Apply as a Virtual Assistant" })).toBeVisible();
});

test("verified signed-in client sees the correct public-page account actions", async ({ page }) => {
  const app = new URL(process.env.E2E_BASE_URL || "http://127.0.0.1:3000");
  const db = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://invalid.example");
  test.skip(
    app.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(app.hostname) ||
      db.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(db.hostname),
    "Authenticated nav acceptance uses seeded loopback-only Supabase identities",
  );

  await page.goto("/auth/login?next=%2Fworkspace%2Fclient");
  await page.getByLabel("Email").fill("client.e2e@example.test");
  await page.getByLabel("Password").fill(process.env.E2E_PASSWORD || "E2e-Only!Pass12345");
  await page.getByRole("button", { name: /^Log in(?: to training)?$/ }).click();
  await expect(page).toHaveURL(/\/workspace\/client\/?$/, { timeout: 25_000 });

  await page.goto("/");
  const navigation = page.locator(".site-header .nav-actions");
  await expect(navigation.locator("> a.va-nav-account-login")).toHaveText("My workspace");
  await expect(navigation.locator("> a.header-hire-cta")).toHaveText("Post a job");
  await expect(navigation.locator("> a.va-nav-account-login")).toHaveAttribute("href", "/workspace/client");

  await page.goto("/training");
  // This public page remains cacheable and never serializes session info into its HTML.
  await expect(page.locator(".site-header .nav-actions > a.va-nav-account-login")).toHaveText("My learning");
  await expect(page.locator(".site-header .nav-actions > a.training-header-cta")).toContainText("Continue training");
});
