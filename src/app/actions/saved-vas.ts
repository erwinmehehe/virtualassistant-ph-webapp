"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function toggleSavedVaAction(formData: FormData) {
  const { user } = await requireRole("client");
  const vaId = String(formData.get("va_id") || "");
  const returnTo = String(formData.get("return_to") || "/workspace/client/saved");
  if (!vaId) throw new Error("VA profile not found.");
  const supabase = await createClient();
  const { data: existing } = await supabase.from("saved_vas").select("va_id").eq("client_id",user.id).eq("va_id",vaId).maybeSingle();
  if (existing) await supabase.from("saved_vas").delete().eq("client_id",user.id).eq("va_id",vaId);
  else await supabase.from("saved_vas").insert({client_id:user.id,va_id:vaId});
  revalidatePath("/workspace/client/saved");
  revalidatePath("/find-talent");
  if (returnTo.startsWith("/") && !returnTo.startsWith("//")) redirect(`${returnTo}${returnTo.includes("?")?"&":"?"}saved=${existing?"0":"1"}`);
}
