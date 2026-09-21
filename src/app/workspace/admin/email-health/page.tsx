import { AlertTriangle, CheckCircle2, Mail, ShieldX } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";

type EmailRow = {
  id: string;
  event_type: string | null;
  recipient: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

type SuppressionRow = {
  email: string;
  reason: string;
  suppressed_at: string;
};

const problemStatuses = ["failed", "bounced", "suppressed", "complained"];

export default async function AdminEmailHealthPage() {
  await requireRole("admin");

  const admin = createAdminClient();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const [eventsRes, suppressionsRes] = await Promise.all([
    admin
      .from("outbound_email_events")
      .select("id,event_type,recipient,status,error_message,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500),
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
  const delivered = events.filter((event) => ["sent", "delivered"].includes(event.status)).length;
  const failed = events.filter((event) => event.status === "failed").length;
  const bounced = events.filter((event) => event.status === "bounced").length;
  const quota = events.filter((event) => /quota|rate limit|daily/i.test(event.error_message ?? "")).length;

  const byType = new Map<string, { total: number; failed: number }>();
  for (const event of events) {
    const key = event.event_type || "unknown";
    const value = byType.get(key) || { total: 0, failed: 0 };
    value.total++;
    if (problemStatuses.includes(event.status)) value.failed++;
    byType.set(key, value);
  }
  const types = [...byType.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 12);
  const recentProblems = events.filter((event) => problemStatuses.includes(event.status)).slice(0, 50);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="kicker">Email operations</div>
          <h1>Email health</h1>
          <p>Latest 500 email events from the last 24 hours, plus up to 100 suppressed recipients.</p>
        </div>
      </div>

      <div className="health-grid">
        <div className="health-card ok">
          <CheckCircle2 size={19} />
          <div>
            <span>Sent / delivered in sample</span>
            <strong>{delivered}</strong>
            <small>Latest 500 email events maximum</small>
          </div>
        </div>
        <div className={"health-card " + (failed ? "warn" : "ok")}>
          <AlertTriangle size={19} />
          <div>
            <span>Failed in sample</span>
            <strong>{failed}</strong>
            <small>Provider or recipient failures</small>
          </div>
        </div>
        <div className={"health-card " + (bounced ? "warn" : "ok")}>
          <Mail size={19} />
          <div>
            <span>Bounced in sample</span>
            <strong>{bounced}</strong>
            <small>Hard delivery failures</small>
          </div>
        </div>
        <div className={"health-card " + (quota ? "warn" : "ok")}>
          <ShieldX size={19} />
          <div>
            <span>Quota errors in sample</span>
            <strong>{quota}</strong>
            <small>Capacity failures that can block critical mail</small>
          </div>
        </div>
        <div className="health-card">
          <ShieldX size={19} />
          <div>
            <span>Suppressed recipients loaded</span>
            <strong>{suppressions.length}</strong>
            <small>Up to 100 suppressed recipients</small>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Email volume by automation</h2>
          <p className="muted">Latest 500 email events from the last 24 hours. Counts are a recent sample, not guaranteed totals.</p>
          {types.length ? (
            <div className="compact-list">
              {types.map(([name, value]) => (
                <div className="compact-static" key={name}>
                  <span>
                    <strong>{name.replaceAll("_", " ")}</strong>
                    <small>{value.failed ? String(value.failed) + " failed" : "No recorded failures in sample"}</small>
                  </span>
                  <strong>{value.total}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No email events were recorded in the latest sample.</div>
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
          <div className="empty">No delivery problems were recorded in the latest sample.</div>
        )}
      </section>
    </>
  );
}
