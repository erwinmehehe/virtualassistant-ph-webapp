import { MapPin, MonitorSmartphone, ShieldCheck } from "lucide-react";
import {
  logoutEverywhereAction,
  logoutOtherDevicesAction,
  revokeOwnSessionAction,
} from "@/app/actions/account-security";
import type { AccountDisplayPreferences } from "@/lib/account-display-preferences";
import type { AccountSession } from "@/lib/account-security";

function formatDate(value: string | null | undefined, preferences: AccountDisplayPreferences) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const options: Intl.DateTimeFormatOptions = {
    dateStyle: preferences.date_format,
    timeStyle: "short",
    hour12: preferences.time_format === "12h",
    timeZone: preferences.timezone,
  };

  try {
    return new Intl.DateTimeFormat("en", options).format(date);
  } catch {
    return new Intl.DateTimeFormat("en", {
      dateStyle: preferences.date_format,
      timeStyle: "short",
      hour12: preferences.time_format === "12h",
      timeZone: "UTC",
    }).format(date);
  }
}

function lastActivity(session: AccountSession) {
  return session.refreshed_at || session.updated_at || session.created_at;
}

function locationLabel(session: AccountSession) {
  const parts = [session.location.city, session.location.region, session.location.country]
    .filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index);
  return parts.length ? parts.join(", ") : "Location unavailable";
}

function deviceLabel(session: AccountSession) {
  if (session.device && session.device !== "Unknown device") {
    return `${session.browser} on ${session.device}`;
  }
  return `${session.browser} on ${session.os}`;
}

function trustBadge(session: AccountSession) {
  if (session.current) {
    return <span className="account-current-badge"><ShieldCheck size={13} /> This device</span>;
  }
  if (session.recognized === true) {
    return <span className="account-trust-badge is-recognized">Recognized</span>;
  }
  if (session.recognized === false) {
    return <span className="account-trust-badge is-new">New device</span>;
  }
  return null;
}

export function SessionList({
  sessions,
  preferences,
}: {
  sessions: AccountSession[];
  preferences: AccountDisplayPreferences;
}) {
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
                <strong>{deviceLabel(session)}</strong>
                {trustBadge(session)}
              </div>

              <div className="account-session-location">
                <MapPin size={14} aria-hidden="true" />
                <span>{locationLabel(session)}</span>
                <small>Approximate</small>
              </div>

              <div className="account-session-meta">
                <span>
                  <small>Last activity</small>
                  <strong>{session.current ? "Active now" : formatDate(lastActivity(session), preferences)}</strong>
                </span>
                <span>
                  <small>Signed in</small>
                  <strong>{formatDate(session.created_at, preferences)}</strong>
                </span>
                <span>
                  <small>IP address</small>
                  <strong>{session.ip || "Unavailable"}</strong>
                </span>
                <span>
                  <small>Sign-in method</small>
                  <strong>{session.signInMethod || "Not recorded"}</strong>
                </span>
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
