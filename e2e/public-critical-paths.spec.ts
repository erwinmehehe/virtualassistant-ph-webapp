import { expect, test } from "@playwright/test";

test("public hiring and auth routes render without runtime failures", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/hire");
  await expect(page.locator("h1").first()).toBeVisible();

  await page.goto("/book-client-call");
  await expect(page.getByRole("heading", { name: "Book a discovery call" })).toBeVisible();

  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  expect(consoleErrors.filter((message) => !/favicon/i.test(message))).toEqual([]);
});

test("invalid proposal capability is a real 404", async ({ page }) => {
  const response = await page.goto("/proposal/not-found");
  expect(response?.status()).toBe(404);
});

test("protected recruiter route sends anonymous users to login", async ({ page }) => {
  await page.goto("/workspace/recruiter/today");
  await expect(page).toHaveURL(/\/auth\/login\?next=/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});
