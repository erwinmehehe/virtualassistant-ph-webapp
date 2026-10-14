import { mkdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const password = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";

async function signIn(page: Page, email: string, next: string) {
  await page.goto("/auth/login?next=" + encodeURIComponent(next));
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await expect(page).toHaveURL(new RegExp(next));
}

const workspaces = [
  {
    role: "client",
    email: "client.e2e@example.test",
    home: "/workspace/client",
    heading: "Your hiring workspace",
    primaryHref: "/workspace/client/jobs",
    nextHref: "/workspace/client/jobs/new",
    secondaryHref: "/workspace/client/payments",
  },
  {
    role: "va",
    email: "va.e2e@example.test",
    home: "/workspace/va",
    heading: "Your VA dashboard",
    primaryHref: "/workspace/va/applications",
    nextHref: "/workspace/va/jobs",
    secondaryHref: "/workspace/va/workroom",
  },
] as const;

const viewports = [
  { name: "desktop", width: 1365, height: 900, mobile: false },
  { name: "mobile", width: 390, height: 844, mobile: true },
] as const;

for (const workspace of workspaces) {
  for (const size of viewports) {
    test(`${workspace.role} dashboard keeps next action and navigation usable on ${size.name}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await signIn(page, workspace.email, workspace.home);
      await expect(page.getByRole("heading", { name: workspace.heading, exact: true })).toBeVisible();
      await expect(page.locator("main#main-content")).toBeVisible();
      await expect(page.locator(`main#main-content a[href="${workspace.nextHref}"]`).first()).toBeVisible();

      const nav = page.getByRole("navigation", {
        name: size.mobile ? "Mobile workspace navigation" : "Workspace navigation",
      });
      await expect(nav.locator(`a[href="${workspace.primaryHref}"]`)).toBeVisible();
      const summary = nav.locator(
        size.mobile ? "details.mobile-more > summary" : "details.workspace-nav-more > summary"
      );
      await summary.click();
      await expect(nav.locator(`a[href="${workspace.secondaryHref}"]`)).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `${workspace.role} ${size.name} page must not scroll horizontally`)
        .toBeLessThanOrEqual(2);

      await mkdir("test-results/workspace-screenshots", { recursive: true });
      await page.screenshot({
        path: `test-results/workspace-screenshots/${workspace.role}-${size.name}.png`,
        fullPage: true,
      });
    });
  }
}
