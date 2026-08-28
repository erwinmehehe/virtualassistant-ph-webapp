// Actually attempts to create a Stripe Checkout Session the same way
// createCheckoutSessionAction does, to see whether charges_enabled=false on
// the connected account actually blocks it. Creates nothing in the app DB --
// pure Stripe API call, session is abandoned (never completed), no money
// moves either way since this is a test-mode key.
import Stripe from "stripe";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-07-29.dahlia" });

try {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: { currency: "usd", unit_amount: 500, product_data: { name: "Diagnostic test -- placement fee" } },
      quantity: 1
    }],
    success_url: "https://virtualassistant.com.ph/workspace/client/payments?paid=1",
    cancel_url: "https://virtualassistant.com.ph/workspace/client/payments?cancelled=1"
  });
  console.log("Checkout session created successfully.");
  console.log("id:", session.id);
  console.log("status:", session.status);
  console.log("payment_status:", session.payment_status);
  console.log("url:", session.url);
} catch (e) {
  console.log("Checkout session creation FAILED:");
  console.log(e.message);
  console.log(e.raw || e);
}
