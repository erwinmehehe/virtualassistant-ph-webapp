import { Webhook } from "svix";
import { createAdminClient } from "@/lib/supabase/admin";

type ResendEvent = {
  type?: string;
  data?: { email_id?: string; to?: string[] };
};

const statuses: Record<string, "delivered" | "bounced" | "complained" | "suppressed"> = {
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.suppressed": "suppressed",
};

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
  const status = event.type ? statuses[event.type] : null;
  const providerId = event.data?.email_id;
  if (!status || !providerId) return Response.json({ received: true });
  const admin = createAdminClient();
  const { data: existing } = await admin.from("outbound_email_events").select("id").eq("provider_id", providerId).maybeSingle();
  if (existing?.id) {
    await admin.from("outbound_email_events").update({ status }).eq("id", existing.id);
  } else {
    await admin.from("outbound_email_events").insert({ event_type: event.type, recipient: event.data?.to?.join(",") || null, status, provider_id: providerId });
  }
  return Response.json({ received: true });
}
