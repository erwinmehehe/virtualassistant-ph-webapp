import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("client CRM record loads the structured discovery brief for closer context", async () => {
  const page = await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");

  assert.match(page, /from\("lead_discovery_briefs"\)/);
  for (const field of [
    "current_pain",
    "why_now",
    "ownership_needed",
    "success_90_days",
    "decision_process",
    "recommended_role",
    "recommended_hours",
    "recommended_start_date",
  ]) {
    assert.ok(page.includes(field), `expected discovery field ${field}`);
  }
});

test("client CRM record surfaces the pre-call closing brief and qualification gaps", async () => {
  const page = await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");

  for (const copy of [
    "Pre-call / closing brief",
    "Know the client before the conversation starts.",
    "What we need to learn",
    "Business problem understood",
    "Why now captured",
    "Responsibilities defined",
    "Hours known",
    "Budget discussed",
    "Start timeframe known",
    "90-day success defined",
    "Decision process known",
  ]) {
    assert.ok(page.includes(copy), `expected closing brief copy: ${copy}`);
  }

  assert.match(page, /Open discovery/);
  assert.match(page, /leadAge\(lead\.created_at\)/);
  assert.match(page, /lead\.source_page/);
  assert.match(page, /missingCallItems/);
});

test("closing brief keeps key sales context on one screen", async () => {
  const page = await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");

  for (const label of [
    "Company",
    "Role / need",
    "Hours",
    "Budget",
    "Timezone",
    "Preferred start",
    "Source",
    "Lead age",
    "Original hiring need",
  ]) {
    assert.ok(page.includes(label), `expected briefing label: ${label}`);
  }
});

test("closing brief has responsive desktop and mobile styling", async () => {
  const css = await read("src/app/workspace/recruiter/crm/crm.module.css");

  for (const hook of [
    ".closingBrief",
    ".closingFactGrid",
    ".closingBriefBody",
    ".closingChecklistItems",
    ".closingChecklistMissing",
    ".closingChecklistComplete",
  ]) {
    assert.ok(css.includes(hook), `expected CSS hook: ${hook}`);
  }

  assert.match(css, /@media \(max-width: 980px\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
});
