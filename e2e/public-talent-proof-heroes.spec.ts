import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";

// The user-confirmed total (700) includes more profiles than the consent-gated
// public directory, from which the five optional photos are selected.
const pages = [
  { path: "/", name: "home", root: ".pva-hero-copy" },
  { path: "/services", name: "services", root: ".compact-page-header-copy" },
  { path: "/industries", name: "industries", root: ".compact-page-header-copy" },
  { path: "/service/seo", name: "service-seo", root: ".hh-copy" },
  { path: "/industries/healthcare-dental", name: "industry-healthcare", root: ".hh-copy" },
] as const;
const viewports = [
  { name: "desktop", width: 1365, height: 850 },
  { name: "mobile", width: 390, height: 844 },
] as const;

for (const viewport of viewports) {
  test("700 VA profile proof on homepage, services, and industries - " + viewport.name, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await mkdir("artifacts/public-talent-proof", { recursive: true });

    for (const entry of pages) {
      const response = await page.goto(entry.path, { waitUntil: "domcontentloaded", timeout: 45_000 });
      expect(response?.status(), "Page must load: " + entry.path).toBe(200);
      const hero = page.locator(entry.root).first();
      const proof = hero.locator(".va-public-proof");
      await expect(proof, "Proof must appear within hero: " + entry.path).toBeVisible();
      await expect(proof).toHaveAttribute("href", "/find-talent");
      await expect(proof).toHaveAttribute("aria-label", /700 VA profiles/);

      const actualCopy = ((await proof.textContent()) || "").trim();
      expect(actualCopy).toBe("700 VA profiles");
      const strongText = ((await proof.locator("strong").textContent()) || "").trim();
      expect(strongText).toBe("700");

      const bounds = await proof.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x, "Proof left edge: " + entry.path).toBeGreaterThanOrEqual(-2);
      expect(bounds!.x + bounds!.width, "Proof right edge: " + entry.path).toBeLessThanOrEqual(viewport.width + 2);
      await hero.screenshot({
        path: "artifacts/public-talent-proof/" + viewport.name + "-" + entry.name + ".png",
        animations: "disabled",
        timeout: 20_000,
      });
    }
  });
}
