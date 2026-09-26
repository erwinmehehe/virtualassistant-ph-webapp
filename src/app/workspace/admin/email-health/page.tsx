import { AlertTriangle, CheckCircle2, Mail, ShieldCheck, ShieldX } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";
import { DAILY_RECIPIENT_LIMIT, LOW_PRIORITY_DAILY_LIMIT, RESERVED_CRITICAL_RECIPIENTS } from "@/lib/email";
import { sendVaTrainingAnnouncementBatchAction } from "@/app/actions/admin-training-email";

type EmailRow = {
  id: string;
  event_type: string | null;
  recipient: string | null;
  recipient_count: number | null;
  priority: "critical" | "standard" | "low" | null;
  idempotency_key: string | null;
  skip_reason: string | null;
  automation: string | null;
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
const realDeliveryProblemStatuses = ["failed", "bounced", "complained"];

function isTestOrPlaceholderRecipient(value: string | null) {
  const recipients = String(value || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (!recipients.length) return false;
  return recipients.every((recipient) => {
    const email = recipient.match(/<([^<>]+)>$/)?.[1]?.trim() || recipient;
    const domain = email.split("@")[1] || "";
    return ["test.com", "example.com", "example.org", "example.net", "invalid"].includes(domain) || domain.endsWith(".invalid");
  });
}

function eventRecipientCount(event: Pick<EmailRow, "recipient" | "recipient_count">) {
  const legacyCount = String(event.recipient || "").split(",").map((item) => item.trim()).filter(Boolean).length;
  if (typeof event.recipient_count === "number" && Number.isFinite(event.recipient_count) && (event.recipient_count > 0 || legacyCount === 0)) {
    return event.recipient_count;
  }
  return legacyCount;
}

function utcDayStart() {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}

export default async function AdminEmailHealthPage() {
  await requireRoleFast("admin");

  const admin = createAdminClient();
  const since = utcDayStart();
  const [eventsRes, suppressionsRes] = await Promise.all([
    admin
      .from("outbound_email_events")
      .select("id,event_type,recipient,recipient_count,priority,idempotency_key,skip_reason,automation,status,provider_id,error_message,created_at")
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
    .reduce((total, event) => total + eventRecipientCount(event), 0);
  const remaining = Math.max(0, DAILY_RECIPIENT_LIMIT - deliveriesToday);
  const quotaPercent = Math.min(100, Math.round((deliveriesToday / DAILY_RECIPIENT_LIMIT) * 100));
  const quotaPressure = remaining <= 20 ? "High" : quotaPercent >= 60 ? "Elevated" : "Normal";
  const duplicatePrevented = events.filter((event) => event.status === "duplicate_prevented").length;
  const suppressedSends = events.filter((event) => event.status === "suppressed").length;
  const lowPrioritySkipped = events.filter((event) => event.status === "skipped_quota" && event.priority === "low").length;
  const productionEvents = events.filter((event) => !isTestOrPlaceholderRecipient(event.recipient));
  const failed = productionEvents.filter((event) => event.status === "failed").length;
  const bounced = productionEvents.filter((event) => event.status === "bounced").length;
  const testProblemsExcluded = events.filter((event) => isTestOrPlaceholderRecipient(event.recipient) && realDeliveryProblemStatuses.includes(event.status)).length;

  const byType = new Map<string, { messages: number; recipients: number; failed: number }>();
  for (const event of events) {
    if (!event.provider_id || !quotaConsumedStatuses.includes(event.status)) continue;
    const key = event.automation || event.event_type || "unknown";
    const value = byType.get(key) || { messages: 0, recipients: 0, failed: 0 };
    value.messages += 1;
    value.recipients += eventRecipientCount(event);
    if (problemStatuses.includes(event.status)) value.failed += 1;
    byType.set(key, value);
  }

  const types = [...byType.entries()].sort((a, b) => b[1].recipients - a[1].recipients).slice(0, 12);
  const recentProblems = productionEvents.filter((event) => problemStatuses.includes(event.status)).slice(0, 50);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="kicker">Email operations</div>
          <h1>Email health</h1>
          <p>App-tracked recipient usage for the current UTC day. Optional mail is capped at {LOW_PRIORITY_DAILY_LIMIT} recipients and {RESERVED_CRITICAL_RECIPIENTS} recipients are protected from standard mail; critical transactional mail is always attempted.</p>
        </div>
      </div>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="row-between" style={{ gap: 16, alignItems: "center" }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Free VA training announcement</h2>
            <p className="muted" style={{ margin: 0 }}>Send the approved training announcement in batches of 10. Previously sent VAs are skipped automatically, explicit opt-outs and suppressed addresses are respected, and critical email capacity stays reserved.</p>
          </div>
          <form action={sendVaTrainingAnnouncementBatchAction}>
            <button className="btn btn-primary" type="submit">Send next VA batch</button>
          </form>
        </div>
      </section>

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
            <small>Configured limit: {DAILY_RECIPIENT_LIMIT} · {quotaPercent}% used · {quotaPressure} pressure</small>
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
            <small>{failed} failed, {bounced} bounced{testProblemsExcluded ? ` · ${testProblemsExcluded} test/placeholder excluded` : ""}</small>
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
                    {event.status + " · " + (event.skip_reason || event.error_message || "Provider delivery event") +
                      (event.priority ? " · " + event.priority : "") +
                      (event.recipient ? " · " + event.recipient : "")}
                  </small>
                </span>
                <small>{dateShort(event.created_at)}</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">No production delivery problems were recorded today{testProblemsExcluded ? `; ${testProblemsExcluded} test/placeholder event${testProblemsExcluded === 1 ? " was" : "s were"} excluded.` : "."}</div>
        )}
      </section>
    </>
  );
}
