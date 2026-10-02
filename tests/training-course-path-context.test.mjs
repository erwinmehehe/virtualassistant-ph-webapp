import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contextPath = "src/lib/training-path-context.ts";
const specializationsPath = "src/lib/training-specializations.ts";
const coursePath = "src/app/workspace/training/courses/[slug]/page.tsx";
const lessonPath = "src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx";
const assessmentPath = "src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx";
const cssPath = "src/app/workspace/training/training-home.css";

test("course-to-path context resolves the selected path before ambiguous shared paths", async () => {
  const [context, specializations] = await Promise.all([
    readFile(contextPath, "utf8"),
    readFile(specializationsPath, "utf8"),
  ]);

  assert.match(specializations, /getAustraliaSpecializationsForCourse/);
  assert.match(context, /getAustraliaSpecializationsForCourse\(courseSlug\)/);
  assert.match(context, /australia_specialization/);
  assert.match(context, /const selected = selectedSlug/);
  assert.match(context, /selected \|\| \(candidates\.length === 1 \? candidates\[0\] : null\)/);
  assert.match(context, /completedCount/);
  assert.match(context, /progressPercent/);
  assert.match(context, /nextCourse/);
});

test("course overview shows path progress and what follows the current course", async () => {
  const page = await readFile(coursePath, "utf8");

  assert.match(page, /getTrainingPathContext\(slug, userId\)/);
  assert.match(page, /training-course-path-context/);
  assert.match(page, /Your Australian learning path/);
  assert.match(page, /Step \{pathContext\.primary\.currentStep\} of \{pathContext\.primary\.totalSteps\}/);
  assert.match(page, /After this course/);
  assert.match(page, /pathContext\.primary\.nextCourse\?\.title/);
  assert.match(page, /\/workspace\/training\/paths\/\$\{pathContext\.primary\.slug\}/);
  assert.match(page, /Shared Australian course/);
});

test("lesson player and final check keep path context visible", async () => {
  const [lesson, assessment] = await Promise.all([
    readFile(lessonPath, "utf8"),
    readFile(assessmentPath, "utf8"),
  ]);

  assert.match(lesson, /getTrainingPathContext\(slug, userId\)/);
  assert.match(lesson, /training-player-path-context/);
  assert.match(lesson, /After this course/);
  assert.match(lesson, /View full path/);

  assert.match(assessment, /getTrainingPathContext\(slug, userId\)/);
  assert.match(assessment, /training-assessment-path-context/);
  assert.match(assessment, /After this course/);
  assert.match(assessment, /View path/);
});

test("path context stays compact and responsive in course lesson and assessment views", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /\/\* Course-to-path context bridge \*\//);
  assert.match(css, /\.training-course-path-context/);
  assert.match(css, /\.training-player-path-context/);
  assert.match(css, /\.training-assessment-path-context/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.training-course-path-context/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.training-assessment-path-context/);
});
