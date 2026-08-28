import { createAdminClient } from "@/lib/supabase/admin";

export async function writeAdminAudit(args: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit_log").insert({
      actor_id: args.actorId,
      action: args.action,
      target_type: args.targetType,
      target_id: args.targetId || null,
      metadata: args.metadata || {}
    });
  } catch (error) {
    console.error("[audit] Unable to write admin audit event", error);
  }
}
