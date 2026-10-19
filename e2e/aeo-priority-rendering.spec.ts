import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// Editorial release gate for the 12 manually optimized articles. Captures
// actual visible Quick Answers, rather than trusting source-only snapshots.
const slugs = [
  "virtual-assistant-onboarding-checklist",
  "how-many-hours-hire-virtual-assistant",
  "virtual-assistant-interview-questions",
  "part-time-virtual-assistant-jobs-philippines",
  "virtual-assistant-niches",
  "virtual-assistant-tasks",
  "how-to-create-the-best-va-profile",
  "virtual-assistant-introduction-video",
  "virtual-assistant-proposal-sample",
  "free-virtual-assistant-job-websites-philippines",
  "virtual-assistant-email-management-tasks-sops",
  "digital-marketing-virtual-assistant-tasks",
] as const;

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const output = "artifacts/aeo-priority-pages";

test.beforeAll(() => {
  const app = new URL(process.env.E2E_BASE_URL || "http://127.0.0.1:3000");
  if (app.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(app.hostname)) {
    throw new Error("AEO rendering QA refuses a remote or production site.");
  }
});

for (const viewport of viewports) {
  for (const slug of slugs) {
    test(viewport.name + " editorial rendering: " + slug, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto("/blog/" + slug, { waitUntil: "domcontentloaded", timeout: 45_000 });
      expect(response?.status(), "Published article must return HTTP 200").toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);

      const answer = page.locator("#quick-answer");
      await expect(answer).toBeVisible();
      await expect(answer.locator("h2")).toHaveText(/\?$/);
      const answerText = (await answer.locator("p").textContent())?.trim() || "";
      expect(answerText.split(/\s+/).length, "Answer-first summary must contain substantial visible copy").toBeGreaterThanOrEqual(35);

      const sections = (await page.locator(".blog-section h2").allTextContents()).map(x => x.trim());
      expect(sections.length, "Article sections must remain present").toBeGreaterThanOrEqual(6);
      expect(sections.every(x => x.endsWith("?")), "Editorial H2 headings must be natural questions").toBe(true);

      const visibleFaq = (await page.locator(".blog-faq-list details summary").allTextContents()).map(x => x.trim());
      expect(visibleFaq.length, "Visible FAQs must remain present").toBeGreaterThanOrEqual(5);
      const jsonLdText = await page.locator('script[type="application/ld+json"]').allTextContents();
      const nodes = jsonLdText.flatMap(raw => {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
      });
      const faq = nodes.find(node => node["@type"] === "FAQPage");
      expect(faq, "FAQ schema must be present on the rendered article").toBeTruthy();
      const structuredQuestions = (faq?.mainEntity || []).map((node: { name: string }) => node.name);
      expect(structuredQuestions.length).toBe(visibleFaq.length);
      for (const question of structuredQuestions) {
        expect(visibleFaq, "Structured data cannot invent invisible FAQs").toContain(question);
      }

      const bounds = await answer.boundingBox();
      expect(bounds, "Answer block must have a visible layout box").not.toBeNull();
      expect(bounds!.x, "Quick Answer cannot clip at the left edge").toBeGreaterThanOrEqual(-2);
      expect(bounds!.x + bounds!.width, "Quick Answer cannot clip at the right edge").toBeLessThanOrEqual(viewport.width + 2);

      await mkdir(output, { recursive: true });
      await answer.screenshot({
        path: join(output, viewport.name + "-" + slug + ".png"),
        animations: "disabled",
        timeout: 20_000,
      });
    });
  }
}
