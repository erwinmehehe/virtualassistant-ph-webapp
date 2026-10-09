import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const src = await readFile(new URL("../src/lib/training-reminder-outcomes.ts", import.meta.url), "utf8");
const js = ts.transpileModule(src, {
  compilerOptions: { target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.ESNext },
}).outputText;
const { buildTrainingReminderOutcomes } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);

const NOW = Date.parse("2026-10-09T12:00:00Z");
const ago = days => new Date(NOW - days * 86_400_000).toISOString();
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";
const course = (id, title) => ({id,title,slug:title.toLowerCase(),status:"published"});
const remind = (user, id, days, count = 1) => ({
  subject_type:"va",subject_id:user,recipient_id:user,
  action:"resume_training_" + id,reminder_count:count,last_sent_at:ago(days),
});
const enroll = (user, id, started, completed=null) => ({
  user_id:user,course_id:id,started_at:ago(started),
  completed_at:completed===null?null:ago(completed),
});
const lesson = (id,course_id) => ({id,course_id});
const progress = (user, id, days) => ({user_id:user,lesson_id:id,completed_at:ago(days)});
function fixture() {
  return {
    nowMs:NOW,
    courses:[course(A,"Foundations"),course(B,"Support"),course(C,"Empty")],
    reminders:[remind("u1",A,10,2),remind("u2",A,10),remind("u3",B,5),remind("u4",B,20),remind("u5",B,20)],
    enrollments:[enroll("u1",A,21),enroll("u2",A,30),enroll("u3",B,10),
      enroll("u4",B,26,10),enroll("u5",B,35,18)],
    lessons:[lesson("lA",A),lesson("lB",B)],
    progress:[progress("u1","lA",8),progress("u2","lA",2),progress("u5","lB",18)],
  };
}
const calc = v => buildTrainingReminderOutcomes(v || fixture());

