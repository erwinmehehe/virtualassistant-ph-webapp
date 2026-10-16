import { mkdir } from "node:fs/promises";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

// Acceptance evidence for #904. All accounts and database writes are LOCAL E2E ONLY.
// The guard deliberately rejects any hosted Supabase URL and external app URL.
const COURSE_SLUG = "virtual-assistant-foundations";
const COURSE_URL = "/workspace/training/courses/" + COURSE_SLUG;
const PASSWORD = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";
const ARTIFACT_DIR = "artifacts/training-uat";

function isLoopback(value: string | undefined) {
  try {
    const url = new URL(value || "");
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

async function signIn(page: Page, email: string, destination: string) {
  await page.goto("/auth/login?next=" + encodeURIComponent(destination));
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /^Log in(?: to training)?$/ }).click();
  await expect(page).toHaveURL((url) => url.pathname === destination, { timeout: 30_000 });
}

test.describe("P1 training transactional acceptance (disposable local Supabase)", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(
    !isLoopback(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
      !isLoopback(process.env.E2E_BASE_URL || "http://127.0.0.1:3000"),
    "Never provision acceptance learners or mutate an external database",
  );

  let admin: SupabaseClient;
  let learnerEmail = "";
  let learnerId = "";
  let courseId = "";
  let firstLessonId = "";

  test.beforeAll(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!isLoopback(url) || !key) throw new Error("Disposable local Supabase required");
    admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: course, error: courseError } = await admin.from("training_courses")
      .select("id").eq("slug", COURSE_SLUG).eq("status", "published").single();
    if (courseError || !course) throw courseError || new Error("Published Foundations course missing");
    courseId = course.id;

    const { data: modules, error: moduleError } = await admin.from("training_modules")
      .select("id,position").eq("course_id", course.id).order("position");
    if (moduleError || !modules?.length) throw moduleError || new Error("Published modules missing");
    const { data: lessons, error: lessonError } = await admin.from("training_lessons")
      .select("id,module_id,position").in("module_id", modules.map((m) => m.id))
      .eq("is_published", true);
    if (lessonError || !lessons?.length) throw lessonError || new Error("Published lessons missing");
    const order = new Map(modules.map((m, index) => [m.id, index]));
    firstLessonId = [...lessons].sort((a, b) =>
      (order.get(a.module_id) ?? 99999) - (order.get(b.module_id) ?? 99999) ||
      a.position - b.position || a.id.localeCompare(b.id)
    )[0].id;

    learnerEmail = "training-p1-" + Date.now() + "@example.test";
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email: learnerEmail,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role: "va", full_name: "Isolated Training UAT" },
    });
    if (authError || !created.user) throw authError || new Error("Cannot seed local learner");
    learnerId = created.user.id;
    const { error: profileError } = await admin.from("profiles").upsert({
      id: learnerId,
      role: "va",
      full_name: "Isolated Training UAT",
      account_status: "active",
      email_verified: true,
    }, { onConflict: "id" });
    if (profileError) throw profileError;

    await mkdir(ARTIFACT_DIR, { recursive: true });
  });

  test("new learner is enrolled by the real Start action, enters the first lesson, and cannot complete it immediately", async ({ page }) => {
    test.setTimeout(150_000);
    const firstPath = COURSE_URL + "/lessons/" + firstLessonId;
    await signIn(page, learnerEmail, "/workspace/training");

    const { data: before } = await admin.from("training_enrollments")
      .select("id").eq("user_id", learnerId).eq("course_id", courseId);
    expect(before).toHaveLength(0);

    await page.getByRole("button", { name: "Start VA Foundations" }).click();
    await expect(page).toHaveURL((url) => url.pathname === firstPath, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Ready to complete this lesson?" })).toBeVisible();

    const { data: enrollment, error: enrollmentError } = await admin.from("training_enrollments")
      .select("id,completed_at").eq("user_id", learnerId).eq("course_id", courseId).single();
    expect(enrollmentError).toBeNull();
    expect(enrollment?.id).toBeTruthy();
    expect(enrollment?.completed_at).toBeNull();

    const finish = page.getByRole("button", { name: "Complete lesson when ready" });
    await expect(finish).toBeDisabled();
    const { data: progress } = await admin.from("training_lesson_progress")
      .select("lesson_id").eq("user_id", learnerId).eq("lesson_id", firstLessonId);
    expect(progress).toHaveLength(0);

    // Exercise a real checkpoint request without guessing or storing its answer.
    const checkpoint = page.locator(".training-inline-checkpoint");
    if (await checkpoint.count()) {
      await checkpoint.locator('input[type="radio"]').first().check();
      await checkpoint.getByRole("button", { name: "Check answer" }).click();
      await expect(page.getByText(/quick check is saved|Not quite\. Review/i)).toBeVisible();
    }

    // Real reader engagement is persisted by the page's 20-second heartbeat.
    await page.locator('[data-training-content-end="' + firstLessonId + '"]').scrollIntoViewIfNeeded();
    await expect.poll(async () => {
      const { data } = await admin.from("training_lesson_engagement")
        .select("max_scroll_percent").eq("user_id", learnerId).eq("lesson_id", firstLessonId).maybeSingle();
      return Number(data?.max_scroll_percent || 0);
    }, { timeout: 50_000, intervals: [1000, 2000, 5000] }).toBeGreaterThanOrEqual(85);

    await page.screenshot({ path: ARTIFACT_DIR + "/first-lesson-desktop.png", animations: "disabled" });
    await page.goto("/workspace/training");
    await expect(page.locator('a[href="' + firstPath + '"]').first()).toBeVisible();
    const { data: after } = await admin.from("training_enrollments")
      .select("id").eq("user_id", learnerId).eq("course_id", courseId);
    expect(after).toHaveLength(1);
  });

  test("Australian path selection is persisted and opens a real published course", async ({ page }) => {
    test.setTimeout(90_000);
    await signIn(page, learnerEmail, "/workspace/training");
    const selection = page.locator('form:has(input[name="specialization_slug"][value="tradie-operations"])');
    await expect(selection).toHaveCount(1);
    await selection.locator('button[type="submit"]').click();
    await expect(page).toHaveURL((url) =>
      url.pathname.startsWith("/workspace/training/courses/"), { timeout: 30_000 });
    const { data: preference, error } = await admin.from("training_learner_preferences")
      .select("australia_specialization").eq("user_id", learnerId).single();
    expect(error).toBeNull();
    expect(preference?.australia_specialization).toBe("tradie-operations");
    await page.screenshot({ path: ARTIFACT_DIR + "/australia-learning-path.png", animations: "disabled" });
  });

  test("admin training reports are role-protected and identity-free on desktop and mobile", async ({ browser }) => {
    test.setTimeout(120_000);
    const adminContext = await browser.newContext();
    const clientContext = await browser.newContext();
    try {
      const adminPage = await adminContext.newPage();
      await signIn(adminPage, "admin.e2e@example.test", "/workspace/admin/training");
      await expect(adminPage.getByRole("heading", { name: "Where learners get stuck" })).toBeVisible();
      await expect(adminPage.getByRole("heading", { name: "Next-lesson bottlenecks" })).toBeVisible();
      await expect(adminPage.locator("body")).not.toContainText(learnerEmail);
      await adminPage.getByRole("link", { name: "Account activation" }).first().click();
      await expect(adminPage).toHaveURL(/\/workspace\/admin\/training\/activation$/);
      await expect(adminPage.locator("body")).not.toContainText(learnerEmail);
      await adminPage.setViewportSize({ width: 390, height: 844 });
      await adminPage.screenshot({ path: ARTIFACT_DIR + "/admin-activation-mobile.png", animations: "disabled", fullPage: true });

      const clientPage = await clientContext.newPage();
      await signIn(clientPage, "client.e2e@example.test", "/workspace/client/company");
      await clientPage.goto("/workspace/admin/training/activation");
      await expect(clientPage).not.toHaveURL(/\/workspace\/admin\/training\/activation/);
    } finally {
      await Promise.allSettled([adminContext.close(), clientContext.close()]);
    }
  });
});
