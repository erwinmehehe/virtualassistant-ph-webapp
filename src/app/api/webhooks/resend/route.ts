import { Webhook } from "svix";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

type ResendEvent = {
  type?: string;
  data?: {
    email_id?: string;
    to?: string[];
    from?: string;
    subject?: string;
    message_id?: string;
  };
};

const statuses: Record<string, "delivered" | "bounced" | "complained" | "suppressed"> = {
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.suppressed": "suppressed",
};

function bareEmailAddress(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return (raw.match(/<([^<>]+)>$/)?.[1]?.trim() || raw).toLowerCase();
}

type ReplyTarget = { type: "lead" | "job"; id: string };

type ReplyAttribution = {
  subjectType: "lead" | "job";
  subjectId: string;
  actorId: string | null;
  ownerId: string | null;
  jobId: string | null;
  mode: "reply_address" | "sender_fallback";
};

const REPLY_CONTEXT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function replyTargetFromRecipients(values: string[] | undefined): ReplyTarget | null {
  for (const raw of values || []) {
    const address = bareEmailAddress(raw);
    const localPart = address.split("@")[0] || "";
    const match = localPart.match(/^(lead|job)-(.+)$/i);
    if (!match) continue;
    const id = String(match[2] || "").toLowerCase();
    if (REPLY_CONTEXT_ID_RE.test(id)) {
      return { type: match[1].toLowerCase() as "lead" | "job", id };
    }
  }
  return null;
}

async function findLatestLeadBySender(admin: ReturnType<typeof createAdminClient>, sender: string) {
  const exact = await admin
    .from("lead_intake")
    .select("id,client_id,owner_id,email,job_id")
    .eq("email", sender)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (exact.error) throw exact.error;
  if (exact.data?.id) return exact.data;

  const escaped = sender.replace(/([%_\\])/g, "\\$1");
  const insensitive = await admin
    .from("lead_intake")
    .select("id,client_id,owner_id,email,job_id")
    .ilike("email", escaped)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (insensitive.error) throw insensitive.error;
  return insensitive.data || null;
}

async function findExactReplyAttribution(
  admin: ReturnType<typeof createAdminClient>,
  target: ReplyTarget,
  sender: string,
): Promise<ReplyAttribution | null> {
  if (target.type === "lead") {
    const { data: lead, error } = await admin
      .from("lead_intake")
      .select("id,client_id,owner_id,email,job_id")
      .eq("id", target.id)
      .maybeSingle();
    if (error) throw error;
    if (!lead?.id || bareEmailAddress(lead.email) !== sender) return null;
    return {
      subjectType: "lead",
      subjectId: lead.id,
      actorId: lead.client_id || null,
      ownerId: lead.owner_id || null,
      jobId: lead.job_id || null,
      mode: "reply_address",
    };
  }

  const escaped = sender.replace(/([%_\\])/g, "\\$1");
  const { data: linkedLead, error: leadError } = await admin
    .from("lead_intake")
    .select("id,client_id,owner_id,email,job_id")
    .eq("job_id", target.id)
    .ilike("email", escaped)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (leadError) throw leadError;
  if (linkedLead?.id) {
    return {
      subjectType: "lead",
      subjectId: linkedLead.id,
      actorId: linkedLead.client_id || null,
      ownerId: linkedLead.owner_id || null,
      jobId: target.id,
      mode: "reply_address",
    };
  }

  const { data: job, error: jobError } = await admin
    .from("jobs")
    .select("id,client_id")
    .eq("id", target.id)
    .maybeSingle();
  if (jobError) throw jobError;
  if (!job?.id || !job.client_id) return null;

  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(job.client_id);
  if (authError) throw authError;
  if (bareEmailAddress(authUser.user?.email) !== sender) return null;

  return {
    subjectType: "job",
    subjectId: job.id,
    actorId: job.client_id,
    ownerId: null,
    jobId: job.id,
    mode: "reply_address",
  };
}

