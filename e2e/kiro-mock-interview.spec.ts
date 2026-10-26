import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { disposableLoginHeaders } from "./disposable-login-isolation";

const DESTINATION = "/workspace/training/coach/mock-interview";
const PASSWORD = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";

test.describe("Kiro expert panel — offline browser and privacy acceptance", () => {
  test.setTimeout(180_000);

  test("anonymous visitors cannot access the authenticated interview page", async ({ page }) => {
    await page.goto(DESTINATION);
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: /Practice with a virtual panel/i })).toHaveCount(0);
  });

  test("enrolled fictional VA can complete six offline rounds without uploading answers", async ({ browser }) => {
    const context = await browser.newContext({ extraHTTPHeaders: disposableLoginHeaders(86) });
    try {
      const page = await context.newPage();
      const coursePath = "/workspace/training/courses/virtual-assistant-foundations";
      await page.goto("/auth/login?next=" + encodeURIComponent(coursePath));
      await page.getByLabel("Email").fill("va.e2e@example.test");
      await page.getByLabel("Password").fill(PASSWORD);
      await page.getByRole("button", { name: /^Log in(?: to training)?$/ }).click();
      await expect(page).toHaveURL((url) => url.pathname === coursePath, { timeout: 30000 });

      const startCourse = page.getByRole("button", { name: /Start first lesson/ });
      if (await startCourse.count()) {
        await startCourse.click();
        await expect(page).toHaveURL(/\/lessons\//, { timeout: 30000 });
      }

      await page.goto(DESTINATION);
      await expect(page.getByRole("heading", { name: /Practice with a virtual panel/i })).toBeVisible();
      await expect(page.getByLabel("Enrolled training course")).toContainText("Virtual Assistant Foundations");
      await page.getByLabel("VA role or focus").selectOption("SEO");
      await page.getByLabel("Difficulty").selectOption("intermediate");

      const aiOption = page.getByLabel(/Adaptive AI panel/);
      expect(await aiOption.isDisabled()).toBe(true);
      const payloads: string[] = [];
      const interviewPosts: string[] = [];
      page.on("request", (request) => {
        if (["POST", "PUT", "PATCH"].includes(request.method())) {
          payloads.push(request.postData() || "");
          if (new URL(request.url()).pathname === "/api/training/mock-interview") {
            interviewPosts.push(request.url());
          }
        }
      });

      await page.getByRole("button", { name: /Start six-round mock interview/ }).click();
      for (let index = 0; index < 6; index += 1) {
        await expect(page.getByText("Round " + (index + 1) + " of 6")).toBeVisible();
        await page.getByLabel("Your answer").fill(
          "Fictional answer " + (index + 1) + ": I will confirm the task, document a plan, check the details, get client approval and send an update."
        );
        await page.getByRole("button", { name: index === 5 ? /Finish and review/ : /Submit answer/ }).click();
      }
      await expect(page.getByRole("heading", { name: /Expert panel practice report/ })).toBeVisible();
      await expect(page.getByText(/100-point reference rubric/)).toBeVisible();
      await expect(page.getByText(/answered 6 of 6 fictional interview questions/i)).toBeVisible();
      expect(interviewPosts, "Offline rehearsal must never call AI API").toEqual([]);
      expect(payloads.filter((body) => body.includes("Fictional answer")), "Offline answers must never be transmitted").toEqual([]);

      await mkdir("artifacts/kiro-mock-interview", { recursive: true });
      await page.screenshot({ path: "artifacts/kiro-mock-interview/desktop.png", fullPage: true, animations: "disabled" });
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.getByRole("heading", { name: /Expert panel practice report/ })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(2);
      await page.screenshot({ path: "artifacts/kiro-mock-interview/mobile.png", fullPage: true, animations: "disabled" });
    } finally {
      await context.close();
    }
  });
});
