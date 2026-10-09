import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Execute the actual pure TypeScript aggregation, not a copied model or regex.
const moduleSource = await readFile(new URL("../src/lib/training-completion-health.ts", import.meta.url), "utf8");
const js = ts.transpileModule(moduleSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { buildTrainingCompletionHealth } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);

const NOW = Date.parse("2026-10-09T06:00:00Z");
const ago = days => new Date(NOW - days * 86400000).toISOString();
const courses = [
  {id:"a",slug:"foundations",title:"Foundations",status:"published",publishedLessonIds:["a1","a2","a3","a4"]},
  {id:"b",slug:"support",title:"Support",status:"published",publishedLessonIds:["b1","b2"]},
  {id:"draft",slug:"secret",title:"Draft",status:"draft",publishedLessonIds:["d1"]},
];
const en = (user_id,course_id,startedDays,completedDays=null) =>
  ({user_id,course_id,started_at:ago(startedDays),completed_at:completedDays===null?null:ago(completedDays)});
const prog = (user_id,lesson_id,days=8) => ({user_id,lesson_id,completed_at:ago(days)});
const engage = (user_id,lesson_id,days=0,active_seconds=45) =>
  ({user_id,lesson_id,active_seconds,last_activity_at:ago(days),updated_at:ago(days)});
const assess = (user_id,course_id,status,days) => ({user_id,course_id,status,submitted_at:ago(days)});
const scenario=()=>({
  nowMs:NOW,courses,
  enrollments:[
    en("u1","a",20,1),              // already finished
    en("u2","a",20),                // never started, stalled
    en("u3","a",10),                // one lesson to go
    en("u4","a",15),                // needs revision, recent submission
    en("u5","a",20),                // awaiting manual review, recent submission
    en("u6","a",5),                 // reading first lesson, not stale
    en("u7","b",13,2),              // completed B
    en("u8","b",20),                // final step, stale
    en("u9","draft",30),            // should be excluded
  ],
  progress:[
    ...["a1","a2","a3"].map(x=>prog("u3",x,1)),
    ...["a1","a2","a3","a4"].map(x=>prog("u4",x,10)),
    ...["a1","a2","a3","a4"].map(x=>prog("u5",x,12)),
    ...["b1","b2"].map(x=>prog("u8",x,10)),
    prog("u9","d1",1),
  ],
  engagement:[engage("u6","a1",1,40)],
  assessments:[
    assess("u4","a","submitted",13),
    assess("u4","a","needs_revision",2),
    assess("u5","a","submitted",1),
  ],
});
const evaluate=s=>buildTrainingCompletionHealth(s);
const bySlug=(result,slug)=>result.courses.find(r=>r.slug===slug);

