"use server";

import { revalidatePath } from "next/cache";
import { requireAnyRole, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePlacementFinance } from "@/lib/agency-finance";

const adjustmentTypes = new Set([
  "service_fee_revenue","placement_fee_revenue","other_revenue",
  "client_credit","refund","va_bonus","va_deduction",
  "payment_fee","fx_cost","ops_cost","other_cost"
]);

function numberField(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key) ?? fallback);
  if (!Number.isFinite(value)) throw new Error(`Invalid ${key}.`);
  return value;
}

function textField(formData: FormData, key: string, max = 3000) {
  const value = String(formData.get(key) ?? "").trim();
  if (value.length > max) throw new Error(`${key} is too long.`);
  return value;
}

async function financeSettings(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from("admin_settings")
    .select("finance_min_margin_percent,finance_target_margin_percent,finance_default_payment_cost_percent,finance_default_ops_cost_monthly")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return {
    min: Number(data.finance_min_margin_percent ?? 15),
    target: Number(data.finance_target_margin_percent ?? 25),
    paymentCost: Number(data.finance_default_payment_cost_percent ?? 3),
    opsCost: Number(data.finance_default_ops_cost_monthly ?? 0)
  };
}

async function assertRecruiterOwnsWorkroom(admin: ReturnType<typeof createAdminClient>, workroomId: string, userId: string, role: string) {
  if (role === "admin") return;
  const { data: room, error } = await admin.from("workrooms").select("id,job_id").eq("id", workroomId).maybeSingle();
  if (error || !room) throw new Error("Placement not found.");
  const { data: job, error: jobError } = await admin.from("jobs").select("id,recruiter_id").eq("id", room.job_id).maybeSingle();
  if (jobError || !job || job.recruiter_id !== userId) throw new Error("You can only request an exception for placements you own.");
}

function revalidateFinance(workroomId?: string) {
  revalidatePath("/workspace/admin/finance");
  revalidatePath("/workspace/recruiter/finance");
  if (workroomId) revalidatePath(`/workspace/admin/finance/${workroomId}`);
}

export async function savePlacementFinanceAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();
  const workroomId = textField(formData, "workroom_id", 100);
  if (!workroomId) throw new Error("Placement is required.");

  const { data: room, error: roomError } = await admin.from("workrooms").select("id").eq("id", workroomId).maybeSingle();
  if (roomError || !room) throw new Error("Placement not found.");

  const settings = await financeSettings(admin);
  const revenue = Math.max(0, numberField(formData, "expected_monthly_client_revenue"));
  const vaComp = Math.max(0, numberField(formData, "expected_monthly_va_compensation"));
  const paymentCost = Math.max(0, Math.min(100, numberField(formData, "payment_cost_percent", settings.paymentCost)));
  const opsCost = Math.max(0, numberField(formData, "monthly_ops_cost", settings.opsCost));
  const otherCost = Math.max(0, numberField(formData, "other_monthly_cost"));
  const currency = textField(formData, "currency", 3).toUpperCase() || "USD";
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Use a 3-letter currency code.");

  const { data: existing } = await admin.from("placement_finance_profiles").select("*").eq("workroom_id", workroomId).maybeSingle();
  const result = calculatePlacementFinance({
    expectedMonthlyClientRevenue: revenue,
    expectedMonthlyVaCompensation: vaComp,
    paymentCostPercent: paymentCost,
    monthlyOpsCost: opsCost,
    otherMonthlyCost: otherCost,
    minMarginPercent: settings.min,
    targetMarginPercent: settings.target,
    exceptionStatus: existing?.exception_status
  });

  const economicsChanged = Boolean(existing) && [
    [existing.expected_monthly_client_revenue, revenue],
    [existing.expected_monthly_va_compensation, vaComp],
    [existing.payment_cost_percent, paymentCost],
    [existing.monthly_ops_cost, opsCost],
    [existing.other_monthly_cost, otherCost],
    [existing.currency, currency]
  ].some(([before, after]) => String(before ?? "") !== String(after ?? ""));

  let exceptionStatus = String(existing?.exception_status || "not_required");
  const belowFloor = revenue > 0 && result.marginPercent < settings.min;
  if (!belowFloor) exceptionStatus = "not_required";
  else if (!existing || economicsChanged || !["approved","pending"].includes(exceptionStatus)) exceptionStatus = "pending";

  const patch: Record<string, unknown> = {
    workroom_id: workroomId,
    currency,
    expected_monthly_client_revenue: revenue,
    expected_monthly_va_compensation: vaComp,
    payment_cost_percent: paymentCost,
    monthly_ops_cost: opsCost,
    other_monthly_cost: otherCost,
    exception_status: exceptionStatus,
    reconciled_at: null,
    reconciled_by: null,
    reconciliation_note: economicsChanged ? null : existing?.reconciliation_note ?? null
  };
  if (exceptionStatus === "pending" && (!existing || economicsChanged || existing.exception_status !== "pending")) {
    patch.exception_requested_by = user.id;
    patch.exception_requested_at = new Date().toISOString();
    patch.exception_reviewed_by = null;
    patch.exception_reviewed_at = null;
    patch.exception_review_note = null;
  }
  if (exceptionStatus === "not_required") {
    patch.exception_reason = null;
    patch.exception_requested_by = null;
    patch.exception_requested_at = null;
    patch.exception_reviewed_by = null;
    patch.exception_reviewed_at = null;
    patch.exception_review_note = null;
  }

  const { error } = await admin.from("placement_finance_profiles").upsert(patch, { onConflict: "workroom_id" });
  if (error) throw error;
  revalidateFinance(workroomId);
}

