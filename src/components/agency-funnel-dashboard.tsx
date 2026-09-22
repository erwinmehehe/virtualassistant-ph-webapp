import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Clock3, ShieldCheck, TrendingUp, UsersRound } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

type FunnelData = {
  days: number;
  sales: { leads: number; discovery_completed: number; qualified: number; active_job_orders: number };
  recruiting: { job_orders: number; shortlisted: number; interviewed: number; offered: number; placed: number; avg_days_to_shortlist: number; avg_days_to_start: number };
  retention: { active_placements: number; eligible_30d: number; retained_30d: number; eligible_90d: number; retained_90d: number };
};

function count(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function percent(value: number, denominator: number) {
  if (!denominator) return null;
  return Math.round((value / denominator) * 100);
}

function pctLabel(value: number, denominator: number) {
  const valuePct = percent(value, denominator);
  return valuePct == null ? "No baseline yet" : String(valuePct) + "%";
}

function FunnelFlow({ stages }: { stages: { label: string; value: number; note: string }[] }) {
  return <div className="agency-funnel-flow">
    {stages.map((stage, index) => {
      const previous = index ? stages[index - 1] : null;
      const conversion = previous ? percent(stage.value, previous.value) : null;
      const lost = previous ? Math.max(0, previous.value - stage.value) : 0;
      return <div className="agency-funnel-step" key={stage.label}>
        <div className="agency-funnel-step-top"><span>{stage.label}</span><strong>{stage.value}</strong></div>
        <p>{stage.note}</p>
        {previous ? <div className="agency-funnel-step-foot"><span>{conversion == null ? "No prior-stage data" : String(conversion) + "% moved forward"}</span>{lost ? <small>{lost} stopped before this step</small> : <small>No drop-off recorded</small>}</div> : <div className="agency-funnel-step-foot"><span>Starting cohort</span><small>Selected period</small></div>}
      </div>;
    })}
  </div>;
}

function HealthMetric({ label, value, note, tone = "neutral" }: { label: string; value: string | number; note: string; tone?: "neutral" | "good" | "warn" }) {
  return <div className={"agency-health-metric " + tone}>
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{note}</small>
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
  const { data, error } = await admin.rpc("agency_funnel_metrics", { p_days: days, p_recruiter_id: recruiterId });
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

  const leadToRole = percent(sales.active_job_orders, sales.leads);
  const roleToPlacement = percent(recruiting.placed, recruiting.job_orders);
  const retained30 = percent(retention.retained_30d, retention.eligible_30d);
  const retained90 = percent(retention.retained_90d, retention.eligible_90d);
  const salesUnconverted = Math.max(0, sales.leads - sales.active_job_orders);
  const recruitingUnplaced = Math.max(0, recruiting.job_orders - recruiting.placed);
  const lost30 = Math.max(0, retention.eligible_30d - retention.retained_30d);
  const lost90 = Math.max(0, retention.eligible_90d - retention.retained_90d);

  const salesStages = [
    { label: "Hiring leads", value: sales.leads, note: "New client hiring enquiries" },
    { label: "Discovery completed", value: sales.discovery_completed, note: "Discovery call finished" },
    { label: "Qualified", value: sales.qualified, note: "Confirmed hiring opportunity" },
    { label: "Active job orders", value: sales.active_job_orders, note: "Role handed to recruiting" }
  ];
  const recruitingStages = [
    { label: "Job orders", value: recruiting.job_orders, note: "Published roles entering delivery" },
    { label: "Shortlisted", value: recruiting.shortlisted, note: "Client-ready shortlist released" },
    { label: "Interviewed", value: recruiting.interviewed, note: "Interview workflow started" },
    { label: "Offered", value: recruiting.offered, note: "Placement offer created" },
    { label: "Placed", value: recruiting.placed, note: "Workroom / placement created" }
  ];

  return <div className="agency-funnel-page">
    <div className="page-head agency-funnel-head">
      <div>
        <div className="kicker">Agency funnel</div>
        <h1>From hiring enquiry to retained placement</h1>
        <p>{scopeLabel}. Read this left to right: client demand becomes a role, recruiting turns that role into a placement, then Client Success keeps the placement healthy.</p>
      </div>
      <div className="role-filter-tabs agency-range-tabs" aria-label="Funnel date range">
        {[30, 90, 180].map((range) => <Link prefetch={false} key={range} className={days === range ? "active" : ""} href={basePath + "?days=" + range}>{range} days</Link>)}
      </div>
    </div>

    <section className="agency-funnel-explainer">
      <TrendingUp size={18}/>
      <div><strong>How to read this page</strong><span>Each percentage compares one stage with the stage immediately before it. That makes the actual handoff loss obvious instead of comparing every step with the first number.</span></div>
    </section>

    <div className="agency-health-grid">
      <HealthMetric label="Lead → active role" value={leadToRole == null ? "—" : String(leadToRole) + "%"} note={String(sales.active_job_orders) + " of " + String(sales.leads) + " hiring leads became active job orders"} tone={leadToRole != null && leadToRole >= 50 ? "good" : "neutral"}/>
      <HealthMetric label="Role → placement" value={roleToPlacement == null ? "—" : String(roleToPlacement) + "%"} note={String(recruiting.placed) + " of " + String(recruiting.job_orders) + " job orders produced a placement"} tone={roleToPlacement != null && roleToPlacement >= 50 ? "good" : "neutral"}/>
      <HealthMetric label="30-day retention" value={retained30 == null ? "—" : String(retained30) + "%"} note={String(retention.retained_30d) + " of " + String(retention.eligible_30d) + " eligible placements retained"} tone={retained30 != null && retained30 >= 80 ? "good" : retained30 != null ? "warn" : "neutral"}/>
      <HealthMetric label="90-day retention" value={retained90 == null ? "—" : String(retained90) + "%"} note={String(retention.retained_90d) + " of " + String(retention.eligible_90d) + " eligible placements retained"} tone={retained90 != null && retained90 >= 80 ? "good" : retained90 != null ? "warn" : "neutral"}/>
    </div>

    <section className="agency-funnel-section">
      <div className="agency-funnel-section-head">
        <div><span className="agency-section-icon"><TrendingUp size={18}/></span><div><h2>1. Sales handoff</h2><p>Can we turn a hiring enquiry into a real role for recruiting?</p></div></div>
        <Link className="text-link" href={leadsPath}>Review leads →</Link>
      </div>
      <FunnelFlow stages={salesStages}/>
    </section>

    <section className="agency-funnel-section">
      <div className="agency-funnel-section-head">
        <div><span className="agency-section-icon"><BriefcaseBusiness size={18}/></span><div><h2>2. Recruiting delivery</h2><p>Once a role is live, how reliably does it move through shortlist, interview, offer, and placement?</p></div></div>
        <Link className="text-link" href={rolesPath}>Review roles →</Link>
      </div>
      <FunnelFlow stages={recruitingStages}/>
      <div className="agency-speed-strip">
        <div><Clock3 size={16}/><span><strong>{recruiting.avg_days_to_shortlist} days</strong><small>Average role → first client shortlist</small></span></div>
        <div><Clock3 size={16}/><span><strong>{recruiting.avg_days_to_start} days</strong><small>Average role → placement start</small></span></div>
      </div>
    </section>

    <section className="agency-funnel-section">
      <div className="agency-funnel-section-head">
        <div><span className="agency-section-icon"><ShieldCheck size={18}/></span><div><h2>3. Retention</h2><p>After placement, are VAs still active when they reach the 30-day and 90-day milestones?</p></div></div>
        <Link className="text-link" href="/workspace/client-success">Open Client Success →</Link>
      </div>
      <div className="agency-retention-grid">
        <div><span>Active placements now</span><strong>{retention.active_placements}</strong><small>Current non-ended managed placements</small></div>
        <div><span>30-day retained</span><strong>{retained30 == null ? "—" : String(retained30) + "%"}</strong><small>{retention.retained_30d} retained of {retention.eligible_30d} eligible</small></div>
        <div><span>90-day retained</span><strong>{retained90 == null ? "—" : String(retained90) + "%"}</strong><small>{retention.retained_90d} retained of {retention.eligible_90d} eligible</small></div>
      </div>
    </section>

    <section className="agency-attention-section">
      <div className="agency-funnel-section-head">
        <div><span className="agency-section-icon"><UsersRound size={18}/></span><div><h2>Needs attention</h2><p>These are workflow gaps to inspect, not automatic explanations for why a record stopped.</p></div></div>
      </div>
      <div className="agency-attention-grid">
        <Link href={leadsPath}><strong>{salesUnconverted}</strong><span>Hiring leads have not reached an active role</span><small>{pctLabel(sales.active_job_orders, sales.leads)} reached recruiting <ArrowRight size={13}/></small></Link>
        <Link href={rolesPath}><strong>{recruitingUnplaced}</strong><span>Job orders do not yet have a placement</span><small>{pctLabel(recruiting.placed, recruiting.job_orders)} reached placement <ArrowRight size={13}/></small></Link>
        <Link href="/workspace/client-success"><strong>{lost30}</strong><span>Eligible placements ended before day 30</span><small>Review early retention <ArrowRight size={13}/></small></Link>
        <Link href="/workspace/client-success"><strong>{lost90}</strong><span>Eligible placements ended before day 90</span><small>Review retention risks <ArrowRight size={13}/></small></Link>
      </div>
    </section>
  </div>;
}
