import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("placement actions separate recruiter handoff from Client Success ownership", async () => {
  const actions = await read("src/app/actions/agency-operations-v2.ts");

  assert.match(actions, /function assertRecruiterHandoffAccess/);
  assert.match(actions, /job\.recruiter_id === userId && !room\.handoff_completed_at/);
  assert.match(actions, /Recruitment access ends after the Client Success handoff/);

  assert.match(actions, /function assertClientSuccessAccess/);
  assert.match(actions, /room\.client_success_owner_id === userId/);
  assert.match(actions, /Post-start placement work belongs to the assigned Client Success owner/);

  const checkinStart = actions.indexOf("export async function recordPlacementCheckinAction");
  const stageStart = actions.indexOf("export async function updatePlacementStageAction");
  const checkinBlock = actions.slice(checkinStart, stageStart);
  const stageBlock = actions.slice(stageStart);

  assert.match(checkinBlock, /assertClientSuccessAccess\(profile\.role, user\.id, room\)/);
  assert.match(stageBlock, /assertClientSuccessAccess\(profile\.role, user\.id, room\)/);
});

test("placement support can only be resolved by Client Success owner or admin", async () => {
  const support = await read("src/app/actions/placement-support.ts");
  const start = support.indexOf("export async function resolvePlacementSupportRequestAction");
  const block = support.slice(start);

  assert.match(block, /profile\.role !== "admin" && room\.client_success_owner_id !== user\.id/);
  assert.doesNotMatch(block, /job\.recruiter_id !== user\.id && room\.client_success_owner_id/);
  assert.match(block, /Placement support belongs to the assigned Client Success owner/);
});

test("Recruiter Today keeps only the formal handoff and excludes post-start Client Success work", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  assert.match(page, /CLIENT_SUCCESS_QUEUE_KINDS = new Set\(\["placement_checkin", "placement_risk"\]\)/);
  assert.match(page, /!CLIENT_SUCCESS_QUEUE_KINDS\.has\(String\(item\.kind\)\)/);
  assert.match(page, /item\.kind==="placement_handoff"/);
  assert.doesNotMatch(page, /if\(item\.kind==="placement_checkin"\) return "Complete check-in"/);
  assert.doesNotMatch(page, /if\(item\.kind==="placement_risk"\) return "Open placement"/);
  assert.match(page, /summary\.placement_handoffs/);
  assert.match(page, /title:"Complete recruiter handoffs"/);
  assert.match(page, /This is the recruiter's final post-hire action/);
});

test("Client Success UI gates post-start controls to the assigned owner", async () => {
  const [detail, today] = await Promise.all([
    read("src/app/workspace/client-success/[id]/page.tsx"),
    read("src/app/workspace/client-success/page.tsx"),
  ]);

  assert.match(detail, /const canManagePostHire=profile\.role==="admin"\|\|room\.client_success_owner_id===userId/);
  assert.match(detail, /c\.status!=="completed"&&canManagePostHire/);
  assert.match(detail, /canManagePostHire\?<form action=\{updatePlacementStageAction\}/);
  assert.match(detail, /Client Success owned/);
  assert.match(today, /Recruitment ends at the formal handoff/);
  assert.match(today, /Client Success owns launch, check-ins, support, recovery, retention, replacement, and expansion/);
});

test("Client Success RPC visibility drops the hiring recruiter after formal handoff", async () => {
  const migration = await read("supabase/migrations/20261001204500_separate_recruitment_client_success_ownership.sql");

  assert.match(migration, /private\.client_success_can_access/);
  assert.match(migration, /w\.client_success_owner_id=p_actor_id/);
  assert.match(migration, /w\.handoff_completed_at is null/);
  assert.match(migration, /j\.recruiter_id=p_actor_id/);
  assert.match(migration, /client_success_today_queue/);
  assert.match(migration, /client_success_placement_detail/);
  assert.match(migration, /client_success_support_summary/);
  assert.match(migration, /client_success_retention_summary/);
});

test("recruiter summary exposes only incomplete formal handoffs", async () => {
  const migration = await read("supabase/migrations/20261001205500_recruiter_final_handoff_queue.sql");

  assert.match(migration, /placement_handoffs as/);
  assert.match(migration, /j\.recruiter_id=p_user_id/);
  assert.match(migration, /w\.handoff_completed_at is null/);
  assert.match(migration, /w\.client_success_owner_id is not null/);
  assert.match(migration, /'placement_handoffs', phf\.rows/);
});
