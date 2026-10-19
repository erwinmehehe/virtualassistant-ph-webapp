import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const output = "artifacts/jobs-hero-qa";

test("desktop navigation has a direct Jobs link and the hero leads to open roles", async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 900 });
  const response = await page.goto("/jobs", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);

  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  const jobsLink = nav.getByRole("link", { name: "Jobs", exact: true });
  await expect(jobsLink).toBeVisible();
  await expect(jobsLink).toHaveAttribute("href", "/jobs");
  await expect(page.locator(".jobs-market-hero h1")).toHaveText("Virtual Assistant Jobs Philippines");

  const actions = page.locator(".jobs-market-actions");
  await expect(actions.locator("a").first()).toHaveAttribute("href", "#open-jobs");
  await expect(actions.locator("a").nth(1)).toHaveAttribute("href", "/auth/join/va");
  await expect(page.locator(".jobs-employer-card a[href='/post-a-job']")).toBeVisible();

  await mkdir(output, { recursive: true });
  await page.locator(".jobs-market-hero").screenshot({ path: output + "/desktop-1365.png", animations: "disabled" });

  await actions.getByRole("link", { name: "Browse open jobs" }).click();
  await expect(page).toHaveURL(/#open-jobs$/);
  await expect(page.locator("#open-jobs .jobs-filterbar")).toBeVisible();
});

test("390px phone keeps Jobs in navigation, candidate-first CTA and no hero overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/jobs", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);

  await expect(page.locator(".jobs-market-hero h1")).toBeVisible();
  await expect(page.locator(".jobs-market-actions a[href='#open-jobs']")).toBeVisible();
  await expect(page.locator(".jobs-employer-card a[href='/post-a-job']")).toBeVisible();

  const drawer = page.locator(".va-mobile-drawer");
  await drawer.locator("summary").click();
  const nav = page.getByRole("navigation", { name: "Mobile navigation" });
  const jobsLink = nav.getByRole("link", { name: "Jobs", exact: true });
  await expect(jobsLink).toBeVisible();
  await expect(jobsLink).toHaveAttribute("href", "/jobs");
  await drawer.locator("summary").click();

  const heroOverflow = await page.locator(".jobs-market-hero").evaluate(
    (element) => element.scrollWidth - element.clientWidth,
  );
  expect(heroOverflow).toBeLessThanOrEqual(2);

  await mkdir(output, { recursive: true });
  await page.locator(".jobs-market-hero").screenshot({ path: output + "/mobile-390.png", animations: "disabled" });
});
