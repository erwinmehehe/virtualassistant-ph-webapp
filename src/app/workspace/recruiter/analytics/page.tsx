import { Clock3, Gauge, TimerReset, TrendingUp, UserRoundCheck, UsersRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { parseSalesRange } from "@/lib/sales-analytics";
import { SalesAnalyticsDashboard } from "@/components/sales-analytics-dashboard";
import { createAdminClient } from "@/lib/supabase/admin";

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
  return <>
    <div className="page-head"><div><div className="kicker">Recruiter performance</div><h1>Recruiting operations</h1><p>Measure speed, client response, interview conversion, placement quality, and the reasons searches get stuck.</p></div></div>
    <div className="dash-stats">
      <div className="card"><div className="row"><TimerReset size={18}/><span className="small muted">Time to shortlist</span></div><strong className="score-big">{Number(m.avg_time_to_shortlist_hours||0).toFixed(1)}h</strong><p className="small muted">Average role creation to first client shortlist</p></div>
      <div className="card"><div className="row"><TrendingUp size={18}/><span className="small muted">Shortlist → interview</span></div><strong className="score-big">{Number(m.shortlist_to_interview_rate||0).toFixed(1)}%</strong><p className="small muted">Released roles that reach an interview</p></div>
      <div className="card"><div className="row"><UserRoundCheck size={18}/><span className="small muted">Interview → hire</span></div><strong className="score-big">{Number(m.interview_to_hire_rate||0).toFixed(1)}%</strong><p className="small muted">Interviewed roles that produce a hire</p></div>
      <div className="card"><div className="row"><Clock3 size={18}/><span className="small muted">Client response</span></div><strong className="score-big">{Number(m.avg_client_response_hours||0).toFixed(1)}h</strong><p className="small muted">Average shortlist-to-first-decision time</p></div>
      <div className="card"><div className="row"><Clock3 size={18}/><span className="small muted">VA offer response</span></div><strong className="score-big">{Number(m.avg_va_offer_response_hours||0).toFixed(1)}h</strong><p className="small muted">Average final-offer response time</p></div>
      <div className="card"><div className="row"><Gauge size={18}/><span className="small muted">Roles stuck 3+ days</span></div><strong className="score-big">{Number(m.roles_stuck_3d||0)}</strong><p className="small muted">Open roles without a completed placement</p></div>
      <div className="card"><div className="row"><UsersRound size={18}/><span className="small muted">Placements, 30 days</span></div><strong className="score-big">{Number(m.placements_30d||0)}</strong><p className="small muted">Completed hires in the last 30 days</p></div>
      <div className="card"><div className="row"><UsersRound size={18}/><span className="small muted">Upcoming interviews</span></div><strong className="score-big">{Number(m.interviews_next_7d||0)}</strong><p className="small muted">Scheduled in the next seven days</p></div>
    </div>
    <div className="grid-2" style={{marginTop:18,marginBottom:24}}>
      <section className="card"><h2>Client pass reasons · 30 days</h2><p className="small muted">Use this for matching adjustments, client calibration, and VA coaching.</p>{passReasons.length?<div className="stack">{passReasons.map((row:any,index:number)=><div className="row-between" key={`${row.reason}-${index}`}><span>{row.reason}</span><span className="badge">{row.count}</span></div>)}</div>:<div className="empty">No client pass reasons recorded in the last 30 days.</div>}</section>
      <section className="card"><h2>Placements by recruiter · 30 days</h2><p className="small muted">Operational placements, not page visits or vanity engagement.</p>{recruiterPlacements.length?<div className="stack">{recruiterPlacements.map((row:any,index:number)=><div className="row-between" key={`${row.recruiter}-${index}`}><span>{row.recruiter}</span><span className="badge badge-success">{row.count}</span></div>)}</div>:<div className="empty">No confirmed placements in the last 30 days.</div>}</section>
    </div>
    <details className="dash-secondary"><summary>Website conversion analytics</summary><div style={{marginTop:18}}><SalesAnalyticsDashboard days={days} basePath="/workspace/recruiter/analytics" scope={scope} recruiterId={user.id} allowScopeToggle/></div></details>
  </>;
}
