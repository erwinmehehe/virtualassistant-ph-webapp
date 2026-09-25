import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordProductEvent } from "@/lib/product-events";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

type StripePaymentRow = {
  id: string;
  status: string;
  client_id: string;
  description: string | null;
  amount_total: number | string;
};

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

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const body = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: "Signature verification failed: " + (err as Error).message },
      { status: 400 },
    );
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: true });
  }

  const session = event.data.object as {
    id: string;
    livemode?: boolean;
    metadata?: Record<string, string>;
    payment_intent?: string | null;
  };
  const paymentId = session.metadata?.payment_id;
  if (!paymentId) return NextResponse.json({ received: true, ignored: true });

  const admin = createAdminClient();
  const { data: claimRows, error: claimError } = await admin.rpc(
    "claim_payment_provider_event",
    {
      p_provider: "stripe",
      p_provider_event_id: event.id,
      p_event_type: event.type,
      p_livemode: Boolean(event.livemode ?? session.livemode),
      p_provider_object_id: session.id,
      p_metadata: {
        payment_id: paymentId,
        payment_intent:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      },
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
  let payment: StripePaymentRow | null = null;
  let transitioned = false;

  try {
    const { data, error } = await admin
      .from("payments")
      .select("id,status,client_id,description,amount_total")
      .eq("id", paymentId)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      await completeProviderEvent(admin, {
        eventRowId,
        error: "payment_not_found",
        processed: true,
      });
      return NextResponse.json({ received: true, reconciled: false });
    }
    payment = data as StripePaymentRow;

    if (payment.status === "awaiting_payment" || payment.status === "checkout_pending") {
      const { data: transitionedRow, error: transitionError } = await admin.rpc(
        "transition_payment_state",
        {
          p_payment_id: payment.id,
          p_expected_status: payment.status,
          p_new_status: "paid",
          p_actor_id: null,
          p_source: "stripe_webhook",
          p_external_reference: event.id,
          p_note: null,
          p_metadata: {
            provider: "stripe",
            provider_session_id: session.id,
            provider_payment_intent:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
          },
        },
      );
      if (transitionError) throw transitionError;
      payment = (transitionedRow as StripePaymentRow | null) || payment;
      transitioned = true;
    } else if (
      !["paid", "disputed", "provider_disputed", "release_pending", "released", "refunded", "chargeback"].includes(
        payment.status,
      )
    ) {
      throw new Error("payment_state_conflict:" + payment.status);
    }

    const { error: providerError } = await admin
      .from("payments")
      .update({
        provider: "stripe",
        provider_session_id: session.id,
        provider_payment_intent:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      })
      .eq("id", payment.id);
    if (providerError) throw providerError;

    if (transitioned) {
      await recordProductEvent("payment_completed", {
        userId: payment.client_id,
        path: "/workspace/client/payments",
        metadata: {
          payment_id: payment.id,
          provider: "stripe",
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
          body:
            "We received your payment for " +
            (payment.description || "your VirtualAssistant.com.ph invoice") +
            ".",
          href:
            (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph") +
            "/workspace/client/payments",
          hrefLabel: "View payments",
          archive: false,
          idempotencyKey: "stripe-paid-" + payment.id,
        });
      } catch {
        // Payment state remains authoritative if notification delivery fails.
      }
    }

    await completeProviderEvent(admin, {
      eventRowId,
      paymentId: payment.id,
      processed: true,
    });
    return NextResponse.json({ received: true, reconciled: true });
  } catch (error) {
    try {
      await completeProviderEvent(admin, {
        eventRowId,
        paymentId: payment?.id || paymentId,
        error: error instanceof Error ? error.message : String(error),
        processed: false,
      });
    } catch {
      // Keep the webhook retryable even if observability persistence fails.
    }
    return NextResponse.json({ error: "Payment reconciliation failed" }, { status: 500 });
  }
}
