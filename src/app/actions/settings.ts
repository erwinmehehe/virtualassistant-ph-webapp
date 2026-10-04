"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_HOURLY_RATE } from "@/lib/constants";
import { DEFAULT_LEAD_SCORING_RULES, normalizeLeadScoringRules } from "@/lib/lead-scoring";

export async function updateMarketplaceSettingsAction(formData: FormData){
  await requireRole("admin");
  const minHourlyRate=Math.max(MIN_HOURLY_RATE,Number(formData.get("min_hourly_rate")??MIN_HOURLY_RATE));
  const placementFee=Math.max(0,Number(formData.get("default_placement_fee")??0));
  const markup=Math.max(0,Math.min(100,Number(formData.get("default_managed_markup_percent")??0)));
  const clientSuccessOwnerId=String(formData.get("client_success_owner_id")??"").trim()||null;
  const financeMinMargin=Math.max(0,Math.min(100,Number(formData.get("finance_min_margin_percent")??15)));
  const financeTargetMargin=Math.max(financeMinMargin,Math.min(100,Number(formData.get("finance_target_margin_percent")??25)));
  const financePaymentCost=Math.max(0,Math.min(100,Number(formData.get("finance_default_payment_cost_percent")??3)));
  const financeOpsCost=Math.max(0,Number(formData.get("finance_default_ops_cost_monthly")??0));
  const financeOverdueDays=Math.max(1,Math.min(120,Math.round(Number(formData.get("finance_invoice_overdue_days")??7))));
  const admin=createAdminClient();
  if(clientSuccessOwnerId){
    const {data:owner}=await admin.from("profiles").select("id,role,account_status").eq("id",clientSuccessOwnerId).maybeSingle();
    if(!owner||!["admin","recruiter"].includes(String(owner.role))||owner.account_status!=="active") throw new Error("Choose an active agency team member for Client Success.");
  }
  const {error}=await admin.from("admin_settings").update({
    min_hourly_rate:minHourlyRate,
    default_placement_fee:placementFee,
    default_managed_markup_percent:markup,
    client_success_owner_id:clientSuccessOwnerId,
    finance_min_margin_percent:financeMinMargin,
    finance_target_margin_percent:financeTargetMargin,
    finance_default_payment_cost_percent:financePaymentCost,
    finance_default_ops_cost_monthly:financeOpsCost,
    finance_invoice_overdue_days:financeOverdueDays,
    updated_at:new Date().toISOString()
  }).eq("id",1);
  if(error) throw error;
  revalidatePath("/workspace/admin/settings");
  revalidatePath("/workspace/admin/finance");
  revalidatePath("/workspace/recruiter/finance");
  revalidatePath("/pricing");
  revalidatePath("/");
  revalidatePath("/jobs");
}

export async function updateFocusVerticalAction(formData: FormData){
  await requireRole("admin");
  const id=String(formData.get("vertical_id")??"");
  const target=Math.max(1,Math.min(25,Number(formData.get("bench_target")??5)));
  const active=formData.get("active")==="on";
  const admin=createAdminClient();
  await admin.from("focus_verticals").update({active,bench_target:target}).eq("id",id);
  revalidatePath("/workspace/admin/settings");
}


