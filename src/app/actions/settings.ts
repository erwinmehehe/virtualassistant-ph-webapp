"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateMarketplaceSettingsAction(formData: FormData){
  await requireRole("admin");
  const placementFee=Math.max(0,Number(formData.get("default_placement_fee")??0));
  const markup=Math.max(0,Math.min(100,Number(formData.get("default_managed_markup_percent")??0)));
  const admin=createAdminClient();
  await admin.from("admin_settings").update({default_placement_fee:placementFee,default_managed_markup_percent:markup}).eq("id",1);
  revalidatePath("/workspace/admin/settings");
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
