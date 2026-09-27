import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("recruiter badge destinations use current role and talent pages while focused nav stays intact", async () => {
  const [nav,badges,today]=await Promise.all([
    read("src/components/app-nav-links.tsx"),
    read("src/lib/workspace-badges.ts"),
    read("src/app/workspace/recruiter/today/page.tsx"),
  ]);

  assert.match(nav,/\["Hiring inbox", "\/workspace\/recruiter\/leads", BriefcaseBusiness\]/);
  assert.match(nav,/\["Active roles", "\/workspace\/recruiter\/roles", BriefcaseBusiness\]/);
  assert.match(nav,/\["Client review", "\/workspace\/recruiter\/client-review", MessageSquare\]/);
  assert.match(nav,/\["Placements", "\/workspace\/recruiter\/placements", Wrench\]/);
  assert.match(badges,/"\/workspace\/recruiter\/talent": Number\(raw\.vetting \|\| 0\)/);
  assert.match(badges,/"\/workspace\/recruiter\/roles": Number\(raw\.pending_roles \|\| 0\)/);
  assert.doesNotMatch(badges,/"\/workspace\/recruiter\/queue"/);
  assert.doesNotMatch(badges,/"\/workspace\/recruiter\/matching"/);
  for (const href of ["/workspace/recruiter/agenda","/workspace/recruiter/tasks","/workspace/recruiter/notifications"]) {
    assert.ok(today.includes(href));
  }
});

test("My Day workload totals include new hiring enquiries", async () => {
  const page=await read("src/app/workspace/recruiter/today/page.tsx");
  assert.ok(page.includes("const roleActions = newHiringRoles.length + incompleteRoleCount + roleNoCandidates"));
  assert.ok(page.includes("newHiringRoles.length+incompleteRoleCount+roleNoCandidates+replacementNeeded+interviewsDue+offersWaiting+staleRolesCount"));
});

test("tasks and agenda use canonical role URLs and agenda is recruiter scoped", async () => {
  const [tasks,agenda]=await Promise.all([
    read("src/app/workspace/recruiter/tasks/page.tsx"),
    read("src/app/workspace/recruiter/agenda/page.tsx"),
  ]);
  assert.ok(tasks.includes("return `/workspace/recruiter/roles/${task.subject_id}`;"));
  assert.ok(!tasks.includes("return `/workspace/recruiter/matching/${task.subject_id}`;"));
  assert.ok(agenda.includes("return `/workspace/recruiter/roles/${task.subject_id}`;"));
  assert.ok(agenda.includes("owner_id.eq.${userId},owner_id.is.null"));
  assert.ok(agenda.includes("/workspace/recruiter/roles/${item.jobId}#interviews"));
  assert.ok(!agenda.includes("/workspace/recruiter/matching/${item.jobId}"));
});

test("coverage counts linked enquiries only once and does not hide query failures", async () => {
  const coverage=await read("src/app/workspace/recruiter/coverage/page.tsx");
  assert.ok(coverage.includes('select("id,service,crm_stage,job_id")'));
  assert.ok(coverage.includes('select("id,title,categories,status,lead_id")'));
  assert.ok(coverage.includes("openJobIds"));
  assert.ok(coverage.includes("linkedLeadIds"));
  assert.ok(coverage.includes("linked enquiries counted once"));
  assert.ok(coverage.includes("if (leadError) throw leadError"));
  assert.ok(coverage.includes("if (jobError) throw jobError"));
  assert.ok(coverage.includes("if (vaError) throw vaError"));
});

test("recruiter finance fails loudly instead of rendering false zero states", async () => {
  const page=await read("src/app/workspace/recruiter/finance/page.tsx");
  for (const snippet of [
    "if(jobsError) throw jobsError",
    "if(settingsError) throw settingsError",
    "if(roomResult.error) throw roomResult.error",
    "if(profileResult.error) throw profileResult.error",
  ]) assert.ok(page.includes(snippet));
});

test("recruiter notification actions rewrite legacy destinations and reject cross-role workspace links", async () => {
  const actions=await read("src/app/actions/recruiter-ops.ts");
  assert.ok(actions.includes("function recruiterActionPath"));
  assert.ok(actions.includes("const legacyMatch = path.match("));
  assert.ok(actions.includes("const adminJob = path.match("));
  assert.ok(actions.includes("legacyMatch[1]"));
  assert.ok(actions.includes("adminJob[1]"));
  assert.ok(actions.includes('path.startsWith("/workspace/recruiter/")'));
  assert.ok(actions.includes('path === "/workspace/client-success"'));
  assert.ok(actions.includes('redirect(recruiterActionPath(notification.href, "/workspace/recruiter/notifications"))'));
  assert.ok(actions.includes('const href = recruiterActionPath(formData.get("href"), "")'));
});

test("maintenance creates canonical recruiter links and keeps client reminders in-app only", async () => {
  const route=await read("src/app/api/cron/maintenance/route.ts");
  assert.ok(route.includes('href: `/workspace/recruiter/roles/${job.id}`'));
  assert.ok(!route.includes('href: `/workspace/recruiter/matching/${job.id}`'));

  const interviewStart=route.indexOf("action: `schedule_interview_");
  assert.ok(interviewStart>=0);
  assert.match(route.slice(interviewStart,interviewStart+900),/email: false/);

  const clientOfferStart=route.indexOf("action: `placement_offer_client_");
  assert.ok(clientOfferStart>=0);
  assert.match(route.slice(clientOfferStart,clientOfferStart+900),/email: false/);

  assert.ok(route.includes("async function runRecruiterNotificationHygiene"));
  assert.ok(route.includes("notificationRetentionCutoff"));
  assert.ok(route.includes("staleSlaCutoff"));
  assert.ok(route.includes('runMaintenanceTask("recruiter notification hygiene"'));
  assert.ok(route.includes(".eq(\"title\", args.title)"));
  assert.ok(route.includes(".eq(\"href\", args.href)"));
  assert.ok(route.includes("roleIds.slice(index, index + 200)"));
  assert.ok(route.includes("archiveIds.slice(index, index + 200)"));
});

test("roles page falls back safely from stale view and sort query strings", async () => {
  const page=await read("src/app/workspace/recruiter/roles/page.tsx");
  assert.ok(page.includes('ROLE_VIEWS.some(([value])=>value===String(params.view||"active"))'));
  assert.ok(page.includes('["urgent","oldest","newest","start","stage"].includes'));
});


test("Talent links directly to canonical recruiter queues instead of legacy redirect routes", async () => {
  const page=await read("src/app/workspace/recruiter/talent/page.tsx");
  assert.ok(page.includes('href="/workspace/recruiter/talent?stage=recruiter_review"'));
  assert.ok(page.includes('href="/workspace/recruiter/roles?view=needs_candidates&sort=urgent"'));
  assert.ok(!page.includes('href="/workspace/recruiter/queue"'));
  assert.ok(!page.includes('href="/workspace/recruiter/matching"'));
});


test("talent operations no longer links recruiters through the legacy vetting route", async () => {
  const panel=await read("src/components/recruiter-talent-operations-panel.tsx");
  assert.ok(panel.includes('href="/workspace/recruiter/talent?stage=recruiter_review"'));
  assert.ok(!panel.includes('href="/workspace/recruiter/queue"'));
});