function formNumber(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

export async function updateLeadScoringSettingsAction(formData: FormData){
  await requireRole("admin");
  const stagePoints = {
    new: formNumber(formData, "score_stage_new", DEFAULT_LEAD_SCORING_RULES.stagePoints.new),
    contacted: formNumber(formData, "score_stage_contacted", DEFAULT_LEAD_SCORING_RULES.stagePoints.contacted),
    discovery_booked: formNumber(formData, "score_stage_discovery_booked", DEFAULT_LEAD_SCORING_RULES.stagePoints.discovery_booked),
    qualified: formNumber(formData, "score_stage_qualified", DEFAULT_LEAD_SCORING_RULES.stagePoints.qualified),
    terms_sent: formNumber(formData, "score_stage_terms_sent", DEFAULT_LEAD_SCORING_RULES.stagePoints.terms_sent),
    shortlist_sent: formNumber(formData, "score_stage_shortlist_sent", DEFAULT_LEAD_SCORING_RULES.stagePoints.shortlist_sent),
    nurture: formNumber(formData, "score_stage_nurture", DEFAULT_LEAD_SCORING_RULES.stagePoints.nurture),
    won: 100,
    lost: 0,
  };
  const rules = normalizeLeadScoringRules({
    stagePoints,
    hotThreshold: formNumber(formData, "score_hot_threshold", DEFAULT_LEAD_SCORING_RULES.hotThreshold),
    warmThreshold: formNumber(formData, "score_warm_threshold", DEFAULT_LEAD_SCORING_RULES.warmThreshold),
    activeTodayPoints: formNumber(formData, "score_active_today", DEFAULT_LEAD_SCORING_RULES.activeTodayPoints),
    recent3DaysPoints: formNumber(formData, "score_recent_3d", DEFAULT_LEAD_SCORING_RULES.recent3DaysPoints),
    recent7DaysPoints: formNumber(formData, "score_recent_7d", DEFAULT_LEAD_SCORING_RULES.recent7DaysPoints),
    stale7Penalty: formNumber(formData, "score_stale_7d_penalty", DEFAULT_LEAD_SCORING_RULES.stale7Penalty),
    stale14Penalty: formNumber(formData, "score_stale_14d_penalty", DEFAULT_LEAD_SCORING_RULES.stale14Penalty),
    budgetLowThreshold: formNumber(formData, "score_budget_low_threshold", DEFAULT_LEAD_SCORING_RULES.budgetLowThreshold),
    budgetMediumThreshold: formNumber(formData, "score_budget_medium_threshold", DEFAULT_LEAD_SCORING_RULES.budgetMediumThreshold),
    budgetHighThreshold: formNumber(formData, "score_budget_high_threshold", DEFAULT_LEAD_SCORING_RULES.budgetHighThreshold),
    budgetAnyPoints: formNumber(formData, "score_budget_any", DEFAULT_LEAD_SCORING_RULES.budgetAnyPoints),
    budgetLowPoints: formNumber(formData, "score_budget_low", DEFAULT_LEAD_SCORING_RULES.budgetLowPoints),
    budgetMediumPoints: formNumber(formData, "score_budget_medium", DEFAULT_LEAD_SCORING_RULES.budgetMediumPoints),
    budgetHighPoints: formNumber(formData, "score_budget_high", DEFAULT_LEAD_SCORING_RULES.budgetHighPoints),
    agencyValueMediumThreshold: formNumber(formData, "score_agency_medium_threshold", DEFAULT_LEAD_SCORING_RULES.agencyValueMediumThreshold),
    agencyValueHighThreshold: formNumber(formData, "score_agency_high_threshold", DEFAULT_LEAD_SCORING_RULES.agencyValueHighThreshold),
    agencyValueAnyPoints: formNumber(formData, "score_agency_any", DEFAULT_LEAD_SCORING_RULES.agencyValueAnyPoints),
    agencyValueMediumPoints: formNumber(formData, "score_agency_medium", DEFAULT_LEAD_SCORING_RULES.agencyValueMediumPoints),
    agencyValueHighPoints: formNumber(formData, "score_agency_high", DEFAULT_LEAD_SCORING_RULES.agencyValueHighPoints),
    discoveryBookedPoints: formNumber(formData, "score_discovery_booked", DEFAULT_LEAD_SCORING_RULES.discoveryBookedPoints),
    discoveryCompletedPoints: formNumber(formData, "score_discovery_completed", DEFAULT_LEAD_SCORING_RULES.discoveryCompletedPoints),
    followUpDueSoonPoints: formNumber(formData, "score_followup_due", DEFAULT_LEAD_SCORING_RULES.followUpDueSoonPoints),
    followUpOverdueBasePoints: formNumber(formData, "score_followup_overdue_base", DEFAULT_LEAD_SCORING_RULES.followUpOverdueBasePoints),
    followUpOverdueMaxPoints: formNumber(formData, "score_followup_overdue_max", DEFAULT_LEAD_SCORING_RULES.followUpOverdueMaxPoints),
    firstResponseOverdueMinutes: formNumber(formData, "score_first_response_minutes", DEFAULT_LEAD_SCORING_RULES.firstResponseOverdueMinutes),
    firstResponseOverduePoints: formNumber(formData, "score_first_response_points", DEFAULT_LEAD_SCORING_RULES.firstResponseOverduePoints),
  });
  const admin=createAdminClient();
  const {error}=await admin.from("admin_settings").update({
    lead_scoring_rules: rules,
    updated_at:new Date().toISOString(),
  }).eq("id",1);
  if(error) throw error;
  revalidatePath("/workspace/admin/settings");
  revalidatePath("/workspace/recruiter/crm");
  revalidatePath("/workspace/recruiter/leads");
}
