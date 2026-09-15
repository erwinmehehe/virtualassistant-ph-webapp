import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_HOURLY_RATE } from "@/lib/constants";

export type BusinessSettings = {
  minHourlyRate: number;
  placementFee: number;
  managedMarkupPercent: number;
  clientSuccessOwnerId: string | null;
};

const fallback: BusinessSettings = {
  minHourlyRate: MIN_HOURLY_RATE,
  placementFee: 0,
  managedMarkupPercent: 0,
  clientSuccessOwnerId: null,
};

export async function getBusinessSettings(): Promise<BusinessSettings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return fallback;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("admin_settings")
      .select("min_hourly_rate,default_placement_fee,default_managed_markup_percent,client_success_owner_id")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return fallback;
    return {
      minHourlyRate: Number(data.min_hourly_rate ?? fallback.minHourlyRate),
      placementFee: Number(data.default_placement_fee ?? 0),
      managedMarkupPercent: Number(data.default_managed_markup_percent ?? 0),
      clientSuccessOwnerId: data.client_success_owner_id || null,
    };
  } catch {
    return fallback;
  }
}
