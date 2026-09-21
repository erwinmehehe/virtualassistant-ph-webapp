import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewLoginSecurityEmail } from "@/lib/email";
import { siteOrigin } from "@/lib/seo-url";

export type SecurityEventType =
  | "login_succeeded"
  | "login_failed"
  | "logout_current"
  | "logout_others"
  | "logout_all"
  | "session_revoked"
  | "password_changed"
  | "profile_updated"
  | "email_change_requested"
  | "email_changed";

export type AccountSession = {
  id: string;
  created_at: string;
  updated_at: string;
  not_after: string | null;
  refreshed_at: string | null;
  user_agent: string | null;
  ip: string | null;
  aal: "aal1" | "aal2" | null;
  current: boolean;
};

export type SecurityEvent = {
  id: string;
  event_type: SecurityEventType;
  session_id: string | null;
  ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AccountSecurityState = {
  user: {
    id: string;
    email?: string;
  };
  signInProviders: string[];
  sessions: AccountSession[];
  events: SecurityEvent[];
};

function headerIp(value: string | null) {
  const first = value?.split(",")[0]?.trim();
  return first || null;
}

async function requestSecurityContext() {
  const requestHeaders = await headers();
  return {
    ip: headerIp(requestHeaders.get("x-forwarded-for")) || headerIp(requestHeaders.get("x-real-ip")),
    userAgent: requestHeaders.get("user-agent"),
  };
}

function claimsSessionId(claims: unknown) {
  if (!claims || typeof claims !== "object") return null;
  const value = (claims as Record<string, unknown>).session_id;
  return typeof value === "string" ? value : null;
}

function loginDevice(userAgent: string | null) {
  const ua = userAgent || "";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  const os = /Windows NT/.test(ua)
    ? "Windows"
    : /Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua)
      ? "macOS"
      : /iPhone|iPad/.test(ua)
        ? "iOS"
        : /Android/.test(ua)
          ? "Android"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    browser,
    os,
    deviceKey: `${slug(browser)}:${slug(os)}`,
  };
}

export async function recordSuccessfulLoginAndMaybeAlert(args: {
  userId: string;
  email?: string | null;
  fullName?: string | null;
}) {
  const [requestContext, supabase] = await Promise.all([
    requestSecurityContext(),
    createClient(),
  ]);
  const { data: claimsData } = await supabase.auth.getClaims();
  const sessionId = claimsSessionId(claimsData?.claims);
  const device = loginDevice(requestContext.userAgent);
  const admin = createAdminClient();
  const occurredAt = new Date().toISOString();
  const seenSince = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentLogins } = await admin
    .from("account_security_events")
    .select("metadata")
    .eq("user_id", args.userId)
    .eq("event_type", "login_succeeded")
    .gte("created_at", seenSince)
    .order("created_at", { ascending: false })
    .limit(50);

  const loginHistory = recentLogins ?? [];
  const recognized = loginHistory.some((event) => {
    const metadata = event.metadata && typeof event.metadata === "object"
      ? event.metadata as Record<string, unknown>
      : {};
    return metadata.device_key === device.deviceKey;
  });
  const shouldAlert = loginHistory.length > 0 && !recognized;

  await admin.from("account_security_events").insert({
    user_id: args.userId,
    event_type: "login_succeeded",
    session_id: sessionId,
    ip: requestContext.ip,
    user_agent: requestContext.userAgent,
    metadata: {
      device_key: device.deviceKey,
      browser: device.browser,
      os: device.os,
      recognized,
      baseline: loginHistory.length === 0,
    },
  });

  if (shouldAlert && args.email) {
    try {
      await sendNewLoginSecurityEmail({
        to: args.email,
        fullName: args.fullName,
        browser: device.browser,
        os: device.os,
        ip: requestContext.ip,
        occurredAt,
        reviewUrl: `${siteOrigin()}/workspace/account?tab=security`,
        alertKey: `${args.userId}-${device.deviceKey}-${occurredAt.slice(0, 10)}`,
      });
    } catch {
      // A security-email outage must not block a valid sign-in.
    }
  }
}

export async function getAccountSecurityState(): Promise<AccountSecurityState> {
  const supabase = await createClient();

  const [
    { data: userData },
    { data: claimsData },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getClaims(),
  ]);

  const user = userData.user;
  if (!user) redirect("/auth/login?next=/workspace/account");

  const currentSessionId = claimsSessionId(claimsData?.claims);
  const admin = createAdminClient();

  const [sessionsResult, { data: events }] = await Promise.all([
    admin.rpc("list_auth_sessions_for_user", { target_user_id: user.id }),
    supabase
      .from("account_security_events")
      .select("id,event_type,session_id,ip,user_agent,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const sessions = Array.isArray(sessionsResult.data)
    ? sessionsResult.data.map((row) => {
        const session = row as Omit<AccountSession, "current">;
        return {
          ...session,
          current: session.id === currentSessionId,
        };
      })
    : [];

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    signInProviders: (user.identities ?? [])
      .map((identity) => identity.provider)
      .filter((provider): provider is string => Boolean(provider)),
    sessions,
    events: (events ?? []) as SecurityEvent[],
  };
}

export async function recordSecurityEvent(args: {
  eventType: SecurityEventType;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const [{ data: userData }, { data: claimsData }, requestContext] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getClaims(),
    requestSecurityContext(),
  ]);

  const user = userData.user;
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("account_security_events").insert({
    user_id: user.id,
    event_type: args.eventType,
    session_id: claimsSessionId(claimsData?.claims),
    ip: requestContext.ip,
    user_agent: requestContext.userAgent,
    metadata: args.metadata ?? {},
  });
}

export async function recordSecurityEventForUser(args: {
  targetUserId: string;
  eventType: SecurityEventType;
  metadata?: Record<string, unknown>;
}) {
  const requestContext = await requestSecurityContext();
  const admin = createAdminClient();

  await admin.from("account_security_events").insert({
    user_id: args.targetUserId,
    event_type: args.eventType,
    session_id: null,
    ip: requestContext.ip,
    user_agent: requestContext.userAgent,
    metadata: args.metadata ?? {},
  });
}
