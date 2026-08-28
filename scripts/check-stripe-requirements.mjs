import Stripe from "stripe";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-07-29.dahlia" });
const account = await stripe.accounts.retrieve();

console.log("Account:", account.id);
console.log("Email:", account.email);
console.log("Business type:", account.business_type);
console.log("Country:", account.country);
console.log("Details submitted:", account.details_submitted);
console.log("Charges enabled:", account.charges_enabled);
console.log("Payouts enabled:", account.payouts_enabled);
console.log("\n--- Requirements ---");
console.log("Currently due:", account.requirements?.currently_due);
console.log("Eventually due:", account.requirements?.eventually_due);
console.log("Past due:", account.requirements?.past_due);
console.log("Disabled reason:", account.requirements?.disabled_reason);
console.log("Pending verification:", account.requirements?.pending_verification);
