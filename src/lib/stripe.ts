import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * Lazily-constructed Stripe client. Throws only when actually used without a
 * key configured, so pages that don't touch payments keep working even
 * before STRIPE_SECRET_KEY is set.
 */
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-07-29.dahlia" });
  }
  return client;
}

/**
 * A key can be present and still be useless for real money: Stripe accounts
 * that never finished activation (business details, bank account, identity
 * verification) report charges_enabled=false and will silently fail on any
 * live charge, even though test-mode charges keep working. This surfaced
 * once already as a completely invisible gap -- surface it in the admin UI
 * instead. Best-effort: never throws, so a Stripe outage doesn't break the
 * payments page itself.
 */
export async function getStripeActivationStatus(): Promise<{ checked: boolean; chargesEnabled: boolean; detailsSubmitted: boolean; mode: "test" | "live" | "unknown" }> {
  if (!process.env.STRIPE_SECRET_KEY) return { checked: false, chargesEnabled: false, detailsSubmitted: false, mode: "unknown" };
  const mode = process.env.STRIPE_SECRET_KEY.startsWith("sk_live_") ? "live" : process.env.STRIPE_SECRET_KEY.startsWith("sk_test_") ? "test" : "unknown";
  try {
    const account = await getStripe().accounts.retrieveCurrent();
    return { checked: true, chargesEnabled: Boolean(account.charges_enabled), detailsSubmitted: Boolean(account.details_submitted), mode };
  } catch {
    return { checked: false, chargesEnabled: false, detailsSubmitted: false, mode };
  }
}