async function recordInboundClientReply(
  admin: ReturnType<typeof createAdminClient>,
  event: ResendEvent,
  providerId: string,
) {
  const sender = bareEmailAddress(event.data?.from);
  if (!sender || !sender.includes("@")) return;

  const target = replyTargetFromRecipients(event.data?.to);
  let attribution = target ? await findExactReplyAttribution(admin, target, sender) : null;

  // A tagged reply address is authoritative. If the sender does not match that
  // lead/job, do not fall back to another lead with the same email and risk
  // attaching the reply to the wrong hiring request.
  if (target && !attribution) return;

  if (!attribution) {
    const lead = await findLatestLeadBySender(admin, sender);
    if (!lead?.id) return;
    attribution = {
      subjectType: "lead",
      subjectId: lead.id,
      actorId: lead.client_id || null,
      ownerId: lead.owner_id || null,
      jobId: lead.job_id || null,
      mode: "sender_fallback",
    };
  }

  const { data: duplicate, error: duplicateError } = await admin
    .from("recruiter_activity")
    .select("id")
    .eq("action", "client_contact_email")
    .contains("metadata", { source: "resend_inbound", provider_id: providerId })
    .limit(1)
    .maybeSingle();
  if (duplicateError) throw duplicateError;
  if (duplicate?.id) return;

  const subject = String(event.data?.subject || "").trim().slice(0, 240);
  const { error } = await admin.from("recruiter_activity").insert({
    subject_type: attribution.subjectType,
    subject_id: attribution.subjectId,
    action: "client_contact_email",
    description: subject ? `Inbound email reply: ${subject}` : "Inbound email reply",
    actor_id: attribution.actorId,
    metadata: {
      source: "resend_inbound",
      provider_id: providerId,
      message_id: event.data?.message_id || null,
      subject,
      sender,
      recipient: event.data?.to?.[0] || null,
      attribution: attribution.mode,
      job_id: attribution.jobId,
      reply_target_type: target?.type || null,
      reply_target_id: target?.id || null,
    },
  });
  if (error) throw error;

  if (attribution.ownerId) {
    await admin.from("notifications").insert({
      user_id: attribution.ownerId,
      title: "Client replied · action needed",
      body: subject || "A client replied to a hiring email and needs recruiter follow-up.",
      href: attribution.subjectType === "lead"
        ? `/workspace/recruiter/crm/${attribution.subjectId}`
        : `/workspace/recruiter/roles/${attribution.subjectId}`,
      type: "client",
      priority: "high",
    });
  }

  revalidatePath("/workspace/recruiter/crm");
  revalidatePath("/workspace/recruiter/today");
  if (attribution.subjectType === "lead") {
    revalidatePath(`/workspace/recruiter/crm/${attribution.subjectId}`);
  }
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) return Response.json({ error: "Webhook not configured" }, { status: 503 });

  const payload = await request.text();
  let event: ResendEvent;
  try {
    event = new Webhook(secret).verify(payload, {
      "svix-id": request.headers.get("svix-id") || "",
      "svix-timestamp": request.headers.get("svix-timestamp") || "",
      "svix-signature": request.headers.get("svix-signature") || "",
    }) as ResendEvent;
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const providerId = event.data?.email_id;
  if (event.type === "email.received" && providerId) {
    const admin = createAdminClient();
    await recordInboundClientReply(admin, event, providerId);
    return Response.json({ received: true });
  }

  const status = event.type ? statuses[event.type] : null;
  if (!status || !providerId) return Response.json({ received: true });

  const admin = createAdminClient();
  const recipientCount = (event.data?.to || []).filter(Boolean).length;
  const { data: existing } = await admin.from("outbound_email_events").select("id").eq("provider_id", providerId).maybeSingle();

  if (["bounced", "complained", "suppressed"].includes(status)) {
    for (const raw of event.data?.to || []) {
      const email = String(raw || "").trim().toLowerCase();
      if (email) await admin.from("email_suppressions").upsert({ email, reason: status, provider_id: providerId, suppressed_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "email" });
    }
  }

  if (existing?.id) {
    // Preserve the app-recorded To + CC + BCC recipient_count. Resend delivery
    // webhooks expose the visible To list, which can be smaller than quota usage.
    await admin.from("outbound_email_events").update({ status }).eq("id", existing.id);
  } else {
    await admin.from("outbound_email_events").insert({
      event_type: event.type,
      automation: event.type,
      recipient: event.data?.to?.join(",") || null,
      recipient_count: recipientCount,
      status,
      provider_id: providerId,
    });
  }

  return Response.json({ received: true });
}