export async function requestMarginExceptionAction(formData: FormData) {
  const session = await requireAnyRole(["recruiter", "admin"]);
  const admin = createAdminClient();
  const workroomId = textField(formData, "workroom_id", 100);
  const reason = textField(formData, "reason");
  if (reason.length < 10) throw new Error("Explain why this low-margin placement should be approved.");
  await assertRecruiterOwnsWorkroom(admin, workroomId, session.user.id, String(session.profile.role));

  const [{ data: profile, error: profileError }, settings] = await Promise.all([
    admin.from("placement_finance_profiles").select("*").eq("workroom_id", workroomId).maybeSingle(),
    financeSettings(admin)
  ]);
  if (profileError || !profile) throw new Error("Set placement economics before requesting an exception.");
  const result = calculatePlacementFinance({
    expectedMonthlyClientRevenue: Number(profile.expected_monthly_client_revenue),
    expectedMonthlyVaCompensation: Number(profile.expected_monthly_va_compensation),
    paymentCostPercent: Number(profile.payment_cost_percent),
    monthlyOpsCost: Number(profile.monthly_ops_cost),
    otherMonthlyCost: Number(profile.other_monthly_cost),
    minMarginPercent: settings.min,
    targetMarginPercent: settings.target,
    exceptionStatus: profile.exception_status
  });
  if (result.marginPercent >= settings.min) throw new Error("This placement meets the minimum margin and does not need an exception.");

  const { error } = await admin.from("placement_finance_profiles").update({
    exception_status: "pending",
    exception_reason: reason,
    exception_requested_by: session.user.id,
    exception_requested_at: new Date().toISOString(),
    exception_reviewed_by: null,
    exception_reviewed_at: null,
    exception_review_note: null
  }).eq("workroom_id", workroomId);
  if (error) throw error;
  revalidateFinance(workroomId);
}

export async function reviewMarginExceptionAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();
  const workroomId = textField(formData, "workroom_id", 100);
  const decision = textField(formData, "decision", 20);
  const note = textField(formData, "review_note");
  if (!["approved", "rejected"].includes(decision)) throw new Error("Choose approve or reject.");
  if (note.length < 3) throw new Error("Add a short decision note.");

  const { data: profile, error: profileError } = await admin.from("placement_finance_profiles").select("exception_status").eq("workroom_id", workroomId).maybeSingle();
  if (profileError || !profile) throw new Error("Finance profile not found.");
  if (profile.exception_status !== "pending") throw new Error("There is no pending margin exception to review.");

  const { error } = await admin.from("placement_finance_profiles").update({
    exception_status: decision,
    exception_reviewed_by: user.id,
    exception_reviewed_at: new Date().toISOString(),
    exception_review_note: note
  }).eq("workroom_id", workroomId);
  if (error) throw error;
  revalidateFinance(workroomId);
}

export async function addFinanceAdjustmentAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();
  const workroomId = textField(formData, "workroom_id", 100);
  const adjustmentType = textField(formData, "adjustment_type", 50);
  const amount = numberField(formData, "amount");
  const reason = textField(formData, "reason");
  const currency = (textField(formData, "currency", 3) || "USD").toUpperCase();
  const paymentId = textField(formData, "payment_id", 100) || null;
  const effectiveDate = textField(formData, "effective_date", 20) || new Date().toISOString().slice(0, 10);
  if (!adjustmentTypes.has(adjustmentType)) throw new Error("Invalid adjustment type.");
  if (!(amount > 0)) throw new Error("Adjustment amount must be greater than zero.");
  if (reason.length < 3) throw new Error("Add a reason for the adjustment.");
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Use a 3-letter currency code.");

  const { error } = await admin.from("placement_finance_adjustments").insert({
    workroom_id: workroomId,
    payment_id: paymentId,
    adjustment_type: adjustmentType,
    amount,
    currency,
    effective_date: effectiveDate,
    reason,
    created_by: user.id
  });
  if (error) throw error;
  await admin.from("placement_finance_profiles").update({ reconciled_at: null, reconciled_by: null }).eq("workroom_id", workroomId);
  revalidateFinance(workroomId);
}

export async function markFinanceReconciledAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();
  const workroomId = textField(formData, "workroom_id", 100);
  const note = textField(formData, "reconciliation_note", 4000);
  const { error } = await admin.from("placement_finance_profiles").update({
    reconciled_at: new Date().toISOString(),
    reconciled_by: user.id,
    reconciliation_note: note || null
  }).eq("workroom_id", workroomId);
  if (error) throw error;
  revalidateFinance(workroomId);
}
