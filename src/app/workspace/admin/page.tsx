import { philippineDate } from "@/lib/lead-follow-ups";
import Link from "next/link";
import { ArrowRight, CalendarDays, BriefcaseBusiness, UsersRound, MessageSquare } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardDegradedNotice } from "@/components/dashboard-degraded-notice";
import { collectQueryIssues } from "@/lib/query-health";
import { LEAD_STAGES } from "@/lib/agency-pipeline";

export default async function AdminPage() {
  await requireRole("admin");
  const admin=createAdminClient();
  const today=philippineDate();
  const [leads,followUps,jobs,quotes,rooms,finalists,stages]=await Promise.all([
    admin.from("lead_intake").select("id",{count:"exact",head:true}).neq("status","archived").eq("sales_stage","new"),
    admin.from("lead_intake").select("id,company,name,service,follow_up_on").neq("status","archived").not("sales_stage","in","(won,lost)").lte("follow_up_on",today).order("follow_up_on").limit(8),
    admin.from("jobs").select("id",{count:"exact",head:true}).eq("status","pending"),
    admin.from("job_commercials").select("job_id",{count:"exact",head:true}).eq("commercial_status","quoted"),
    admin.from("workrooms").select("id",{count:"exact",head:true}).eq("status","active"),
    admin.from("va_vetting").select("va_id",{count:"exact",head:true}).eq("stage","finalist"),
    Promise.all(LEAD_STAGES.map(([stage])=>admin.from("lead_intake").select("id",{count:"exact",head:true}).neq("status","archived").eq("sales_stage",stage)))
  ]);
  const issues=collectQueryIssues({"new leads":leads.error,"follow-ups":followUps.error,"hiring briefs":jobs.error,"proposals":quotes.error,"placements":rooms.error,"finalists":finalists.error,...Object.fromEntries(stages.map((row,i)=>[LEAD_STAGES[i][1],row.error]))});
  const metrics=[
    {label:"New enquiries",result:leads,href:"/workspace/admin/leads?stage=new",icon:MessageSquare,copy:"Start the conversation"},
    {label:"Briefs to review",result:jobs,href:"/workspace/admin/jobs",icon:BriefcaseBusiness,copy:"Confirm the work and budget"},
    {label:"Quotes awaiting acceptance",result:quotes,href:"/workspace/admin/jobs",icon:CalendarDays,copy:"Help clients take the next step"},
    {label:"Active placements",result:rooms,href:"/workspace/admin/placements",icon:UsersRound,copy:"Support the people already hired"}
  ];
  const priorities=[
    {label:"Follow up with employers",copy:"Start with the earliest commitments below.",href:"#owner-follow-ups",ready:!followUps.error&&Boolean(followUps.data?.length),value:followUps.data?.length===8?"8+":String(followUps.data?.length||0),error:followUps.error},
    {label:"Review hiring briefs",copy:"Confirm scope and budget before recruiting.",href:"/workspace/admin/jobs",ready:!jobs.error&&Boolean(jobs.count),value:String(jobs.count||0),error:jobs.error},
    {label:"Approve screened VAs",copy:"Review finalists so they can move into matching.",href:"/workspace/admin/vetting",ready:!finalists.error&&Boolean(finalists.count),value:String(finalists.count||0),error:finalists.error}
  ];
  return <div className="owner-overview">
    <DashboardDegradedNotice issues={issues}/>
    <div className="page-head agency-page-head"><div><div className="kicker">Agency overview · {today}</div><h1>Marketplace admin</h1><p>Follow up with employers, move hiring forward, and keep every commitment visible.</p></div><Link className="btn btn-primary" href="/workspace/admin/leads">Open lead pipeline <ArrowRight size={16}/></Link></div>
    <section className="owner-priorities" aria-labelledby="owner-priority-title"><div className="owner-section-title"><div><span className="kicker">Your daily focus</span><h2 id="owner-priority-title">What needs attention</h2></div><span className="small muted">Philippine time</span></div><div className="owner-priority-grid">{priorities.map(item=><Link key={item.label} href={item.href} className={`owner-priority ${item.ready?"has-work":""}`}><div className="row-between"><span className="owner-priority-number">{item.error?"—":item.value}</span><ArrowRight size={18}/></div><strong>{item.label}</strong><p>{item.copy}</p><span className="small">{item.error?"Status unavailable":item.ready?"Review now":"No pending items"}</span></Link>)}</div></section>
    <div className="owner-section-title"><h2>Business overview</h2><Link className="text-link" href="/workspace/admin/placements">Manage placements →</Link></div>
    <div className="agency-metrics">{metrics.map(({label,result,href,icon:Icon,copy})=><Link className="agency-metric" href={href} key={label}><div className="row-between"><span>{label}</span><Icon size={19}/></div><strong>{result.error?"—":result.count??0}</strong><small>{copy}</small></Link>)}</div>
    <section className="card agency-pipeline"><div className="dashboard-section-head"><div><h2>Employer pipeline</h2><p>Sales stages are tracked separately from job publication and VA applications.</p></div><Link className="text-link" href="/workspace/admin/leads">Manage leads →</Link></div><div className="agency-stages">{LEAD_STAGES.map(([stage,label],i)=><Link href={"/workspace/admin/leads?stage="+stage} key={stage}><span>{label}</span><strong>{stages[i].error?"—":stages[i].count??0}</strong></Link>)}</div></section>
    <div className="grid-2 dashboard-ops-grid"><section className="card" id="owner-follow-ups"><div className="dashboard-section-head"><div><h2>Follow-ups due</h2><p>Due today or earlier · Philippine time</p></div><Link className="text-link" href="/workspace/admin/leads?follow=due">View all due →</Link></div>{followUps.error?<p>Follow-ups are temporarily unavailable.</p>:followUps.data?.length?<div className="compact-list">{followUps.data.map(lead=><Link key={lead.id} href={"/workspace/admin/leads?lead="+lead.id+"#lead-"+lead.id}><span><strong>{lead.company||lead.name||"Employer enquiry"}</strong><small>{lead.service||"Hiring request"}</small><small className={lead.follow_up_on<today?"owner-overdue":""}>{lead.follow_up_on<today?"Overdue":"Due today"} · {lead.follow_up_on}</small></span><ArrowRight size={16}/></Link>)}</div>:<div className="agency-empty"><CalendarDays size={28}/><h3>No follow-ups due</h3><p>Set the next contact date in your lead pipeline so a promising enquiry never gets forgotten.</p><Link className="btn" href="/workspace/admin/leads">Review enquiries</Link></div>}</section>
    <section className="card"><div className="dashboard-section-head"><div><h2>Keep hiring moving</h2><p>The next handoffs for your team.</p></div></div><div className="compact-list"><Link href="/workspace/admin/jobs"><span><strong>Review hiring briefs and quotes</strong><small>Confirm scope, schedule, and service terms.</small></span><ArrowRight size={16}/></Link><Link href="/workspace/admin/vetting"><span><strong>{finalists.error?"Review":finalists.count??0} vetting finalists</strong><small>Approve screened candidates for matching.</small></span><ArrowRight size={16}/></Link><Link href="/workspace/admin/payments"><span><strong>Payment administration</strong><small>Review invoices and outstanding payments.</small></span><ArrowRight size={16}/></Link></div></section></div>
  </div>;
}
