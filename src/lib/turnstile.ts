import "server-only";

import { headers } from "next/headers";
import { recordAuthChallengeFailure } from "@/lib/auth-challenge-health";

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

// Official Cloudflare dummy keys return generic test actions, not the widget
// action. Only the isolated loopback CI gate may accept that fixture response.
// Real credentials still require an exact action match.
function isLoopbackHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" &&
      ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

function allowIsolatedDummyAction(args: {
  siteKey: string;
  secret: string;
  observedAction?: string;
  requestHeaders: Headers;
}): boolean {
  if (args.observedAction && args.observedAction !== "test") return false;
  if (process.env.VAPH_AUTH_GATE !== "true" ||
      process.env.NODE_ENV !== "development" ||
      process.env.VERCEL_ENV ||
      process.env.VERCEL ||
      args.siteKey !== "1x00000000000000000000AA" ||
      args.secret !== "1x0000000000000000000000000000000AA") {
    return false;
  }
  const loopbackUrls = [
    process.env.E2E_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ];
  if (!loopbackUrls.every(isLoopbackHttpUrl)) return false;
  const host = args.requestHeaders.get("host");
  return Boolean(host && isLoopbackHttpUrl("http://" + host));
}

export async function verifyTurnstile(formData: FormData, expectedAction?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  // Turnstile is optional, but a partial production configuration is unsafe:
  // a public widget without server validation is security theatre, while a
  // secret without a widget makes every legitimate submission impossible.
  if (!secret && !siteKey) {
    // Production is expected to have both keys. Missing configuration must
    // never silently disable the login and signup abuse gate.
    if (process.env.VERCEL_ENV === "production") {
      console.error("[turnstile] missing production configuration; refusing protected submission");
      return false;
    }
    // Non-production local tests and ordinary previews may opt out.
    return true;
  }
  if (!secret || !siteKey) {
    console.error("[turnstile] incomplete configuration; refusing protected submission");
    await recordAuthChallengeFailure(expectedAction, "incomplete_configuration");
    return false;
  }

  const token = String(formData.get("cf-turnstile-response") || "").trim();
  if (!token || token.length > 2_048) {
    // This often means an SPA navigation failed to mount the widget. Never
    // log the token, email, IP address, or secret.
    console.warn("[turnstile] missing_or_malformed_token", { action: expectedAction || null });
    await recordAuthChallengeFailure(expectedAction, "missing_or_malformed_token");
    return false;
  }

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
    if (!response.ok) {
      console.warn("[turnstile] siteverify_http_failure", {
        action: expectedAction || null,
        status: response.status,
      });
      await recordAuthChallengeFailure(expectedAction, "siteverify_http_failure");
      return false;
    }

    const result = await response.json() as TurnstileResult;
    if (!result.success) {
      console.warn("[turnstile] validation failed", {
        errorCodes: Array.isArray(result["error-codes"]) ? result["error-codes"].slice(0, 5) : [],
      });
      await recordAuthChallengeFailure(expectedAction, "siteverify_rejected");
      return false;
    }
    if (expectedAction && result.action !== expectedAction &&
        !allowIsolatedDummyAction({ siteKey, secret, observedAction: result.action, requestHeaders })) {
      console.warn("[turnstile] action mismatch", {
        expectedAction,
        receivedAction: result.action || null,
      });
      await recordAuthChallengeFailure(expectedAction, "action_mismatch");
      return false;
    }
    if (process.env.VERCEL_ENV === "production") {
      // A valid token from a different hostname is not authorization to
      // submit this site's forms. Only the canonical and www hosts are valid.
      let expectedHost = "";
      try {
        expectedHost = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph")
          .hostname.toLowerCase().replace(/^www\./, "");
      } catch {
        console.error("[turnstile] production app URL is invalid");
        await recordAuthChallengeFailure(expectedAction, "incomplete_configuration");
        return false;
      }
      const receivedHost = String(result.hostname || "").toLowerCase();
      if (!expectedHost || ![expectedHost, "www." + expectedHost].includes(receivedHost)) {
        console.warn("[turnstile] hostname mismatch");
        await recordAuthChallengeFailure(expectedAction, "hostname_mismatch");
        return false;
      }
    }
    return true;
  } catch {
    console.warn("[turnstile] siteverify_request_failed", { action: expectedAction || null });
    await recordAuthChallengeFailure(expectedAction, "siteverify_request_failed");
    return false;
  }
}
