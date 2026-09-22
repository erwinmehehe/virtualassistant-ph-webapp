import Link from "next/link";
import { ArrowRight, Clock3, Gauge, TimerReset, TrendingUp, UserRoundCheck, UsersRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { parseSalesRange } from "@/lib/sales-analytics";
import { SalesAnalyticsDashboard } from "@/components/sales-analytics-dashboard";
import { createAdminClient } from "@/lib/supabase/admin";

function MetricCard({label,value,note,icon}:{label:string;value:string;note:string;icon:React.ReactNode}) {
  return <div className="analytics-primary-card"><span className="analytics-primary-icon">{icon}</span><span><small>{label}</small><strong>{value}</strong><em>{note}</em></span></div>;
}

export default async function RecruiterAnalyticsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const query=await searchParams;
  const {user}=await requireRole("recruiter");
  const days=parseSalesRange(query.days);
  const scope=query.scope==="mine"?"mine":"team";
  const admin=createAdminClient();
  const {data:metrics,error}=await admin.rpc("recruiter_operating_metrics");
  if(error)throw error;
  const m=(metrics||{}) as any;
  const passReasons=Array.isArray(m.pass_reasons_30d)?m.pass_reasons_30d:[];
  const recruiterPlacements=Array.isArray(m.placements_by_recruiter_30d)?m.placements_by_recruiter_30d:[];

  const shortlistHours=Number(m.avg_time_to_shortlist_hours||0);
  const clientResponseHours=Number(m.avg_client_response_hours||0);
  const shortlistToInterview=Number(m.shortlist_to_interview_rate||0);
  const interviewToHire=Number(m.interview_to_hire_rate||0);
  const vaOfferHours=Number(m.avg_va_offer_response_hours||0);
  const rolesStuck=Number(m.roles_stuck_3d||0);
  const placements=Number(m.placements_30d||0);
  const upcomingInterviews=Number(m.interviews_next_7d||0);

  return <div className="recruiter-analytics-page">
    <div className="page-head recruiter-analytics-head">
      <div><div className="kicker">Recruiter performance</div><h1>Analytics</h1><p>Start with speed and conversion. Use the lower sections only when you need to diagnose why hiring or sales is slowing down.</p></div>
      <Link className="btn" href="/workspace/recruiter/funnel">Open Agency Funnel <ArrowRight size={14}/></Link>
    </div>

    <section className="analytics-explainer">
      <TrendingUp size={18}/><div><strong>Analytics answers “how well are we operating?”</strong><span>Agency Funnel answers “where are records stopping?” Keep those two questions separate so the numbers stay actionable.</span></div>
    </section>

    <div className="analytics-primary-grid">
      <MetricCard label="Time to shortlist" value={shortlistHours.toFixed(1)+"h"} note="Role created → first client shortlist" icon={<TimerReset size={18}/>}/>
      <MetricCard label="Client response" value={clientResponseHours.toFixed(1)+"h"} note="Shortlist sent → first client decision" icon={<Clock3 size={18}/>}/>
      <MetricCard label="Placements · 30 days" value={String(placements)} note="Confirmed hires completed" icon={<UsersRound size={18}/>}/>
      <MetricCard label="Roles stuck 3+ days" value={String(rolesStuck)} note="Open roles without completed placement" icon={<Gauge size={18}/>}/>
    </div>

    <div className="analytics-story-grid">
      <section className="analytics-story-card">
        <div className="analytics-story-head"><div><span>Hiring conversion</span><h2>Do client-ready candidates become hires?</h2></div><UserRoundCheck size={20}/></div>
        <div className="analytics-conversion-flow">
          <div><span>Shortlist → interview</span><strong>{shortlistToInterview.toFixed(1)}%</strong><small>Released roles that reach an interview</small></div>
          <ArrowRight size={18}/>
          <div><span>Interview → hire</span><strong>{interviewToHire.toFixed(1)}%</strong><small>Interviewed roles that produce a hire</small></div>
        </div>
      </section>

      <section className="analytics-story-card">
        <div className="analytics-story-head"><div><span>Current workload</span><h2>What could slow placements next?</h2></div><Clock3 size={20}/></div>
        <div className="analytics-operations-list">
          <div><span>VA offer response</span><strong>{vaOfferHours.toFixed(1)}h</strong><small>Average final-offer response time</small></div>
          <div><span>Upcoming interviews</span><strong>{upcomingInterviews}</strong><small>Scheduled in the next seven days</small></div>
          <div><span>Stuck roles</span><strong>{rolesStuck}</strong><small>Review these before opening more sourcing work</small></div>
        </div>
      </section>
    </div>

    <div className="grid-2 analytics-detail-grid">
      <section className="analytics-diagnostic-card">
        <div className="analytics-story-head"><div><span>Client feedback</span><h2>Why clients pass</h2><p>Use this to improve matching, calibration, and VA coaching.</p></div></div>
        {passReasons.length?<div className="analytics-ranked-list">{passReasons.map((row:any,index:number)=><div key={String(row.reason)+"-"+index}><span><strong>{row.reason}</strong><small>Recorded pass reason</small></span><b>{row.count}</b></div>)}</div>:<div className="empty">No client pass reasons recorded in the last 30 days.</div>}
      </section>
      <section className="analytics-diagnostic-card">
        <div className="analytics-story-head"><div><span>Delivery output</span><h2>Placements by recruiter</h2><p>Use this for workload balancing and coaching, not as a vanity leaderboard.</p></div></div>
        {recruiterPlacements.length?<div className="analytics-ranked-list">{recruiterPlacements.map((row:any,index:number)=><div key={String(row.recruiter)+"-"+index}><span><strong>{row.recruiter}</strong><small>Confirmed placements · 30 days</small></span><b>{row.count}</b></div>)}</div>:<div className="empty">No confirmed placements in the last 30 days.</div>}
      </section>
    </div>

    <section className="analytics-sales-section">
      <div className="analytics-sales-head">
        <div><div className="kicker">Client acquisition</div><h2>Website & sales analytics</h2><p>Use this section to understand where hiring enquiries come from, how quickly we respond, and whether proposals become clients.</p></div>
      </div>
      <SalesAnalyticsDashboard days={days} basePath="/workspace/recruiter/analytics" scope={scope} recruiterId={user.id} allowScopeToggle/>
    </section>
  </div>;
}
