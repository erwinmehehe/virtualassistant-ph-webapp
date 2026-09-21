import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SessionList } from "@/components/account-security/session-list";
import { requireAnyRole } from "@/lib/auth";
import { getAccountSecurityState, type SecurityEventType } from "@/lib/account-security";
import type { Role } from "@/lib/types";

export const metadata = { robots: { index: false, follow: false } };

const eventLabels: Record<SecurityEventType, string> = {
  login_succeeded: "Signed in",
  login_failed: "Failed sign-in attempt",
  logout_current: "Signed out this device",
  logout_others: "Signed out other devices",
  logout_all: "Signed out everywhere",
  session_revoked: "Signed out a device",
  password_changed: "Password changed",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function eventDevice(userAgent: string | null) {
  if (!userAgent) return null;
  if (/Edg\//.test(userAgent)) return "Edge";
  if (/Chrome\//.test(userAgent)) return "Chrome";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  if (/Safari\//.test(userAgent)) return "Safari";
  return "Browser";
}

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; message?: string; error?: string }>;
}) {
  const { user, profile } = await requireAnyRole(["admin", "recruiter", "client", "va"]);
  const state = await getAccountSecurityState();
  const params = await searchParams;
  const tab = params.tab === "security" ? "security" : "account";
  const role = profile.role as Role;

  return (
    <AppShell userId={user.id} role={role} name={profile.full_name} title="Account settings">
      <div className="page-head">
        <div>
          <h1>Account settings</h1>
          <p>Manage your personal account, sign-in methods, password, active sessions, and security activity.</p>
        </div>
      </div>

      {params.message ? <p className="success-banner" role="status">{params.message}</p> : null}
      {params.error ? <p className="alert" role="alert">{params.error}</p> : null}
      <div className="row wrap" style={{ marginBottom: 18 }}>
        <Link className={`btn ${tab === "account" ? "btn-primary" : ""}`} href="/workspace/account?tab=account">
          Account
        </Link>
        <Link className={`btn ${tab === "security" ? "btn-primary" : ""}`} href="/workspace/account?tab=security">
          Security
        </Link>
      </div>

      {tab === "account" ? (
        <section className="card stack">
          <div>
            <h2 style={{ margin: 0 }}>Account</h2>
            <p className="muted">Your personal sign-in and identity settings.</p>
          </div>
          <div className="data-row"><span>Name</span><strong>{profile.full_name || "Not set"}</strong></div>
          <div className="data-row"><span>Email</span><strong>{state.user.email || "Not available"}</strong></div>
          <div className="data-row"><span>Role</span><strong>{role}</strong></div>
          <div className="data-row">
            <span>Sign-in methods</span>
            <strong>{state.signInProviders.length ? state.signInProviders.join(", ") : "Email/password"}</strong>
          </div>
          <div>
            <Link className="btn" href="/auth/update-password?source=account">Change password</Link>
          </div>
        </section>
      ) : (
        <div className="stack">
          <section className="stack">
            <div>
              <h2>{"Where you're logged in"}</h2>
              <p className="muted">Review active browser sessions and remove access from devices you no longer use.</p>
            </div>
            <SessionList sessions={state.sessions} />
          </section>

          <section className="card stack">
            <div>
              <h2 style={{ margin: 0 }}>Recent security activity</h2>
              <p className="muted">Recent account-security events recorded by VirtualAssistant.com.ph.</p>
            </div>
            {state.events.length ? (
              <div className="stack">
                {state.events.map((event) => {
                  const device = eventDevice(event.user_agent);
                  return (
                    <div className="data-row" key={event.id}>
                      <span>
                        <strong style={{ display: "block" }}>{eventLabels[event.event_type] || event.event_type}</strong>
                        <small className="muted">
                          {[formatDate(event.created_at), event.ip ? `IP ${event.ip}` : null, device].filter(Boolean).join(" · ")}
                        </small>
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="muted">No recent security activity has been recorded yet.</p>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
