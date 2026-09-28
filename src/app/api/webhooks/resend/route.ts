import { Webhook } from "svix";
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

async function findLatestLeadBySender(admin: ReturnType<typeof createAdminClient>, sender: string) {
  const exact = await admin
    .from("lead_intake")
    .select("id,client_id,owner_id,email")
    .eq("email", sender)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (exact.error) throw exact.error;
  if (exact.data?.id) return exact.data;

  const escaped = sender.replace(/([%_\\])/g, "\\$1");
  const insensitive = await admin
    .from("lead_intake")
    .select("id,client_id,owner_id,email")
    .ilike("email", escaped)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (insensitive.error) throw insensitive.error;
  return insensitive.data || null;
}

async function recordInboundClientReply(
  admin: ReturnType<typeof createAdminClient>,
  event: ResendEvent,
  providerId: string,
) {
  const sender = bareEmailAddress(event.data?.from);
  if (!sender || !sender.includes("@")) return;

  const lead = await findLatestLeadBySender(admin, sender);
  if (!lead?.id) return;

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
    subject_type: "lead",
    subject_id: lead.id,
    action: "client_contact_email",
    description: subject ? `Inbound email reply: ${subject}` : "Inbound email reply",
    actor_id: lead.client_id || null,
    metadata: {
      source: "resend_inbound",
      provider_id: providerId,
      message_id: event.data?.message_id || null,
      subject,
      sender,
      recipient: event.data?.to?.[0] || null,
    },
  });
  if (error) throw error;

  if (lead.owner_id) {
    await admin.from("notifications").insert({
      user_id: lead.owner_id,
      title: "Client replied by email",
      body: subject || "A client replied to a hiring email.",
      href: `/workspace/recruiter/crm/${lead.id}`,
      type: "client",
      priority: "normal",
    });
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
