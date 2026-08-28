import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRuntimeSetupStatus } from "@/lib/env-status";
import { sendSystemTestEmailAction } from "@/app/actions/admin";

function StatusBadge({ configured, manual = false }: { configured: boolean | null; manual?: boolean }) {
  if (manual || configured === null) return <span className="badge badge-warning">Verify manually</span>;
  return configured ? <span className="badge badge-success">Configured</span> : <span className="badge badge-warning">Needs setup</span>;
}

export default async function AdminSystemPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const { user } = await requireRole("admin");
  const admin = createAdminClient();
  const status = getRuntimeSetupStatus();
  const [{ count: admins }, { count: recruiters }, { data: authUser }] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "recruiter"),
    admin.auth.admin.getUserById(user.id)
  ]);
  const adminEmail = authUser.user?.email || null;

  return <>
    <div className="page-head">
      <div>
        <h1>System setup</h1>
        <p>Production readiness for internal access, lead ingestion, and transactional email.</p>
      </div>
    </div>

    {query.email_test === "sent" ? <div className="card" style={{ marginBottom: 18 }}><strong>Email test sent.</strong><p className="small muted" style={{ margin: "4px 0 0" }}>Check the Admin inbox and Resend delivery log to confirm receipt.</p></div> : null}

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
