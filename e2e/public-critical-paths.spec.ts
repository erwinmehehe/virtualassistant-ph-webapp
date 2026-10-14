import { expect, test } from "@playwright/test";

async function expectBasicPublicAccessibility(page: import("@playwright/test").Page) {
  const h1Count = await page.locator("h1").count();
  expect(h1Count).toBe(1);

  const unlabeledImages = await page.locator('img:not([alt])').count();
  expect(unlabeledImages).toBe(0);

  const controls = page.locator('input:not([type="hidden"]):not([aria-hidden="true"]), select:not([aria-hidden="true"]), textarea:not([aria-hidden="true"])');
  const count = await controls.count();
  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    const hasAccessibleName = Boolean(
      (await control.getAttribute("aria-label")) ||
      (await control.getAttribute("aria-labelledby")) ||
      (await control.getAttribute("placeholder")) ||
      (await control.getAttribute("title"))
    );
    const id = await control.getAttribute("id");
    const hasExplicitLabel = id
      ? (await page.locator(`label[for="${id.replace(/"/g, '\\"')}"]`).count()) > 0
      : false;
    const hasWrappingLabel = (await control.locator("xpath=ancestor::label[1]").count()) > 0;

    expect(hasAccessibleName || hasExplicitLabel || hasWrappingLabel).toBeTruthy();
  }
}

test("public hiring and auth routes render without runtime failures", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/hire");
  await expect(page.locator("h1").first()).toBeVisible();
  await expectBasicPublicAccessibility(page);

  await page.goto("/book-client-call");
  await expect(page.getByRole("heading", { name: "Book a discovery call" })).toBeVisible();
  await expectBasicPublicAccessibility(page);

  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expectBasicPublicAccessibility(page);

  expect(consoleErrors.filter((message) => !/favicon/i.test(message))).toEqual([]);
});

test("invalid proposal capability is a real, recoverable 404", async ({ page }) => {
  const response = await page.goto("/proposal/not-found");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "We couldn’t find this hiring proposal." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contact the recruiting team" })).toBeVisible();
  await expect(page.getByText(/return to the email from your recruiter/i)).toBeVisible();
});

test("protected recruiter route sends anonymous users to login", async ({ page }) => {
  await page.goto("/workspace/recruiter/today");
  await expect(page).toHaveURL(/\/auth\/login\?next=/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});
