import { mkdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const COURSE = "/workspace/training/courses/virtual-assistant-foundations";
const DESTINATION = "/workspace/training/coach/mock-interview";
const PASSWORD = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";

function localUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch { return false; }
}

async function login(page: Page, email: string, destination: string) {
  await page.goto("/auth/login?next=" + encodeURIComponent(destination));
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /^Log in(?: to training)?$/ }).click();
  await expect(page).toHaveURL((url) => url.pathname === destination, { timeout: 30000 });
}

const payload = {
  courseSlug: "virtual-assistant-foundations",
  difficulty: "beginner",
  focus: "General VA",
  consent: true,
  turns: [{ speaker: "recruiter", question: "How would you handle a fictional task?", answer: "I will check the deadline, make a plan and request approval." }],
};

test.describe("Kiro AI mock interview — disposable local fixture gates", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(180_000);
  test.skip(process.env.AI_MOCK_INTERVIEW_E2E_MOCK !== "true", "Only the isolated mock-interview pilot enables this fixture");

  test.beforeAll(() => {
    if (process.env.AI_MOCK_INTERVIEW_ENABLED !== "true" ||
        !localUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || "") ||
        !localUrl(process.env.E2E_BASE_URL || "")) {
      throw new Error("AI mock-interview fixture must use enabled local app and disposable loopback Supabase");
    }
  });

  test("anonymous requests are rejected before course access", async ({ request }) => {
    const response = await request.post("/api/training/mock-interview", { data: payload });
    expect(response.status()).toBe(401);
    expect(response.headers()["cache-control"]).toBe("no-store");
  });

  test("signed-in but unenrolled client cannot use a VA training interview", async ({ page }) => {
    await login(page, "client.e2e@example.test", "/workspace/client");
    const response = await page.request.post("/api/training/mock-interview", { data: payload });
    expect(response.status()).toBe(403);
  });

  test("enrolled VA can conduct six fictional AI-mode rounds without contacting a model", async ({ page }) => {
    await login(page, "va.e2e@example.test", COURSE);
    const start = page.getByRole("button", { name: /Start first lesson/ });
    if (await start.count()) {
      await start.click();
      await expect(page).toHaveURL(/\/lessons\//, { timeout: 30000 });
    }
    await page.goto(DESTINATION);
    await expect(page.getByRole("heading", { name: /Practice with a virtual panel/i })).toBeVisible();
    await page.getByLabel(/Adaptive AI panel/).check();
    await expect(page.getByRole("button", { name: /Start six-round mock interview/ })).toBeDisabled();
    await page.getByLabel(/I understand my interview answers/).check();
    await page.getByRole("button", { name: /Start six-round mock interview/ }).click();

    for (let index = 0; index < 6; index += 1) {
      await expect(page.getByText("Round " + (index + 1) + " of 6")).toBeVisible();
      await page.getByLabel("Your answer").fill(
        "Fictional round " + (index + 1) + ". I would confirm requirements, verify the facts, request approval, document the result and update the client."
      );
      await page.getByRole("button", { name: index === 5 ? /Finish and review/ : /Submit answer/ }).click();
      if (index < 5) await expect(page.getByText("Round " + (index + 2) + " of 6")).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: /Expert panel practice report/ })).toBeVisible();
    await expect(page.getByText(/LOCAL TEST INTERVIEW — simulated responses/)).toBeVisible();
    await mkdir("artifacts/kiro-mock-interview", { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await page.screenshot({ path: "artifacts/kiro-mock-interview/ai-fixture-mobile.png", fullPage: true, animations: "disabled" });
  });
});
