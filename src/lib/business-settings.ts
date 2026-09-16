import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_HOURLY_RATE } from "@/lib/constants";

// Agency Operations v2 release marker: production schema verified on 2026-09-15.
export type BusinessSettings = {
  minHourlyRate: number;
  placementFee: number;
  managedMarkupPercent: number;
  clientSuccessOwnerId: string | null;
  financeMinMarginPercent: number;
  financeTargetMarginPercent: number;
  financeDefaultPaymentCostPercent: number;
  financeDefaultOpsCostMonthly: number;
  financeInvoiceOverdueDays: number;
};

const fallback: BusinessSettings = {
  minHourlyRate: MIN_HOURLY_RATE,
  placementFee: 350,
  managedMarkupPercent: 0,
  clientSuccessOwnerId: null,
  financeMinMarginPercent: 15,
  financeTargetMarginPercent: 25,
  financeDefaultPaymentCostPercent: 3,
  financeDefaultOpsCostMonthly: 0,
  financeInvoiceOverdueDays: 7,
};

export async function getBusinessSettings(): Promise<BusinessSettings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return fallback;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("admin_settings")
      .select("min_hourly_rate,default_placement_fee,default_managed_markup_percent,client_success_owner_id,finance_min_margin_percent,finance_target_margin_percent,finance_default_payment_cost_percent,finance_default_ops_cost_monthly,finance_invoice_overdue_days")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return fallback;
    return {
      minHourlyRate: Number(data.min_hourly_rate ?? fallback.minHourlyRate),
      placementFee: Number(data.default_placement_fee ?? fallback.placementFee),
      managedMarkupPercent: Number(data.default_managed_markup_percent ?? 0),
      clientSuccessOwnerId: data.client_success_owner_id || null,
      financeMinMarginPercent: Number(data.finance_min_margin_percent ?? fallback.financeMinMarginPercent),
      financeTargetMarginPercent: Number(data.finance_target_margin_percent ?? fallback.financeTargetMarginPercent),
      financeDefaultPaymentCostPercent: Number(data.finance_default_payment_cost_percent ?? fallback.financeDefaultPaymentCostPercent),
      financeDefaultOpsCostMonthly: Number(data.finance_default_ops_cost_monthly ?? fallback.financeDefaultOpsCostMonthly),
      financeInvoiceOverdueDays: Number(data.finance_invoice_overdue_days ?? fallback.financeInvoiceOverdueDays),
    };
  } catch {
    return fallback;
  }
}
