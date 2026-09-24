import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordProductEvent } from "@/lib/product-events";
import { verifyPaymongoWebhookSignature } from "@/lib/paymongo";

export const runtime = "nodejs";

type PaymongoResource = {
  id?: string;
  type?: string;
  attributes?: {
    reference_number?: string;
    external_reference_number?: string;
    payment_intent?: { data?: { id?: string } };
    payment_intent_id?: string;
    payment_id?: string;
    status?: string;
    disputed?: boolean;
    payments?: Array<{ id?: string; type?: string }>;
    refunds?: Array<{ id?: string; status?: string }>;
  };
};

type PaymongoEvent = {
  data?: {
    id?: string;
    attributes?: {
      type?: string;
      livemode?: boolean;
      data?: PaymongoResource;
    };
  };
};

function isUuid(value?: string | null) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

async function findPaymentForResource(admin: ReturnType<typeof createAdminClient>, resource: PaymongoResource) {
  const attrs = resource.attributes || {};
  const directId = attrs.reference_number || attrs.external_reference_number;
  if (isUuid(directId)) {
    const { data } = await admin.from("payments").select("id,status,client_id,description,amount_total").eq("id", directId).maybeSingle();
    if (data) return data;
  }

  const providerPaymentId = attrs.payment_id || (String(resource.id || "").startsWith("pay_") ? resource.id : null);
  if (providerPaymentId) {
    const { data } = await admin.from("payments").select("id,status,client_id,description,amount_total").eq("provider_payment_id", providerPaymentId).maybeSingle();
    if (data) return data;
  }

  const paymentIntentId = attrs.payment_intent_id || attrs.payment_intent?.data?.id;
  if (paymentIntentId) {
    const { data } = await admin.from("payments").select("id,status,client_id,description,amount_total").eq("provider_payment_intent", paymentIntentId).maybeSingle();
    if (data) return data;
  }

  return null;
}

async function notifyAdmins(admin: ReturnType<typeof createAdminClient>, title: string, body: string) {
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  if (!admins?.length) return;
  await admin.from("notifications").insert(admins.map((row) => ({
    user_id: row.id,
    title,
    body,
    href: "/workspace/admin/payments",
  })));
}

