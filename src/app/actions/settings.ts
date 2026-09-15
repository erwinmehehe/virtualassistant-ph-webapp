"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateMarketplaceSettingsAction(formData: FormData){
  await requireRole("admin");
  const minHourlyRate=Math.max(0,Number(formData.get("min_hourly_rate")??5));
  const placementFee=Math.max(0,Number(formData.get("default_placement_fee")??0));
  const markup=Math.max(0,Math.min(100,Number(formData.get("default_managed_markup_percent")??0)));
  const clientSuccessOwnerId=String(formData.get("client_success_owner_id")??"").trim()||null;
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
    updated_at:new Date().toISOString()
  }).eq("id",1);
  if(error) throw error;
  revalidatePath("/workspace/admin/settings");
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
