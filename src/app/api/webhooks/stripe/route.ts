import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordProductEvent } from "@/lib/product-events";
import { transitionPaymentState, paymentStateConflict } from "@/lib/payment-state";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

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
    return NextResponse.json({ error: `Signature verification failed: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      metadata?: Record<string, string>;
      payment_intent?: string | null;
    };
    const paymentId = session.metadata?.payment_id;
    if (paymentId) {
      const admin = createAdminClient();
      try {
        const payment = await transitionPaymentState<{
          id: string;
          client_id: string;
          description: string;
          amount_total: number | string;
        }>(admin, {
          paymentId,
          expectedStatus: "awaiting_payment",
          newStatus: "paid",
          source: "stripe_webhook",
          externalRef: event.id,
          context: {
            paid_at: new Date().toISOString(),
            provider: "stripe",
            provider_session_id: session.id,
            provider_payment_intent:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
            provider_last_event_id: event.id,
            provider_last_event_at: new Date().toISOString(),
          },
        });

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
            body: `We received your payment for ${payment.description || "your VirtualAssistant.com.ph invoice"}.`,
            href: `${process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"}/workspace/client/payments`,
            hrefLabel: "View payments",
            archive: false,
            idempotencyKey: `stripe-payment-received-${payment.id}`,
          });
        } catch {
          // Payment state remains authoritative when email delivery is unavailable.
        }
      } catch (error) {
        if (!paymentStateConflict(error, "paid")) {
          return NextResponse.json({ error: "Payment reconciliation failed" }, { status: 500 });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
