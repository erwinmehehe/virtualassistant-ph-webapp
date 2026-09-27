import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("recruiter navigation exposes the operational queues and current badge destinations", async () => {
  const [nav,badges]=await Promise.all([
    read("src/components/app-nav-links.tsx"),
    read("src/lib/workspace-badges.ts"),
  ]);

  for (const href of [
    "/workspace/recruiter/agenda",
    "/workspace/recruiter/tasks",
    "/workspace/recruiter/notifications",
    "/workspace/recruiter/talent",
    "/workspace/recruiter/roles",
  ]) assert.match(nav,new RegExp(href.replaceAll("/","\\/")));

  assert.match(nav,/\["Placements", "\/workspace\/client-success", Wrench\]/);
  assert.match(nav,/recruiter: \["\/workspace\/recruiter\/today", "\/workspace\/recruiter\/leads", "\/workspace\/recruiter\/roles", "\/workspace\/recruiter\/talent"\]/);
  assert.match(badges,/"\/workspace\/recruiter\/talent": Number\(raw\.vetting \|\| 0\)/);
  assert.match(badges,/"\/workspace\/recruiter\/roles": Number\(raw\.pending_roles \|\| 0\)/);
  assert.doesNotMatch(badges,/"\/workspace\/recruiter\/queue"/);
  assert.doesNotMatch(badges,/"\/workspace\/recruiter\/matching"/);
});

test("My Day workload totals include new hiring enquiries", async () => {
  const page=await read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(page,/const roleActions = newHiringRoles\.length \+ incompleteRoleCount \+ roleNoCandidates/);
  assert.match(page,/newHiringRoles\.length\+incompleteRoleCount\+roleNoCandidates\+replacementNeeded\+interviewsDue\+offersWaiting\+staleRolesCount/);
});

test("tasks and agenda use canonical role URLs and agenda is recruiter scoped", async () => {
  const [tasks,agenda]=await Promise.all([
    read("src/app/workspace/recruiter/tasks/page.tsx"),
    read("src/app/workspace/recruiter/agenda/page.tsx"),
  ]);
  assert.match(tasks,/return `\/workspace\/recruiter\/roles\/\$\{task\.subject_id\}`/);
  assert.doesNotMatch(tasks,/\/workspace\/recruiter\/matching\/\$\{task\.subject_id\}/);
  assert.match(agenda,/return `\/workspace\/recruiter\/roles\/\$\{task\.subject_id\}`/);
  assert.match(agenda,/owner_id\.eq\.\$\{userId\},owner_id\.is\.null/);
  assert.match(agenda,/\/workspace\/recruiter\/roles\/\$\{item\.jobId\}#interviews/);
  assert.doesNotMatch(agenda,/\/workspace\/recruiter\/matching\/\$\{item\.jobId\}/);
});

test("coverage counts linked enquiries only once and does not hide query failures", async () => {
  const coverage=await read("src/app/workspace/recruiter/coverage/page.tsx");
  assert.match(coverage,/select\("id,service,crm_stage,job_id"\)/);
  assert.match(coverage,/select\("id,title,categories,status,lead_id"\)/);
  assert.match(coverage,/openJobIds/);
  assert.match(coverage,/linkedLeadIds/);
  assert.match(coverage,/linked enquiries counted once/);
  assert.match(coverage,/if \(leadError\) throw leadError/);
  assert.match(coverage,/if \(jobError\) throw jobError/);
  assert.match(coverage,/if \(vaError\) throw vaError/);
});

test("recruiter finance fails loudly instead of rendering false zero states", async () => {
  const page=await read("src/app/workspace/recruiter/finance/page.tsx");
  assert.match(page,/if\(jobsError\) throw jobsError/);
  assert.match(page,/if\(settingsError\) throw settingsError/);
  assert.match(page,/if\(roomResult\.error\) throw roomResult\.error/);
  assert.match(page,/if\(profileResult\.error\) throw profileResult\.error/);
});

test("recruiter notification actions rewrite legacy destinations and reject cross-role workspace links", async () => {
  const actions=await read("src/app/actions/recruiter-ops.ts");
  assert.match(actions,/function recruiterActionPath/);
  assert.match(actions,/\/workspace\/recruiter\/matching\//);
  assert.match(actions,/\/workspace\/admin\/jobs\//);
  assert.match(actions,/path\.startsWith\("\/workspace\/recruiter\/"\)/);
  assert.match(actions,/path === "\/workspace\/client-success"/);
  assert.match(actions,/redirect\(recruiterActionPath\(notification\.href/);
  assert.match(actions,/const href = recruiterActionPath\(formData\.get\("href"\), ""\)/);
});

test("maintenance creates canonical recruiter links and keeps client reminders in-app only", async () => {
  const route=await read("src/app/api/cron/maintenance/route.ts");
  assert.match(route,/href: `\/workspace\/recruiter\/roles\/\$\{job\.id\}`/);
  assert.doesNotMatch(route,/href: `\/workspace\/recruiter\/matching\/\$\{job\.id\}`/);

  const interviewStart=route.indexOf("action: `schedule_interview_");
  assert.ok(interviewStart>=0);
  assert.match(route.slice(interviewStart,interviewStart+900),/email: false/);

  const clientOfferStart=route.indexOf("action: `placement_offer_client_");
  assert.ok(clientOfferStart>=0);
  assert.match(route.slice(clientOfferStart,clientOfferStart+900),/email: false/);
});

test("roles page falls back safely from stale view and sort query strings", async () => {
  const page=await read("src/app/workspace/recruiter/roles/page.tsx");
  assert.match(page,/ROLE_VIEWS\.some\(\(\[value\]\)=>value===String\(params\.view\|\|"active"\)\)\?String\(params\.view\|\|"active"\\):"active"/);
  assert.match(page,/\["urgent","oldest","newest","start","stage"\]\.includes/);
});
