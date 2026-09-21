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
    <div className="stack">
      {sessions.length ? (
        sessions.map((session) => (
          <article className="card" key={session.id}>
            <div className="row-between" style={{ alignItems: "flex-start", gap: 16 }}>
              <div className="stack" style={{ gap: 6 }}>
                <div className="row wrap" style={{ gap: 8 }}>
                  <strong>{deviceLabel(session.user_agent)}</strong>
                  {session.current ? <span className="pill">Current device</span> : null}
                  {session.aal === "aal2" ? <span className="pill">2FA verified</span> : null}
                </div>
                <span className="small muted">IP: {session.ip || "Unavailable"}</span>
                <span className="small muted">Signed in: {formatDate(session.created_at)}</span>
                <span className="small muted">Last activity: {formatDate(lastActivity(session))}</span>
              </div>
              {!session.current ? (
                <form action={revokeOwnSessionAction}>
                  <input type="hidden" name="session_id" value={session.id} />
                  <button className="btn btn-sm" type="submit">Log out this device</button>
                </form>
              ) : null}
            </div>
          </article>
        ))
      ) : (
        <p className="muted">No active sessions were returned for this account.</p>
      )}

      <div className="row wrap">
        <form action={logoutOtherDevicesAction}>
          <button className="btn" type="submit">Log out other devices</button>
        </form>
        <form action={logoutEverywhereAction}>
          <button className="btn btn-danger" type="submit">Log out everywhere</button>
        </form>
      </div>
    </div>
  );
}
