import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/training-lesson-bottlenecks.ts",import.meta.url),"utf8");
const js = ts.transpileModule(source,{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},
}).outputText;
const { buildTrainingLessonBottlenecks } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
const NOW=Date.parse("2026-10-09T06:00:00Z");
const ago=days=>new Date(NOW-days*86400_000).toISOString();
const course=(id,title,status="published")=>({id,slug:id,title,status});
const moduleRow=(id,course_id,position)=>({id,course_id,position});
const lesson=(id,module_id,position,title=id,is_published=true)=>({id,module_id,position,title,is_published});
const enrollment=(user_id,course_id,days=15,completed_at=null)=>({user_id,course_id,started_at:ago(days),completed_at});
const progress=(user_id,lesson_id,days=10)=>({user_id,lesson_id,completed_at:ago(days)});
const engagement=(user_id,lesson_id,days=1,active_seconds=120)=>({
  user_id,lesson_id,active_seconds,last_activity_at:ago(days),updated_at:ago(days),
});
const base=()=>({
  courses:[course("foundation","Foundations"),course("tools","Tools"),course("draft","Draft","draft")],
  modules:[moduleRow("f2","foundation",2),moduleRow("f1","foundation",1),
    moduleRow("t1","tools",1),moduleRow("d1","draft",1)],
  lessons:[lesson("f3","f2",1),lesson("f2","f1",2),lesson("f1","f1",1),
    lesson("t1","t1",1),lesson("hidden","t1",2,"Hidden",false),lesson("d1","d1",1)],
  enrollments:[
    enrollment("started-old","foundation",14),
    enrollment("middle-old","foundation",18),
    enrollment("recent","foundation",2),
    enrollment("finished","foundation",30,ago(15)),
    enrollment("near-end","foundation",11),
    enrollment("all-lessons","foundation",40),
    enrollment("recent-tools","tools",1),
    enrollment("draft-student","draft",50),
  ],
  progress:[
    progress("middle-old","f1"), progress("near-end","f1"),progress("near-end","f2"),
    progress("all-lessons","f1"),progress("all-lessons","f2"),progress("all-lessons","f3"),
  ],
  engagement:[engagement("recent-tools","t1",1,60)],
  nowMs:NOW,
});
const calc = overrides => buildTrainingLessonBottlenecks({...base(),...overrides});
const byId=(result,id)=>result.lessons.find(x=>x.lessonId===id);

test("assigns every incomplete learner-course to only the next unfinished published lesson",()=>{
  const result=calc();
  assert.equal(result.available,true);
  assert.deepEqual(result.totals,{
    unfinishedEnrollments:6,withNextLesson:5,stalled7d:3,noRecordedEngagement:2,
  });
  assert.equal(byId(result,"f1").waiting,2);
  assert.equal(byId(result,"f2").waiting,1);
  assert.equal(byId(result,"f3").waiting,1);
  assert.equal(byId(result,"t1").waiting,1);
  assert.equal(result.lessons.reduce((sum,x)=>sum+x.waiting,0),5);
});

test("uses module and lesson sequence, not arbitrary query response order",()=>{
  const result=calc();
  assert.equal(byId(result,"f1").lessonNumber,1);
  assert.equal(byId(result,"f2").lessonNumber,2);
  assert.equal(byId(result,"f3").lessonNumber,3);
  assert.equal(byId(result,"f3").totalLessons,3);
});

test("published-only lesson sequence ignores hidden material and draft courses",()=>{
  const result=calc();
  assert.equal(byId(result,"hidden"),undefined);
  assert.equal(byId(result,"d1"),undefined);
  assert.equal(byId(result,"t1").totalLessons,1);
  assert.ok(result.lessons.every(row=>row.courseId!=="draft"));
});

test("completed courses are excluded and final assessments do not masquerade as lesson blockers",()=>{
  const result=calc();
  assert.equal(result.totals.unfinishedEnrollments,6);
  assert.equal(result.totals.withNextLesson,5);
  assert.equal(result.lessons.reduce((sum,row)=>sum+row.waiting,0),5);
});

