import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRuntimeSetupStatus } from "@/lib/env-status";
import { sendSystemTestEmailAction } from "@/app/actions/admin";

function StatusBadge({ configured, manual = false }: { configured: boolean | null; manual?: boolean }) {
  if (manual || configured === null) return <span className="badge badge-warning">Verify manually</span>;
  return configured ? <span className="badge badge-success">Configured</span> : <span className="badge badge-warning">Needs setup</span>;
}

function EvidenceBadge({ count }: { count: number | null }) {
  return Number(count || 0) > 0
    ? <span className="badge badge-success">Observed in production</span>
    : <span className="badge badge-warning">No durable runtime row yet</span>;
}

export default async function AdminSystemPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const { userId } = await requireRoleFast("admin");
  const admin = createAdminClient();
  const status = getRuntimeSetupStatus();

  const [
    { count: admins },
    { count: recruiters },
    { data: authUser },
    { count: hiringLeads },
    { count: acknowledgedLeads },
    { count: discoveryMeetings },
    { count: proposalRows },
    { count: acceptedProposalRows },
    { count: acceptedCommercials },
    { count: unlockedCandidateAccess },
    { count: releasedShortlists },
    { count: interviews },
    { count: offers },
    { count: activeWorkrooms },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "recruiter"),
    admin.auth.admin.getUserById(userId),
    admin.from("lead_intake").select("id", { count: "exact", head: true }).eq("lead_type", "client_hiring"),
    admin.from("lead_intake").select("id", { count: "exact", head: true }).eq("lead_type", "client_hiring").not("acknowledgement_sent_at", "is", null),
    admin.from("lead_intake").select("id", { count: "exact", head: true }).eq("lead_type", "client_hiring").not("discovery_scheduled_at", "is", null).not("discovery_meeting_url", "is", null).not("discovery_calendar_event_id", "is", null),
    admin.from("lead_proposals").select("id", { count: "exact", head: true }),
    admin.from("lead_proposals").select("id", { count: "exact", head: true }).eq("status", "accepted"),
    admin.from("job_commercials").select("job_id", { count: "exact", head: true }).eq("commercial_status", "accepted"),
    admin.from("job_candidate_access").select("job_id", { count: "exact", head: true }).in("access_status", ["paid", "comped"]),
    admin.from("job_shortlist_candidates").select("job_id", { count: "exact", head: true }).eq("shortlist_status", "released"),
    admin.from("candidate_interviews").select("id", { count: "exact", head: true }),
    admin.from("placement_offers").select("id", { count: "exact", head: true }),
    admin.from("workrooms").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);
  const adminEmail = authUser.user?.email || null;

  const hiringEvidence = [
    { label: "Client hiring briefs", count: hiringLeads, detail: "Persisted client-hiring intake rows." },
    { label: "Acknowledgements", count: acknowledgedLeads, detail: "Hiring leads with an acknowledgement timestamp." },
    { label: "Discovery + Meet", count: discoveryMeetings, detail: "Bookings with a schedule, Meet URL, and Calendar event ID." },
    { label: "Proposal rows", count: proposalRows, detail: "Durable proposal records currently retained in production." },
    { label: "Accepted proposals", count: acceptedProposalRows, detail: "Durable proposals currently in accepted state." },
    { label: "Accepted commercials", count: acceptedCommercials, detail: "Roles with accepted commercial terms." },
    { label: "Candidate access", count: unlockedCandidateAccess, detail: "Roles with paid or included candidate access." },
    { label: "Released shortlist rows", count: releasedShortlists, detail: "Recruiter-selected candidates released to clients." },
    { label: "Interviews", count: interviews, detail: "Canonical interview records created in production." },
    { label: "Placement offers", count: offers, detail: "Canonical placement-offer records created in production." },
    { label: "Active workrooms", count: activeWorkrooms, detail: "Post-hire workrooms currently active." },
  ];

  return <>
    <div className="page-head">
      <div>
        <h1>System setup</h1>
        <p>Production readiness for internal access, lead ingestion, transactional email, automatic Google Calendar booking, and the hiring handoff.</p>
      </div>
    </div>

    {query.email_test === "sent" ? <div className="card" style={{ marginBottom: 18 }}><strong>Email test sent.</strong><p className="small muted" style={{ margin: "4px 0 0" }}>Check the Admin inbox and Resend delivery log to confirm receipt.</p></div> : null}

    <section className="card stack" style={{ marginBottom: 18 }}>
      <div className="row-between wrap">
        <div>
          <h2 style={{ margin: 0 }}>Hiring loop runtime evidence</h2>
          <p className="small muted" style={{ marginBottom: 0 }}>Privacy-safe production counts only. This panel never selects client names, email addresses, proposal tokens, candidate contact details, or message content.</p>
        </div>
        <span className="badge">Live database evidence</span>
      </div>
      <div className="grid-3" style={{ alignItems: "stretch" }}>
        {hiringEvidence.map((item) => <div className="card stack" key={item.label} style={{ margin: 0 }}>
          <div className="row-between wrap">
            <strong>{item.label}</strong>
            <EvidenceBadge count={item.count} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{item.count || 0}</div>
          <p className="small muted" style={{ margin: 0 }}>{item.detail}</p>
        </div>)}
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        Zero does not mean the code path is broken. It means there is no durable production row proving that stage has happened. Rollback-only acceptance QA, delivery logs, and failure-path evidence remain recorded in the release-readiness file.
      </p>
    </section>

    <div className="grid-2" style={{ alignItems: "start" }}>
      <div className="card stack">
        <div className="row-between wrap">
          <div>
            <h3 style={{ margin: 0 }}>Internal access</h3>
            <p className="small muted" style={{ marginBottom: 0 }}>At least one Admin is required. Recruiters can then be promoted from Users.</p>
          </div>
          <StatusBadge configured={(admins || 0) > 0} />
        </div>
        <div className="row wrap">
          <span className="badge">{admins || 0} admin{admins === 1 ? "" : "s"}</span>
          <span className="badge">{recruiters || 0} recruiter{recruiters === 1 ? "" : "s"}</span>
        </div>
        <p className="small muted">First Admin bootstrap is intentionally not exposed through public signup. Use the one-time bootstrap script or SQL file included with the project.</p>
      </div>

      <div className="card stack">
        <div className="row-between wrap">
          <div>
            <h3 style={{ margin: 0 }}>Lead ingestion secret</h3>
            <p className="small muted" style={{ marginBottom: 0 }}>{status.leadIngest.detail}</p>
          </div>
          <StatusBadge configured={status.leadIngest.configured} />
        </div>
        <p className="small muted">Native public forms use server actions and do not expose this secret. It protects the separate server-to-server <code>/api/leads</code> integration endpoint.</p>
      </div>

      <div className="card stack">
        <div className="row-between wrap">
          <div>
            <h3 style={{ margin: 0 }}>App notification email</h3>
            <p className="small muted" style={{ marginBottom: 0 }}>{status.appEmail.detail}</p>
          </div>
          <StatusBadge configured={status.appEmail.configured} />
        </div>
        {status.appEmail.configured && adminEmail ? <form action={sendSystemTestEmailAction}><button className="btn btn-sm" type="submit">Send test to {adminEmail}</button></form> : null}
      </div>

      <div className="card stack">
        <div className="row-between wrap">
          <div>
            <h3 style={{ margin: 0 }}>Supabase Auth email</h3>
            <p className="small muted" style={{ marginBottom: 0 }}>{status.authEmail.detail}</p>
          </div>
          <StatusBadge configured={status.authEmail.configured} manual />
        </div>
        <p className="small muted">This controls signup confirmation, password reset, and other Auth messages. The application cannot safely infer this project-level setting from runtime environment variables.</p>
      </div>

      <div className="card stack">
        <div className="row-between wrap">
          <div>
            <h3 style={{ margin: 0 }}>Google Calendar + Meet</h3>
            <p className="small muted" style={{ marginBottom: 0 }}>{status.googleCalendar.detail}</p>
          </div>
          <StatusBadge configured={status.googleCalendar.configured} />
        </div>
        <p className="small muted">Required for public discovery calls to create the real Calendar event and Google Meet link automatically. <code>GOOGLE_CALENDAR_ID</code> is optional and defaults to the authenticated primary calendar.</p>
      </div>

      <div className="card stack">
        <div className="row-between wrap">
          <div>
            <h3 style={{ margin: 0 }}>Production URL</h3>
            <p className="small muted" style={{ marginBottom: 0 }}>{status.appUrl.detail}</p>
          </div>
          <StatusBadge configured={status.appUrl.configured} />
        </div>
      </div>

      <div className="card stack">
        <h3 style={{ margin: 0 }}>Useful setup commands</h3>
        <p className="small muted" style={{ margin: 0 }}><code>npm run secret:lead</code> generates a strong webhook secret.</p>
        <p className="small muted" style={{ margin: 0 }}><code>npm run bootstrap:admin -- you@company.com</code> promotes an existing Auth user to the first Admin.</p>
        <p className="small muted" style={{ margin: 0 }}><code>npm run setup:check -- --strict</code> checks production environment variables before launch.</p>
      </div>
    </div>
  </>;
}
