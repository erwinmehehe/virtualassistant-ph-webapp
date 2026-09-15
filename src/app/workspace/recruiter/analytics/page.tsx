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
  const statItems=[
    {label:"Time to shortlist",value:`${Number(m.avg_time_to_shortlist_hours||0).toFixed(1)}h`,sub:"Average role creation to first client shortlist",icon:<TimerReset size={18}/>},
    {label:"Shortlist → interview",value:`${Number(m.shortlist_to_interview_rate||0).toFixed(1)}%`,sub:"Released roles that reach an interview",icon:<TrendingUp size={18}/>},
    {label:"Interview → hire",value:`${Number(m.interview_to_hire_rate||0).toFixed(1)}%`,sub:"Interviewed roles that produce a hire",icon:<UserRoundCheck size={18}/>},
    {label:"Client response",value:`${Number(m.avg_client_response_hours||0).toFixed(1)}h`,sub:"Average shortlist-to-first-decision time",icon:<Clock3 size={18}/>},
    {label:"VA offer response",value:`${Number(m.avg_va_offer_response_hours||0).toFixed(1)}h`,sub:"Average final-offer response time",icon:<Clock3 size={18}/>},
    {label:"Roles stuck 3+ days",value:String(Number(m.roles_stuck_3d||0)),sub:"Open roles without a completed placement",icon:<Gauge size={18}/>},
    {label:"Placements, 30 days",value:String(Number(m.placements_30d||0)),sub:"Completed hires in the last 30 days",icon:<UsersRound size={18}/>},
    {label:"Upcoming interviews",value:String(Number(m.interviews_next_7d||0)),sub:"Scheduled in the next seven days",icon:<UsersRound size={18}/>},
  ];
  return <>
    <div className="page-head"><div><div className="kicker">Recruiter performance</div><h1>Recruiting operations</h1><p>Measure speed, client response, interview conversion, placement quality, and the reasons searches get stuck.</p></div></div>
    <div className="analytics-stat-grid">{statItems.map((item,index)=><div className="analytics-stat-card" key={item.label}><span className={`analytics-stat-icon tone-${["indigo","emerald","violet","sky","amber","rose","emerald","indigo"][index]}`}>{item.icon}</span><span><small>{item.label}</small><strong>{item.value}</strong><em>{item.sub}</em></span></div>)}</div>
    <div className="grid-2 analytics-detail-grid" style={{marginTop:18,marginBottom:24}}>
      <section className="card"><h2>Client pass reasons · 30 days</h2><p className="small muted">Use this for matching adjustments, client calibration, and VA coaching.</p>{passReasons.length?<div className="stack">{passReasons.map((row:any,index:number)=><div className="row-between" key={`${row.reason}-${index}`}><span>{row.reason}</span><span className="badge">{row.count}</span></div>)}</div>:<div className="empty">No client pass reasons recorded in the last 30 days.</div>}</section>
      <section className="card"><h2>Placements by recruiter · 30 days</h2><p className="small muted">Operational placements, not page visits or vanity engagement.</p>{recruiterPlacements.length?<div className="stack">{recruiterPlacements.map((row:any,index:number)=><div className="row-between" key={`${row.recruiter}-${index}`}><span>{row.recruiter}</span><span className="badge badge-success">{row.count}</span></div>)}</div>:<div className="empty">No confirmed placements in the last 30 days.</div>}</section>
    </div>
    <details className="dash-secondary"><summary>Website conversion analytics</summary><div style={{marginTop:18}}><SalesAnalyticsDashboard days={days} basePath="/workspace/recruiter/analytics" scope={scope} recruiterId={user.id} allowScopeToggle/></div></details>
  </>;
}
