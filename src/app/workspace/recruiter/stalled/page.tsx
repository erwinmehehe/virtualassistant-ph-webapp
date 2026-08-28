import Link from "next/link";
import { AlertCircle, ArrowRight, Clock3, UsersRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";

const daysAgo = (days:number) => new Date(Date.now()-days*86400000).toISOString();

export default async function RecruiterStalledWorkPage(){
  await requireRole("recruiter"); const admin=createAdminClient(); const cutoff=daysAgo(3);
  const [{data:jobs},{data:shortlist},{data:applications}]=await Promise.all([
    admin.from("jobs").select("id,title,company_name,status,created_at").in("status",["pending","published"]).lte("created_at",cutoff).order("created_at",{ascending:true}).limit(200),
    admin.from("job_shortlist_candidates").select("job_id,shortlist_status,released_at").eq("shortlist_status","released"),
    admin.from("applications").select("id,job_id,status,updated_at").in("status",["interview","offered"]).lte("updated_at",cutoff).order("updated_at",{ascending:true}).limit(200)
  ]);
  const candidateJobs=new Set((shortlist||[]).map((row:any)=>row.job_id)); const applicationJobs=new Set((applications||[]).map((row:any)=>row.job_id));
  const noCandidates=(jobs||[]).filter((job:any)=>!candidateJobs.has(job.id)&&!applicationJobs.has(job.id));
  const waitingClient=(jobs||[]).filter((job:any)=>candidateJobs.has(job.id)&&!applicationJobs.has(job.id));
  const sections=[
    {title:"Roles waiting for candidates",icon:UsersRound,copy:"These roles have been active for three or more days without a candidate signal.",rows:noCandidates,href:(row:any)=>`/workspace/recruiter/matching/${row.id}`,action:"Find candidates"},
    {title:"Shortlists waiting for a client",icon:Clock3,copy:"Candidates were released, but no application or stage movement has happened yet.",rows:waitingClient,href:(row:any)=>`/workspace/recruiter/matching/${row.id}`,action:"Follow up"}
  ];
  return <><div className="page-head"><div><div className="kicker">Recruiter follow-up</div><h1>Stalled work</h1><p>Focus on roles where the next handoff has been waiting for at least three days. Automated reminders are sent at most every five days.</p></div><span className="badge badge-warning">{noCandidates.length+waitingClient.length+(applications?.length||0)} items</span></div><div className="stalled-work-grid">{sections.map((section)=>{const Icon=section.icon;return <section className="card" key={section.title}><div className="dashboard-section-head"><div><div className="row wrap"><Icon size={18}/><h2>{section.title}</h2></div><p>{section.copy}</p></div><span className="stat-inline">{section.rows.length}</span></div>{section.rows.length?<div className="compact-list">{section.rows.slice(0,8).map((row:any)=><Link key={row.id} href={section.href(row)}><span><strong>{row.title}</strong><small>{row.company_name||"Client role"} · created {dateShort(row.created_at)}</small></span><span className="btn btn-sm">{section.action}<ArrowRight size={13}/></span></Link>)}</div>:<div className="empty">Nothing is waiting in this queue.</div>}</section>})}</div><section className="card" style={{marginTop:18}}><div className="dashboard-section-head"><div><div className="row wrap"><AlertCircle size={18}/><h2>Applications waiting on a decision</h2></div><p>Interview and offer-stage applications with no movement for three or more days.</p></div><span className="stat-inline">{applications?.length||0}</span></div>{applications?.length?<div className="compact-list">{applications.map((row:any)=><Link key={row.id} href={`/workspace/recruiter/matching/${row.job_id}`}><span><strong>{String(row.status).replaceAll("_"," ")} decision pending</strong><small>Last updated {dateShort(row.updated_at)}</small></span><span className="btn btn-sm">Open role <ArrowRight size={13}/></span></Link>)}</div>:<div className="empty">No delayed interviews or offers.</div>}</section></>;
}
