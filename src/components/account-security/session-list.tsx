import { MonitorSmartphone, ShieldCheck } from "lucide-react";
import {
  logoutEverywhereAction,
  logoutOtherDevicesAction,
  revokeOwnSessionAction,
} from "@/app/actions/account-security";
import type { AccountSession } from "@/lib/account-security";

function deviceLabel(userAgent: string | null) {
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
    : /Mac OS X/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown device";
  return `${browser} on ${os}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function lastActivity(session: AccountSession) {
  return session.refreshed_at || session.updated_at || session.created_at;
}

export function SessionList({ sessions }: { sessions: AccountSession[] }) {
  return (
    <div className="account-session-stack">
      {sessions.length ? (
        sessions.map((session) => (
          <article className={`account-session-card ${session.current ? "is-current" : ""}`} key={session.id}>
            <div className="account-session-icon" aria-hidden="true">
              <MonitorSmartphone size={20} />
            </div>
            <div className="account-session-content">
              <div className="account-session-title-row">
                <strong>{deviceLabel(session.user_agent)}</strong>
                {session.current ? (
                  <span className="account-current-badge"><ShieldCheck size={13} /> This device</span>
                ) : null}
              </div>
              <div className="account-session-meta">
                <span><small>IP address</small><strong>{session.ip || "Unavailable"}</strong></span>
                <span><small>Signed in</small><strong>{formatDate(session.created_at)}</strong></span>
                <span><small>Last activity</small><strong>{formatDate(lastActivity(session))}</strong></span>
              </div>
            </div>
            {!session.current ? (
              <form action={revokeOwnSessionAction} className="account-session-action">
                <input type="hidden" name="session_id" value={session.id} />
                <button className="btn btn-sm" type="submit">Log out</button>
              </form>
            ) : null}
          </article>
        ))
      ) : (
        <div className="account-session-empty">
          <MonitorSmartphone size={22} />
          <div>
            <strong>No active sessions returned</strong>
            <p>Refresh the page or sign in again if you expected to see this device.</p>
          </div>
        </div>
      )}

      <div className="account-session-footer">
        <div>
          <strong>Need to secure the account quickly?</strong>
          <span>Remove other sessions while keeping this browser signed in, or sign out everywhere.</span>
        </div>
        <div className="account-session-footer-actions">
          <form action={logoutOtherDevicesAction}>
            <button className="btn" type="submit">Log out other devices</button>
          </form>
          <form action={logoutEverywhereAction}>
            <button className="btn btn-danger" type="submit">Log out everywhere</button>
          </form>
        </div>
      </div>
    </div>
  );
}
