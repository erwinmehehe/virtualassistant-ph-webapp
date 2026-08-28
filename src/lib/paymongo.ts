import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PayMongo replaces Stripe as the client payment collector -- Stripe does
 * not support Philippine-registered businesses as a country of operation,
 * so that integration could never be activated for real charges. PayMongo
 * is PH-native and settles in PHP only, which is why every helper here
 * deals in centavos (PHP smallest unit) and why usdToPhp() exists at all:
 * the rest of the app still quotes and stores prices in USD.
 *
 * Talks to the REST API directly with fetch rather than a third-party SDK
 * -- PayMongo's API is a small, stable Basic-Auth REST surface and this
 * keeps the exact request/response shape visible and auditable here.
 */

const API_BASE = "https://api.paymongo.com/v1";

function getSecretKey() {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not configured.");
  return key;
}

export function isPaymongoConfigured() {
  return Boolean(process.env.PAYMONGO_SECRET_KEY);
}

async function paymongoRequest<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  const auth = Buffer.from(`${getSecretKey()}:`).toString("base64");
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = json?.errors?.[0]?.detail || `PayMongo request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

type PaymongoCheckoutSession = {
  data: {
    id: string;
    attributes: { checkout_url: string; payment_intent?: { data?: { id?: string } } };
  };
};

/**
 * Creates a hosted checkout page and returns its URL. Amount is in whole
 * PHP (converted from the invoice's USD amount by the caller) -- PayMongo
 * itself wants centavos, so the *100 happens in here to keep that unit
 * conversion in one place.
 */
export async function createPaymongoCheckoutSession(args: {
  amountPhp: number;
  description: string;
  referenceNumber: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const centavos = Math.round(args.amountPhp * 100);
  const result = await paymongoRequest<PaymongoCheckoutSession>("/checkout_sessions", "POST", {
    data: {
      attributes: {
        line_items: [{ amount: centavos, currency: "PHP", name: args.description, quantity: 1 }],
        payment_method_types: ["card", "gcash", "paymaya", "grab_pay"],
        description: args.description,
        reference_number: args.referenceNumber,
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
        send_email_receipt: true
      }
    }
  });
  return { id: result.data.id, url: result.data.attributes.checkout_url };
}

type PaymongoRefund = { data: { id: string; attributes: { status: string } } };

export async function refundPaymongoPayment(paymentId: string, amountPhp: number, reason: string) {
  return paymongoRequest<PaymongoRefund>("/refunds", "POST", {
    data: {
      attributes: {
        amount: Math.round(amountPhp * 100),
        payment_id: paymentId,
        reason: "others",
        notes: reason.slice(0, 255)
      }
    }
  });
}

/**
 * Verifies the `Paymongo-Signature` header: `t=<timestamp>,te=<test sig>,li=<live sig>`.
 * The signed string is `${t}.${rawBody}`, HMAC-SHA256'd with the webhook
 * secret; compare against `te` in test mode or `li` in live mode. Uses the
 * raw request body text (not the parsed JSON) since re-serializing JSON can
 * change byte-for-byte formatting and break the signature match.
 */
export async function verifyPaymongoWebhookSignature(rawBody: string, signatureHeader: string | null, live: boolean) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const parts = Object.fromEntries(signatureHeader.split(",").map((p) => p.split("=").map((s) => s.trim()) as [string, string]));
  const timestamp = parts.t;
  const expected = live ? parts.li : parts.te;
  if (!timestamp || !expected) return false;

  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const computed = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(computed);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const FALLBACK_USD_PHP_RATE = 58;
const RATE_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Converts a USD amount to PHP for the actual PayMongo charge. Tries a live
 * rate first, caches it in admin_settings so a brief FX API outage doesn't
 * block checkout, and only falls back to a hardcoded rate if there has
 * never been a successful lookup at all. Returns the rate used alongside
 * the converted amount so the payment record can show exactly what was
 * charged and why.
 */
export async function usdToPhp(amountUsd: number): Promise<{ amountPhp: number; rate: number }> {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("admin_settings").select("usd_to_php_rate,usd_to_php_rate_updated_at").eq("id", 1).maybeSingle();
  const cachedRate = settings?.usd_to_php_rate ? Number(settings.usd_to_php_rate) : null;
  const cachedAt = settings?.usd_to_php_rate_updated_at ? new Date(settings.usd_to_php_rate_updated_at).getTime() : 0;
  const isStale = Date.now() - cachedAt > RATE_STALE_AFTER_MS;

  let rate = cachedRate ?? FALLBACK_USD_PHP_RATE;
  if (isStale) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: controller.signal });
      clearTimeout(timeout);
      const json = await res.json();
      const liveRate = Number(json?.rates?.PHP);
      if (Number.isFinite(liveRate) && liveRate > 0) {
        rate = liveRate;
        await admin.from("admin_settings").update({ usd_to_php_rate: liveRate, usd_to_php_rate_updated_at: new Date().toISOString() }).eq("id", 1);
      }
    } catch {
      // Live lookup failed -- keep using the cached (or hardcoded) rate above.
    }
  }

  return { amountPhp: Math.round(amountUsd * rate * 100) / 100, rate };
}
