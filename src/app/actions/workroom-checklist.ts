"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function toggleOwnedChecklistAction(formData:FormData){
  const {user,profile}=await getSessionProfile();
  if(!user||!profile||!["client","va"].includes(profile.role))throw new Error("Not authorized.");
  const id=String(formData.get("checklist_id")||"");
  const done=String(formData.get("done"))==="1";
  const admin=createAdminClient();
  const {data:item,error}=await admin.from("workroom_checklist").select("id,workroom_id,owner_role,workrooms!inner(client_id,va_id)").eq("id",id).maybeSingle();
  if(error||!item)throw new Error("Checklist item not found.");
  const room:any=Array.isArray((item as any).workrooms)?(item as any).workrooms[0]:(item as any).workrooms;
  const participant=profile.role==="client"?room?.client_id===user.id:room?.va_id===user.id;
  if(!participant)throw new Error("You are not part of this placement.");
  if(item.owner_role!==profile.role)throw new Error(`This onboarding item belongs to the ${item.owner_role}.`);
  const {error:updateError}=await admin.from("workroom_checklist").update({completed_at:done?null:new Date().toISOString(),completed_by:done?null:user.id}).eq("id",id);
  if(updateError)throw updateError;
  revalidatePath("/workspace/client/workroom");
  revalidatePath("/workspace/va/workroom");
}
