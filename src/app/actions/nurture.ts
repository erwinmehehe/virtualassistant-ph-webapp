"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function unsubscribeLeadNurtureAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  if (!UUID_RE.test(token)) redirect("/email/unsubscribe/invalid");

  const admin = createAdminClient();
  const { data: state, error: lookupError } = await admin
    .from("lead_nurture_state")
    .select("lead_id,status")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (lookupError || !state) redirect("/email/unsubscribe/invalid");

  if (state.status !== "unsubscribed") {
    const { error } = await admin
      .from("lead_nurture_state")
      .update({
        status: "unsubscribed",
        next_send_at: null,
        paused_reason: "recipient_unsubscribed",
        updated_at: new Date().toISOString(),
      })
      .eq("unsubscribe_token", token);
    if (error) throw error;

    try {
      await admin.from("recruiter_activity").insert({
        subject_type: "lead",
        subject_id: state.lead_id,
        action: "nurture_unsubscribed",
        description: "Client unsubscribed from automated hiring nurture emails.",
        actor_id: null,
        metadata: { channel: "email" },
      });
    } catch {}
  }

  revalidatePath(`/email/unsubscribe/${token}`);
  redirect(`/email/unsubscribe/${token}?done=1`);
}
