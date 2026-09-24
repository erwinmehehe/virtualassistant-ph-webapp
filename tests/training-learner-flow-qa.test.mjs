import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homePath = "src/app/workspace/training/page.tsx";
const coursePath = "src/app/workspace/training/courses/[slug]/page.tsx";
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
  assert.match(home, /"In progress"/);
  assert.match(home, /"Not started"/);
  assert.match(home, /"Start path"/);
  assert.match(home, /"Continue path"/);
  assert.doesNotMatch(home, /Specialist-review pending/);
});


test("course overview always exposes the learner's next meaningful action", async () => {
  const course = await readFile(coursePath, "utf8");

  assert.match(course, /Start course/);
  assert.match(course, /Continue lesson/);
  assert.match(course, /Start assessment/);
  assert.match(course, /View certificate/);
  assert.match(course, /nextLesson/);
  assert.match(course, /nextAssessment/);
  assert.match(course, /assessmentInReview/);
  assert.match(course, /Assessment in review/);
  assert.match(course, /Certificate preparing/);
  assert.match(course, /reviewLabel \? <span className="badge">/);
});

test("course overview uses a focused, responsive learning layout", async () => {
  const [course, css] = await Promise.all([
    readFile(coursePath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(course, /training-course-hero/);
  assert.match(course, /training-module-card/);
  assert.match(course, /training-module-lessons/);
  assert.match(course, /training-lesson-row/);
  assert.match(course, /training-lesson-copy/);

  assert.match(css, /\.training-course-page \{/);
  assert.match(css, /width: min\(100%, 1120px\)/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /\.training-course-page \.training-lesson-row/);
});

test("final lesson saves progress and continues directly to the next required assessment", async () => {
  const lesson = await readFile(lessonPath, "utf8");

  assert.match(lesson, /course\.assessments\.find/);
  assert.match(lesson, /assessmentPassed/);
  assert.match(lesson, /assessments\/\$\{nextAssessment\.id\}/);
  assert.match(lesson, /name="continue_to"/);
  assert.match(lesson, /Complete lesson/);
  assert.match(lesson, /Start assessment/);
  assert.match(lesson, /Continue lesson/);
});

test("assessment remains locked until lessons complete and exposes real review states", async () => {
  const assessment = await readFile(assessmentPath, "utf8");

  assert.match(assessment, /const lessonsComplete = course\.lessonCount > 0 && course\.completedLessons === course\.lessonCount/);
  assert.match(assessment, /Complete the lessons first/);
  assert.match(assessment, /Review pending/);
  assert.match(assessment, /Needs revision/);
  assert.match(assessment, /Assessment passed/);
  assert.match(assessment, /waitingForReview \? "In review"/);
  assert.match(assessment, /training-assessment-journey/);
  assert.match(assessment, /credentialHref \? "Issued" : course\.completedAt \? "Preparing" : "After passing"/);
});

test("passed course exposes the issued credential and returns to the learning home", async () => {
  const assessment = await readFile(assessmentPath, "utf8");

  assert.match(assessment, /passed && course\.completedAt/);
  assert.match(assessment, /course\.certificate\.credential_code/);
  assert.match(assessment, /View certificate/);
  assert.match(assessment, /TrainingCertificateActions/);
  assert.match(assessment, />My learning</);
  assert.match(assessment, /passed && !course\.completedAt/);
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

  assert.match(page, /Certificate of completion/);
  assert.match(page, /Verified/);
  assert.match(page, /Not verified/);
  assert.match(page, /It does not verify employment/);

  const certificateCss = await readFile("src/app/training/certificates/[code]/certificate.css", "utf8");
  assert.match(certificateCss, /@media \(max-width: 430px\)/);
  assert.match(certificateCss, /\.credential-link/);
  assert.match(certificateCss, /min-height: 44px/);
});

test("training home retains compact mobile layouts for phone widths", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /grid-template-columns: 1fr/);
  assert.match(css, /training-filter-tabs/);
  assert.match(css, /training-certificate-actions/);
  assert.match(css, /training-assessment-submit textarea/);
  assert.match(css, /training-player-lesson-link strong/);
});
