import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homePath = "src/app/workspace/training/page.tsx";
const lessonPath = "src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx";
const assessmentPath = "src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx";
const completionPath = "src/lib/training-completion.ts";
const credentialPath = "src/lib/training-credentials.ts";
const credentialPagePath = "src/app/training/certificates/[code]/page.tsx";
const cssPath = "src/app/workspace/training/training-home.css";

test("learner home resumes exact next lesson or assessment and has no retired specialist gate label", async () => {
  const home = await readFile(homePath, "utf8");

  assert.match(home, /Continue where you left off/);
  assert.match(home, /resumeCourse\.nextLesson/);
  assert.match(home, /resumeCourse\.nextAssessment/);
  assert.match(home, /lessons\/\$\{course\.nextLesson\.id\}/);
  assert.match(home, /assessments\/\$\{course\.nextAssessment\.id\}/);
  assert.match(home, /"Completed"/);
  assert.match(home, /"Available"/);
  assert.match(home, /"In development"/);
  assert.doesNotMatch(home, /Specialist-review pending/);
});

test("final completed lesson links directly to the first final assessment", async () => {
  const lesson = await readFile(lessonPath, "utf8");

  assert.match(lesson, /const finalAssessment = course\.assessments\[0\] \|\| null/);
  assert.match(lesson, /lesson\.completed && finalAssessment/);
  assert.match(lesson, /assessments\/\$\{finalAssessment\.id\}/);
  assert.match(lesson, />Final assessment </);
  assert.match(lesson, />Next lesson </);
  assert.match(lesson, />Course overview </);
});

test("assessment remains locked until lessons complete and exposes real review states", async () => {
  const assessment = await readFile(assessmentPath, "utf8");

  assert.match(assessment, /const lessonsComplete = course\.lessonCount > 0 && course\.completedLessons === course\.lessonCount/);
  assert.match(assessment, /Complete the lessons first/);
  assert.match(assessment, /Review pending/);
  assert.match(assessment, /Needs revision/);
  assert.match(assessment, /Assessment passed/);
  assert.match(assessment, /waitingForReview \? "In review" : "Review required"/);
});

test("passed assessment leads to training home and certificate section when course completion exists", async () => {
  const assessment = await readFile(assessmentPath, "utf8");

  assert.match(assessment, /course\.completedAt/);
  assert.match(assessment, /credential is available from the training home/);
  assert.match(assessment, /href="\/workspace\/training#certificates"/);
  assert.match(assessment, />View certificate</);
  assert.match(assessment, /href="\/workspace\/training"/);
  assert.match(assessment, />Back to training</);
});

test("course completion requires all published lessons and all published assessments to pass", async () => {
  const completion = await readFile(completionPath, "utf8");

  assert.match(completion, /training_lesson_progress/);
  assert.match(completion, /lessonIds\.every/);
  assert.match(completion, /training_assessments/);
  assert.match(completion, /eq\("is_published", true\)/);
  assert.match(completion, /training_assessment_submissions/);
  assert.match(completion, /eq\("status", "reviewed"\)/);
  assert.match(completion, /publishedAssessments\.every/);
  assert.match(completion, /training_enrollments/);
  assert.match(completion, /completed_at: completedAt/);
});

test("certificate issuance is idempotent and public verification rejects revoked or unpublished credentials", async () => {
  const [completion, credentials, page] = await Promise.all([
    readFile(completionPath, "utf8"),
    readFile(credentialPath, "utf8"),
    readFile(credentialPagePath, "utf8"),
  ]);

  assert.match(completion, /training_certificates/);
  assert.match(completion, /existingCertificate/);
  assert.match(completion, /completionCredentialCode/);
  assert.match(completion, /error\.code !== "23505"/);

  assert.match(credentials, /is\("revoked_at", null\)/);
  assert.match(credentials, /eq\("status", "published"\)/);
  assert.match(credentials, /\^VAT-\[A-Z0-9-\]\{8,64\}\$/);

  assert.match(page, /Valid credential/);
  assert.match(page, /Credential not verified/);
  assert.match(page, /It does not verify employment/);
});

test("training home retains compact mobile layouts for phone widths", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /grid-template-columns: 1fr/);
  assert.match(css, /training-filter-tabs/);
  assert.match(css, /training-certificate-actions/);
});
