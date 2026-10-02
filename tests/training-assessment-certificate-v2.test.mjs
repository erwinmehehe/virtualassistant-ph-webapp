import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const assessmentPath = "src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx";
const trainingCssPath = "src/app/workspace/training/training-home.css";
const certificatePath = "src/app/training/certificates/[code]/page.tsx";
const certificateCssPath = "src/app/training/certificates/[code]/certificate.css";

test("final check carries course identity through readiness, questions, and completion", async () => {
  const [page, css] = await Promise.all([
    readFile(assessmentPath, "utf8"),
    readFile(trainingCssPath, "utf8"),
  ]);

  assert.match(page, /function trainingCourseMark/);
  assert.match(page, /training-assessment-journey-v2/);
  assert.match(page, /training-assessment-course-mark/);
  assert.match(page, /training-assessment-step-track/);
  assert.match(page, /training-assessment-hero-v2/);
  assert.match(page, /training-assessment-attempt-card/);
  assert.match(page, /training-auto-question-v2/);
  assert.match(page, /training-auto-question-number/);
  assert.match(page, /training-completion-card-v2/);
  assert.match(page, /training-completion-seal/);
  assert.match(page, /Verified credential/);

  assert.match(css, /\/\* Assessment \+ completion v2 \*\//);
  assert.match(css, /\.training-assessment-journey\.training-assessment-journey-v2/);
  assert.match(css, /\.training-assessment-hero-grid/);
  assert.match(css, /\.training-auto-question\.training-auto-question-v2/);
  assert.match(css, /\.training-completion-card\.training-completion-card-v2/);
});

test("public verification page renders a real printable certificate with a separate verification panel", async () => {
  const [page, css] = await Promise.all([
    readFile(certificatePath, "utf8"),
    readFile(certificateCssPath, "utf8"),
  ]);

  assert.match(page, /function certificateMark/);
  assert.match(page, /credential-certificate-frame/);
  assert.match(page, /credential-brand-mark/);
  assert.match(page, /Verified credential/);
  assert.match(page, /credential-course-mark/);
  assert.match(page, /credential-certificate-foot/);
  assert.match(page, /credential-seal/);
  assert.match(page, /credential-side-panel/);
  assert.match(page, /TrainingCertificateActions/);
  assert.doesNotMatch(page, /learner name|full_name|email|phone/i);

  assert.match(css, /\/\* Certificate document v2 \*\//);
  assert.match(css, /\.credential-card\.credential-certificate/);
  assert.match(css, /\.credential-certificate-frame/);
  assert.match(css, /\.credential-side-panel/);
  assert.match(css, /@media print[\s\S]*\.credential-side-panel/);
});

test("assessment and certificate redesigns stay compact on phone screens", async () => {
  const [trainingCss, certificateCss] = await Promise.all([
    readFile(trainingCssPath, "utf8"),
    readFile(certificateCssPath, "utf8"),
  ]);

  assert.match(trainingCss, /@media \(max-width: 620px\)[\s\S]*\.training-assessment-step-track/);
  assert.match(trainingCss, /@media \(max-width: 430px\)[\s\S]*\.training-auto-question\.training-auto-question-v2/);
  assert.match(certificateCss, /@media \(max-width: 620px\)[\s\S]*\.credential-card\.credential-certificate/);
  assert.match(certificateCss, /\.credential-side-panel \.credential-print-actions[\s\S]*grid-template-columns: 1fr/);
});
