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
      app_metadata: { account_type: "training" },
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
      // Exercise *real source counts*, not just dashboard visibility.
      // This fresh disposable training-origin account started exactly one
      // course and completed no lessons or courses at this point in the suite.
      const { data: originUser, error: originError } = await admin.auth.admin.getUserById(learnerId);
      expect(originError).toBeNull();
      expect(originUser.user?.app_metadata?.account_type).toBe("training");
      const { data: starts, error: startsError } = await admin.from("training_enrollments")
        .select("id,completed_at").eq("user_id", learnerId);
      expect(startsError).toBeNull();
      expect(starts).toHaveLength(1);
      expect(starts?.[0].completed_at).toBeNull();
      const { data: lessonRows, error: lessonRowsError } = await admin.from("training_lesson_progress")
        .select("lesson_id").eq("user_id", learnerId);
      expect(lessonRowsError).toBeNull();
      expect(lessonRows).toHaveLength(0);
      // The isolated CI seed contains no other training-origin account. The
      // two figures must match the actual Supabase Auth + enrollment fixture.
      const activationCard = (label: string) => adminPage.locator(".status-summary-card")
        .filter({ hasText: label }).locator("strong").first();
      await expect(activationCard("Training registrations")).toHaveText("1");
      await expect(activationCard("First course started")).toHaveText("1");
      await expect(activationCard("First course completion")).toHaveText("0");
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

  test("server rejects a forged early lesson completion despite the disabled UI button", async ({ page }) => {
    test.setTimeout(90_000);
    const firstPath = COURSE_URL + "/lessons/" + firstLessonId;
    await signIn(page, learnerEmail, firstPath);
    const finishForm = page.locator("form.training-integrity-complete-form");
    await expect(finishForm).toBeVisible();
    await expect(finishForm.locator('button[type="submit"]')).toBeDisabled();

    // Intentionally bypass only browser-side validation. The real server
    // action must still enforce saved active reading time for this learner.
    await finishForm.evaluate((element) => {
      const form = element as HTMLFormElement;
      form.noValidate = true;
      form.requestSubmit();
    });
    await expect(page).toHaveURL(/lesson_error=time/, { timeout: 30_000 });
    const { data: progress, error: progressError } = await admin.from("training_lesson_progress")
      .select("lesson_id").eq("user_id", learnerId).eq("lesson_id", firstLessonId);
    expect(progressError).toBeNull();
    expect(progress).toHaveLength(0);
    const { data: credentials } = await admin.from("training_certificates")
      .select("id").eq("user_id", learnerId).eq("course_id", courseId);
    expect(credentials).toHaveLength(0);
  });

  test("final assessment failure, retry, course completion and certificate issuance use real UI actions", async ({ page, browser }) => {
    test.setTimeout(240_000);
    // This phase deliberately starts from *synthetic local prerequisite records*.
    // It tests final assessment / certification, NOT a claim that the learner
    // actually spent the required reading time on every Foundations lesson.
    const { data: modules, error: modulesError } = await admin.from("training_modules")
      .select("id").eq("course_id", courseId);
    expect(modulesError).toBeNull();
    expect(modules?.length).toBeGreaterThan(0);
    const { data: lessons, error: lessonsError } = await admin.from("training_lessons")
      .select("id").in("module_id", (modules || []).map((row) => row.id))
      .eq("is_published", true);
    expect(lessonsError).toBeNull();
    expect(lessons?.length).toBeGreaterThan(2);
    const { data: assessments, error: assessmentError } = await admin.from("training_assessments")
      .select("id").eq("course_id", courseId).eq("is_published", true);
    expect(assessmentError).toBeNull();
    expect(assessments?.length).toBeGreaterThan(0);
    const assessmentPath = COURSE_URL + "/assessments/" + assessments![0].id;
    await signIn(page, learnerEmail, assessmentPath);
    await expect(page.getByRole("heading", { name: "Complete the lessons first" })).toBeVisible();

    const timestamp = new Date().toISOString();
    const { error: fixtureError } = await admin.from("training_lesson_progress").upsert(
      lessons!.map((lesson) => ({
        user_id: learnerId, lesson_id: lesson.id, completed_at: timestamp,
      })),
      { onConflict: "user_id,lesson_id" },
    );
    expect(fixtureError).toBeNull();
    const { data: beforeCertificate } = await admin.from("training_certificates")
      .select("id").eq("user_id", learnerId).eq("course_id", courseId);
    expect(beforeCertificate).toHaveLength(0);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Answer the final check" })).toBeVisible();

    async function completeAnswerSheet(mode: "incorrect" | "correct") {
      const fields = page.locator(".training-auto-question");
      await expect(fields).toHaveCount(8);
      for (let index = 0; index < 8; index++) {
        const field = fields.nth(index);
        const prompt = (await field.locator("legend strong").innerText()).trim();
        // The local fixture question generator has known option formats.
        // This is a transaction-path oracle for synthetic test data, not a
        // learner comprehension or assessment quality evaluation.
        let expected: string;
        if (prompt.startsWith("Which response is the most subtle process failure")) {
          expected = "Apply this control only after the work has moved forward:";
        } else if (prompt.startsWith("In the same case")) {
          expected = "Keep the item open until this control is satisfied:";
        } else if (prompt.startsWith("The client wants this handled quickly")) {
          expected = "Do the administrative work that is supported by evidence, but preserve this boundary:";
        } else if (prompt.startsWith("You cannot fully resolve the case")) {
          expected = "Make the handoff decision-ready by applying this standard:";
        } else if (prompt.startsWith("Case:") || prompt.startsWith("A deadline is close")) {
          expected = "Apply this control before moving forward:";
        } else {
          throw new Error("Unrecognized training fixture question. Do not guess answers: " + prompt);
        }
        const labels = field.locator(".training-auto-question-options label");
        let selected = false;
        for (let option = 0; option < await labels.count(); option++) {
          const label = labels.nth(option);
          const copy = (await label.locator("span").innerText()).trim();
          const matches = copy.startsWith(expected);
          if ((mode === "correct") === matches) {
            await label.locator('input[type="radio"]').check();
            selected = true;
            break;
          }
        }
        if (!selected) throw new Error("No valid " + mode + " fixture choice for question " + (index + 1));
      }
      await page.getByRole("button", { name: "Submit final check" }).click();
    }

    // A scored failure must persist feedback without completing enrollment
    // or issuing a credential. Retrying exercises a genuinely new question set.
    await completeAnswerSheet("incorrect");
    await expect(page).toHaveURL(/result=failed/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Review and try again" })).toBeVisible();
    const { data: failures, error: failureError } = await admin.from("training_assessment_submissions")
      .select("status,score").eq("user_id", learnerId).eq("assessment_id", assessments![0].id);
    expect(failureError).toBeNull();
    expect(failures).toHaveLength(1);
    expect(failures![0].status).toBe("needs_revision");
    expect(failures![0].score).toBe(0);
    const { data: incomplete } = await admin.from("training_enrollments")
      .select("completed_at").eq("user_id", learnerId).eq("course_id", courseId).single();
    expect(incomplete?.completed_at).toBeNull();
    const { data: noneIssued } = await admin.from("training_certificates")
      .select("id").eq("user_id", learnerId).eq("course_id", courseId);
    expect(noneIssued).toHaveLength(0);
    await page.screenshot({ path: ARTIFACT_DIR + "/final-assessment-retry-desktop.png", animations: "disabled" });

    await expect(page.getByRole("heading", { name: "Answer the final check" })).toBeVisible();
    await completeAnswerSheet("correct");
    await expect(page).toHaveURL(/result=passed/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Final check complete" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View certificate" }).first()).toBeVisible();
    const { data: passedAttempts, error: attemptsError } = await admin.from("training_assessment_submissions")
      .select("status,score").eq("user_id", learnerId).eq("assessment_id", assessments![0].id);
    expect(attemptsError).toBeNull();
    expect(passedAttempts).toHaveLength(2);
    expect(passedAttempts?.some((row) => row.status === "reviewed" && Number(row.score) === 100)).toBe(true);

    const { data: completed, error: completedError } = await admin.from("training_enrollments")
      .select("completed_at").eq("user_id", learnerId).eq("course_id", courseId).single();
    expect(completedError).toBeNull();
    expect(completed?.completed_at).toBeTruthy();
    const { data: issued, error: issuedError } = await admin.from("training_certificates")
      .select("id,credential_code,metadata").eq("user_id", learnerId).eq("course_id", courseId);
    expect(issuedError).toBeNull();
    expect(issued).toHaveLength(1);
    expect(issued?.[0].credential_code).toMatch(/^VAT-[0-9A-F]{12}$/);
    expect(issued?.[0].metadata?.public_profile_visible).toBe(false);
    const { data: notifications, error: notificationsError } = await admin.from("training_notifications")
      .select("type").eq("user_id", learnerId).in("type", ["course_completed", "certificate_issued"]);
    expect(notificationsError).toBeNull();
    expect(notifications?.map((row) => row.type).sort()).toEqual(["certificate_issued", "course_completed"]);
    await page.screenshot({ path: ARTIFACT_DIR + "/final-assessment-passed-desktop.png", animations: "disabled" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: ARTIFACT_DIR + "/certificate-ready-mobile.png", animations: "disabled", fullPage: true });

    // Admin activation uses authoritative app_metadata to count actual
    // training-origin accounts; verify the funnel matches the fixture after
    // the real assessment submission has finalized enrollment + certificate.
    const adminContext = await browser.newContext();
    try {
      const adminPage = await adminContext.newPage();
      await signIn(adminPage, "admin.e2e@example.test", "/workspace/admin/training/activation");
      const card = (label: string) => adminPage.locator(".status-summary-card")
        .filter({ hasText: label }).locator("strong").first();
      await expect(card("Training registrations")).toHaveText("1");
      await expect(card("First course started")).toHaveText("1");
      await expect(card("First course completion")).toHaveText("1");
      await expect(adminPage.locator("body")).not.toContainText(learnerEmail);
      await adminPage.screenshot({ path: ARTIFACT_DIR + "/activation-after-completion-desktop.png", animations: "disabled" });
    } finally {
      await adminContext.close();
    }

    // Reloading a completed course must not create another certificate.
    await page.reload();
    const { data: stillOne } = await admin.from("training_certificates")
      .select("id").eq("user_id", learnerId).eq("course_id", courseId);
    expect(stillOne).toHaveLength(1);
  });

});
