#!/usr/bin/env node
/**
 * Manually invoked, authenticated production learner smoke.
 *
 * REQUIRES a dedicated, consenting QA learner account. Do not use a real
 * learner, auto-create Auth users, store browser state, or upload screenshots.
 * The test intentionally answers the first lesson's checkpoint and records
 * learner progress; it must never be placed on a daily schedule.
 */
import { chromium } from "playwright";

const baseUrl = "https://virtualassistant.com.ph";
const email = String(process.env.PRODUCTION_TEST_LEARNER_EMAIL || "").trim();
const password = String(process.env.PRODUCTION_TEST_LEARNER_PASSWORD || "");
const consent = process.env.PRODUCTION_LEARNER_SMOKE_ACK;
if (!email || !password || consent !== "dedicated-test-account-only") {
  throw new Error("Dedicated production QA credentials and explicit acknowledgment are required.");
}

const firstLessonPath =
  "/workspace/training/courses/virtual-assistant-foundations/lessons/12000000-0000-4000-8000-000000000001";
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: false,
    serviceWorkers: "block",
  });
  const page = await context.newPage();

  await page.goto(baseUrl + "/auth/login?next=" + encodeURIComponent(firstLessonPath), {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^Log in(?: to training)?$/ }).click();
  try {
    await page.waitForURL((url) => url.pathname.startsWith("/workspace/training"), { timeout: 45_000 });
  } catch {
    throw new Error(
      "Dedicated QA account could not log in. Check account activation, " +
      "production Turnstile requirements, and test-account credentials. Never bypass CAPTCHA."
    );
  }

  await page.goto(baseUrl + firstLessonPath, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Ready to complete this lesson?" })
    .waitFor({ state: "visible", timeout: 25_000 });
  const checkpoint = page.locator(".training-inline-checkpoint");
  await checkpoint.waitFor({ state: "visible", timeout: 20_000 });

  const choiceCount = await checkpoint.locator('input[type="radio"]').count();
  if (choiceCount < 2 || choiceCount > 8) throw new Error("Unexpected first-lesson checkpoint choices");
  let correct = false;
  for (let i = 0; i < choiceCount; i++) {
    await checkpoint.locator('input[type="radio"]').nth(i).check();
    await checkpoint.getByRole("button", { name: "Check answer" }).click();
    await page.getByText(/Correct\. Your quick check is saved\.|Not quite\.|couldn't save that answer/i)
      .first().waitFor({ state: "visible", timeout: 30_000 });
    if (await page.getByText("Correct. Your quick check is saved.").count()) {
      correct = true;
      break;
    }
  }
  if (!correct) throw new Error("Could not persist a correct first-lesson checkpoint");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText("Quick check complete.").waitFor({ state: "visible", timeout: 25_000 });

  const form = page.locator("form.training-integrity-complete-form");
  const note = form.locator('textarea[name="exercise_response"]');
  if (await note.count()) {
    await note.fill(
      "I will verify client instructions, record approval boundaries, document " +
      "open questions, communicate with the right owner, and provide a clear handoff."
    );
  }

  const marker = page.locator('[data-training-content-end="12000000-0000-4000-8000-000000000001"]');
  await marker.scrollIntoViewIfNeeded();
  const finish = form.locator('button[type="submit"]');
  // Active time must be earned normally. Keep the page visible and provide
  // modest keyboard activity; do not alter the database or bypass the gate.
  let enabled = false;
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("ArrowDown");
    if (await finish.isEnabled()) {
      enabled = true;
      break;
    }
    await page.waitForTimeout(15_000);
  }
  if (!enabled) throw new Error("First lesson did not become completable within normal active-reading window");
  await finish.click();
  await page.waitForURL((url) =>
    url.pathname.startsWith("/workspace/training/courses/virtual-assistant-foundations/lessons/") &&
    url.pathname !== firstLessonPath, { timeout: 30_000 });
  await page.getByRole("heading", { name: "Ready to complete this lesson?" })
    .waitFor({ state: "visible", timeout: 30_000 });

  await page.setViewportSize({ width: 390, height: 844 });
  const horizontalOverflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  if (horizontalOverflow) throw new Error("Mobile next-lesson page has horizontal overflow");

  // No credentials, learner identifiers, answer values, cookies, or screenshots.
  console.info("Production QA smoke passed: login, persisted checkpoint, lesson completion, next lesson, mobile layout.");
  await context.close();
} finally {
  await browser.close();
}
