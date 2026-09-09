import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordProductEvent } from "@/lib/product-events";
import { verifyPaymongoWebhookSignature } from "@/lib/paymongo";

// Needs the raw request body to verify the signature, so this route must
// not run through any JSON body parsing before the check.
export const runtime = "nodejs";

type PaymongoEvent = {
  data: {
    attributes: {
      type: string;
      livemode: boolean;
      data: {
        id: string;
        attributes: {
          reference_number?: string;
          payment_intent?: { data?: { id?: string } };
          payments?: Array<{ id?: string; type?: string }>;
        };
      };
    };
  };
};

export async function POST(request: Request) {
  const signatureHeader = request.headers.get("paymongo-signature");
  const rawBody = await request.text();

  const bodyForLivemode = JSON.parse(rawBody) as PaymongoEvent;
  const live = Boolean(bodyForLivemode?.data?.attributes?.livemode);
  const verified = await verifyPaymongoWebhookSignature(rawBody, signatureHeader, live);
  if (!verified) {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  const event = bodyForLivemode;
  const eventType = event.data.attributes.type;

  if (eventType === "checkout_session.payment.paid") {
    const checkoutSession = event.data.attributes.data;
    // reference_number was set to the internal payment_id when the checkout
    // session was created -- see createCheckoutSessionAction.
    const paymentId = checkoutSession.attributes.reference_number;
    const paymentIntentId = checkoutSession.attributes.payment_intent?.data?.id || null;
    const providerPaymentId = checkoutSession.attributes.payments?.find((payment) => String(payment?.id || "").startsWith("pay_"))?.id || null;
    if (paymentId) {
      const admin = createAdminClient();
      const { data: payment } = await admin.from("payments").update({
        status: "paid",
        paid_at: new Date().toISOString(),
        provider_payment_intent: paymentIntentId,
        provider_payment_id: providerPaymentId
      }).eq("id", paymentId).eq("status", "awaiting_payment").select("id,client_id,description,amount_total").maybeSingle();
      if (payment) {
        await recordProductEvent("payment_completed", { userId: payment.client_id, path: "/workspace/client/payments", metadata: { payment_id: payment.id, provider: "paymongo", amount_total: payment.amount_total } });
        try { const auth = await admin.auth.admin.getUserById(payment.client_id); const { sendTransactionalEventEmail } = await import("@/lib/email"); await sendTransactionalEventEmail({ to: auth.data.user?.email, subject: "Payment received", heading: "Payment successful", body: `We received your payment for ${payment.description || "your VirtualAssistant.com.ph invoice"}.`, href: `${process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"}/workspace/client/payments`, hrefLabel: "View payments", archive: false }); } catch {}
      }
    }
  }

  return NextResponse.json({ received: true });
}
