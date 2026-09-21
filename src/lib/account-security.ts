import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SecurityEventType =
  | "login_succeeded"
  | "login_failed"
  | "logout_current"
  | "logout_others"
  | "logout_all"
  | "session_revoked"
  | "password_changed";

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



export async function getAccountSecurityState(): Promise<AccountSecurityState> {
  const supabase = await createClient();

  const [
    { data: userData },
    { data: claimsData },
    sessionsResult,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getClaims(),
    supabase.rpc("list_own_auth_sessions"),
  ]);

  const user = userData.user;
  if (!user) redirect("/auth/login?next=/workspace/account");

  const currentSessionId = claimsSessionId(claimsData?.claims);

  const { data: events } = await supabase
    .from("account_security_events")
    .select("id,event_type,session_id,ip,user_agent,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

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
