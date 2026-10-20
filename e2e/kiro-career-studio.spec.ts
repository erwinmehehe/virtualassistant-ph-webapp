import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { disposableLoginHeaders } from "./disposable-login-isolation";

const DESTINATION = "/workspace/training/coach";
const PASSWORD = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";

test.describe("Kiro Career Studio - isolated learner experience", () => {
  test.setTimeout(180_000);

  test("anonymous learners are redirected to sign-in", async ({ page }) => {
    const response = await page.goto(DESTINATION);
    expect(response).not.toBeNull();
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: /Turn your VA training into confident next steps/i })).toHaveCount(0);
  });

  test("authenticated VA can practice without uploading drafts, including on mobile", async ({ browser }) => {
    // A synthetic login identity is accepted only with loopback app + DB;
    // never run this test against any hosted database or real accounts.
    const context = await browser.newContext({ extraHTTPHeaders: disposableLoginHeaders(82) });
    try {
      const page = await context.newPage();
      await page.goto("/auth/login?next=" + encodeURIComponent(DESTINATION));
      await page.getByLabel("Email").fill("va.e2e@example.test");
      await page.getByLabel("Password").fill(PASSWORD);
      await page.getByRole("button", { name: /^Log in(?: to training)?$/ }).click();
      await expect(page).toHaveURL((url) => url.pathname === DESTINATION, { timeout: 30000 });

      await expect(page.getByRole("heading", { name: /Turn your VA training into confident next steps/i })).toBeVisible();
      await expect(page.getByText("Courses completed", { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: /Update my VA profile/ })).toBeVisible();

      // The site's normal analytics POSTs can occur while a learner types.
      // Audit bodies as well as destinations: never permit draft content to
      // leave the browser, and reject any new non-analytics write requests.
      const outboundWrites: Array<{ url: string; payload: string }> = [];
      page.on("request", (request) => {
        if (["POST", "PUT", "PATCH"].includes(request.method())) {
          outboundWrites.push({
            url: request.url(),
            payload: request.postData() || "",
          });
        }
      });

      await page.getByLabel(/What did you actually do/).fill("Sorted a fictional client inbox");
      await page.getByLabel(/Tools you used/).fill("Gmail");
      await expect(page.getByText(/Practice project \(simulated\): Practiced Sorted a fictional client inbox using Gmail/)).toBeVisible();
      await page.getByLabel("Actual work I performed").check();
      await expect(page.getByText(/Work experience draft: Sorted a fictional client inbox using Gmail/)).toBeVisible();

      await page.getByRole("button", { name: "Portfolio builder" }).click();
      await page.getByLabel(/Name your sample project/).fill("Fictional task handoff");
      await page.getByLabel(/What did the fictional client need/).fill("A daily task status update");
      await expect(page.getByText(/PRACTICE PORTFOLIO SAMPLE — NOT PAID CLIENT WORK/)).toBeVisible();

      await page.getByRole("button", { name: "Interview practice" }).click();
      await page.getByLabel("VA area to practice").selectOption("SEO");
      await expect(page.getByText(/website traffic dropped this week/)).toBeVisible();
      await page.getByLabel("Your answer").fill("I would first confirm the dates, check Search Console, and ask the SEO lead to approve any changes.");
      await page.getByRole("button", { name: /Review my answer/ }).click();
      await expect(page.getByText("Compare with the scenario checklist")).toBeVisible();
      const unexpectedWrites = outboundWrites.filter(({ url }) =>
        new URL(url).pathname !== "/api/analytics"
      );
      expect(unexpectedWrites, "Practice tools must not create API writes").toEqual([]);

      const draftMarkers = [
        "Sorted a fictional client inbox",
        "Fictional task handoff",
        "A daily task status update",
        "I would first confirm the dates",
      ];
      const leakedDrafts = outboundWrites.filter(({ payload }) => {
        // Encoded form bodies must not hide draft content from the assertion.
        let body = payload;
        try { body = decodeURIComponent(payload.replace(/\\+/g, " ")); } catch { /* keep original */ }
        return draftMarkers.some((marker) => body.includes(marker));
      });
      expect(leakedDrafts, "No resume, portfolio or interview draft can leave the browser").toEqual([]);

      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.getByRole("heading", { name: /Turn your VA training into confident next steps/i })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(2);
      await mkdir("artifacts/kiro-career-studio", { recursive: true });
      await page.screenshot({ path: "artifacts/kiro-career-studio/mobile.png", fullPage: true, animations: "disabled" });
    } finally {
      await context.close();
    }
  });
});
