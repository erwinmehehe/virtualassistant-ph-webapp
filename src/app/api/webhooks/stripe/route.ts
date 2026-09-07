import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordProductEvent } from "@/lib/product-events";
import { getStripe } from "@/lib/stripe";

// Stripe needs the raw request body to verify the webhook signature, so this
// route must not run through any JSON body parsing.
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
    const session = event.data.object as { id: string; metadata?: Record<string, string>; payment_intent?: string | null };
    const paymentId = session.metadata?.payment_id;
    if (paymentId) {
      const admin = createAdminClient();
      const { data: payment } = await admin.from("payments").update({
        status: "paid",
        paid_at: new Date().toISOString(),
        provider_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : null
      }).eq("id", paymentId).eq("status", "awaiting_payment").select("id,client_id,description,amount_total").maybeSingle();
      if (payment) {
        await recordProductEvent("payment_completed", { userId: payment.client_id, path: "/workspace/client/payments", metadata: { payment_id: payment.id, provider: "stripe", amount_total: payment.amount_total } });
        try { const auth = await admin.auth.admin.getUserById(payment.client_id); const { sendTransactionalEventEmail } = await import("@/lib/email"); await sendTransactionalEventEmail({ to: auth.data.user?.email, subject: "Payment received", heading: "Payment successful", body: `We received your payment for ${payment.description || "your VirtualAssistant.com.ph invoice"}.`, href: `${process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"}/workspace/client/payments`, hrefLabel: "View payments", archive: false }); } catch {}
      }
    }
  }

  return NextResponse.json({ received: true });
}
