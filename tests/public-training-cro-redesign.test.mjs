import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = "src/app/training/page.tsx";
const cssPath = "src/app/training-landing.css";
const publicTrainingPath = "src/lib/public-training.ts";

test("public training hero sells the live product instead of the old roadmap concept", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /Free VA training · \{totalCourseCount\} courses available/);
  assert.match(page, /Build practical VA skills\./);
  assert.match(page, /Earn verified certificates\./);
  assert.match(page, /Browse \{totalCourseCount\} courses/);
  assert.match(page, /No course or certificate fees/);
  assert.match(page, /Progress saved automatically/);
  assert.doesNotMatch(page, /courses mapped/);
  assert.doesNotMatch(page, /First course being prepared/);
});

test("public catalogue is driven by published LMS courses and keeps one public training page", async () => {
  const [page, helper] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(publicTrainingPath, "utf8"),
  ]);

  assert.match(page, /publishedCourses = courses\.filter\(\(course\) => course\.status === "published"\)/);
  assert.match(page, /globalCourses = publishedCourses\.filter/);
  assert.match(page, /australiaCourses = publishedCourses\.filter/);
  assert.match(page, /id="global-training"/);
  assert.match(page, /id="australia-training"/);
  assert.match(page, /Recommended first/);
  assert.match(page, /CourseCard course=\{course\}/);
  assert.match(page, /training_course_interest_click/);
  assert.match(page, /Start this course/);
  assert.match(page, /View all \{globalCourseCount\} global courses/);
  assert.doesNotMatch(page, /href=\{?["'`]\/training\/courses\//);
  assert.match(helper, /lesson_count/);
});

test("public training explains the real integrity and automatic certificate flow", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /Do the practical work/);
  assert.match(page, /Pass the randomized final check/);
  assert.match(page, /questions are scored automatically|scored automatically/i);
  assert.match(page, /Certificate issued automatically/);
  assert.match(page, /answer key is not shown/i);
  assert.match(page, /No admin approval queue/);
  assert.match(page, /Certificates require real course completion/);
  assert.doesNotMatch(page, /required practical assessment/);
  assert.doesNotMatch(page, /Specialist courses stay unpublished until reviewed/);
});

test("certificate section connects verified training to profiles without presenting it as experience", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /A certificate you can actually verify/);
  assert.match(page, /Public verification/);
  assert.match(page, /Recruiter-visible evidence/);
  assert.match(page, /appears there automatically as supporting evidence for recruiters/);
  assert.match(page, /not employment history, professional experience, or hiring eligibility/i);
  assert.match(page, /Publicly verifiable credential/);
});

test("FAQ reflects current training records and hiring boundaries", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /practical checkpoints/);
  assert.match(page, /randomized final check/);
  assert.match(page, /final-check attempts/);
  assert.match(page, /does not automatically create a candidate profile/);
  assert.match(page, /does not verify employment history, professional experience, or hiring eligibility/);
  assert.doesNotMatch(page, /assessment work/);
});

test("CRO redesign stays compact and responsive across course library and certificate proof", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /\.tr-proof-grid/);
  assert.match(css, /\.tr-course-grid/);
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.tr-completion-grid/);
  assert.match(css, /\.tr-certificate-preview/);
  assert.match(css, /@media \(max-width: 1080px\)/);
  assert.match(css, /@media \(max-width: 840px\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /overflow-wrap: anywhere/);
});
