"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateLeadUpdate } from "@/lib/agency-pipeline";

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
  redirect(`/workspace/admin/leads?saved=1&lead=${id}#lead-${id}`);
}
