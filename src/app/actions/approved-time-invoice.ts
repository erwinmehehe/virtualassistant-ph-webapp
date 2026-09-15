"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createApprovedTimeInvoiceAction(formData:FormData){
  const {user}=await requireRole("admin");
  const workroomId=String(formData.get("workroom_id")||"");
  const description=String(formData.get("description")||"").trim().slice(0,300);
  if(!workroomId)throw new Error("Choose an active workroom.");
  const admin=createAdminClient();
  const {data,error}=await admin.rpc("create_approved_time_invoice",{
    p_workroom_id:workroomId,
    p_description:description||"Approved VA time",
    p_created_by:user.id
  });
  if(error)throw error;
  revalidatePath("/workspace/admin/payments");
  revalidatePath("/workspace/client/payments");
  revalidatePath("/workspace/va/payments");
  redirect(`/workspace/admin/payments?time_invoice=${encodeURIComponent(String(data||"created"))}`);
}
