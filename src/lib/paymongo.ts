import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const API_BASE = "https://api.paymongo.com/v1";

function getSecretKey() {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not configured.");
  return key;
}

export function isPaymongoConfigured() {
  return Boolean(process.env.PAYMONGO_SECRET_KEY);
}

export class PaymongoApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "PaymongoApiError";
    this.status = status;
  }
}

export function isPaymongoOutcomeUncertain(error: unknown) {
  if (!(error instanceof PaymongoApiError)) return true;
  return error.status === 409 || error.status === 429 || error.status >= 500;
}

async function paymongoRequest<T>(
  path: string,
  method: "GET" | "POST",
  body?: unknown,
  options: { idempotencyKey?: string } = {},
): Promise<T> {
  const auth = Buffer.from(`${getSecretKey()}:`).toString("base64");
  const headers: Record<string, string> = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey.slice(0, 255);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw error;
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = json?.errors?.[0]?.detail || `PayMongo request failed (${res.status})`;
    throw new PaymongoApiError(message, res.status);
  }
  return json as T;
}

type PaymongoCheckoutSession = {
  data: {
    id: string;
    attributes: {
      checkout_url: string;
      status?: string;
      payment_intent?: { data?: { id?: string } };
      payments?: PaymongoPaymentSummary[];
    };
  };
};

export type PaymongoPaymentSummary = {
  id?: string;
  type?: string;
  attributes?: {
    status?: string;
    payment_intent_id?: string;
    disputed?: boolean;
    paid_at?: number;
  };
};

export async function createPaymongoCheckoutSession(args: {
  amountPhp: number;
  description: string;
  referenceNumber: string;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
}) {
  const centavos = Math.round(args.amountPhp * 100);
  const result = await paymongoRequest<PaymongoCheckoutSession>(
    "/checkout_sessions",
    "POST",
    {
      data: {
        attributes: {
          line_items: [{ amount: centavos, currency: "PHP", name: args.description, quantity: 1 }],
          payment_method_types: ["card", "gcash", "paymaya", "grab_pay"],
          description: args.description,
          reference_number: args.referenceNumber,
          success_url: args.successUrl,
          cancel_url: args.cancelUrl,
          send_email_receipt: true,
        },
      },
    },
    { idempotencyKey: args.idempotencyKey },
  );

  return {
    id: result.data.id,
    url: result.data.attributes.checkout_url,
    paymentIntentId: result.data.attributes.payment_intent?.data?.id || null,
  };
}

export async function retrievePaymongoCheckoutSession(sessionId: string) {
  return paymongoRequest<PaymongoCheckoutSession>(
    `/checkout_sessions/${encodeURIComponent(sessionId)}`,
    "GET",
  );
}

export type PaymongoRefundSummary = {
  id?: string;
  type?: string;
  attributes?: {
    status?: string;
    amount?: number;
    currency?: string;
    payment_id?: string;
    created_at?: number;
    updated_at?: number;
  };
};

type PaymongoRefund = {
  data: {
    id: string;
    attributes: {
      status: string;
      amount?: number;
      currency?: string;
      payment_id?: string;
    };
  };
};

export async function refundPaymongoPayment(
  paymentId: string,
  amountPhp: number,
  reason: string,
  idempotencyKey: string,
) {
  return paymongoRequest<PaymongoRefund>(
    "/refunds",
    "POST",
    {
      data: {
        attributes: {
          amount: Math.round(amountPhp * 100),
          payment_id: paymentId,
          reason: "others",
          notes: reason.slice(0, 255),
        },
      },
    },
    { idempotencyKey },
  );
}

export async function retrievePaymongoRefund(refundId: string) {
  return paymongoRequest<PaymongoRefund>(
    `/refunds/${encodeURIComponent(refundId)}`,
    "GET",
  );
}

export type PaymongoPayment = {
  data: {
    id: string;
    attributes: {
      status?: string;
      amount?: number;
      currency?: string;
      payment_intent_id?: string;
      disputed?: boolean;
      refunds?: PaymongoRefundSummary[];
      paid_at?: number;
      updated_at?: number;
    };
  };
};

export async function retrievePaymongoPayment(paymentId: string) {
  return paymongoRequest<PaymongoPayment>(
    `/payments/${encodeURIComponent(paymentId)}`,
    "GET",
  );
}

export async function verifyPaymongoWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  live: boolean,
) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader
      .split(",")
      .map((part) => part.split("=").map((value) => value.trim()) as [string, string]),
  );
  const timestamp = parts.t;
  const expected = live ? parts.li : parts.te;
  if (!timestamp || !expected) return false;

  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const computed = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const a = Buffer.from(computed);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const FALLBACK_USD_PHP_RATE = 58;
const RATE_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export async function usdToPhp(amountUsd: number): Promise<{ amountPhp: number; rate: number }> {
  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("admin_settings")
    .select("usd_to_php_rate,usd_to_php_rate_updated_at")
    .eq("id", 1)
    .maybeSingle();

  const cachedRate = settings?.usd_to_php_rate
    ? Number(settings.usd_to_php_rate)
    : null;
  const cachedAt = settings?.usd_to_php_rate_updated_at
    ? new Date(settings.usd_to_php_rate_updated_at).getTime()
    : 0;
  const isStale = Date.now() - cachedAt > RATE_STALE_AFTER_MS;

  let rate = cachedRate ?? FALLBACK_USD_PHP_RATE;
  if (isStale) {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD", {
        signal: AbortSignal.timeout(4_000),
        cache: "no-store",
      });
      const json = await res.json();
      const liveRate = Number(json?.rates?.PHP);
      if (Number.isFinite(liveRate) && liveRate > 0) {
        rate = liveRate;
        await admin
          .from("admin_settings")
          .update({
            usd_to_php_rate: liveRate,
            usd_to_php_rate_updated_at: new Date().toISOString(),
          })
          .eq("id", 1);
      }
    } catch {
      // Keep the latest cached rate. The hardcoded value is only a bootstrap
      // fallback when no successful rate lookup has ever been stored.
    }
  }

  return {
    amountPhp: Math.round(amountUsd * rate * 100) / 100,
    rate,
  };
}
