import "server-only";

import { headers } from "next/headers";

type TurnstileResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

function requestIpFromHeaders(requestHeaders: Headers) {
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || requestHeaders.get("x-real-ip")?.trim() || "";
}

export async function verifyTurnstile(formData: FormData, expectedAction?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  // Turnstile is optional, but a partial production configuration is unsafe:
  // a public widget without server validation is security theatre, while a
  // secret without a widget makes every legitimate submission impossible.
  if (!secret && !siteKey) return true;
  if (!secret || !siteKey) {
    console.error("[turnstile] incomplete configuration; refusing protected submission");
    return false;
  }

  const token = String(formData.get("cf-turnstile-response") || "").trim();
  if (!token || token.length > 2_048) return false;

  try {
    const requestHeaders = await headers();
    const body = new URLSearchParams({ secret, response: token });
    const remoteIp = requestIpFromHeaders(requestHeaders);
    if (remoteIp) body.set("remoteip", remoteIp);

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return false;

    const result = await response.json() as TurnstileResult;
    if (!result.success) {
      console.warn("[turnstile] validation failed", {
        errorCodes: Array.isArray(result["error-codes"]) ? result["error-codes"].slice(0, 5) : [],
      });
      return false;
    }
    if (expectedAction && result.action !== expectedAction) {
      console.warn("[turnstile] action mismatch", {
        expectedAction,
        receivedAction: result.action || null,
      });
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
