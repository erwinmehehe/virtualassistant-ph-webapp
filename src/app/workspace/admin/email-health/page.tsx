import { AlertTriangle, CheckCircle2, Mail, ShieldCheck, ShieldX } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";
import { DAILY_RECIPIENT_LIMIT } from "@/lib/email";

type EmailRow = {
  id: string;
  event_type: string | null;
  recipient: string | null;
  status: string;
  provider_id: string | null;
  error_message: string | null;
  created_at: string;
};

type SuppressionRow = {
  email: string;
  reason: string;
  suppressed_at: string;
};

const problemStatuses = ["failed", "bounced", "complained", "suppressed", "suppression_unavailable", "skipped_quota"];
const quotaConsumedStatuses = ["sent", "delivered", "bounced", "complained", "suppressed"];

function recipient_count(recipient: string | null) {
  return String(recipient || "").split(",").map((item) => item.trim()).filter(Boolean).length;
}

function utcDayStart() {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}

export default async function AdminEmailHealthPage() {
  await requireRole("admin");

  const admin = createAdminClient();
  const since = utcDayStart();
  const [eventsRes, suppressionsRes] = await Promise.all([
    admin
      .from("outbound_email_events")
      .select("id,event_type,recipient,status,provider_id,error_message,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000),
    admin
      .from("email_suppressions")
      .select("email,reason,suppressed_at")
      .order("suppressed_at", { ascending: false })
      .limit(100),
  ]);

  const eventsError = eventsRes.error;
  const suppressionsError = suppressionsRes.error;

  if (eventsError || suppressionsError) {
    console.error("[email-health] Unable to load dashboard data", {
      events: eventsError ? { code: eventsError.code, message: eventsError.message } : null,
      suppressions: suppressionsError
        ? { code: suppressionsError.code, message: suppressionsError.message }
        : null,
    });

    return (
      <>
        <div className="page-head">
          <div>
            <div className="kicker">Email operations</div>
            <h1>Email health</h1>
            <p>See what is consuming mail volume, which messages fail, and which recipients are automatically suppressed.</p>
          </div>
        </div>
        <section className="card" role="alert">
          <div className="empty">
            <AlertTriangle size={20} aria-hidden="true" />
            <strong>Email health data unavailable</strong>
            <p>We could not load the delivery or suppression data. Try again shortly instead of relying on partial results.</p>
          </div>
        </section>
      </>
    );
  }

  const events = (eventsRes.data ?? []) as EmailRow[];
  const suppressions = (suppressionsRes.data ?? []) as SuppressionRow[];
  const deliveriesToday = events
    .filter((event) => Boolean(event.provider_id) && quotaConsumedStatuses.includes(event.status))
    .reduce((total, event) => total + recipient_count(event.recipient), 0);
  const remaining = Math.max(0, DAILY_RECIPIENT_LIMIT - deliveriesToday);
  const duplicatePrevented = events.filter((event) => event.status === "duplicate_prevented").length;
  const suppressedSends = events.filter((event) => event.status === "suppressed").length;
  const lowPrioritySkipped = events.filter((event) => event.status === "skipped_quota" && /Skipped low email/i.test(event.error_message || "")).length;
  const failed = events.filter((event) => event.status === "failed").length;
  const bounced = events.filter((event) => event.status === "bounced").length;

  const byType = new Map<string, { messages: number; recipients: number; failed: number }>();
  for (const event of events) {
    if (!event.provider_id || !quotaConsumedStatuses.includes(event.status)) continue;
    const key = event.event_type || "unknown";
    const value = byType.get(key) || { messages: 0, recipients: 0, failed: 0 };
    value.messages += 1;
    value.recipients += recipient_count(event.recipient);
    if (problemStatuses.includes(event.status)) value.failed += 1;
    byType.set(key, value);
  }

  const types = [...byType.entries()].sort((a, b) => b[1].recipients - a[1].recipients).slice(0, 12);
  const recentProblems = events.filter((event) => problemStatuses.includes(event.status)).slice(0, 50);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="kicker">Email operations</div>
          <h1>Email health</h1>
          <p>App-tracked recipient usage for the current UTC day. The final 20 daily recipients are reserved for critical transactional mail.</p>
        </div>
      </div>

      <div className="health-grid">
        <div className="health-card ok">
          <Mail size={19} />
          <div>
            <span>Recipient deliveries today</span>
            <strong>{deliveriesToday}</strong>
            <small>Counts To + CC + BCC on provider-accepted messages</small>
          </div>
        </div>
        <div className={"health-card " + (remaining <= 20 ? "warn" : "ok")}>
          <ShieldCheck size={19} />
          <div>
            <span>Remaining daily allowance</span>
            <strong>{remaining}</strong>
            <small>Configured limit: {DAILY_RECIPIENT_LIMIT}</small>
          </div>
        </div>
        <div className="health-card ok">
          <CheckCircle2 size={19} />
          <div>
            <span>Prevented duplicate sends</span>
            <strong>{duplicatePrevented}</strong>
            <small>Detected Resend idempotency replays</small>
          </div>
        </div>
        <div className={"health-card " + (suppressedSends ? "warn" : "ok")}>
          <ShieldX size={19} />
          <div>
            <span>Suppressed sends</span>
            <strong>{suppressedSends}</strong>
            <small>Known bounce, complaint, or provider suppressions</small>
          </div>
        </div>
        <div className={"health-card " + (lowPrioritySkipped ? "warn" : "ok")}>
          <AlertTriangle size={19} />
          <div>
            <span>Low-priority messages skipped</span>
            <strong>{lowPrioritySkipped}</strong>
            <small>Stopped to preserve critical email capacity</small>
          </div>
        </div>
        <div className={"health-card " + (failed || bounced ? "warn" : "ok")}>
          <AlertTriangle size={19} />
          <div>
            <span>Failed / bounced</span>
            <strong>{failed + bounced}</strong>
            <small>{failed} failed, {bounced} bounced</small>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Sends by automation</h2>
          <p className="muted">Provider-accepted messages today, ranked by recipient deliveries.</p>
          {types.length ? (
            <div className="compact-list">
              {types.map(([name, value]) => (
                <div className="compact-static" key={name}>
                  <span>
                    <strong>{name.replaceAll("_", " ")}</strong>
                    <small>{value.messages} message{value.messages === 1 ? "" : "s"} · {value.failed ? `${value.failed} delivery problem${value.failed === 1 ? "" : "s"}` : "No recorded failures"}</small>
                  </span>
                  <strong>{value.recipients}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No provider-accepted email events were recorded today.</div>
          )}
        </section>

        <section className="card">
          <h2>Suppression list</h2>
          <p className="muted">Showing up to 100 recent bounce, complaint, and provider-suppressed recipients.</p>
          {suppressions.length ? (
            <div className="compact-list">
              {suppressions.slice(0, 30).map((row) => (
                <div className="compact-static" key={row.email}>
                  <span>
                    <strong>{row.email}</strong>
                    <small>{row.reason}</small>
                  </span>
                  <small>{dateShort(row.suppressed_at)}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No suppressed recipients were returned.</div>
          )}
        </section>
      </div>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Recent delivery problems</h2>
        {recentProblems.length ? (
          <div className="compact-list">
            {recentProblems.map((event) => (
              <div className="compact-static" key={event.id}>
                <span>
                  <strong>{(event.event_type || "email").replaceAll("_", " ")}</strong>
                  <small>
                    {event.status + " · " + (event.error_message || "Provider delivery event") +
                      (event.recipient ? " · " + event.recipient : "")}
                  </small>
                </span>
                <small>{dateShort(event.created_at)}</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">No delivery problems were recorded today.</div>
        )}
      </section>
    </>
  );
}
