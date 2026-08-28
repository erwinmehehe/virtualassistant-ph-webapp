import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function writeRecruiterActivity(args: {
  subjectType: "va" | "job" | "lead" | "application";
  subjectId: string;
  action: string;
  description?: string | null;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await createAdminClient().from("recruiter_activity").insert({
      subject_type: args.subjectType,
      subject_id: args.subjectId,
      action: args.action,
      description: args.description || null,
      actor_id: args.actorId || null,
      metadata: args.metadata || {}
    });
  } catch (error) {
    console.error("[recruiter-activity] unable to write event", error);
  }
}
