import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("loss reasons are structured and shared across every recruiter close path",async()=>{
  const [taxonomy,close,recruiter,form,detail,legacy]=await Promise.all([
    read("src/lib/loss-reasons.ts"),
    read("src/app/actions/close-lead.ts"),
    read("src/app/actions/recruiter.ts"),
    read("src/components/close-lead-form.tsx"),
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
    read("src/app/workspace/recruiter/leads/page.tsx"),
  ]);
  for(const code of ["too_expensive","budget_too_low","hiring_postponed","competitor","hired_independently","couldnt_reach","no_show","wrong_service","offshore_concern","expertise_gap","not_a_fit","duplicate","spam","other"]){
    assert.ok(taxonomy.includes(code),`missing loss reason ${code}`);
  }
  assert.match(close,/lost_reason_code/);
  assert.match(close,/winBackAtForLoss/);
  assert.match(recruiter,/lost_reason_code/);
  assert.match(recruiter,/syncLeadWinBackTask/);
  assert.match(form,/LEAD_LOSS_REASONS/);
  assert.match(detail,/Lost reason category/);
  assert.match(legacy,/Lost reason category/);
});

test("recoverable losses create internal win-back work without reopening the lead",async()=>{
  const [recovery,taxonomy,crm]=await Promise.all([
    read("src/lib/loss-recovery.ts"),
    read("src/lib/loss-reasons.ts"),
    read("src/app/workspace/recruiter/crm/page.tsx"),
  ]);
  assert.match(recovery,/Win-back follow-up/);
  assert.match(recovery,/subject_type: "lead"/);
  assert.match(recovery,/status: "todo"/);
  assert.match(recovery,/due_at: winBackAt/);
  assert.match(taxonomy,/winBackDays: 14/);
  assert.match(taxonomy,/winBackDays: 30/);
  assert.match(taxonomy,/winBackDays: 60/);
  assert.match(taxonomy,/winBackDays: 90/);
  assert.match(crm,/\["winback", "Win-back"\]/);
  assert.match(crm,/Win-back due/);
  assert.match(crm,/lead\.win_back_at/);
});

test("sales analytics report reason share lost value recovery and competitor signals",async()=>{
  const [lib,dashboard]=await Promise.all([
    read("src/lib/sales-analytics.ts"),
    read("src/components/sales-analytics-dashboard.tsx"),
  ]);
  assert.match(lib,/lost_reason_code/);
  assert.match(lib,/lostValue/);
  assert.match(lib,/recoverableLost/);
  assert.match(lib,/winBackScheduled/);
  assert.match(lib,/winBackDue/);
  assert.match(lib,/preProposalLost/);
  assert.match(lib,/postProposalLost/);
  assert.match(lib,/competitors/);
  assert.match(dashboard,/Win \/ loss intelligence/);
  assert.match(dashboard,/Top loss reason/);
  assert.match(dashboard,/Where losses happen/);
  assert.match(dashboard,/Competitor signals/);
});

test("database migration keeps win-loss fields constrained and win-back task creation idempotent",async()=>{
  const migration=await read("supabase/migrations/20261004164000_structured_win_loss_intelligence.sql");
  assert.match(migration,/lost_reason_code text/);
  assert.match(migration,/lost_competitor text/);
  assert.match(migration,/win_back_at timestamptz/);
  assert.match(migration,/lead_intake_lost_reason_code_check/);
  assert.match(migration,/lead_intake_win_back_due_idx/);
  assert.match(migration,/recruiter_tasks_open_lead_winback_unique/);
  assert.match(migration,/where subject_type = 'lead' and status = 'todo' and title = 'Win-back follow-up'/);
});
