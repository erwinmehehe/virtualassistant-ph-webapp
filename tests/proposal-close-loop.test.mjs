import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("Discovery Workspace generates an editable recommendation instead of re-entering the role",async()=>{
  const [page,action,nextStepMigration]=await Promise.all([
    read("src/app/workspace/recruiter/crm/[leadId]/discovery/page.tsx"),
    read("src/app/actions/discovery-workspace.ts"),
    read("supabase/migrations/20260930222500_allow_proposal_discovery_next_step.sql"),
  ]);
  assert.match(page,/Generate recommendation/);
  assert.match(page,/name="intent" value="proposal"/);
  assert.match(action,/lead_proposals/);
  assert.match(action,/responsibilities/);
  assert.match(action,/required_skills/);
  assert.match(action,/required_tools/);
  assert.match(action,/salary_min/);
  assert.match(action,/commercial_note/);
  assert.match(action,/proposal\?generated=1/);
  assert.match(action,/const NEXT_STEPS = new Set\(\["save", "proposal", "qualified", "follow_up", "nurture"\]\)/);
  assert.match(nextStepMigration,/next_step is null or next_step in \('proposal','qualified','follow_up','nurture'\)/);
});

test("proposal editor supports Draft to Sent to Viewed to Changes requested to Accepted or Lost",async()=>{
  const [page,actions,crm]=await Promise.all([
    read("src/app/workspace/recruiter/crm/[leadId]/proposal/page.tsx"),
    read("src/app/actions/proposals.ts"),
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
  ]);
  for(const label of ["Draft","Sent","Viewed","Changes requested","Accepted","Lost"]) assert.match(page,new RegExp(label));
  assert.match(page,/What we heard \/ recommendation summary/);
  assert.match(page,/Responsibilities/);
  assert.match(page,/Required skills/);
  assert.match(page,/Required tools/);
  assert.match(page,/VAPH fee/);
  assert.match(page,/Send to client/);
  assert.match(actions,/crm_stage: "terms_sent"/);
  assert.match(actions,/client_hiring_proposal/);
  assert.match(actions,/proposalFollowUpTimeZone/);
  assert.match(actions,/followUpAtClientNine/);
  assert.match(actions,/next_follow_up_at: proposalFollowUpAt/);
  assert.match(actions,/follow_up_timezone: proposalFollowUpTimeZone/);
  assert.doesNotMatch(actions,/\/workspace\/recruiter\/leads/);
  assert.match(crm,/proposalPipelineStatus/);
  assert.match(crm,/Generate recommendation/);
  assert.match(crm,/Follow up on proposal/);
  assert.match(crm,/Revise proposal/);
});

test("client proposal is a decision-ready recommendation",async()=>{
  const publicProposal=await read("src/app/proposal/[token]/page.tsx");
  assert.match(publicProposal,/What this person will own/);
  assert.match(publicProposal,/Fit requirements/);
  assert.match(publicProposal,/Recommended compensation/);
  assert.match(publicProposal,/Commercial note/);
  assert.match(publicProposal,/What happens next/);
  assert.match(publicProposal,/Approve and start recruiting/);
  assert.match(publicProposal,/Request changes/);
});

test("accepted proposals hand recommendation data straight into matching atomically",async()=>{
  const [actions,migration]=await Promise.all([
    read("src/app/actions/proposals.ts"),
    read("supabase/migrations/20260930204500_atomic_proposal_matching_handoff.sql"),
  ]);
  assert.match(actions,/proposalResponsibilities/);
  assert.match(actions,/proposalSkills/);
  assert.match(actions,/proposalTools/);
  assert.match(actions,/required_skills: proposalSkills/);
  assert.match(actions,/required_tools: proposalTools/);
  assert.doesNotMatch(actions.slice(actions.indexOf("export async function acceptLeadProposalAction")),/from\("jobs"\)\.update/);
  assert.match(migration,/required_skills = v_required_skills/);
  assert.match(migration,/required_tools = v_required_tools/);
  assert.match(migration,/hiring_stage = 'ready_to_recruit'/);
  assert.match(actions,/autoReleaseTopMatches/);
});

test("sales maintenance follows discovery and proposals without duplicate sends",async()=>{
  const maintenance=await read("src/app/api/cron/maintenance/route.ts");
  assert.match(maintenance,/proposal_due_after_discovery/);
  assert.match(maintenance,/Prepare recommendation today/);
  assert.match(maintenance,/proposal-client-followup-2d-/);
  assert.match(maintenance,/client_hiring_proposal_followup/);
  assert.match(maintenance,/title: proposal\.viewed_at \? `Viewed proposal still open:/);
});

test("proposal recommendation snapshot remains server-only",async()=>{
  const migration=await read("supabase/migrations/20260930203000_discovery_proposal_close_loop.sql");
  for(const field of ["responsibilities","required_skills","required_tools","salary_min","salary_max","salary_currency","commercial_note","recommended_start_date","send_count"]){
    assert.match(migration,new RegExp(field));
  }
  assert.match(migration,/enable row level security/);
  assert.match(migration,/revoke all on table public\.lead_proposals from anon, authenticated/);
  assert.match(migration,/grant select, insert, update, delete on table public\.lead_proposals to service_role/);
});
