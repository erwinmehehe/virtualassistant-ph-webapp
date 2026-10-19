import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// Batch 3 editorial rendering QA. Runs only against a local disposable app.
// The historical rate article has a root-level canonical and a legacy route.
const slugs = [
  "hire-virtual-assistant-philippines",
  "average-hourly-rate-virtual-assistants-philippines",
  "onlinejobs-ph-vs-virtual-assistant-agency",
  "customer-service-tasks",
  "customer-service-interview-questions",
  "executive-virtual-assistant-tasks",
  "ecommerce-tasks",
  "amazon-virtual-assistant-tasks",
  "shopify-virtual-assistant-tasks",
  "seo-interview-questions",
  "bookkeeping-tasks",
  "medical-virtual-assistant-tasks",
] as const;

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const artifactDir = "artifacts/aeo-batch3-pages";
const legacyRate = "average-hourly-rate-virtual-assistants-philippines";

test.beforeAll(() => {
  const app = new URL(process.env.E2E_BASE_URL || "http://127.0.0.1:3000");
  if (app.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(app.hostname)) {
    throw new Error("Editorial screenshots may only run against a local disposable app.");
  }
});

for (const viewport of viewports) {
  for (const slug of slugs) {
    test("Batch 3 " + viewport.name + " renders: " + slug, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const articlePath = slug === legacyRate ? "/" + slug : "/blog/" + slug;
      const response = await page.goto(articlePath, { waitUntil: "domcontentloaded", timeout: 45_000 });
      expect(response?.status(), "An existing article must return HTTP 200").toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical, "Preserve the article's canonical route").toContain(articlePath);

      const answer = page.locator("#quick-answer");
      await expect(answer).toBeVisible();
      await expect(answer.locator("h2")).toHaveText(/\?$/);
      const answerText = (await answer.locator("p").textContent())?.trim() || "";
      expect(answerText.split(/\s+/u).length).toBeGreaterThanOrEqual(45);

      const headings = (await page.locator(".blog-section h2").allTextContents()).map((value) => value.trim());
      expect(headings.length, "Do not lose substantive article sections").toBeGreaterThanOrEqual(8);
      expect(headings.every((heading) => heading.endsWith("?")), "Every edited section heading is a question").toBe(true);
      const visibleFaqs = (await page.locator(".blog-faq-list details summary").allTextContents()).map((value) => value.trim());
      expect(visibleFaqs.length, "Each updated article has exactly seven visible FAQs").toBe(7);

      // The existing legacy root route renders Article/Breadcrumb JSON-LD but
      // not FAQPage. For ordinary /blog/ routes, structured FAQs must match
      // the actual visible questions; never invent rich-result eligibility.
      if (slug !== legacyRate) {
        const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
        const nodes = scripts.flatMap((raw) => {
          const schema = JSON.parse(raw);
          return Array.isArray(schema["@graph"]) ? schema["@graph"] : [schema];
        });
        const faq = nodes.find((node) => node["@type"] === "FAQPage");
        expect(faq, "Visible FAQs should match existing structured data").toBeTruthy();
        const questions: string[] = (faq?.mainEntity || []).map((item: { name: string }) => item.name);
        expect(questions.length).toBe(visibleFaqs.length);
        for (const question of questions) expect(visibleFaqs).toContain(question);
      }

      const bounds = await answer.boundingBox();
      expect(bounds, "Quick Answer must have a visible layout box").not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(-2);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 2);
      await mkdir(artifactDir, { recursive: true });
      await answer.screenshot({
        path: join(artifactDir, viewport.name + "-" + slug + ".png"),
        animations: "disabled",
        timeout: 20_000,
      });
    });
  }
}
