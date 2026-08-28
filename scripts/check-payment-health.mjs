// Answers "can clients actually pay?" for the platform as a whole -- there's
// no saved-card-on-file system (payments.ts confirms each invoice creates a
// fresh one-time Stripe Checkout session, nothing is stored ahead of time),
// so the real question is: is Stripe configured correctly, and are invoiced
// clients actually completing checkout when asked to pay.
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log("=== Stripe configuration ===");
const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.log("STRIPE_SECRET_KEY is NOT set -- no client can pay anything right now.");
} else {
  console.log(`Key present: ${key.slice(0, 8)}... (${key.startsWith("sk_test_") ? "TEST mode" : key.startsWith("sk_live_") ? "LIVE mode" : "unrecognized prefix"})`);
  try {
    const stripe = new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
    const account = await stripe.accounts.retrieve();
    console.log(`Connected Stripe account: ${account.id} (${account.email || "no email on file"}) charges_enabled=${account.charges_enabled} payouts_enabled=${account.payouts_enabled}`);
  } catch (e) {
    console.log("Could not reach Stripe with this key:", e.message);
  }
}

console.log("\n=== payments table status breakdown ===");
const { data: payments, error } = await admin.from("payments").select("id,status,amount_total,client_id,created_at,provider_session_id,provider_payment_intent").order("created_at", { ascending: false });
if (error) { console.error(error); process.exit(1); }

const byStatus = {};
for (const p of payments) byStatus[p.status] = (byStatus[p.status] || 0) + 1;
console.log(byStatus);
console.log(`Total invoices: ${payments.length}`);

const stuckAwaiting = payments.filter((p) => p.status === "awaiting_payment" && new Date(p.created_at) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
console.log(`\nAwaiting payment for 3+ days (client invoiced but hasn't paid): ${stuckAwaiting.length}`);
for (const p of stuckAwaiting.slice(0, 20)) {
  console.log(`- ${p.id} client=${p.client_id} amount=${p.amount_total} created=${p.created_at} checkout_session=${p.provider_session_id || "never started checkout"}`);
}

const startedButUnpaid = payments.filter((p) => p.status === "awaiting_payment" && p.provider_session_id);
console.log(`\nClient started Stripe checkout but it never completed (session exists, still awaiting_payment): ${startedButUnpaid.length}`);