test("published course metrics are based on distinct learner-course enrolments",()=>{
  const health=evaluate(scenario());
  assert.equal(health.available,true);
  assert.equal(health.totals.enrolled,8);
  assert.equal(health.totals.completed,2);
  assert.equal(health.totals.completionRate,25);
  assert.equal(health.courses.length,2);
  assert.ok(!health.courses.some(x=>x.slug==="secret"));
  assert.equal(bySlug(health,"foundations").enrolled,6);
  assert.equal(bySlug(health,"foundations").completionRate,17);
});
test("never-activated learners appear in stalled and not-engaged counts",()=>{
  const health=evaluate(scenario());
  assert.equal(bySlug(health,"foundations").stalled7d,1);
  assert.equal(bySlug(health,"foundations").notEngaged7d,1);
  assert.equal(health.totals.stalled7d,2);
  assert.equal(health.totals.notEngaged7d,1);
});
test("active lesson reading counts as engagement before completion",()=>{
  const health=evaluate(scenario());
  assert.equal(bySlug(health,"foundations").engaged,5);
});
test("last lesson and finished lessons are counted separately",()=>{
  const health=evaluate(scenario());
  assert.equal(bySlug(health,"foundations").oneLessonLeft,1);
  assert.equal(bySlug(health,"foundations").finalStep,2);
  assert.equal(bySlug(health,"support").finalStep,1);
  assert.equal(health.totals.finalStep,3);
});
test("latest assessment status overrides earlier submissions",()=>{
  const health=evaluate(scenario());
  assert.equal(bySlug(health,"foundations").needsRevision,1);
  assert.equal(bySlug(health,"foundations").awaitingReview,1);
});
test("recent assessment submission is considered learner activity, not seven-day inactivity",()=>{
  const s=scenario();
  const health=evaluate(s);
  assert.equal(bySlug(health,"foundations").stalled7d,1);
  s.assessments=[];  // the recent review/revision submissions are now absent
  const withoutRecent=evaluate(s);
  assert.equal(bySlug(withoutRecent,"foundations").stalled7d,3);
});
test("lesson progress only counts for the correct course and enrolled learner",()=>{
  const s=scenario();
  s.progress.push(prog("u2","b1",0));
  s.progress.push(prog("unregistered","a4",0));
  const health=evaluate(s);
  assert.equal(bySlug(health,"foundations").stalled7d,1);
  assert.equal(bySlug(health,"foundations").notEngaged7d,1);
});
test("duplicate events and duplicate incomplete enrolments cannot inflate funnel",()=>{
  const s=scenario();
  s.enrollments.push(en("u1","a",1));
  s.progress.push(prog("u3","a3",0));
  s.engagement.push(engage("u6","a1",0,90));
  const health=evaluate(s);
  assert.equal(bySlug(health,"foundations").enrolled,6);
  assert.equal(bySlug(health,"foundations").completed,1);
  assert.equal(bySlug(health,"foundations").oneLessonLeft,1);
});
test("a more recent completion never reverts to incomplete with a stale duplicate",()=>{
  const s=scenario();
  s.enrollments.push(en("u7","b",40));
  assert.equal(bySlug(evaluate(s),"support").completed,1);
});
test("missing or truncated data fails closed without partial or invented percentages",()=>{
  const s=scenario();s.complete=false;
  const r=evaluate(s);
  assert.equal(r.available,false);
  assert.equal(r.courses.length,0);
  assert.equal(r.totals.enrolled,0);
  assert.equal(r.totals.completionRate,0);
  assert.match(r.reason,/incomplete or unavailable/);
});
test("zero learners or zero published lessons do not divide by zero",()=>{
  const health=evaluate({courses:[{id:"empty",slug:"empty",title:"Empty",status:"published",publishedLessonIds:[]}],
    enrollments:[],progress:[],engagement:[],assessments:[],nowMs:NOW});
  assert.equal(health.totals.completionRate,0);
  assert.equal(health.courses.length,0);
});
test("privacy: no raw user IDs are returned in the administrator report",()=>{
  const r=evaluate(scenario());
  const text=JSON.stringify(r);
  assert.ok(!text.includes('"user_id"'));
  assert.ok(!text.includes('"u4"'));
  assert.ok(!text.includes('"u8"'));
});
test("data queries page across default REST row ceilings and fail closed on incomplete data",async()=>{
  const source=await readFile(new URL("../src/lib/training.ts",import.meta.url),"utf8");
  assert.match(source,/async function loadHealthRows<T>/);
  assert.match(source,/const pageSize = 500;/);
  assert.match(source,/identifiers\.slice\(i, i \+ 100\)/);
  assert.match(source,/rows: \[\], complete: false/);
  assert.match(source,/training_assessment_submissions/);
  assert.match(source,/assessmentCourseId/);
  assert.match(source,/complete: enrollmentResult\.complete && progressResult\.complete && engagementResult\.complete/);
});
test("admin reporting stays role protected and identity free",async()=>{
  const [page,layout]=await Promise.all([
    readFile(new URL("../src/app/workspace/admin/training/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../src/app/workspace/admin/layout.tsx",import.meta.url),"utf8"),
  ]);
  assert.match(layout,/requireRoleFast\("admin"\)/);
  assert.match(page,/Where learners get stuck/);
  assert.match(page,/Course-level completion bottlenecks/);
  assert.match(page,/No partial totals are shown/);
  assert.match(page,/learner–course enrolment snapshot/);
  assert.doesNotMatch(page,/\.user_id|\.email|\.full_name/);
});
test("learner resumes accurately when assessment is pending or needs revision",async()=>{
  const page=await readFile(new URL("../src/app/workspace/training/page.tsx",import.meta.url),"utf8");
  assert.match(page,/View final check status/);
  assert.match(page,/Review and retry final check/);
  assert.match(page,/Your final check was submitted/);
  assert.match(page,/Your final check needs revision|Final check needs revision/);
  assert.match(page,/!course\.nextLesson && course\.nextAssessment/);
});
