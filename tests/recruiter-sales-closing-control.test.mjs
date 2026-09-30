import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("CRM client record exposes one closer workflow from call outcome through recovery", async () => {
  const page = await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");

  for (const copy of [
    "Closing workflow",
    "Call outcome → objections → terms → follow-up → recovery.",
    "1 · Call outcome",
    "2 · Objections / risks",
    "3 · Proposal / terms",
    "4 · Next follow-up",
    "5 · Recovery",
    "Save closing plan",
  ]) {
    assert.ok(page.includes(copy), `expected closing workflow copy: ${copy}`);
  }

  assert.match(page, /saveCrmClosingControlAction/);
  assert.match(page, /failure_risks/);
  assert.match(page, /additional_notes/);
  assert.match(page, /closing_next_step/);
  assert.match(page, /next_follow_up_at/);
});

test("closing workflow detects concrete stalled and no-response states", async () => {
  const page = await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");

  for (const state of [
    "Follow-up overdue",
    "Proposal viewed · no decision",
    "Proposal unopened",
    "No response · 72h+",
    "Client replied",
    "Changes requested",
    "On track",
  ]) {
    assert.ok(page.includes(state), `expected recovery state: ${state}`);
  }

  assert.match(page, /24 \* 3600000/);
  assert.match(page, /48 \* 3600000/);
  assert.match(page, /72 \* 3600000/);
  assert.match(page, /id="client-followup"/);
  assert.match(page, /proposalViewedWaiting/);
  assert.match(page, /proposalUnopened/);
  assert.match(page, /noResponseStall/);
});

test("closing control stores notes in the existing private discovery brief and CRM follow-up", async () => {
  const actions = await read("src/app/actions/crm.ts");

  assert.match(actions, /export async function saveCrmClosingControlAction/);
  assert.match(actions, /from\("lead_discovery_briefs"\)\.upsert/);
  assert.match(actions, /failure_risks: failureRisks/);
  assert.match(actions, /additional_notes: additionalNotes/);
  assert.match(actions, /next_step: nextStep/);
  assert.match(actions, /qualification_status: qualificationStatus/);
  assert.match(actions, /from\("lead_intake"\)\.update/);
  assert.match(actions, /next_follow_up_at/);
  assert.match(actions, /closing_control_updated/);
});

test("closing control blocks closed leads and offers safe follow-up presets", async () => {
  const [actions, page] = await Promise.all([
    read("src/app/actions/crm.ts"),
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
  ]);

  assert.match(actions, /\["won", "lost"\]\.includes/);
  assert.match(actions, /Closed clients do not need a closing follow-up plan/);
  assert.match(actions, /\[2, 7, 14\]\.includes\(days\)/);
  assert.match(page, /name="quick_followup_days" value="2"/);
  assert.match(page, /name="quick_followup_days" value="7"/);
  assert.match(page, /name="quick_followup_days" value="14"/);
  assert.match(page, /This lead is closed\. Follow-up scheduling is disabled\./);
});

test("closing control is responsive and does not add a parallel sales database", async () => {
  const [css, actions] = await Promise.all([
    read("src/app/workspace/recruiter/crm/crm.module.css"),
    read("src/app/actions/crm.ts"),
  ]);

  for (const hook of [
    ".closingControl",
    ".closingFlow",
    ".closingControlForm",
    ".recoveryUrgent",
    ".recoveryWaiting",
    ".recoveryClear",
  ]) {
    assert.ok(css.includes(hook), `expected CSS hook: ${hook}`);
  }

  assert.doesNotMatch(actions, /lead_closing_state/);
});