test("seven-day inactivity uses latest saved training activity, not only course start",()=>{
  const result=calc();
  assert.equal(byId(result,"f1").stalled7d,1);
  assert.equal(byId(result,"f2").stalled7d,1);
  assert.equal(byId(result,"f3").stalled7d,1);
  assert.equal(byId(result,"t1").stalled7d,0);
  const fresh=calc({engagement:[engagement("started-old","f1",0.25,90)]});
  assert.equal(fresh.totals.stalled7d,2);
  assert.equal(byId(fresh,"f1").stalled7d,0);
});

test("zero-second engagement heartbeat can refresh last seen but is not active engagement",()=>{
  const s=base();
  s.engagement.push(engagement("started-old","f1",1,0));
  const result=calc(s);
  assert.equal(byId(result,"f1").stalled7d,0);
  assert.equal(byId(result,"f1").noRecordedEngagement,2);
});

test("deduplicates learner-course enrolments and completed duplicates win",()=>{
  const s=base();
  s.enrollments.push(enrollment("middle-old","foundation",9));
  s.enrollments.push(enrollment("started-old","foundation",35,ago(1)));
  const result=calc(s);
  assert.equal(result.totals.unfinishedEnrollments,5);
  assert.equal(result.totals.withNextLesson,4);
  assert.equal(byId(result,"f1").waiting,1);
});

test("the same person taking two courses counts as two learner-course enrolments",()=>{
  const s=base();
  s.enrollments.push(enrollment("middle-old","tools",22));
  const result=calc(s);
  assert.equal(result.totals.withNextLesson,6);
  assert.equal(byId(result,"t1").waiting,2);
});

test("rank by inactive learners first, then waiting, without invented severity scores",()=>{
  const r=calc();
  assert.deepEqual(r.lessons.slice(0,3).map(x=>x.lessonId),["f1","f2","f3"]);
});

test("zero courses or no matching published lessons are safe and not fabricated activity",()=>{
  const r=calc({courses:[],enrollments:[]});
  assert.equal(r.available,true);
  assert.deepEqual(r.lessons,[]);
  assert.equal(r.totals.withNextLesson,0);
});

test("failed or truncated sources fail closed without partial lesson counts",()=>{
  const result=calc({complete:false});
  assert.equal(result.available,false);
  assert.deepEqual(result.lessons,[]);
  assert.equal(result.totals.stalled7d,0);
  assert.match(result.reason,/incomplete/i);
});

test("no learner identifiers, email addresses or notification destinations appear in results",()=>{
  const result=calc();
  const text=JSON.stringify(result);
  assert.doesNotMatch(text,/started-old|middle-old|user_id|email|recipient_id|notification/i);
  const row=result.lessons[0];
  assert.deepEqual(Object.keys(row).sort(),[
    "courseId","courseSlug","courseTitle","lessonId","lessonNumber","lessonTitle",
    "noRecordedEngagement","stalled7d","totalLessons","waiting",
  ].sort());
});

test("integration uses existing paginated admin data, remains protected, and triggers no outreach",async()=>{
  const [lib,page,layout]=await Promise.all([
    readFile(new URL("../src/lib/training.ts",import.meta.url),"utf8"),
    readFile(new URL("../src/app/workspace/admin/training/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../src/app/workspace/admin/layout.tsx",import.meta.url),"utf8"),
  ]);
  assert.match(lib,/import \{ buildTrainingLessonBottlenecks \}/);
  assert.match(lib,/loadHealthRows<HealthEnrollment>/);
  assert.match(lib,/loadHealthRows<HealthProgress>/);
  assert.match(lib,/complete: enrollmentResult\.complete && progressResult\.complete && engagementResult\.complete/);
  assert.match(lib,/training_modules"\)\.select\("id,course_id,position"\)/);
  assert.match(layout,/requireRoleFast\("admin"\)/);
  assert.match(page,/Next-lesson bottlenecks/);
  assert.match(page,/lessonBottlenecks\.available/);
  assert.match(page,/No learner names, emails, or automatic outreach/);
  assert.doesNotMatch(page,/\.user_id|\.recipient_id|sendTransactionalEventEmail/);
});
