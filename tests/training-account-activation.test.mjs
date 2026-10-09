import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(
  new URL("../src/lib/training-account-activation.ts", import.meta.url), "utf8"
);
const js = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { buildTrainingAccountActivation } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);

const NOW = Date.parse("2026-10-09T06:00:00Z");
const ago = days => new Date(NOW - days * 86400_000).toISOString();
const account = (id,days) => ({id,created_at:ago(days)});
const started = (user_id,startDays,finishDays=null) => ({
  user_id,started_at:ago(startDays),
  completed_at:finishDays===null?null:ago(finishDays),
});
const base=()=>({
  nowMs:NOW,
  accounts:[
    account("u1",30), account("u2",20), account("u3",10),
    account("u4",5), account("u5",2), account("u6",80),
    account("u7",110), account("u8",15), account("u9",25),
  ],
  enrollments:[
    started("u1",29,24),started("u1",25), // duplicate course starts
    started("u2",15),started("u4",4),
    started("u6",60,10), started("u7",109,100),started("u9",24),
  ],
  lessonCompletions:[{user_id:"u1"},{user_id:"u1"},{user_id:"u2"},
    {user_id:"u6"},{user_id:"u7"}],
  verifiedVaProfileUserIds:["u1","u7","u8","u8"],
});
const calc = overrides => buildTrainingAccountActivation({...base(),...overrides});

test("counts unique signup accounts, course starts, lessons and graduates rather than enrollment rows",()=>{
  const r=calc();
  assert.equal(r.available,true);
  assert.deepEqual(r.totals,{
    registered:9,
    startedCourse:6,
    completedLesson:4,
    completedCourse:3,
    noStart72h:2,
    alsoVaProfile:3,
    graduatesAlsoVaProfile:2,
  });
});
test("calculates a 7-day signup cohort only after full observation time",()=>{
  const r=calc();
  assert.deepEqual(r.firstCourseSevenDay,{
    lookbackDays:90,eligible:6,activated:3,rate:50,
  });
  assert.equal(r.recentThirtyDayRegistrations,7);
});
test("7-day exact boundary is mature and counts a same-window activation",()=>{
  const r=calc({
    accounts:[account("exact",7),account("young",6)],
    enrollments:[started("exact",0),started("young",5)],
    lessonCompletions:[],verifiedVaProfileUserIds:[],
  });
  assert.deepEqual(r.firstCourseSevenDay,{lookbackDays:90,eligible:1,activated:1,rate:100});
});
test("late course start cannot count as a first-week activation",()=>{
  const r=calc({
    accounts:[account("late",40)],
    enrollments:[started("late",20)],
    lessonCompletions:[],verifiedVaProfileUserIds:[],
  });
  assert.equal(r.totals.startedCourse,1);
  assert.deepEqual(r.firstCourseSevenDay,{lookbackDays:90,eligible:1,activated:0,rate:0});
});
test("recent signup without a course does not become overdue before 72 hours",()=>{
  const r=calc({
    accounts:[account("recent",2),account("mature",4)],
    enrollments:[],lessonCompletions:[],verifiedVaProfileUserIds:[],
  });
  assert.equal(r.totals.noStart72h,1);
});
test("deduplicates account and VA profile identifiers without inventing a timeline",()=>{
  const r=calc({
    accounts:[account("repeat",9),account("repeat",10)],
    enrollments:[started("repeat",8),started("repeat",6)],
    lessonCompletions:[{user_id:"repeat"},{user_id:"repeat"}],
    verifiedVaProfileUserIds:["repeat","repeat"],
  });
  assert.equal(r.totals.registered,1);
  assert.equal(r.totals.startedCourse,1);
  assert.equal(r.totals.completedLesson,1);
  assert.equal(r.totals.alsoVaProfile,1);
  assert.equal(r.firstCourseSevenDay.eligible,1);
});
test("nonmembers, future accounts, and impossible course starts do not inflate activation",()=>{
  const r=calc({
    accounts:[account("a",15),{id:"future",created_at:ago(-1)}],
    enrollments:[started("other",5),started("a",20)],
    lessonCompletions:[{user_id:"other"}],
    verifiedVaProfileUserIds:["other","future"],
  });
  assert.equal(r.totals.registered,1);
  assert.equal(r.totals.startedCourse,0);
  assert.equal(r.totals.alsoVaProfile,0);
  assert.equal(r.firstCourseSevenDay.eligible,1);
  assert.equal(r.firstCourseSevenDay.activated,0);
});
test("legacy lesson or completed-course rows without a course start do not inflate activation",()=>{
  const r=calc({
    accounts:[account("orphan",20)],
    enrollments:[{user_id:"orphan",started_at:ago(30),completed_at:ago(5)}],
    lessonCompletions:[{user_id:"orphan"}],
    verifiedVaProfileUserIds:[],
  });
  assert.equal(r.totals.startedCourse,0);
  assert.equal(r.totals.completedLesson,0);
  assert.equal(r.totals.completedCourse,0);
});

test("no mature cohort is not mislabeled as 0 percent",()=>{
  const r=calc({
    accounts:[account("new",1)],
    enrollments:[],lessonCompletions:[],verifiedVaProfileUserIds:[],
  });
  assert.equal(r.firstCourseSevenDay.eligible,0);
  assert.equal(r.firstCourseSevenDay.rate,null);
});
test("incomplete upstream data suppresses all potentially misleading totals",()=>{
  const r=calc({complete:false});
  assert.equal(r.available,false);
  assert.equal(r.totals.registered,0);
  assert.equal(r.firstCourseSevenDay.rate,null);
  assert.match(r.reason,/incomplete/);
});
test("pure report never returns learner IDs or contact details",()=>{
  const r=calc();
  const output=JSON.stringify(r);
  assert.doesNotMatch(output,/u1|u2|u3|@|email|full_name|user_id|created_at/);
  assert.match(output,/"alsoVaProfile"/);
});
test("server loader validates admin role and uses trusted app metadata, not editable claims",async()=>{
  const s=await readFile("src/lib/training-account-activation-server.ts","utf8");
  const auth=s.indexOf('await requireRoleFast("admin")');
  const serviceClient=s.indexOf("const admin = createAdminClient()");
  assert.ok(auth>=0 && serviceClient>auth);
  assert.match(s,/user\.app_metadata\?\.account_type !== "training"/);
  assert.doesNotMatch(s,/user\.user_metadata|raw_user_meta_data/);
  assert.match(s,/data\.users\.length < AUTH_PAGE_SIZE/);
  assert.match(s,/if \(!exhausted\) throw new Error/);
  assert.match(s,/if \(!finished\) throw new Error/);
  assert.match(s,/row\.role === "va"/);
  assert.match(s,/name: "va_profiles"/);
  assert.match(s,/complete: false/);
});
test("admin activation page shows totals and next steps but no identifying data",async()=>{
  const [page,trainingPage]=await Promise.all([
    readFile("src/app/workspace/admin/training/activation/page.tsx","utf8"),
    readFile("src/app/workspace/admin/training/page.tsx","utf8"),
  ]);
  assert.match(page,/From training signup to first completion/);
  assert.match(page,/No course start after 72h/);
  assert.match(page,/First-week course activation/);
  assert.match(page,/Also created a VA candidate profile/);
  assert.match(page,/not proof that training occurred before VA registration/);
  assert.doesNotMatch(page,/user_id|email_address|full_name/);
  assert.match(trainingPage,/href="\/workspace\/admin\/training\/activation"/);
});
