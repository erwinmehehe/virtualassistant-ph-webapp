import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const maintenancePath = "src/app/api/cron/maintenance/route.ts";
const emailPath = "src/lib/email.ts";
const trainingPath = "src/lib/training.ts";
const adminPagePath = "src/app/workspace/admin/training/page.tsx";

test("stalled training nudges use the existing daily maintenance runner", async () => {
  const maintenance = await readFile(maintenancePath, "utf8");

  assert.match(maintenance, /runTrainingResumeNudges/);
  assert.match(maintenance, /training resume nudges/);
  assert.match(maintenance, /trainingResumeNudges: trainingResumeResult/);
  assert.doesNotMatch(maintenance, /subjectType: "training"/);
});

test("training recovery waits 72 hours and caps each course at two reminders", async () => {
  const maintenance = await readFile(maintenancePath, "utf8");

  assert.match(maintenance, /const inactivityCutoff = daysAgo\(3\)/);
  assert.match(maintenance, /repeatDays: 7/);
  assert.match(maintenance, /maxReminders: 2/);
  assert.match(maintenance, /action: `resume_training_\$\{enrollment\.course_id\}`/);
  assert.match(maintenance, /latestActivity > Date\.now\(\) - 3 \* 24 \* 60 \* 60 \* 1000/);
});

test("training reminder resumes the exact next lesson or final check", async () => {
  const maintenance = await readFile(maintenancePath, "utf8");

  assert.match(maintenance, /const nextLesson = courseLessons\.find/);
  assert.match(maintenance, /const nextAssessment =/);
  assert.match(maintenance, /\/workspace\/training\/courses\/\$\{course\.slug\}\/lessons/);
  assert.match(maintenance, /\/workspace\/training\/courses\/\$\{course\.slug\}\/assessments/);
  assert.match(maintenance, /You finished every lesson\. Complete the final check/);
});

test("resume email is low priority, idempotent, and respects product email preferences", async () => {
  const [maintenance, email] = await Promise.all([
    readFile(maintenancePath, "utf8"),
    readFile(emailPath, "utf8"),
  ]);

  assert.match(maintenance, /emailPriority: "low"/);
  assert.match(maintenance, /emailEventType: "product_training_resume_reminder"/);
  assert.match(maintenance, /emailHrefLabel: "Resume training"/);
  assert.match(email, /eventType\?: string/);
  assert.match(email, /args\.eventType \|\| "transactional_event"/);
  assert.match(email, /eventType\.startsWith\("product_"\)/);
});

test("admin training shows stalled learner recovery health without learner identities", async () => {
  const [training, page] = await Promise.all([
    readFile(trainingPath, "utf8"),
    readFile(adminPagePath, "utf8"),
  ]);

  assert.match(training, /stalled72h/);
  assert.match(training, /stalled7d/);
  assert.match(training, /remindersSent/);
  assert.match(training, /resume_training_%/);
  assert.match(page, /Stalled learner recovery/);
  assert.match(page, /Stalled 72h\+/);
  assert.match(page, /Stalled 7d\+/);
  assert.match(page, /Reminders sent/);
  assert.match(page, /Product Emails preference/);
  assert.doesNotMatch(page, /recipientEmail|fullName|user_id/);
});