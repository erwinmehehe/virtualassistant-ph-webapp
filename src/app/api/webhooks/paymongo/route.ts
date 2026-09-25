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
    payment?: { id?: string; data?: { id?: string } };
    status?: string;
    reason?: string;
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

type PaymentRow = {
  id: string;
  status: string;
  client_id: string;
  description: string | null;
  amount_total: number | string;
  released_at?: string | null;
  provider_dispute_id?: string | null;
  provider_dispute_status?: string | null;
};

const PAYMENT_SELECT =
  "id,status,client_id,description,amount_total,released_at,provider_dispute_id,provider_dispute_status";

function isUuid(value?: string | null) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

function nestedPaymentId(resource: PaymongoResource) {
  const attrs = resource.attributes || {};
  return (
    attrs.payment_id ||
    attrs.payment?.id ||
    attrs.payment?.data?.id ||
    null
  );
}

async function findPaymentForResource(
  admin: ReturnType<typeof createAdminClient>,
  resource: PaymongoResource,
): Promise<PaymentRow | null> {
  const attrs = resource.attributes || {};
  const directId = attrs.reference_number || attrs.external_reference_number;
  if (isUuid(directId)) {
    const { data } = await admin
      .from("payments")
      .select(PAYMENT_SELECT)
      .eq("id", directId)
      .maybeSingle();
    if (data) return data as PaymentRow;
  }

  const resourceId = String(resource.id || "");
  const providerPaymentId =
    nestedPaymentId(resource) || (resourceId.startsWith("pay_") ? resourceId : null);
  if (providerPaymentId) {
    const { data } = await admin
      .from("payments")
      .select(PAYMENT_SELECT)
      .eq("provider_payment_id", providerPaymentId)
      .maybeSingle();
    if (data) return data as PaymentRow;
  }

  if (resourceId.startsWith("ref_")) {
    const { data } = await admin
      .from("payments")
      .select(PAYMENT_SELECT)
      .eq("provider_refund_id", resourceId)
      .maybeSingle();
    if (data) return data as PaymentRow;
  }

  if (resourceId.startsWith("dsp_")) {
    const { data } = await admin
      .from("payments")
      .select(PAYMENT_SELECT)
      .eq("provider_dispute_id", resourceId)
      .maybeSingle();
    if (data) return data as PaymentRow;
  }

  const paymentIntentId = attrs.payment_intent_id || attrs.payment_intent?.data?.id;
  if (paymentIntentId) {
    const { data } = await admin
      .from("payments")
      .select(PAYMENT_SELECT)
      .eq("provider_payment_intent", paymentIntentId)
      .maybeSingle();
    if (data) return data as PaymentRow;
  }

  return null;
}

async function notifyAdmins(
  admin: ReturnType<typeof createAdminClient>,
  title: string,
  body: string,
) {
  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("account_status", "active");
  if (!admins?.length) return;

  await admin.from("notifications").insert(
    admins.map((row) => ({
      user_id: row.id,
      title,
      body,
      href: "/workspace/admin/payments",
    })),
  );
}

async function completeProviderEvent(
  admin: ReturnType<typeof createAdminClient>,
  args: {
    eventRowId: string;
    paymentId?: string | null;
    error?: string | null;
    processed?: boolean;
  },
) {
  const { error } = await admin.rpc("complete_payment_provider_event", {
    p_event_row_id: args.eventRowId,
    p_payment_id: args.paymentId || null,
    p_processing_error: args.error || null,
    p_mark_processed: args.processed !== false,
  });
  if (error) throw error;
}

