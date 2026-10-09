import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const file = await readFile(new URL("../src/lib/training-learning-priority.ts", import.meta.url), "utf8");
const js = ts.transpileModule(file, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { chooseTrainingResumeCourse } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);

const ago = days => new Date(Date.parse("2026-10-09T09:00:00Z") - days * 86400000).toISOString();
function course(id, overrides={}) {
  return {
    id,
    enrolled: true,
    completedAt: null,
    assessmentStatus: "not_started",
    nextAssessment: null,
    nextLesson: {id: id + "-next"},
    lessonCount: 6,
    completedLessons: 2,
    lastActivityAt: ago(2),
    startedAt: ago(4),
    ...overrides,
  };
}

test("no active enrollment has no next action", () => {
  assert.equal(chooseTrainingResumeCourse([]), null);
  assert.equal(chooseTrainingResumeCourse([course("not-started", {enrolled:false})]), null);
  assert.equal(chooseTrainingResumeCourse([course("done", {completedAt:ago(1)})]), null);
});
test("a final check ready to start beats a newer incomplete course", () => {
  const recent = course("recent", {lastActivityAt:ago(0),completedLessons:1});
  const final = course("ready", {lastActivityAt:ago(12),completedLessons:6,nextLesson:null,
    nextAssessment:{id:"final"},assessmentStatus:"ready"});
  assert.equal(chooseTrainingResumeCourse([recent,final])?.id, "ready");
});
test("assessment revision is more actionable than a partially read new course", () => {
  const revision = course("revision",{lastActivityAt:ago(9),nextLesson:null,
    nextAssessment:{id:"retry"},assessmentStatus:"needs_revision"});
  assert.equal(chooseTrainingResumeCourse([course("newer",{lastActivityAt:ago(0)}),revision])?.id,"revision");
});
test("ready final check is ahead of a needed revision", () => {
  const ready = course("ready",{nextLesson:null,nextAssessment:{id:"final"},assessmentStatus:"ready",lastActivityAt:ago(9)});
  const retry = course("retry",{nextLesson:null,nextAssessment:{id:"final"},assessmentStatus:"needs_revision",lastActivityAt:ago(0)});
  assert.equal(chooseTrainingResumeCourse([retry,ready])?.id,"ready");
});
test("last lesson is prioritized ahead of a newly opened long course", () => {
  const short = course("short",{completedLessons:5,lastActivityAt:ago(6)});
  const long = course("long",{completedLessons:1,lastActivityAt:ago(0)});
  assert.equal(chooseTrainingResumeCourse([long,short])?.id,"short");
});
test("for equal progress state the latest learner activity wins", () => {
  assert.equal(chooseTrainingResumeCourse([course("old",{lastActivityAt:ago(10)}),
    course("new",{lastActivityAt:ago(0)})])?.id,"new");
});
test("in-review final checks do not interrupt an actionable unfinished course", () => {
  const pending = course("pending",{nextLesson:null,nextAssessment:{id:"final"},assessmentStatus:"in_review",lastActivityAt:ago(0)});
  const reading = course("reading",{lastActivityAt:ago(2)});
  assert.equal(chooseTrainingResumeCourse([pending,reading])?.id,"reading");
  assert.equal(chooseTrainingResumeCourse([pending])?.id,"pending");
});
test("invalid activity timestamp falls back to enrollment time", () => {
  assert.equal(chooseTrainingResumeCourse([
    course("older",{lastActivityAt:"not-a-date",startedAt:ago(5)}),
    course("newer",{lastActivityAt:ago(1),startedAt:ago(5)}),
  ])?.id,"newer");
});
test("priority evaluation never mutates the caller's active-course order", () => {
  const courses=[course("b",{lastActivityAt:ago(5)}),course("a",{lastActivityAt:ago(0)})];
  const before=courses.map(c=>c.id);
  chooseTrainingResumeCourse(courses);
  assert.deepEqual(courses.map(c=>c.id),before);
});

test("learner reading engagement is accessed server-side for the verified user only", async () => {
  const training=await readFile(new URL("../src/lib/training.ts",import.meta.url),"utf8");
  assert.match(training,/lessonIds\.length && authUserData\.user\?\.id === userId/);
  assert.match(training,/createAdminClient\(\)\s*\.from\("training_lesson_engagement"\)/);
  assert.match(training,/\.select\("lesson_id,last_activity_at,updated_at"\)/);
  assert.match(training,/\.eq\("user_id", userId\)/);
  assert.match(training,/engagementActivityByLesson\.get\(lesson\.id\)/);
  assert.doesNotMatch(training,/auth\.admin\.listUsers/);
});

test("dashboard puts near-completion action first without changing assessment rules", async () => {
  const page=await readFile(new URL("../src/app/workspace/training/page.tsx",import.meta.url),"utf8");
  assert.match(page,/chooseTrainingResumeCourse\(active\)/);
  assert.match(page,/One step from completing this course/);
  assert.match(page,/Final check follow-through/);
  assert.match(page,/Continue where you left off/);
  assert.match(page,/nextCourseHref\(resumeCourse\)/);
  assert.match(page,/nextCourseLabel\(resumeCourse\)/);
});
