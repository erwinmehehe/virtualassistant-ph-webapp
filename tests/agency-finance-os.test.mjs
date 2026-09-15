import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const migration=read("supabase/migrations/20260915174500_agency_finance_os.sql");
const financeLib=read("src/lib/agency-finance.ts");
const adminPage=read("src/app/workspace/admin/finance/page.tsx");
const detailPage=read("src/app/workspace/admin/finance/[workroomId]/page.tsx");
const recruiterPage=read("src/app/workspace/recruiter/finance/page.tsx");
const actions=read("src/app/actions/agency-finance.ts");
const settingsAction=read("src/app/actions/settings.ts");
const nav=read("src/components/app-nav-links.tsx");
const clientPayments=read("src/app/workspace/client/payments/page.tsx");
const vaPayments=read("src/app/workspace/va/payments/page.tsx");

test("Finance OS keeps private placement economics in service-role-only tables",()=>{
  assert.match(migration,/create table if not exists public\.placement_finance_profiles/i);
  assert.match(migration,/create table if not exists public\.placement_finance_adjustments/i);
  assert.match(migration,/enable row level security/i);
  assert.match(migration,/revoke all on table public\.placement_finance_profiles from public,anon,authenticated/i);
  assert.match(migration,/placement_finance_profiles_browser_deny/i);
  assert.match(migration,/grant select,insert,update,delete on table public\.placement_finance_profiles to service_role/i);
});

test("Finance guardrails are centralized in admin settings",()=>{
  for(const field of ["finance_min_margin_percent","finance_target_margin_percent","finance_default_payment_cost_percent","finance_default_ops_cost_monthly","finance_invoice_overdue_days"]){
    assert.match(migration,new RegExp(field));
    assert.match(settingsAction,new RegExp(field));
  }
  assert.match(migration,/finance_target_margin_percent between finance_min_margin_percent and 100/i);
});

test("Placement finance is deterministic and includes payment and operating costs",()=>{
  assert.match(financeLib,/paymentCost = roundMoney\(revenue \* paymentCostPercent \/ 100\)/);
  assert.match(financeLib,/totalMonthlyCost = roundMoney\(vaCompensation \+ paymentCost \+ monthlyOpsCost \+ otherMonthlyCost\)/);
  assert.match(financeLib,/contribution = roundMoney\(revenue - totalMonthlyCost\)/);
  assert.match(financeLib,/approval_required/);
  assert.match(financeLib,/approved_exception/);
});

test("Owner Finance OS does not mislabel the VA-compensation ledger as agency revenue",()=>{
  assert.match(adminPage,/Expected managed MRR/);
  assert.match(adminPage,/These figures come from the existing VA-compensation ledger\. They are not total agency revenue\./);
  assert.match(detailPage,/Existing payment records are retained as the source of truth for client collection and VA payout release\./);
  assert.match(detailPage,/service_fee_revenue/);
});

test("Low-margin exceptions require recruiter ownership and admin review",()=>{
  assert.match(actions,/assertRecruiterOwnsWorkroom/);
  assert.match(actions,/jobs.*recruiter_id/s);
  assert.match(actions,/requireRole\("admin"\)/);
  assert.match(actions,/exception_status: "pending"/);
  assert.match(actions,/\["approved", "rejected"\]/);
  assert.match(recruiterPage,/Request owner exception/);
  assert.match(recruiterPage,/Detailed agency costs stay private to finance\/admin/);
});

test("Finance OS is available only in staff navigation and not added to client or VA billing",()=>{
  assert.match(nav,/\["Finance OS", "\/workspace\/admin\/finance"/);
  assert.match(nav,/\["Margin review", "\/workspace\/recruiter\/finance"/);
  assert.doesNotMatch(clientPayments,/placement_finance_profiles/);
  assert.doesNotMatch(vaPayments,/placement_finance_profiles/);
  assert.doesNotMatch(clientPayments,/finance_min_margin_percent/);
  assert.doesNotMatch(vaPayments,/finance_min_margin_percent/);
});

test("Finance adjustments cover revenue, refunds, VA changes and direct costs",()=>{
  for(const type of ["service_fee_revenue","placement_fee_revenue","refund","client_credit","va_bonus","va_deduction","payment_fee","fx_cost","ops_cost"]){
    assert.match(migration,new RegExp(type));
  }
});
