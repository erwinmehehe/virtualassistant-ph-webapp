import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseAccountDevice } from "@/lib/account-device";

export type SecurityEventType =
  | "login_succeeded"
  | "login_failed"
  | "logout_current"
  | "logout_others"
  | "logout_all"
  | "session_revoked"
  | "session_reported"
  | "password_changed"
  | "profile_updated"
  | "email_change_requested"
  | "email_changed"
  | "account_deletion_requested"
  | "account_deletion_cancelled";

export type AccountApproximateLocation = {
  city: string | null;
  region: string | null;
  country: string | null;
};

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
  browser: string;
  os: string;
  device: string;
  location: AccountApproximateLocation;
  recognized: boolean | null;
  signInMethod: string | null;
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

function decodedHeader(value: string | null) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function metadataBoolean(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "boolean" ? value : null;
}

function locationFromMetadata(metadata: Record<string, unknown>): AccountApproximateLocation {
  return {
    city: metadataString(metadata, "city"),
    region: metadataString(metadata, "region"),
    country: metadataString(metadata, "country"),
  };
}

async function requestSecurityContext() {
  const requestHeaders = await headers();
  return {
    ip: headerIp(requestHeaders.get("x-forwarded-for")) || headerIp(requestHeaders.get("x-real-ip")),
    userAgent: requestHeaders.get("user-agent"),
    location: {
      city: decodedHeader(requestHeaders.get("x-vercel-ip-city")),
      region: decodedHeader(requestHeaders.get("x-vercel-ip-country-region")),
      country: decodedHeader(requestHeaders.get("x-vercel-ip-country")),
    } satisfies AccountApproximateLocation,
  };
}

function claimsSessionId(claims: unknown) {
  if (!claims || typeof claims !== "object") return null;
  const value = (claims as Record<string, unknown>).session_id;
  return typeof value === "string" ? value : null;
}

export async function recordSuccessfulLoginAndMaybeAlert(args: {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  signInMethod?: string | null;
}) {
  const [requestContext, supabase] = await Promise.all([
    requestSecurityContext(),
    createClient(),
  ]);
  const { data: claimsData } = await supabase.auth.getClaims();
  const sessionId = claimsSessionId(claimsData?.claims);
  const device = parseAccountDevice(requestContext.userAgent);
  const admin = createAdminClient();
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
      device: device.device,
      city: requestContext.location.city,
      region: requestContext.location.region,
      country: requestContext.location.country,
      sign_in_method: args.signInMethod ?? null,
      recognized,
      baseline: loginHistory.length === 0,
    },
  });



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

  const [sessionsResult, { data: eventRows }] = await Promise.all([
    admin.rpc("list_auth_sessions_for_user", { target_user_id: user.id }),
    supabase
      .from("account_security_events")
      .select("id,event_type,session_id,ip,user_agent,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const allEvents = (eventRows ?? []) as SecurityEvent[];
  const loginBySession = new Map<string, SecurityEvent>();
  for (const event of allEvents) {
    if (event.event_type === "login_succeeded" && event.session_id && !loginBySession.has(event.session_id)) {
      loginBySession.set(event.session_id, event);
    }
  }

  const sessions = Array.isArray(sessionsResult.data)
    ? sessionsResult.data.map((row) => {
        const raw = row as Omit<AccountSession, "current" | "browser" | "os" | "device" | "location" | "recognized" | "signInMethod">;
        const parsedDevice = parseAccountDevice(raw.user_agent);
        const loginEvent = loginBySession.get(raw.id);
        const metadata = loginEvent?.metadata && typeof loginEvent.metadata === "object"
          ? loginEvent.metadata
          : {};
        return {
          ...raw,
          current: raw.id === currentSessionId,
          browser: metadataString(metadata, "browser") ?? parsedDevice.browser,
          os: metadataString(metadata, "os") ?? parsedDevice.os,
          device: metadataString(metadata, "device") ?? parsedDevice.device,
          location: locationFromMetadata(metadata),
          recognized: metadataBoolean(metadata, "recognized"),
          signInMethod: metadataString(metadata, "sign_in_method"),
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
    events: allEvents.slice(0, 20),
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
