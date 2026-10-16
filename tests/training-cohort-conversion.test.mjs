import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/training-cohort-conversion.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { buildTrainingCohortConversion } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);

const NOW = Date.parse("2026-10-09T06:00:00Z");
const ago = (days) => new Date(NOW - days * 86400000).toISOString();
const course = (id,title,status="published") => ({id,slug:id,title,status});
const courses = [course("a","Foundations"),course("b","Support"),course("draft","Private draft","draft")];
const enrollment = (user_id,course_id,startDays,finishedDays=null) => ({
  user_id,course_id,started_at:ago(startDays),
  completed_at: finishedDays === null ? null : ago(finishedDays),
});
function scenario() {
  return {
    courses,
    nowMs:NOW,
    enrollments: [
      enrollment("u1","a",20,15), // finished within 7 days
      enrollment("u2","a",20,9),  // finished within 14 days only
      enrollment("u3","a",20,2),  // finished too late for either window
      enrollment("u4","a",10,8),  // eligible 7d; too new for 14d
      enrollment("u5","a",5,4),   // too new for both windows
      enrollment("u6","a",40),    // matured incomplete
      enrollment("u7","b",50,40), // 14-day completer
      enrollment("u8","b",120,100), // outside lookback
      enrollment("u9","draft",30,25), // draft course excluded
    ],
  };
}
const calc = scenarioOverride => buildTrainingCohortConversion(scenarioOverride || scenario());
const row = (r,id) => r.courses.find(x=>x.id===id);

test("uses only matured 7/14 day start cohorts, not all-time enrollment rate",()=>{
  const result=calc();
  assert.equal(result.available,true);
  assert.equal(result.lookbackDays,90);
  assert.deepEqual(result.totals.sevenDay,{eligible:6,completed:2,rate:33});
  assert.deepEqual(result.totals.fourteenDay,{eligible:5,completed:3,rate:60});
  assert.deepEqual(row(result,"a").sevenDay,{eligible:5,completed:2,rate:40});
  assert.deepEqual(row(result,"a").fourteenDay,{eligible:4,completed:2,rate:50});
});

test("does not penalize starts younger than the full measurement window",()=>{
  const r=calc({courses:[course("a","A")],nowMs:NOW,enrollments:[
    enrollment("one","a",6),
    enrollment("two","a",13),
  ]});
  assert.deepEqual(r.totals.sevenDay,{eligible:1,completed:0,rate:0});
  assert.deepEqual(r.totals.fourteenDay,{eligible:0,completed:0,rate:null});
});

test("exact 7 and 14 day completion boundaries count",()=>{
  const r=calc({courses:[course("a","A")],nowMs:NOW,enrollments:[
    enrollment("u1","a",7,0),
    enrollment("u2","a",28,14),
  ]});
  assert.equal(r.totals.sevenDay.eligible,2);
  assert.equal(r.totals.sevenDay.completed,1);
  // The seven-day starter has not yet reached the fourteen-day denominator.
  assert.equal(r.totals.fourteenDay.eligible,1);
  assert.equal(r.totals.fourteenDay.completed,1);
});

test("late completions remain excluded from early completion rates",()=>{
  const r=calc({courses:[course("a","A")],nowMs:NOW,enrollments:[
    enrollment("u","a",40,25), // 15 days later
  ]});
  assert.equal(r.totals.sevenDay.completed,0);
  assert.equal(r.totals.fourteenDay.completed,0);
});

test("one learner enrolled in two courses counts as two starts",()=>{
  const r=calc({courses:[course("a","A"),course("b","B")],nowMs:NOW,enrollments:[
    enrollment("same","a",40,39),enrollment("same","b",40,39),
  ]});
  assert.equal(r.totals.sevenDay.eligible,2);
  assert.equal(r.totals.sevenDay.completed,2);
});

test("duplicate enrolments cannot inflate denominators, earliest valid completion wins",()=>{
  const s=scenario();
  s.enrollments.push(enrollment("u1","a",20));
  s.enrollments.push(enrollment("u1","a",25,15));
  const r=calc(s);
  // Earliest start from duplicates is day 25; completion at day 15 is 10 days later.
  assert.equal(r.totals.sevenDay.eligible,6);
  assert.equal(r.totals.sevenDay.completed,1);
  assert.equal(r.totals.fourteenDay.completed,3);
});

test("unknown, draft, future and malformed start dates are excluded",()=>{
  const s=scenario();
  s.enrollments.push(enrollment("unknown","none",40,39));
  s.enrollments.push(enrollment("future","a",-1,-2));
  s.enrollments.push({user_id:"bad",course_id:"a",started_at:"not-a-date",completed_at:null});
  assert.equal(calc(s).totals.sevenDay.eligible,6);
  assert.ok(!calc(s).courses.some(c=>c.id==="draft"));
});

test("completion timestamps preceding enrollment never count as successful",()=>{
  const s={courses:[course("a","A")],nowMs:NOW,
    enrollments:[enrollment("u","a",40,41)]};
  assert.equal(calc(s).totals.sevenDay.completed,0);
  assert.equal(calc(s).totals.fourteenDay.completed,0);
});

test("zero eligible starts are displayed as not measurable, never fabricated 0% conversion",()=>{
  const r=calc({courses:[course("a","A")],nowMs:NOW,enrollments:[enrollment("u","a",2)]});
  assert.equal(r.available,true);
  assert.equal(r.courses.length,0);
  assert.equal(r.totals.sevenDay.rate,null);
  assert.equal(r.totals.fourteenDay.rate,null);
});

test("failed or truncated data fails closed without partial percentages",()=>{
  const r=calc({...scenario(),complete:false});
  assert.equal(r.available,false);
  assert.equal(r.courses.length,0);
  assert.equal(r.totals.sevenDay.rate,null);
  assert.match(r.reason,/incomplete/i);
});

test("small samples and real matured cohorts are kept distinct when sorted for review",()=>{
  const r=calc({courses:[course("a","Small"),course("b","Large")],nowMs:NOW,enrollments:[
    enrollment("a1","a",30),
    ...Array.from({length:5},(_,i)=>enrollment("b"+i,"b",30)),
  ]});
  assert.equal(r.courses[0].id,"b");
  assert.equal(r.courses[0].fourteenDay.eligible,5);
});

test("no learner IDs or emails are returned in the administrator report",()=>{
  const result=calc();
  const output=JSON.stringify(result);
  assert.doesNotMatch(output,/u1|u5|user_id|email/);
  assert.ok(result.courses.every(x=>Object.keys(x).sort().join(",")==="fourteenDay,id,sevenDay,slug,title"));
});

test("integration is admin only, with paginated and fail-closed source loading",async()=>{
  const [training,page,layout]=await Promise.all([
    readFile(new URL("../src/lib/training.ts",import.meta.url),"utf8"),
    readFile(new URL("../src/app/workspace/admin/training/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../src/app/workspace/admin/layout.tsx",import.meta.url),"utf8"),
  ]);
  assert.match(training,/import \{ buildTrainingCohortConversion \}/);
  assert.match(training,/complete: enrollmentResult\.complete/);
  assert.match(training,/async function loadHealthRows<T>/);
  assert.match(training,/const pageSize = 500/);
  assert.match(layout,/requireRoleFast\("admin"\)/);
  assert.match(page,/Completion within 7 and 14 days/);
  assert.match(page,/Small or immature 14-day sample/);
  assert.match(page,/Seven-day and 14-day rates have different eligible denominators/);
  assert.doesNotMatch(page,/\.user_id|\.email|\.full_name/);
});
