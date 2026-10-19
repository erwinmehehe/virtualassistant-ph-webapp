import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";

// Public profiles and counts may legitimately be empty on local disposable DBs.
// The acceptance gate requires truthful fallback copy and no clipped UI.
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
  test("public VA proof on homepage, services, and industries - " + viewport.name, async ({ page }) => {
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

      const actualCopy = ((await proof.textContent()) || "").trim();
      expect(actualCopy).toMatch(/approved Filipino VA profiles|Meet approved Filipino VAs/);
      const strongText = ((await proof.locator("strong").textContent()) || "").trim();
      if (/^[\d,]+$/.test(strongText)) {
        expect(Number(strongText.replaceAll(",", ""))).toBeGreaterThan(0);
        expect(actualCopy).toContain("approved Filipino VA profiles");
      } else {
        expect(strongText).toBe("Meet approved Filipino VAs");
      }

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
