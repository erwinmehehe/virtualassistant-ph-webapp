"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLeadStage, validateLeadUpdate } from "@/lib/agency-pipeline";

import { followUpView, leadQueueHref } from "@/lib/lead-follow-ups";

export async function updateLeadPipelineAction(form: FormData) {
  await requireRole("admin");
  let value: ReturnType<typeof validateLeadUpdate>;
  try { value = validateLeadUpdate(form); }
  catch (error) { redirect(`/workspace/admin/leads?error=${encodeURIComponent((error as Error).message)}`); }
  const { id, ...patch } = value;
  const { data, error } = await createAdminClient().from("lead_intake")
    .update(patch).eq("id", id).select("id").maybeSingle();
  if (error || !data) redirect("/workspace/admin/leads?error=Could%20not%20save%20this%20lead.%20Please%20try%20again.");
  revalidatePath("/workspace/admin");
  revalidatePath("/workspace/admin/leads");
  const stage=String(form.get("return_stage")||"");
  const follow=followUpView(String(form.get("return_follow")||""));
  const href=leadQueueHref(isLeadStage(stage)?stage:"",follow);
  redirect(`${href}${href.includes("?")?"&":"?"}saved=1`);
}