export async function POST(request: Request) {
  const signatureHeader = request.headers.get("paymongo-signature");
  const rawBody = await request.text();

  let event: PaymongoEvent;
  try {
    event = JSON.parse(rawBody) as PaymongoEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const live = Boolean(event.data?.attributes?.livemode);
  const verified = await verifyPaymongoWebhookSignature(rawBody, signatureHeader, live);
  if (!verified) return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });

  const eventId = String(event.data?.id || "");
  const eventType = String(event.data?.attributes?.type || "");
  const resource = event.data?.attributes?.data || {};
  if (!eventId || !eventType) return NextResponse.json({ received: true });

  const admin = createAdminClient();
  const providerObjectId = resource.id || null;
  const providerMetadata = {
    resource_type: resource.type || null,
    status: resource.attributes?.status || null,
    disputed: Boolean(resource.attributes?.disputed),
    payment_id: resource.attributes?.payment_id || null,
  };

  const { error: eventInsertError } = await admin.from("payment_provider_events").insert({
    provider: "paymongo",
    provider_event_id: eventId,
    event_type: eventType,
    livemode: live,
    provider_object_id: providerObjectId,
    metadata: providerMetadata,
  });
  if (eventInsertError && eventInsertError.code !== "23505") {
    return NextResponse.json({ error: "Could not record provider event" }, { status: 500 });
  }

  const { data: storedEvent } = await admin
    .from("payment_provider_events")
    .select("id,processed_at")
    .eq("provider", "paymongo")
    .eq("provider_event_id", eventId)
    .maybeSingle();
  if (storedEvent?.processed_at) return NextResponse.json({ received: true, duplicate: true });

  try {
    let payment = await findPaymentForResource(admin, resource);

    if (eventType === "checkout_session.payment.paid") {
      const attrs = resource.attributes || {};
      const paymentId = attrs.reference_number;
      if (isUuid(paymentId)) {
        const providerPaymentId = attrs.payments?.find((item) => String(item?.id || "").startsWith("pay_"))?.id || null;
        const providerPaymentIntent = attrs.payment_intent?.data?.id || null;
        const { data: paidRow, error } = await admin.rpc("mark_payment_paid_from_provider", {
          p_payment_id: paymentId,
          p_provider_session_id: resource.id || null,
          p_provider_payment_intent: providerPaymentIntent,
          p_provider_payment_id: providerPaymentId,
          p_provider_event_id: eventId,
        });
        if (error) throw error;
        payment = paidRow;

        if (paidRow?.client_id) {
          await recordProductEvent("payment_completed", {
            userId: paidRow.client_id,
            path: "/workspace/client/payments",
            metadata: { payment_id: paidRow.id, provider: "paymongo", amount_total: paidRow.amount_total },
          });
          try {
            const auth = await admin.auth.admin.getUserById(paidRow.client_id);
            const { sendTransactionalEventEmail } = await import("@/lib/email");
            await sendTransactionalEventEmail({
              to: auth.data.user?.email,
              subject: "Payment received",
              heading: "Payment successful",
              body: `We received your payment for ${paidRow.description || "your VirtualAssistant.com.ph invoice"}.`,
              href: `${process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"}/workspace/client/payments`,
              hrefLabel: "View payments",
              archive: false,
              idempotencyKey: `paymongo-paid-${eventId}`,
            });
          } catch {
            // Payment state is authoritative even if notification delivery fails.
          }
        }
      }
    } else if (eventType === "payment.paid" && payment && payment.status !== "paid") {
      const attrs = resource.attributes || {};
      const { data: paidRow, error } = await admin.rpc("mark_payment_paid_from_provider", {
        p_payment_id: payment.id,
        p_provider_session_id: null,
        p_provider_payment_intent: attrs.payment_intent_id || null,
        p_provider_payment_id: resource.id || attrs.payment_id || null,
        p_provider_event_id: eventId,
      });
      if (error) throw error;
      payment = paidRow;
    }

    if ((eventType === "payment.refunded" || eventType === "payment.refund.updated") && payment) {
      const refundId = String(
        resource.attributes?.refunds?.[0]?.id
        || (String(resource.id || "").startsWith("ref_") ? resource.id : "")
      ) || null;
      const refundStatus = String(resource.attributes?.status || resource.attributes?.refunds?.[0]?.status || "");
      if (eventType === "payment.refunded" || refundStatus === "succeeded" || refundStatus === "refunded") {
        const { data: refundedRow, error } = await admin.rpc("mark_payment_refunded_from_provider", {
          p_payment_id: payment.id,
          p_provider_event_id: eventId,
          p_provider_refund_id: refundId,
        });
        if (error) throw error;
        payment = refundedRow;
      }
    }

    if (resource.attributes?.disputed === true && payment && payment.status !== "provider_disputed" && payment.status !== "refunded") {
      const { data: disputedRow, error } = await admin.rpc("mark_payment_provider_disputed", {
        p_payment_id: payment.id,
        p_provider_event_id: eventId,
        p_reason: "PayMongo marked the payment as disputed.",
      });
      if (error) throw error;
      const disputedDescription = disputedRow?.description || payment.description || "a payment";
      payment = disputedRow || payment;
      await notifyAdmins(
        admin,
        "Provider payment dispute",
        `PayMongo marked "${disputedDescription}" as disputed. Payout/reconciliation requires review.`
      );
    }

    await admin.from("payment_provider_events").update({
      payment_id: payment?.id || null,
      processed_at: new Date().toISOString(),
      processing_error: null,
    }).eq("id", storedEvent?.id);
  } catch (error) {
    await admin.from("payment_provider_events").update({
      processing_error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
    }).eq("id", storedEvent?.id);
    return NextResponse.json({ error: "Provider event processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