async function sendPaidSideEffects(
  admin: ReturnType<typeof createAdminClient>,
  payment: PaymentRow,
) {
  await recordProductEvent("payment_completed", {
    userId: payment.client_id,
    path: "/workspace/client/payments",
    metadata: {
      payment_id: payment.id,
      provider: "paymongo",
      amount_total: payment.amount_total,
    },
  });

  try {
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
      idempotencyKey: `paymongo-paid-${payment.id}`,
    });
  } catch {
    // Financial state remains authoritative if notification delivery fails.
  }
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
  if (!verified) {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  const eventId = String(event.data?.id || "");
  const eventType = String(event.data?.attributes?.type || "");
  const resource = event.data?.attributes?.data || {};
  if (!eventId || !eventType) return NextResponse.json({ received: true });

  const admin = createAdminClient();
  const providerObjectId = String(resource.id || "") || null;
  const providerMetadata = {
    resource_type: resource.type || null,
    status: resource.attributes?.status || null,
    disputed: Boolean(resource.attributes?.disputed),
    payment_id: nestedPaymentId(resource),
  };

  const { data: claimRows, error: claimError } = await admin.rpc(
    "claim_payment_provider_event",
    {
      p_provider: "paymongo",
      p_provider_event_id: eventId,
      p_event_type: eventType,
      p_livemode: live,
      p_provider_object_id: providerObjectId,
      p_metadata: providerMetadata,
    },
  );
  if (claimError) {
    return NextResponse.json({ error: "Could not claim provider event" }, { status: 500 });
  }

  const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows;
  if (!claim?.event_row_id) {
    return NextResponse.json({ error: "Could not claim provider event" }, { status: 500 });
  }
  if (claim.claim_state === "processed" || claim.claim_state === "in_progress") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const eventRowId = String(claim.event_row_id);
  let payment: PaymentRow | null = null;

  try {
    payment = await findPaymentForResource(admin, resource);

    if (eventType === "checkout_session.payment.paid") {
      const attrs = resource.attributes || {};
      const paymentId = attrs.reference_number;
      if (isUuid(paymentId)) {
        const providerPaymentId =
          attrs.payments?.find((item) => String(item?.id || "").startsWith("pay_"))?.id ||
          null;
        const providerPaymentIntent = attrs.payment_intent?.data?.id || null;
        const wasPaid = payment?.status === "paid";

        const { data: paidRow, error } = await admin.rpc("mark_payment_paid_from_provider", {
          p_payment_id: paymentId,
          p_provider_session_id: resource.id || null,
          p_provider_payment_intent: providerPaymentIntent,
          p_provider_payment_id: providerPaymentId,
          p_provider_event_id: eventId,
        });
        if (error) throw error;
        payment = (paidRow as PaymentRow | null) || payment;

        if (payment?.client_id && !wasPaid) {
          await sendPaidSideEffects(admin, payment);
        }
      }
    } else if (eventType === "payment.paid" && payment) {
      const attrs = resource.attributes || {};
      const wasPaid = payment.status === "paid";

      const { data: paidRow, error } = await admin.rpc("mark_payment_paid_from_provider", {
        p_payment_id: payment.id,
        p_provider_session_id: null,
        p_provider_payment_intent: attrs.payment_intent_id || null,
        p_provider_payment_id: resource.id || attrs.payment_id || null,
        p_provider_event_id: eventId,
      });
      if (error) throw error;
      payment = (paidRow as PaymentRow | null) || payment;

      if (payment?.client_id && !wasPaid) {
        await sendPaidSideEffects(admin, payment);
      }
    }

    if (
      eventType === "refund.succeeded" ||
      eventType === "payment.refunded" ||
      eventType === "payment.refund.updated"
    ) {
      const refundId =
        String(
          resource.attributes?.refunds?.[0]?.id ||
            (String(resource.id || "").startsWith("ref_") ? resource.id : ""),
        ) || null;
      const refundStatus = String(
        resource.attributes?.status ||
          resource.attributes?.refunds?.[0]?.status ||
          (eventType === "refund.succeeded" ? "succeeded" : ""),
      ).toLowerCase();

      if (!payment && refundId) {
        const { data } = await admin
          .from("payments")
          .select(PAYMENT_SELECT)
          .eq("provider_refund_id", refundId)
          .maybeSingle();
        payment = (data as PaymentRow | null) || null;
      }

      if (payment && (eventType === "refund.succeeded" || refundStatus === "succeeded" || refundStatus === "refunded")) {
        const wasReleased = Boolean(payment.released_at) || payment.status === "released";
        const { data: refundedRow, error } = await admin.rpc(
          "mark_payment_refunded_from_provider",
          {
            p_payment_id: payment.id,
            p_provider_event_id: eventId,
            p_provider_refund_id: refundId,
          },
        );
        if (error) throw error;
        payment = (refundedRow as PaymentRow | null) || payment;

        if (wasReleased) {
          await notifyAdmins(
            admin,
            "Released VA payment was refunded",
            `PayMongo confirmed a refund for "${payment.description || "a payment"}" after VA payout release. Review the recovery balance and payout history.`,
          );
        }
      } else if (!payment && eventType === "refund.succeeded") {
        await notifyAdmins(
          admin,
          "Unmatched PayMongo refund",
          `PayMongo reported refund ${refundId || providerObjectId || "without an ID"}, but it could not be linked automatically to an internal payment. Reconcile it in Finance.`,
        );
      }
    }

    if (eventType === "dispute.created") {
      const disputeId = String(resource.id || "") || null;
      const providerStatus = String(resource.attributes?.status || "under_review");
      const reason = String(resource.attributes?.reason || "provider dispute");

      if (payment) {
        const previousStatus = payment.status;
        const { data: disputedRow, error } = await admin.rpc(
          "open_payment_provider_dispute",
          {
            p_payment_id: payment.id,
            p_provider_event_id: eventId,
            p_provider_dispute_id: disputeId,
            p_provider_status: providerStatus,
            p_reason: reason,
          },
        );
        if (error) throw error;
        payment = (disputedRow as PaymentRow | null) || payment;

        await notifyAdmins(
          admin,
          previousStatus === "released"
            ? "Chargeback opened after VA payout"
            : "PayMongo dispute opened",
          `PayMongo opened dispute ${disputeId || ""} for "${payment.description || "a payment"}". The financial state is frozen for review.`,
        );
      } else {
        await notifyAdmins(
          admin,
          "Unmatched PayMongo dispute",
          `PayMongo opened dispute ${disputeId || "without an ID"}, but the webhook payload did not identify a payment we can safely match. Reconcile it in the PayMongo dashboard and Finance.`,
        );
      }
    } else if (eventType === "dispute.resolved") {
      const disputeId = String(resource.id || "") || null;
      const providerStatus = String(resource.attributes?.status || "").toLowerCase();
      const reason = String(resource.attributes?.reason || "");

      if (!payment && disputeId) {
        const { data } = await admin
          .from("payments")
          .select(PAYMENT_SELECT)
          .eq("provider_dispute_id", disputeId)
          .maybeSingle();
        payment = (data as PaymentRow | null) || null;
      }

      if (payment) {
        const { data: resolvedRow, error } = await admin.rpc(
          "resolve_payment_provider_dispute",
          {
            p_payment_id: payment.id,
            p_provider_event_id: eventId,
            p_provider_dispute_id: disputeId,
            p_provider_status: providerStatus,
            p_reason: reason || null,
          },
        );
        if (error) throw error;
        payment = (resolvedRow as PaymentRow | null) || payment;

        if (providerStatus === "lost" || providerStatus === "closed_lost") {
          await notifyAdmins(
            admin,
            "PayMongo chargeback lost",
            `The provider dispute for "${payment.description || "a payment"}" was lost. The ledger is now marked chargeback and requires financial reconciliation.`,
          );
        } else if (providerStatus === "won" || providerStatus === "closed_won") {
          await notifyAdmins(
            admin,
            "PayMongo dispute won",
            `The provider dispute for "${payment.description || "a payment"}" was won. The prior financial state has been restored.`,
          );
        }
      } else {
        await notifyAdmins(
          admin,
          "Unmatched PayMongo dispute resolution",
          `PayMongo resolved dispute ${disputeId || "without an ID"} as ${providerStatus || "unknown"}, but it could not be linked automatically to an internal payment.`,
        );
      }
    }

    // Some payment events expose only the disputed flag instead of a dedicated
    // dispute resource. Treat it as a provider freeze, but preserve dedicated
    // dispute IDs/status whenever dispute.created is available.
    if (
      resource.attributes?.disputed === true &&
      payment &&
      payment.status !== "provider_disputed" &&
      payment.status !== "chargeback"
    ) {
      const { data: disputedRow, error } = await admin.rpc(
        "open_payment_provider_dispute",
        {
          p_payment_id: payment.id,
          p_provider_event_id: eventId,
          p_provider_dispute_id: null,
          p_provider_status: "under_review",
          p_reason: "PayMongo marked the payment as disputed.",
        },
      );
      if (error) throw error;
      payment = (disputedRow as PaymentRow | null) || payment;

      await notifyAdmins(
        admin,
        "Provider payment dispute",
        `PayMongo marked "${payment.description || "a payment"}" as disputed. Payout and refund actions require review.`,
      );
    }

    const recognized = new Set([
      "checkout_session.payment.paid",
      "payment.paid",
      "payment.failed",
      "payment_intent.succeeded",
      "payment_intent.awaiting_payment_method",
      "refund.succeeded",
      "payment.refunded",
      "payment.refund.updated",
      "dispute.created",
      "dispute.resolved",
    ]).has(eventType);

    await completeProviderEvent(admin, {
      eventRowId,
      paymentId: payment?.id || null,
      error:
        recognized && !payment && ["refund.succeeded", "dispute.created", "dispute.resolved"].includes(eventType)
          ? "Financial provider event requires manual matching"
          : null,
      processed: true,
    });

    return NextResponse.json({
      received: true,
      reconciled: Boolean(payment),
      ignored: !recognized,
    });
  } catch (error) {
    try {
      await completeProviderEvent(admin, {
        eventRowId,
        paymentId: payment?.id || null,
        error: error instanceof Error ? error.message : String(error),
        processed: false,
      });
    } catch {
      // Returning 500 remains the retry signal even if observability update fails.
    }

    return NextResponse.json({ error: "Provider event processing failed" }, { status: 500 });
  }
}
