import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordProductEvent } from "@/lib/product-events";
import { verifyPaymongoWebhookSignature } from "@/lib/paymongo";
import {
  claimPaymongoEvent,
  completePaymongoEvent,
  paymentStateConflict,
  transitionPaymentState,
  type PaymentState,
} from "@/lib/payment-state";

export const runtime = "nodejs";

type ResourceAttributes = Record<string, any>;
type PaymongoResource = {
  id?: string;
  type?: string;
  attributes?: ResourceAttributes;
};

type PaymongoEvent = {
  data?: {
    id?: string;
    attributes?: {
      type?: string;
      livemode?: boolean;
      created_at?: number | string;
      data?: PaymongoResource;
    };
  };
};

type PaymentLookup = {
  id: string;
  status: PaymentState;
  client_id: string;
  description: string;
  amount_total: number | string;
  provider_payment_id: string | null;
  provider_refund_id: string | null;
  provider_dispute_id: string | null;
  provider_dispute_status: string | null;
  dispute_source: string | null;
};

function nestedId(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, any>;
  return String(record.id || record.data?.id || "").trim() || null;
}

function paymentIdFromAttributes(attrs: ResourceAttributes) {
  return (
    String(attrs.payment_id || "").trim() ||
    nestedId(attrs.payment) ||
    String(attrs.payment?.data?.id || "").trim() ||
    null
  );
}

function paymentIntentIdFromAttributes(attrs: ResourceAttributes) {
  return (
    String(attrs.payment_intent_id || "").trim() ||
    nestedId(attrs.payment_intent) ||
    null
  );
}

function checkoutPaymentId(attrs: ResourceAttributes) {
  const payments = Array.isArray(attrs.payments) ? attrs.payments : [];
  return (
    payments.map((item: any) => String(item?.id || item?.data?.id || "")).find((id: string) => id.startsWith("pay_")) ||
    null
  );
}

async function findPaymentForProviderResource(
  admin: ReturnType<typeof createAdminClient>,
  eventType: string,
  resource: PaymongoResource,
): Promise<PaymentLookup | null> {
  const attrs = resource.attributes || {};

  if (eventType === "checkout_session.payment.paid") {
    const reference = String(attrs.reference_number || "").trim();
    if (!reference) return null;
    const { data } = await admin
      .from("payments")
      .select("id,status,client_id,description,amount_total,provider_payment_id,provider_refund_id,provider_dispute_id,provider_dispute_status,dispute_source")
      .eq("id", reference)
      .maybeSingle();
    return (data as PaymentLookup | null) || null;
  }

  const providerPaymentId =
    resource.type === "payment" || String(resource.id || "").startsWith("pay_")
      ? String(resource.id || "")
      : paymentIdFromAttributes(attrs);
  const paymentIntentId = paymentIntentIdFromAttributes(attrs);
  const refundId = resource.type === "refund" || String(resource.id || "").startsWith("ref_")
    ? String(resource.id || "")
    : null;
  const disputeId = resource.type === "dispute" || String(resource.id || "").startsWith("dsp_")
    ? String(resource.id || "")
    : null;

  let query = admin
    .from("payments")
    .select("id,status,client_id,description,amount_total,provider_payment_id,provider_refund_id,provider_dispute_id,provider_dispute_status,dispute_source");

  if (providerPaymentId) query = query.eq("provider_payment_id", providerPaymentId);
  else if (paymentIntentId) query = query.eq("provider_payment_intent", paymentIntentId);
  else if (refundId) query = query.eq("provider_refund_id", refundId);
  else if (disputeId) query = query.eq("provider_dispute_id", disputeId);
  else return null;

  const { data } = await query.maybeSingle();
  return (data as PaymentLookup | null) || null;
}

async function transitionProviderEvent(
  admin: ReturnType<typeof createAdminClient>,
  payment: PaymentLookup,
  to: PaymentState,
  eventId: string,
  resourceId: string | null,
  context: Record<string, unknown>,
) {
  return transitionPaymentState<PaymentLookup>(admin, {
    paymentId: payment.id,
    expectedStatus: payment.status,
    newStatus: to,
    source: "paymongo_webhook",
    externalRef: resourceId || eventId,
    context: {
      ...context,
      provider: "paymongo",
      provider_last_event_id: eventId,
      provider_last_event_at: new Date().toISOString(),
    },
  });
}

async function sendPaymentReceived(payment: PaymentLookup) {
  try {
    const admin = createAdminClient();
    const auth = await admin.auth.admin.getUserById(payment.client_id);
    const { sendTransactionalEventEmail } = await import("@/lib/email");
    await sendTransactionalEventEmail({
      to: auth.data.user?.email,
      subject: "Payment received",
      heading: "Payment successful",
      body: `We received your payment for ${payment.description || "your VirtualAssistant.com.ph invoice"}.`,
      href: `${process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"}/workspace/client/payments`,
      hrefLabel: "View payments",
      archive: false,
      idempotencyKey: `payment-received-${payment.id}`,
    });
  } catch {
    // Ledger reconciliation remains authoritative even if email delivery fails.
  }
}

