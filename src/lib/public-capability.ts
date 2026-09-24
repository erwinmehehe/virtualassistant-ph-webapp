import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

type CapabilityPayload = {
  v: 1;
  scope: string;
  subject: string;
  exp: number;
};

function capabilitySecret() {
  const secret =
    process.env.CAPABILITY_SIGNING_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) throw new Error("Capability signing secret is not configured.");
  return secret;
}

function signatureFor(encodedPayload: string) {
  return createHmac("sha256", capabilitySecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createSignedCapability(args: {
  scope: string;
  subject: string;
  expiresAt?: string;
  ttlSeconds?: number;
}) {
  const expiresAt = args.expiresAt
    ? new Date(args.expiresAt)
    : new Date(Date.now() + Math.max(60, args.ttlSeconds ?? 30 * 24 * 60 * 60) * 1000);
  if (!Number.isFinite(expiresAt.getTime())) throw new Error("Invalid capability expiry.");

  const payload: CapabilityPayload = {
    v: 1,
    scope: args.scope,
    subject: args.subject,
    exp: Math.floor(expiresAt.getTime() / 1000),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return {
    token: `${encodedPayload}.${signatureFor(encodedPayload)}`,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };
}

export function verifySignedCapability(token: string, expectedScope: string) {
  const [encodedPayload, suppliedSignature, ...extra] = token.split(".");
  if (!encodedPayload || !suppliedSignature || extra.length) return null;

  let expectedSignature: string;
  try {
    expectedSignature = signatureFor(encodedPayload);
  } catch {
    return null;
  }

  const expected = Buffer.from(expectedSignature);
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as CapabilityPayload;
    if (
      payload.v !== 1 ||
      payload.scope !== expectedScope ||
      typeof payload.subject !== "string" ||
      !payload.subject ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
