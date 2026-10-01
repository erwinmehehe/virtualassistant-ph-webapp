import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const legacy = /\/workspace\/recruiter\/(leads|queue|activity|funnel|analytics|placements)(?:[/?#"'\x60]|$)/;

test("active recruiter entry points stay on canonical routes", async () => {
  const sources = await Promise.all([
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/crm/page.tsx"),
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/app/workspace/recruiter/roles/page.tsx"),
    read("src/app/workspace/recruiter/performance/page.tsx"),
    read("src/app/workspace/recruiter/finance/page.tsx"),
    read("src/app/actions/recruiter-ops.ts"),
    read("src/app/api/cron/maintenance/route.ts"),
    read("src/lib/workspace-badges.ts"),
    read("src/components/app-nav-links.tsx"),
    read("src/components/recruiter-operations-nav.tsx"),
  ]);
  for (const source of sources) assert.doesNotMatch(source, legacy);
});

test("legacy recruiter URLs have explicit canonical redirects", async () => {
  const config = await read("next.config.ts");
  for (const source of [
    "/workspace/recruiter/leads",
    "/workspace/recruiter/leads/board",
    "/workspace/recruiter/queue",
    "/workspace/recruiter/activity",
    "/workspace/recruiter/funnel",
    "/workspace/recruiter/analytics",
  ]) assert.match(config, new RegExp(`source: "${source.replaceAll("/", "\\/")}"`));
  assert.match(config, /destination: "\/workspace\/recruiter\/crm"/);
  assert.match(config, /destination: "\/workspace\/recruiter\/talent\?stage=recruiter_review/);
  assert.match(config, /destination: "\/workspace\/recruiter\/performance\?tab=funnel"/);
  assert.match(config, /destination: "\/workspace\/recruiter\/performance\?tab=analytics"/);
});

test("recruiter mobile layout retains phone-safe breakpoints and scrollable tabs", async () => {
  const [globalCss, shellCss, todayCss, crmCss, opsCss] = await Promise.all([
    read("src/app/globals.css"),
    read("src/app/dashboard-premium.css"),
    read("src/app/workspace/recruiter/today/today.module.css"),
    read("src/app/workspace/recruiter/crm/crm.module.css"),
    read("src/app/workspace/recruiter-ops-clarity.css"),
  ]);
  assert.match(globalCss, /@media \(max-width: 720px\)[\s\S]*\.role-filter-tabs \{ flex-wrap:nowrap; overflow-x:auto/);
  assert.match(shellCss, /@media \(max-width: 680px\)/);
  assert.match(todayCss, /@media \(max-width: 640px\)/);
  assert.match(crmCss, /@media \(max-width: 760px\)/);
  assert.match(opsCss, /@media \(max-width: 680px\)/);
});

test("canonical CRM preserves discovery recovery controls", async () => {
  const page = await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");
  assert.match(page, /createDiscoveryGoogleMeetLinkAction/);
  assert.match(page, /Create Google Meet/);
  assert.match(page, /Mark no-show/);
  assert.match(page, /No automatic rebooking email is sent/);
  assert.match(page, /Create role & open matching/);
});
