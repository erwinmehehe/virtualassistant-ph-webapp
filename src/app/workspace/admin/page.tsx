import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRuntimeSetupStatus } from "@/lib/env-status";

export default async function AdminPage() {
  await requireRole("admin");
  const admin = createAdminClient();
  const status = getRuntimeSetupStatus();
  const [{ count: pending }, { count: finalists }, { count: bench }, { count: vas }, { count: clients }, { count: recruiters }] = await Promise.all([
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("va_vetting").select("va_id", { count: "exact", head: true }).eq("stage", "finalist"),
    admin.from("bench_memberships").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "va"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "recruiter")
  ]);
  const setupNeedsAttention = !status.leadIngest.configured || !status.appEmail.configured || !status.appUrl.configured;

  return <>
    <div className="page-head">
      <div>
        <h1>Marketplace admin</h1>
        <p>Run the agency by exception: recruiters handle first-pass screening, while you focus on finalists, client demand, talent-pool gaps, and service decisions.</p>
      </div>
    </div>

    {setupNeedsAttention ? <div className="card" style={{ marginBottom: 18 }}>
      <div className="row-between wrap">
        <div>
          <strong>Production setup needs attention</strong>
          <p className="small muted" style={{ margin: "4px 0 0" }}>Check webhook protection, transactional email, and the production URL before relying on automated workflows.</p>
        </div>
        <Link className="btn btn-sm" href="/workspace/admin/system">Review system setup</Link>
      </div>
    </div> : null}

    <div className="stats">
      <div className="stat-card"><span className="small muted">Pending jobs</span><strong>{pending || 0}</strong></div>
      <div className="stat-card"><span className="small muted">Vetting finalists</span><strong>{finalists || 0}</strong></div>
      <div className="stat-card"><span className="small muted">Active talent pool</span><strong>{bench || 0}</strong></div>
      <div className="stat-card"><span className="small muted">Recruiters</span><strong>{recruiters || 0}</strong></div>
    </div>

    <div className="grid-3">
      <Link className="card card-hover" href="/workspace/admin/vetting"><h3>Review finalists</h3><p className="muted">Only candidates already screened and scorecarded by a recruiter arrive here.</p></Link>
      <Link className="card card-hover" href="/workspace/admin/jobs"><h3>Review client jobs</h3><p className="muted">Approve roles and confirm curated placement or managed service terms.</p></Link>
      <Link className="card card-hover" href="/workspace/admin/settings"><h3>Focus and economics</h3><p className="muted">Control your 2 to 3 focus verticals, talent-pool targets, placement fee, and managed service markup.</p></Link>
    </div>

    <div className="card" style={{ marginTop: 18 }}>
      <div className="row wrap"><strong>Accounts:</strong><span className="badge">{vas || 0} Virtual Assistant accounts</span><span className="badge">{clients || 0} client accounts</span><span className="badge">{recruiters || 0} recruiter accounts</span></div>
    </div>
  </>;
}
