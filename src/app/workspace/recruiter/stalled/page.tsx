import Link from "next/link";
import { AlertCircle, ArrowRight, Clock3, UsersRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";
import type { JobSummaryRow } from "@/lib/workspace-rows";

type StalledShortlistRow = { job_id: string; shortlist_status: string; released_at: string | null; client_decision: string | null; created_at: string };
type StalledInterviewRow = { id: string; job_id: string; status: string; created_at: string; updated_at: string; scheduled_at: string | null; completed_at: string | null; client_feedback_at: string | null };
type StalledOfferRow = { id: string; job_id: string; status: string; created_at: string; updated_at: string };

const daysAgo = (days:number) => new Date(Date.now()-days*86400000).toISOString();

export default async function RecruiterStalledWorkPage(){
  const {user}=await requireRole("recruiter");
  const admin=createAdminClient();
  const cutoff=daysAgo(3);
  const {data:jobs}=await admin.from("jobs").select("id,title,company_name,status,created_at").eq("recruiter_id",user.id).in("status",["pending","published"]).lte("created_at",cutoff).order("created_at",{ascending:true}).limit(200);
  const jobRows=(jobs||[]) as JobSummaryRow[];
  const jobIds=jobRows.map((job)=>job.id);
  if(!jobIds.length)return <><div className="page-head"><div><div className="kicker">Recruiter follow-up</div><h1>Stalled work</h1><p>Only work you own appears here.</p></div><span className="badge badge-success">0 items</span></div><div className="card empty">No owned roles are stalled.</div></>;

  const [{data:shortlistData},{data:interviewData},{data:offerData}]=await Promise.all([
    admin.from("job_shortlist_candidates").select("job_id,shortlist_status,released_at,client_decision,created_at").in("job_id",jobIds).in("shortlist_status",["proposed","released"]),
    admin.from("candidate_interviews").select("id,job_id,status,created_at,updated_at,scheduled_at,completed_at,client_feedback_at").in("job_id",jobIds).in("status",["requested","scheduled","completed"]).order("updated_at",{ascending:true}).limit(200),
    admin.from("placement_offers").select("id,job_id,status,created_at,updated_at").in("job_id",jobIds).in("status",["pending_va","pending_client"]).lte("updated_at",cutoff).order("updated_at",{ascending:true}).limit(200)
  ]);

  const shortlist=(shortlistData||[]) as StalledShortlistRow[];
  const interviews=(interviewData||[]) as StalledInterviewRow[];
  const offers=(offerData||[]) as StalledOfferRow[];
  const jobMap=new Map(jobRows.map((job)=>[job.id,job]));
  const shortlistByJob=new Map<string,StalledShortlistRow[]>();
  for(const row of shortlist){const rows=shortlistByJob.get(row.job_id)||[];rows.push(row);shortlistByJob.set(row.job_id,rows);}
  const activeInterviewJobs=new Set(interviews.filter((row)=>row.status!=="completed"||!row.client_feedback_at).map((row)=>row.job_id));
  const activeOfferJobs=new Set(offers.map((row)=>row.job_id));

  const noCandidates=jobRows.filter((job)=>!(shortlistByJob.get(job.id)||[]).length&&!activeInterviewJobs.has(job.id)&&!activeOfferJobs.has(job.id));
  const waitingClient=jobRows.filter((job)=>{
    const released=(shortlistByJob.get(job.id)||[]).filter((row)=>row.shortlist_status==="released");
    if(!released.length||!released.some((row)=>!row.client_decision))return false;
    const oldest=released.map((row)=>row.released_at).filter(Boolean).sort()[0];
    return Boolean(oldest&&oldest<=cutoff);
  });

  const stalledInterviews=interviews.filter((row)=>{
    if(row.status==="requested")return row.created_at<=cutoff;
    if(row.status==="scheduled")return Boolean(row.scheduled_at&&row.scheduled_at<=cutoff);
    if(row.status==="completed")return !row.client_feedback_at&&Boolean((row.completed_at||row.updated_at)<=cutoff);
    return false;
  });

  const sections=[
    {title:"Roles waiting for candidates",icon:UsersRound,copy:"Owned roles active for three or more days with no recruiter shortlist, interview, or offer in progress.",rows:noCandidates,href:(row:JobSummaryRow)=>`/workspace/recruiter/matching/${row.id}`,action:"Find candidates"},
    {title:"Shortlists waiting for a client",icon:Clock3,copy:"Released candidates still have unanswered client decisions after three or more days.",rows:waitingClient,href:(row:JobSummaryRow)=>`/workspace/recruiter/matching/${row.id}`,action:"Follow up"}
  ];
  const stalledCount=noCandidates.length+waitingClient.length+stalledInterviews.length+offers.length;

  return <>
    <div className="page-head"><div><div className="kicker">Recruiter follow-up</div><h1>Stalled work</h1><p>Only work you own appears here. This view uses the actual shortlist, interview, and placement-offer records rather than legacy application stages.</p></div><span className="badge badge-warning">{stalledCount} items</span></div>
    <div className="stalled-work-grid">{sections.map((section)=>{const Icon=section.icon;return <section className="card" key={section.title}><div className="dashboard-section-head"><div><div className="row wrap"><Icon size={18}/><h2>{section.title}</h2></div><p>{section.copy}</p></div><span className="stat-inline">{section.rows.length}</span></div>{section.rows.length?<div className="compact-list">{section.rows.slice(0,8).map((row)=><Link key={row.id} href={section.href(row)}><span><strong>{row.title}</strong><small>{row.company_name||"Client role"} · created {dateShort(row.created_at)}</small></span><span className="btn btn-sm">{section.action}<ArrowRight size={13}/></span></Link>)}</div>:<div className="empty">Nothing is waiting in this queue.</div>}</section>})}</div>

    <div className="grid-2" style={{marginTop:18}}>
      <section className="card"><div className="dashboard-section-head"><div><div className="row wrap"><AlertCircle size={18}/><h2>Interviews needing intervention</h2></div><p>Requested interviews not scheduled, past interview times not completed, or completed interviews missing client feedback for three or more days.</p></div><span className="stat-inline">{stalledInterviews.length}</span></div>{stalledInterviews.length?<div className="compact-list">{stalledInterviews.map((row)=>{const job=jobMap.get(row.job_id);const label=row.status==="requested"?"Interview still unscheduled":row.status==="scheduled"?"Interview time passed":"Interview feedback overdue";return <Link key={row.id} href={`/workspace/recruiter/matching/${row.job_id}`}><span><strong>{label}</strong><small>{job?.title||"Client role"} · last updated {dateShort(row.updated_at)}</small></span><span className="btn btn-sm">Open interview <ArrowRight size={13}/></span></Link>})}</div>:<div className="empty">No delayed interviews.</div>}</section>

      <section className="card"><div className="dashboard-section-head"><div><div className="row wrap"><AlertCircle size={18}/><h2>Offers waiting on acceptance</h2></div><p>Recruiter-prepared placement offers waiting on the VA or client for three or more days.</p></div><span className="stat-inline">{offers.length}</span></div>{offers.length?<div className="compact-list">{offers.map((row)=>{const job=jobMap.get(row.job_id);return <Link key={row.id} href={`/workspace/recruiter/matching/${row.job_id}`}><span><strong>{row.status==="pending_va"?"Waiting for VA acceptance":"Waiting for client confirmation"}</strong><small>{job?.title||"Client role"} · last updated {dateShort(row.updated_at)}</small></span><span className="btn btn-sm">Open offer <ArrowRight size={13}/></span></Link>})}</div>:<div className="empty">No delayed offers.</div>}</section>
    </div>
  </>;
}
