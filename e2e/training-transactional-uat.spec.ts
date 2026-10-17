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
      // Compute *all* training-origin accounts from authoritative Auth rather
      // than assuming the database contains only this test learner. Serial
      // Playwright retries can leave other synthetic local UAT users behind.
      const { data: authList, error: authListError } = await admin.auth.admin.listUsers({
        page: 1, perPage: 500,
      });
      expect(authListError).toBeNull();
      expect(authList.users.length).toBeLessThan(500);
      const originIds = authList.users.filter((user) =>
        user.app_metadata?.account_type === "training" && !user.deleted_at && !user.is_anonymous
      ).map((user) => user.id);
      expect(originIds).toContain(learnerId);
      const { data: sourceEnrollments, error: sourceError } = await admin.from("training_enrollments")
        .select("user_id,started_at,completed_at").in("user_id", originIds);
      expect(sourceError).toBeNull();
      const startedCount = new Set((sourceEnrollments || []).map((row) => row.user_id)).size;
      const completedCount = new Set((sourceEnrollments || [])
        .filter((row) => row.completed_at).map((row) => row.user_id)).size;
      const activationCard = (label: string) => adminPage.locator(".status-summary-card")
        .filter({ hasText: label }).locator("strong").first();
      await expect(activationCard("Training registrations")).toHaveText(String(originIds.length));
      await expect(activationCard("First course started")).toHaveText(String(startedCount));
      await expect(activationCard("First course completion")).toHaveText(String(completedCount));
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
    await expect(page.getByRole("link", { name: "Confirm certificate name" })).toBeVisible();
    const { data: heldCertificates } = await admin.from("training_certificates")
      .select("id").eq("user_id", learnerId).eq("course_id", courseId);
    expect(heldCertificates).toHaveLength(0);
    const { data: passedAttempts, error: attemptsError } = await admin.from("training_assessment_submissions")
      .select("status,score").eq("user_id", learnerId).eq("assessment_id", assessments![0].id);
    expect(attemptsError).toBeNull();
    expect(passedAttempts).toHaveLength(2);
    expect(passedAttempts?.some((row) => row.status === "reviewed" && Number(row.score) === 100)).toBe(true);

    const { data: completed, error: completedError } = await admin.from("training_enrollments")
      .select("completed_at").eq("user_id", learnerId).eq("course_id", courseId).single();
    expect(completedError).toBeNull();
    expect(completed?.completed_at).toBeTruthy();

    // A user can tamper with user_metadata using the public Auth SDK; that
    // must never count as the server-owned public identity confirmation.
    const { data: beforeIdentity } = await admin.auth.admin.getUserById(learnerId);
    const { error: spoofError } = await admin.auth.admin.updateUserById(learnerId, {
      user_metadata: {
        ...(beforeIdentity.user?.user_metadata || {}),
        certificate_name: "Unconfirmed Spoofed UAT",
        certificate_name_confirmed_at: new Date().toISOString(),
      },
    });
    expect(spoofError).toBeNull();
    const { data: spoofedIdentity } = await admin.auth.admin.getUserById(learnerId);
    expect(spoofedIdentity.user?.app_metadata?.certificate_recipient_name).toBeUndefined();

    // Passing never publishes an unconfirmed account/Google name. Confirm the
    // desired public name through the same form real learners use, then verify
    // that issuance resumes without a second assessment.
    await page.goto("/workspace/training/account");
    await expect(page.getByRole("heading", { name: "Certificate recipient name" })).toBeVisible();
    await page.getByLabel("Full name to print on certificates").fill("Isolated Confirmed UAT");
    await page.getByLabel(/I confirm this is the name I want on my certificates/).check();
    await page.getByRole("button", { name: "Confirm certificate name" }).click();
    await expect(page).toHaveURL(/certificate_name_status=saved/, { timeout: 30_000 });
    await expect.poll(async () => {
      const { data } = await admin.from("training_certificates")
        .select("id").eq("user_id", learnerId).eq("course_id", courseId);
      return data?.length || 0;
    }, { timeout: 20_000 }).toBe(1);
    await page.goto(assessmentPath);
    await expect(page.getByRole("link", { name: "View certificate" }).first()).toBeVisible();

    const { data: issued, error: issuedError } = await admin.from("training_certificates")
      .select("id,credential_code,metadata").eq("user_id", learnerId).eq("course_id", courseId);
    expect(issuedError).toBeNull();
    expect(issued).toHaveLength(1);
    expect(issued?.[0].credential_code).toMatch(/^VAT-[0-9A-F]{12}$/);
    expect(issued?.[0].metadata?.public_profile_visible).toBe(false);
    expect(issued?.[0].metadata?.recipient_name).toBe("Isolated Confirmed UAT");
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


  test("staff verified correction preserves issued evidence and future name edits do not rewrite it", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const { data: before, error: beforeError } = await admin.from("training_certificates")
      .select("id,credential_code,issued_at,course_id,metadata")
      .eq("user_id", learnerId).eq("course_id", courseId).single();
    expect(beforeError).toBeNull();
    const code = before!.credential_code;

    const adminContext = await browser.newContext();
    try {
      const staffPage = await adminContext.newPage();
      await signIn(staffPage, "admin.e2e@example.test", "/workspace/admin/training/certificate-corrections");
      await staffPage.getByLabel("Credential code").fill(code);
      await staffPage.getByRole("button", { name: "Find certificate" }).click();
      await expect(staffPage.getByRole("heading", { name: "Verify and correct recipient" })).toBeVisible();
      await expect(staffPage.getByText(/Current recipient: Isolated Confirmed UAT/)).toBeVisible();
      await staffPage.getByLabel("Correct recipient name").fill("Isolated Corrected UAT");
      await staffPage.getByLabel("Support case reference").fill("TEST-CASE-915");
      await staffPage.getByLabel(/I verified account ownership/).check();
      await staffPage.getByRole("button", { name: "Save verified correction" }).click();
      await expect(staffPage).toHaveURL(/status=corrected/, { timeout: 30_000 });

      const { data: after, error: afterError } = await admin.from("training_certificates")
        .select("id,credential_code,issued_at,course_id,metadata").eq("id", before!.id).single();
      expect(afterError).toBeNull();
      expect(after?.id).toBe(before?.id);
      expect(after?.credential_code).toBe(before?.credential_code);
      expect(after?.issued_at).toBe(before?.issued_at);
      expect(after?.course_id).toBe(before?.course_id);
      expect(after?.metadata?.recipient_name).toBe("Isolated Corrected UAT");
      expect(after?.metadata?.recipient_name_corrections).toHaveLength(1);
      expect(JSON.stringify(after?.metadata)).not.toContain("TEST-CASE-915");
      expect(after?.metadata?.recipient_name_corrections[0]).toMatchObject({
        previous_name: "Isolated Confirmed UAT",
        new_name: "Isolated Corrected UAT",
        case_reference_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      });
    } finally {
      await adminContext.close();
    }

    // Public verifier shows the corrected recipient, not support case or
    // private account metadata; learner changes only apply to future awards.
    await page.goto("/training/certificates/" + code);
    await expect(page.getByText("Isolated Corrected UAT", { exact: true })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("TEST-CASE-915");
    await signIn(page, learnerEmail, "/workspace/training/account");
    await page.getByLabel("Full name to print on certificates").fill("Isolated Future-Only UAT");
    await page.getByLabel(/I confirm this is the name I want on my certificates/).check();
    await page.getByRole("button", { name: "Confirm certificate name" }).click();
    await expect(page).toHaveURL(/certificate_name_status=saved/, { timeout: 30_000 });

    const { data: unchanged } = await admin.from("training_certificates")
      .select("issued_at,credential_code,metadata").eq("id", before!.id).single();
    expect(unchanged?.credential_code).toBe(before?.credential_code);
    expect(unchanged?.issued_at).toBe(before?.issued_at);
    expect(unchanged?.metadata?.recipient_name).toBe("Isolated Corrected UAT");
    const { data: saved } = await admin.auth.admin.getUserById(learnerId);
    expect(saved.user?.app_metadata?.certificate_recipient_name).toBe("Isolated Future-Only UAT");
    expect(saved.user?.app_metadata?.certificate_recipient_name_confirmed_at).toBeTruthy();
  });

  test("complete a two-lesson course through real-time learner UI gates without preloaded progress", async ({ page, browser }) => {
    test.setTimeout(480_000);
    // This intentionally published course and learner exist ONLY in the
    // throwaway loopback database. No progress, engagement, pass or credential
    // records are seeded. Playwright must earn the server's reading timer.
    if (!isLoopback(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
        !isLoopback(process.env.E2E_BASE_URL || "http://127.0.0.1:3000")) {
      throw new Error("Refusing real-journey fixture outside disposable local services");
    }

    const token = Date.now().toString(36);
    const slug = "training-genuine-uat-" + token;
    const coursePath = "/workspace/training/courses/" + slug;
    const email = "training-real-journey-" + token + "@example.test";
    const now = new Date().toISOString();
    const { data: course, error: courseError } = await admin.from("training_courses").insert({
      slug, title: "Genuine Completion E2E " + token,
      summary: "Fictional client handoffs and source verification for an isolated acceptance run.",
      category: "foundation", estimated_minutes: 2, status: "published",
      reviewed_by: "Automated UAT (test only)", last_reviewed_at: now, published_at: now,
    }).select("id").single();
    expect(courseError).toBeNull();
    expect(course?.id).toBeTruthy();

    const { data: module, error: moduleError } = await admin.from("training_modules").insert({
      course_id: course!.id, title: "Evidence-driven client handoffs",
      summary: "Fictional quality-control exercises", position: 1,
    }).select("id").single();
    expect(moduleError).toBeNull();
    expect(module?.id).toBeTruthy();

    function content(lessonNumber: number, includeExercise: boolean) {
      const rulePrefix = lessonNumber === 1 ? "handoff" : "verification";
      const blocks: Array<Record<string, unknown>> = [
        { type: "heading", text: "Keep fictional client operations accountable" },
        { type: "paragraph", text:
            "This test lesson uses only fictional customer records. Confirm the owner, " +
            "source, approval boundary, evidence, and deadline before describing " +
            "anything as complete. Unresolved exceptions must remain visible " +
            "to the assigned reviewer, rather than being silently closed." },
        { type: "checklist", title: "Critical controls",
          items: [
            "Verify the original source and record evidence before closing the " + rulePrefix + " request.",
            "Ask the authorized owner for approval before changing the scope or payment instructions.",
            "Escalate tax, payroll, clinical, or legal decisions to the licensed specialist.",
            "Make every handoff decision-ready with an owner, outstanding issue, deadline, and next action.",
            "Recheck open items before marking work complete; never assume a clean-looking dashboard is final.",
            "Document source mismatches and preserve an auditable trail for the next reviewer.",
          ],
        },
        { type: "scenario", title: "Worked example",
          text: "A fictional client requests an urgent account change without approval. " +
            "The virtual assistant gathers evidence, records the unresolved request, " +
            "and asks the responsible owner to authorize a safe next step." },
      ];
      if (includeExercise) {
        blocks.push({
          type: "exercise", title: "Your decision-ready handoff note",
          text: "Describe the owner, current evidence, pending approval, and next safe step. " +
            "Use an invented customer and omit real personal details.",
        });
      }
      return blocks;
    }
    const { data: createdLessons, error: lessonError } = await admin.from("training_lessons").insert([
      {
        module_id: module!.id, slug: "evidence-first", title: "Evidence before closure",
        summary: "Check original records and approval authority.", position: 1,
        estimated_minutes: 1, is_published: true, reviewed_by: "Automated UAT (test only)",
        last_reviewed_at: now, content: content(1, true),
      },
      {
        module_id: module!.id, slug: "decision-ready-handoffs", title: "Decision-ready handoffs",
        summary: "Record ownership and unresolved decisions.", position: 2,
        estimated_minutes: 1, is_published: true, reviewed_by: "Automated UAT (test only)",
        last_reviewed_at: now, content: content(2, false),
      },
    ]).select("id,position");
    expect(lessonError).toBeNull();
    expect(createdLessons).toHaveLength(2);
    const ordered = [...createdLessons!].sort((a, b) => a.position - b.position);
    const lessonPaths = ordered.map((lesson) => coursePath + "/lessons/" + lesson.id);

    const { data: assessment, error: assessmentError } = await admin.from("training_assessments").insert({
      course_id: course!.id, module_id: module!.id, title: "Fictional operations final check",
      instructions: "Select the control-based response for each fictional scenario.",
      assessment_type: "knowledge", pass_score: 80, position: 1, is_published: true,
    }).select("id").single();
    expect(assessmentError).toBeNull();

    const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
      email, password: PASSWORD, email_confirm: true,
      user_metadata: {
        role: "va", full_name: "Genuine Completion Test Learner",
        certificate_name: "Genuine Completion Test Learner",
      },
      // Fixture simulates a verified server-side name confirmation.
      app_metadata: {
        account_type: "training",
        certificate_recipient_name: "Genuine Completion Test Learner",
        certificate_recipient_name_confirmed_at: now,
      },
    });
    expect(userError).toBeNull();
    const uid = createdUser.user!.id;
    const { error: profileError } = await admin.from("profiles").upsert({
      id: uid, role: "va", full_name: "Genuine Completion Test Learner",
      account_status: "active", email_verified: true,
    }, { onConflict: "id" });
    expect(profileError).toBeNull();

    type AcceptanceRow = {
      id?: string;
      lesson_id?: string;
      active_seconds?: number;
      max_scroll_percent?: number;
      status?: string;
      score?: number | null;
      credential_code?: string;
      metadata?: { public_profile_visible?: boolean } | null;
    };
    async function learnerRows(table: string, columns: string, column = "user_id"): Promise<AcceptanceRow[]> {
      const { data, error } = await admin.from(table).select(columns).eq(column, uid);
      expect(error).toBeNull();
      return (data || []) as unknown as AcceptanceRow[];
    }
    expect(await learnerRows("training_enrollments", "id")).toHaveLength(0);
    expect(await learnerRows("training_lesson_progress", "lesson_id")).toHaveLength(0);
    expect(await learnerRows("training_lesson_engagement", "lesson_id")).toHaveLength(0);
    expect(await learnerRows("training_assessment_submissions", "id")).toHaveLength(0);
    expect(await learnerRows("training_certificates", "id")).toHaveLength(0);

    await signIn(page, email, coursePath);
    await page.getByRole("button", { name: "Start first lesson" }).click();
    await expect(page).toHaveURL((url) => url.pathname === lessonPaths[0], { timeout: 30_000 });
    expect(await learnerRows("training_enrollments", "id")).toHaveLength(1);

    // A learner cannot skip lesson 1 by submitting lesson 2's disabled form.
    await page.goto(lessonPaths[1]);
    const secondForm = page.locator("form.training-integrity-complete-form");
    await expect(secondForm.locator('button[type="submit"]')).toBeDisabled();
    await secondForm.evaluate((element) => {
      const form = element as HTMLFormElement;
      form.noValidate = true;
      form.requestSubmit();
    });
    await expect(page).toHaveURL(/lesson_error=sequence/, { timeout: 30_000 });
    expect(await learnerRows("training_lesson_progress", "lesson_id")).toHaveLength(0);

    // The correct option is determined only from this fictional test fixture's
    // known question templates, not by reading an answer key from the app.
    function expectedPrefix(prompt: string) {
      if (prompt.startsWith("Which response is the most subtle process failure")) {
        return "Apply this control only after the work has moved forward:";
      }
      if (prompt.startsWith("In the same case")) {
        return "Keep the item open until this control is satisfied:";
      }
      if (prompt.startsWith("The client wants this handled quickly")) {
        return "Do the administrative work that is supported by evidence, but preserve this boundary:";
      }
      if (prompt.startsWith("You cannot fully resolve the case")) {
        return "Make the handoff decision-ready by applying this standard:";
      }
      if (prompt.startsWith("Case:") || prompt.startsWith("A deadline is close")) {
        return "Apply this control before moving forward:";
      }
      throw new Error("Unknown fictional training question; refusing to guess: " + prompt);
    }

    async function answerCheckpoint() {
      const checkpoint = page.locator(".training-inline-checkpoint");
      await expect(checkpoint).toBeVisible();
      const prompt = (await checkpoint.locator("strong").first().innerText()).trim();
      const prefix = expectedPrefix(prompt);
      const choices = checkpoint.locator(".training-checkpoint-options label");
      let selected = false;
      for (let i = 0; i < await choices.count(); i++) {
        const choice = choices.nth(i);
        const label = (await choice.locator("span").innerText()).trim();
        if (label.startsWith(prefix)) {
          await choice.locator('input[type="radio"]').check();
          selected = true;
          break;
        }
      }
      expect(selected, "A correct answer must exist for the known fixture").toBe(true);
      await checkpoint.getByRole("button", { name: "Check answer" }).click();
      await expect(page.getByText("Correct. Your quick check is saved.")).toBeVisible();
    }

    async function earnRealReadingTime(lessonId: string, expectedSeconds = 60) {
      await page.bringToFront();
      await page.locator('[data-training-content-end="' + lessonId + '"]').scrollIntoViewIfNeeded();
      await page.keyboard.press("ArrowDown");
      // Browser heartbeat awards at most elapsed visible, focused activity.
      // This takes real wall-clock time: no Date mocking, DB progress injection,
      // clock manipulation, or server action bypass.
      for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(20_000);
        await page.keyboard.press("Shift");
      }
      await expect.poll(async () => {
        const rows = await learnerRows("training_lesson_engagement", "lesson_id,active_seconds,max_scroll_percent");
        return Number(rows.find((row) => row.lesson_id === lessonId)?.active_seconds || 0);
      }, { timeout: 15_000, intervals: [1_000, 2_000, 3_000] }).toBeGreaterThanOrEqual(expectedSeconds);
      const rows = await learnerRows("training_lesson_engagement", "lesson_id,active_seconds,max_scroll_percent");
      expect(Number(rows.find((row) => row.lesson_id === lessonId)?.max_scroll_percent || 0)).toBeGreaterThanOrEqual(85);
    }

    await page.goto(lessonPaths[0]);
    await answerCheckpoint();
    const practicalNote = "Fictional client: I confirmed the source evidence, recorded the open " +
      "approval request for the authorized owner, documented a clear next action " +
      "and due time, and left the issue open until a decision can be verified.";
    await page.locator('textarea[name="exercise_response"]').fill(practicalNote);
    await earnRealReadingTime(ordered[0].id);
    await expect(page.getByRole("button", { name: "Complete lesson", exact: true })).toBeEnabled();

    // Leave and resume with all previously earned progress still persisted.
    await page.goto(coursePath);
    expect(await learnerRows("training_lesson_progress", "lesson_id")).toHaveLength(0);
    await page.goto(lessonPaths[0]);
    await expect(page.getByText("Quick check complete.")).toBeVisible();
    // Time, scroll and checkpoint survive refresh. Practical-note drafts are
    // currently committed on lesson completion rather than autosaved.
    await page.locator('textarea[name="exercise_response"]').fill(practicalNote);
    await expect(page.getByRole("button", { name: "Complete lesson", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Complete lesson", exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === lessonPaths[1], { timeout: 30_000 });
    const afterFirst = await learnerRows("training_lesson_progress", "lesson_id");
    expect(afterFirst.map((row) => row.lesson_id)).toEqual([ordered[0].id]);
    expect(await learnerRows("training_certificates", "id")).toHaveLength(0);
    const { data: incompleteEnrollment } = await admin.from("training_enrollments")
      .select("completed_at").eq("user_id", uid).eq("course_id", course!.id).single();
    expect(incompleteEnrollment?.completed_at).toBeNull();

    await answerCheckpoint();
    await earnRealReadingTime(ordered[1].id);
    await expect(page.getByRole("button", { name: "Complete lesson & start final check" })).toBeEnabled();
    await page.getByRole("button", { name: "Complete lesson & start final check" }).click();
    const finalPath = coursePath + "/assessments/" + assessment!.id;
    await expect(page).toHaveURL((url) => url.pathname === finalPath, { timeout: 30_000 });
    expect(await learnerRows("training_lesson_progress", "lesson_id")).toHaveLength(2);
    expect(await learnerRows("training_certificates", "id")).toHaveLength(0);

    const questions = page.locator(".training-auto-question");
    await expect(questions).toHaveCount(8);
    const observedPrompts = new Set<string>();
    for (let i = 0; i < 8; i++) {
      const question = questions.nth(i);
      const prompt = (await question.locator("legend strong").innerText()).trim();
      expect(observedPrompts.has(prompt), "Generated final check must not repeat an identical prompt").toBe(false);
      observedPrompts.add(prompt);
      const answers = question.locator(".training-auto-question-options label");
      await expect(answers).toHaveCount(4);
      const texts = await answers.locator("span").allInnerTexts();
      expect(new Set(texts).size).toBe(4);
      const prefix = expectedPrefix(prompt);
      let matched = false;
      for (let j = 0; j < 4; j++) {
        if (texts[j].trim().startsWith(prefix)) {
          await answers.nth(j).locator('input[type="radio"]').check();
          matched = true;
          break;
        }
      }
      expect(matched, "Expected a correct fictional choice for question " + (i + 1)).toBe(true);
    }

    await page.getByRole("button", { name: "Submit final check" }).click();
    await expect(page).toHaveURL(/result=passed/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Final check complete" })).toBeVisible();
    const attemptRows = await learnerRows("training_assessment_submissions", "status,score");
    expect(attemptRows).toHaveLength(1);
    expect(attemptRows[0].status).toBe("reviewed");
    expect(Number(attemptRows[0].score)).toBe(100);
    const { data: completedEnrollment, error: completeError } = await admin.from("training_enrollments")
      .select("completed_at").eq("user_id", uid).eq("course_id", course!.id).single();
    expect(completeError).toBeNull();
    expect(completedEnrollment?.completed_at).toBeTruthy();
    const credentials = await learnerRows("training_certificates", "id,credential_code,metadata");
    expect(credentials).toHaveLength(1);
    expect(credentials[0].credential_code).toMatch(/^VAT-[0-9A-F]{12}$/);
    expect(credentials[0].metadata?.public_profile_visible).toBe(false);
    await page.screenshot({ path: ARTIFACT_DIR + "/genuine-two-lesson-completion-desktop.png",
      animations: "disabled", fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: ARTIFACT_DIR + "/genuine-two-lesson-completion-mobile.png",
      animations: "disabled", fullPage: true });

    // Independent source reconciliation: match what the admin UI displays
    // against all authoritative training-origin Auth IDs plus SQL-backed
    // enrollment and lesson rows in this fresh disposable environment.
    const { data: authUsers, error: authListError } = await admin.auth.admin.listUsers({
      page: 1, perPage: 500,
    });
    expect(authListError).toBeNull();
    expect(authUsers.users.length).toBeLessThan(500);
    const originIds = authUsers.users.filter((user) =>
      user.app_metadata?.account_type === "training" && !user.deleted_at && !user.is_anonymous
    ).map((user) => user.id);
    expect(originIds).toContain(uid);
    const { data: originEnrollments, error: enrollmentsError } = await admin.from("training_enrollments")
      .select("user_id,started_at,completed_at").in("user_id", originIds);
    expect(enrollmentsError).toBeNull();
    const { data: originProgress, error: progressError } = await admin.from("training_lesson_progress")
      .select("user_id").in("user_id", originIds);
    expect(progressError).toBeNull();
    const expectedRegistered = originIds.length;
    const expectedStarted = new Set((originEnrollments || []).map((row) => row.user_id)).size;
    const expectedGraduates = new Set((originEnrollments || [])
      .filter((row) => row.completed_at).map((row) => row.user_id)).size;
    const expectedLessonLearners = new Set((originProgress || []).map((row) => row.user_id)).size;

    const adminContext = await browser.newContext();
    try {
      const adminPage = await adminContext.newPage();
      await signIn(adminPage, "admin.e2e@example.test", "/workspace/admin/training/activation");
      const card = (label: string) => adminPage.locator(".status-summary-card")
        .filter({ hasText: label }).locator("strong").first();
      await expect(card("Training registrations")).toHaveText(String(expectedRegistered));
      await expect(card("First course started")).toHaveText(String(expectedStarted));
      await expect(card("First course completion")).toHaveText(String(expectedGraduates));
      await expect(adminPage.locator("body")).not.toContainText(email);
      await adminPage.screenshot({ path: ARTIFACT_DIR + "/genuine-completion-activation-metrics.png",
        animations: "disabled", fullPage: true });
      await expect(adminPage.locator("body")).toContainText(String(expectedLessonLearners));
    } finally {
      await adminContext.close();
    }

    await page.reload();
    expect(await learnerRows("training_certificates", "id")).toHaveLength(1);
  });


});