export async function POST(request: Request) {
  const signatureHeader = request.headers.get("paymongo-signature");
  const rawBody = await request.text();

  let parsed: PaymongoEvent;
  try {
    parsed = JSON.parse(rawBody) as PaymongoEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const live = Boolean(parsed.data?.attributes?.livemode);
  const verified = await verifyPaymongoWebhookSignature(rawBody, signatureHeader, live);
  if (!verified) {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  const eventId = String(parsed.data?.id || "").trim();
  const eventType = String(parsed.data?.attributes?.type || "").trim();
  const resource = parsed.data?.attributes?.data || {};
  const resourceId = String(resource.id || "").trim() || null;
  if (!eventId || !eventType) {
    return NextResponse.json({ error: "Malformed event" }, { status: 400 });
  }

  const admin = createAdminClient();
  const claim = await claimPaymongoEvent(admin, { eventId, eventType, resourceId });
  if (claim === "processed" || claim === "in_progress") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  let payment: PaymentLookup | null = null;
  try {
    payment = await findPaymentForProviderResource(admin, eventType, resource);
    const attrs = resource.attributes || {};

    if (eventType === "checkout_session.payment.paid") {
      if (!payment) {
        await completePaymongoEvent(admin, { eventId, resourceId, status: "orphan" });
        return NextResponse.json({ received: true, reconciled: false });
      }

      const providerPaymentId = checkoutPaymentId(attrs);
      const providerPaymentIntent = paymentIntentIdFromAttributes(attrs);
      if (payment.status === "checkout_pending") {
        const transitioned = await transitionProviderEvent(
          admin,
          payment,
          "paid",
          eventId,
          resourceId,
          {
            paid_at: new Date().toISOString(),
            provider_session_id: resourceId,
            provider_payment_intent: providerPaymentIntent,
            provider_payment_id: providerPaymentId,
          },
        );
        await recordProductEvent("payment_completed", {
          userId: transitioned.client_id,
          path: "/workspace/client/payments",
          metadata: {
            payment_id: transitioned.id,
            provider: "paymongo",
            amount_total: transitioned.amount_total,
          },
        });
        await sendPaymentReceived(transitioned);
      } else if (payment.status === "paid") {
        await transitionProviderEvent(admin, payment, "paid", eventId, resourceId, {
          provider_session_id: resourceId,
          provider_payment_intent: providerPaymentIntent,
          provider_payment_id: providerPaymentId,
        });
      }
    } else if (eventType === "payment.paid") {
      if (payment) {
        await transitionProviderEvent(admin, payment, payment.status, eventId, resourceId, {
          provider_payment_id: resourceId,
          provider_payment_intent: paymentIntentIdFromAttributes(attrs),
        });
      }
    } else if (eventType === "payment.failed") {
      if (payment) {
        // A failed Payment can be one attempt inside a hosted checkout. Keep the
        // invoice retryable and record the provider event instead of treating
        // the whole invoice as terminally failed.
        await transitionProviderEvent(admin, payment, payment.status, eventId, resourceId, {
          provider_payment_id: resourceId || payment.provider_payment_id,
        });
      }
    } else if (
      eventType === "refund.succeeded" ||
      eventType === "payment.refunded" ||
      eventType === "payment.refund.updated"
    ) {
      if (!payment) {
        await completePaymongoEvent(admin, { eventId, resourceId, status: "orphan" });
        return NextResponse.json({ received: true, reconciled: false });
      }
      const refundStatus = String(attrs.status || (eventType === "payment.refunded" ? "succeeded" : "")).trim();
      const refundId = String(resource.id || payment.provider_refund_id || "").trim() || null;
      const refundContext = {
        provider_refund_id: refundId,
        provider_refund_status: refundStatus || eventType,
      };

      if (refundStatus === "failed" && payment.status === "refund_pending") {
        await transitionProviderEvent(admin, payment, "disputed", eventId, resourceId, {
          ...refundContext,
          dispute_resolution: "PayMongo reported that the refund failed; manual review is required.",
        });
      } else if (refundStatus === "succeeded" || eventType === "payment.refunded" || eventType === "refund.succeeded") {
        if (payment.status === "released") {
          await transitionProviderEvent(admin, payment, "chargeback", eventId, resourceId, {
            ...refundContext,
            dispute_resolution: "Client funds were refunded after VA payout had already been released.",
          });
        } else if (["refund_pending", "disputed", "paid"].includes(payment.status)) {
          await transitionProviderEvent(admin, payment, "refunded", eventId, resourceId, {
            ...refundContext,
            dispute_resolution: "PayMongo confirmed the client refund.",
            dispute_resolved_at: new Date().toISOString(),
          });
        } else {
          await transitionProviderEvent(admin, payment, payment.status, eventId, resourceId, refundContext);
        }
      } else {
        await transitionProviderEvent(admin, payment, payment.status, eventId, resourceId, refundContext);
      }
    } else if (eventType === "dispute.created") {
      if (!payment) {
        await completePaymongoEvent(admin, { eventId, resourceId, status: "orphan" });
        return NextResponse.json({ received: true, reconciled: false });
      }

      const existingSource = payment.dispute_source;
      const disputeSource =
        payment.status === "disputed" && existingSource === "client"
          ? "client_and_provider"
          : existingSource || "provider";
      const context = {
        provider_dispute_id: resourceId,
        provider_dispute_status: String(attrs.status || "under_review"),
        provider_dispute_reason: String(attrs.reason || ""),
        provider_disputed_at: new Date().toISOString(),
        dispute_source: disputeSource,
        dispute_reason:
          payment.status === "disputed"
            ? undefined
            : `PayMongo dispute: ${String(attrs.reason || "provider review")}`,
      };

      if (payment.status === "paid" || payment.status === "release_pending") {
        await transitionProviderEvent(admin, payment, "disputed", eventId, resourceId, context);
      } else {
        await transitionProviderEvent(admin, payment, payment.status, eventId, resourceId, context);
      }
    } else if (eventType === "dispute.resolved") {
      if (!payment) {
        await completePaymongoEvent(admin, { eventId, resourceId, status: "orphan" });
        return NextResponse.json({ received: true, reconciled: false });
      }

      const resolution = String(attrs.status || "").toLowerCase();
      const context = {
        provider_dispute_id: resourceId,
        provider_dispute_status: resolution,
        provider_dispute_reason: String(attrs.reason || payment.provider_dispute_status || ""),
      };

      if (["lost", "closed_lost"].includes(resolution)) {
        if (["paid", "disputed", "release_pending", "released", "refund_pending"].includes(payment.status)) {
          await transitionProviderEvent(admin, payment, "chargeback", eventId, resourceId, {
            ...context,
            dispute_source: "provider",
            dispute_resolution: "PayMongo resolved the provider dispute against the platform.",
            dispute_resolved_at: new Date().toISOString(),
          });
        } else {
          await transitionProviderEvent(admin, payment, payment.status, eventId, resourceId, context);
        }
      } else if (["won", "closed_won"].includes(resolution)) {
        if (payment.status === "disputed" && payment.dispute_source === "provider") {
          await transitionProviderEvent(admin, payment, "paid", eventId, resourceId, {
            ...context,
            dispute_source: "",
            dispute_resolution: "PayMongo resolved the provider dispute in the platform's favor.",
            dispute_resolved_at: new Date().toISOString(),
          });
        } else if (payment.status === "disputed" && payment.dispute_source === "client_and_provider") {
          await transitionProviderEvent(admin, payment, "disputed", eventId, resourceId, {
            ...context,
            dispute_source: "client",
          });
        } else {
          await transitionProviderEvent(admin, payment, payment.status, eventId, resourceId, context);
        }
      } else {
        await transitionProviderEvent(admin, payment, payment.status, eventId, resourceId, context);
      }
    } else {
      await completePaymongoEvent(admin, {
        eventId,
        paymentId: payment?.id || null,
        resourceId,
        status: "ignored",
      });
      return NextResponse.json({ received: true, ignored: true });
    }

    await completePaymongoEvent(admin, {
      eventId,
      paymentId: payment?.id || null,
      resourceId,
      status: payment ? "processed" : "orphan",
    });
    return NextResponse.json({ received: true, reconciled: Boolean(payment) });
  } catch (error) {
    // State conflicts usually mean another webhook/admin action already moved
    // the ledger. Re-read once and treat an already-terminal reconciliation as
    // success; otherwise return 500 so PayMongo retries this unique event.
    if (paymentStateConflict(error)) {
      const { data: latest } = payment?.id
        ? await admin.from("payments").select("status").eq("id", payment.id).maybeSingle()
        : { data: null };
      if (latest && ["paid", "refunded", "chargeback", "released", "disputed"].includes(String(latest.status))) {
        await completePaymongoEvent(admin, {
          eventId,
          paymentId: payment?.id || null,
          resourceId,
          status: "processed",
        });
        return NextResponse.json({ received: true, reconciled: true, concurrent: true });
      }
    }

    try {
      await completePaymongoEvent(admin, {
        eventId,
        paymentId: payment?.id || null,
        resourceId,
        status: "error",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    } catch {
      // Preserve the provider retry signal even if observability persistence fails.
    }
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
