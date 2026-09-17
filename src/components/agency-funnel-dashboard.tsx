import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Clock3, ShieldCheck, TrendingUp, UsersRound } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

type FunnelData = {
  days: number;
  sales: {
    leads: number;
    discovery_completed: number;
    qualified: number;
    active_job_orders: number;
  };
  recruiting: {
    job_orders: number;
    shortlisted: number;
    interviewed: number;
    offered: number;
    placed: number;
    avg_days_to_shortlist: number;
    avg_days_to_start: number;
  };
  retention: {
    active_placements: number;
    eligible_30d: number;
    retained_30d: number;
    eligible_90d: number;
    retained_90d: number;
  };
};

function count(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function pct(value: number, denominator: number) {
  if (!denominator) return "—";
  return `${Math.round((value / denominator) * 100)}%`;
}

function StageCard({ label, value, baseline, note }: { label: string; value: number; baseline: number; note: string }) {
  return <div className="card">
    <span className="small muted">{label}</span>
    <strong style={{ display: "block", fontSize: 28 }}>{value}</strong>
    <div className="row-between wrap" style={{ marginTop: 6 }}><small className="muted">{note}</small><span className="badge">{pct(value, baseline)} of cohort</span></div>
  </div>;
}

function RetentionCard({ label, retained, eligible }: { label: string; retained: number; eligible: number }) {
  return <div className="card">
    <span className="small muted">{label}</span>
    <strong style={{ display: "block", fontSize: 28 }}>{eligible ? pct(retained, eligible) : "—"}</strong>
    <small className="muted">{retained} retained of {eligible} placements reaching this milestone</small>
  </div>;
}

export async function AgencyFunnelDashboard({ recruiterId, days, basePath, scopeLabel, leadsPath, rolesPath }: {
  recruiterId: string | null;
  days: number;
  basePath: string;
  scopeLabel: string;
  leadsPath: string;
  rolesPath: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("agency_funnel_metrics", {
    p_days: days,
    p_recruiter_id: recruiterId,
  });
  if (error) throw error;

  const raw = (data || {}) as Partial<FunnelData>;
  const sales = {
    leads: count(raw.sales?.leads),
    discovery_completed: count(raw.sales?.discovery_completed),
    qualified: count(raw.sales?.qualified),
    active_job_orders: count(raw.sales?.active_job_orders),
  };
  const recruiting = {
    job_orders: count(raw.recruiting?.job_orders),
    shortlisted: count(raw.recruiting?.shortlisted),
    interviewed: count(raw.recruiting?.interviewed),
    offered: count(raw.recruiting?.offered),
    placed: count(raw.recruiting?.placed),
    avg_days_to_shortlist: count(raw.recruiting?.avg_days_to_shortlist),
    avg_days_to_start: count(raw.recruiting?.avg_days_to_start),
  };
  const retention = {
    active_placements: count(raw.retention?.active_placements),
    eligible_30d: count(raw.retention?.eligible_30d),
    retained_30d: count(raw.retention?.retained_30d),
    eligible_90d: count(raw.retention?.eligible_90d),
    retained_90d: count(raw.retention?.retained_90d),
  };

  const salesUnconverted = Math.max(0, sales.leads - sales.active_job_orders);
  const recruitingUnplaced = Math.max(0, recruiting.job_orders - recruiting.placed);
  const lost30 = Math.max(0, retention.eligible_30d - retention.retained_30d);
  const lost90 = Math.max(0, retention.eligible_90d - retention.retained_90d);
  const recruitingGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: 12 } as const;

  return <>
    <div className="page-head">
      <div><div className="kicker">Agency funnel</div><h1>Lead to retained placement</h1><p>{scopeLabel}. Sales, recruiting, and retention are measured as separate cohorts so the dashboard does not mix unrelated records into a misleading funnel.</p></div>
      <div className="row wrap" aria-label="Funnel date range">
        {[30,90,180].map((range) => <Link prefetch={false} key={range} className={`btn btn-sm ${days===range?"btn-primary":""}`} href={`${basePath}?days=${range}`}>{range} days</Link>)}
      </div>
    </div>

    <section className="card dashboard-section-card" style={{ marginBottom: 18 }}>
      <div className="dashboard-section-head"><div><h2>Sales handoff</h2><p>Hiring leads created in the selected period. “Active job order” means the linked role reached published recruiting, not merely that an automatic draft exists.</p></div><TrendingUp size={20}/></div>
      <div className="grid-4">
        <StageCard label="Hiring leads" value={sales.leads} baseline={sales.leads} note="Client-hiring enquiries"/>
        <StageCard label="Discovery completed" value={sales.discovery_completed} baseline={sales.leads} note="Completed discovery call"/>
        <StageCard label="Qualified" value={sales.qualified} baseline={sales.leads} note="Qualified / terms / downstream evidence"/>
        <StageCard label="Active job orders" value={sales.active_job_orders} baseline={sales.leads} note="Published recruiting handoff"/>
      </div>
    </section>

    <section className="card dashboard-section-card" style={{ marginBottom: 18 }}>
      <div className="dashboard-section-head"><div><h2>Recruiting delivery</h2><p>Roles published in the selected period, followed through recruiter shortlist, interview, offer, and placement.</p></div><BriefcaseBusiness size={20}/></div>
      <div style={recruitingGrid}>
        <StageCard label="Job orders" value={recruiting.job_orders} baseline={recruiting.job_orders} note="Published roles"/>
        <StageCard label="Shortlisted" value={recruiting.shortlisted} baseline={recruiting.job_orders} note="Client-ready shortlist released"/>
        <StageCard label="Interviewed" value={recruiting.interviewed} baseline={recruiting.job_orders} note="Interview workflow started"/>
        <StageCard label="Offered" value={recruiting.offered} baseline={recruiting.job_orders} note="Placement offer created"/>
        <StageCard label="Placed" value={recruiting.placed} baseline={recruiting.job_orders} note="Workroom / placement created"/>
      </div>
      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="card"><div className="row-between"><span className="small muted">Average time to shortlist</span><Clock3 size={17}/></div><strong style={{display:"block",fontSize:28}}>{recruiting.avg_days_to_shortlist} days</strong><small className="muted">Published role → first released recruiter shortlist</small></div>
        <div className="card"><div className="row-between"><span className="small muted">Average time to start</span><Clock3 size={17}/></div><strong style={{display:"block",fontSize:28}}>{recruiting.avg_days_to_start} days</strong><small className="muted">Published role → first placement start date</small></div>
      </div>
    </section>

    <section className="card dashboard-section-card" style={{ marginBottom: 18 }}>
      <div className="dashboard-section-head"><div><h2>Retention</h2><p>Retention uses placements whose 30-day or 90-day anniversary fell inside the selected period. A placement counts as retained if it was still active at that milestone.</p></div><ShieldCheck size={20}/></div>
      <div className="grid-3">
        <div className="card"><span className="small muted">Active placements now</span><strong style={{display:"block",fontSize:28}}>{retention.active_placements}</strong><small className="muted">Current non-ended managed placements</small></div>
        <RetentionCard label="30-day retained" retained={retention.retained_30d} eligible={retention.eligible_30d}/>
        <RetentionCard label="90-day retained" retained={retention.retained_90d} eligible={retention.eligible_90d}/>
      </div>
    </section>

    <section className="card dashboard-section-card">
      <div className="dashboard-section-head"><div><h2>Where to inspect next</h2><p>Concrete cohort gaps only. These are not attributed causes; open the underlying workflow before deciding why a record did not progress.</p></div><UsersRound size={20}/></div>
      <div className="grid-4">
        <div className="card"><strong>{salesUnconverted}</strong><p className="small muted">hiring leads in this cohort have not reached an active job order.</p><Link className="btn btn-sm" href={leadsPath}>Review leads <ArrowRight size={14}/></Link></div>
        <div className="card"><strong>{recruitingUnplaced}</strong><p className="small muted">published job orders in this cohort do not yet have a placement.</p><Link className="btn btn-sm" href={rolesPath}>Review roles <ArrowRight size={14}/></Link></div>
        <div className="card"><strong>{lost30}</strong><p className="small muted">placements reaching a 30-day milestone in this period ended before day 30.</p><Link className="btn btn-sm" href="/workspace/client-success">Client Success <ArrowRight size={14}/></Link></div>
        <div className="card"><strong>{lost90}</strong><p className="small muted">placements reaching a 90-day milestone in this period ended before day 90.</p><Link className="btn btn-sm" href="/workspace/client-success">Review retention <ArrowRight size={14}/></Link></div>
      </div>
    </section>
  </>;
}
