"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updatePublicCompanyVisibilityAction(formData: FormData){
  const {user}=await requireRole("client");
  const visible=formData.get("public_company_visible")==="on";
  const admin=createAdminClient();
  const {error}=await admin.from("client_profiles").update({
    public_company_visible:visible,
    public_company_visible_at:visible?new Date().toISOString():null,
    updated_at:new Date().toISOString()
  }).eq("user_id",user.id);
  if(error) throw error;
  revalidatePath("/workspace/client/company");
  revalidatePath("/jobs");
  redirect(`/workspace/client/company?visibility=${visible?"public":"private"}`);
}