test("most-recent-reminder cohorts count only full seven- and fourteen-day observation windows",() => {
  const r=calc();
  assert.equal(r.available,true);
  assert.equal(r.nudgedEnrollments,5);
  assert.equal(r.learnersNudged,5);
  assert.equal(r.remindersLogged,6);
  assert.deepEqual(r.sevenDay,{eligible:4,reached:2,rate:50});
  assert.deepEqual(r.fourteenDay,{eligible:2,reached:2,rate:100});
  assert.equal(r.courses.length,2);
});
test("a lesson completed after seven days is not counted as seven-day recovery",() => {
  const r=calc();
  const foundation=r.courses.find(x=>x.id===A);
  assert.deepEqual(foundation.sevenDay,{eligible:2,reached:1,rate:50});
});
test("graduation after seven days but within fourteen days is only a fourteen-day outcome",() => {
  const r=calc({ ...fixture(),reminders:[remind("u4",B,20)],enrollments:[enroll("u4",B,26,10)],progress:[] });
  assert.deepEqual(r.sevenDay,{eligible:1,reached:0,rate:0});
  assert.deepEqual(r.fourteenDay,{eligible:1,reached:1,rate:100});
});
test("incomplete fourteen-day exposure shows no fake zero rate",() => {
  const r=calc({ ...fixture(),reminders:[remind("u3",B,5)],enrollments:[enroll("u3",B,10)],progress:[] });
  assert.deepEqual(r.sevenDay,{eligible:0,reached:0,rate:null});
  assert.deepEqual(r.fourteenDay,{eligible:0,reached:0,rate:null});
});
test("pre-reminder lesson completion cannot be attributed to later reminder",() => {
  const f=fixture();
  f.reminders=[remind("u1",A,10)];
  f.enrollments=[enroll("u1",A,20)];
  f.progress=[progress("u1","lA",11)];
  assert.equal(calc(f).sevenDay.reached,0);
});
test("other-course lesson completion is not counted for this reminder",() => {
  const f=fixture();
  f.reminders=[remind("u1",A,10)];
  f.enrollments=[enroll("u1",A,20)];
  f.progress=[progress("u1","lB",8)];
  assert.equal(calc(f).sevenDay.reached,0);
});
test("a graduation within seven days qualifies even when no lesson event was retained",() => {
  const f=fixture();
  f.reminders=[remind("u1",A,10)];
  f.enrollments=[enroll("u1",A,20,8)];
  f.progress=[];
  assert.equal(calc(f).sevenDay.reached,1);
});
test("most recent reminder supersedes older ones and prevents duplicate denominator",() => {
  const f=fixture();
  f.reminders=[remind("u1",A,20),remind("u1",A,5,2)];
  f.enrollments=[enroll("u1",A,30)];
  f.progress=[progress("u1","lA",18)];
  const r=calc(f);
  assert.equal(r.nudgedEnrollments,1);
  assert.equal(r.remindersLogged,2);
  assert.equal(r.sevenDay.eligible,0);
});
test("a learner nudged in two separate courses counts once per course, once as a learner",() => {
  const f=fixture();
  f.reminders=[remind("u1",A,20),remind("u1",B,20)];
  f.enrollments=[enroll("u1",A,30),enroll("u1",B,30)];
  f.progress=[];
  const r=calc(f);
  assert.equal(r.nudgedEnrollments,2);
  assert.equal(r.learnersNudged,1);
  assert.equal(r.fourteenDay.eligible,2);
});
test("stale reminder after an already completed course is ignored",() => {
  const f=fixture();
  f.reminders=[remind("u1",A,10)];
  f.enrollments=[enroll("u1",A,30,15)];
  f.progress=[];
  assert.equal(calc(f).nudgedEnrollments,0);
});
test("orphan, malformed and mismatched-recipient reminders do not inflate denominators",() => {
  const f=fixture();
  f.reminders=[
    remind("missing",A,10),
    {...remind("u1",A,10),subject_id:"imposter"},
    {...remind("u1",A,10),action:"resume_training_not-a-uuid"},
  ];
  const r=calc(f);
  assert.equal(r.nudgedEnrollments,0);
  assert.equal(r.sevenDay.eligible,0);
});
test("future reminders and progress never count as observed outcomes",() => {
  const f=fixture();
  f.reminders=[remind("u1",A,-1)];
  f.enrollments=[enroll("u1",A,30)];
  f.progress=[progress("u1","lA",-1)];
  assert.equal(calc(f).nudgedEnrollments,0);
});
test("zero reminders is a valid empty report, not a missing-data error",() => {
  const f=fixture();
  f.reminders=[];
  const r=calc(f);
  assert.equal(r.available,true);
  assert.equal(r.nudgedEnrollments,0);
  assert.equal(r.sevenDay.rate,null);
});
test("incomplete source data fails closed and never displays partial rates or identities",() => {
  const f=fixture();
  const r=calc({...f,complete:false});
  assert.equal(r.available,false);
  assert.deepEqual(r.courses,[]);
  assert.equal(r.nudgedEnrollments,0);
  assert.doesNotMatch(JSON.stringify(r),/"u1"/);
});
test("course rows contain only aggregates, no learner identifiers",() => {
  const r=calc();
  assert.equal(r.available,true);
  assert.doesNotMatch(JSON.stringify(r),/u1|u2|u3|u4|u5|@/);
});

test("admin-only loader paginates all sources and fails closed on partial data",async () => {
  const source=await readFile(new URL("../src/lib/training-reminder-outcomes-server.ts",import.meta.url),"utf8");
  assert.match(source,/await requireRoleFast\("admin"\)/);
  assert.ok(source.indexOf('await requireRoleFast("admin")') < source.indexOf("const admin = createAdminClient()"));
  assert.match(source,/\.like\("action", "resume_training_%"\)/);
  assert.match(source,/\.range\(from,to\)/);
  assert.match(source,/pagination incomplete/);
  assert.match(source,/complete: false/);
  assert.doesNotMatch(source,/console\.log\(.*recipient|console\.log\(.*user/i);
});
test("admin dashboard labels reminder outcomes as observational, without delivery claims",async () => {
  const source=await readFile(new URL("../src/app/workspace/admin/training/page.tsx",import.meta.url),"utf8");
  assert.match(source,/getTrainingReminderOutcomes/);
  assert.match(source,/What happens after a learning reminder/);
  assert.match(source,/not evidence the reminder caused the improvement/);
  assert.match(source,/does not confirm email delivery/);
  assert.match(source,/reminderOutcomes\.fourteenDay\.eligible/);
});
