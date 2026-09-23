import Link from "next/link";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminJobRow = { id: string; title: string | null; company_name: string | null; status: string; service_model: string | null; client_id: string | null; recruiter_id: string | null; hours_per_week: number | null; min_hourly_rate: number | null; created_at: string; summary: string | null; responsibilities: string[] | null; required_skills: string[] | null; timezone: string | null; start_timing: string | null };
type JobCommercialRow = { job_id: string; commercial_status: string | null };
import { dateShort, money } from "@/lib/format";
import { publicationBlocker } from "@/lib/job-publication";

export default async function AdminJobsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  await requireRoleFast("admin");
  const admin=createAdminClient();
  const showAll=params.view==="all";
  const [{data:jobs},{data:commercials},{data:recruiters}]=await Promise.all([
    admin.from("jobs").select("*").order("created_at",{ascending:false}).limit(200),
    admin.from("job_commercials").select("*"),
    admin.from("profiles").select("id,full_name").eq("role","recruiter")
  ]);
  const cm=new Map(((commercials||[]) as JobCommercialRow[]).map((row)=>[row.job_id,row]));
  const recruiterMap=new Map(((recruiters||[]) as {id:string;full_name:string|null}[]).map((row)=>[row.id,row.full_name||"Recruiter"]));
  const rows=(jobs||[]) as AdminJobRow[];
  const exceptions=rows.filter((job)=>{
    const commercial=cm.get(job.id);
    if(job.status==="closed"||job.status==="draft")return false;
    const publication=publicationBlocker(job,commercial);
    if(publication.key==="needs_role_details")return true;
    if(job.service_model==="managed_service"&&job.status==="pending"&&commercial?.commercial_status!=="accepted")return true;
    return false;
  });
  const visible=showAll?rows:exceptions;
  const standardPending=rows.filter((job)=>job.status==="pending"&&job.service_model!=="managed_service"&&!cm.has(job.id)).length;
  const unlinked=rows.filter((job)=>job.status==="pending"&&!job.client_id).length;
  const incomplete=rows.filter((job)=>job.status!=="closed"&&job.status!=="draft"&&publicationBlocker(job,cm.get(job.id)).key==="needs_role_details").length;

  return <>
    <div className="page-head"><div><div className="kicker">Admin by exception</div><h1>Job exceptions</h1><p>Recruiters own normal curated placements. Admin steps in only for managed-service commercial decisions and unusual exceptions.</p></div><div className="row wrap"><Link className={`btn ${!showAll?"btn-primary":""}`} href="/workspace/admin/jobs">Exceptions ({exceptions.length})</Link><Link className={`btn ${showAll?"btn-primary":""}`} href="/workspace/admin/jobs?view=all">All roles</Link></div></div>

    <div className="grid-4" style={{marginBottom:18}}>
      <div className="card"><div className="small muted">Admin exceptions</div><strong style={{fontSize:28}}>{exceptions.length}</strong><p className="small muted">Incomplete roles or managed-service decisions</p></div>
      <div className="card"><div className="small muted">Needs role details</div><strong style={{fontSize:28}}>{incomplete}</strong><p className="small muted">Open the role and complete only confirmed client details</p></div>
      <div className="card"><div className="small muted">Recruiter-owned standard terms</div><strong style={{fontSize:28}}>{standardPending}</strong><p className="small muted">These belong in recruiter My Day, not this queue</p></div>
      <div className="card"><div className="small muted">Client account not linked</div><strong style={{fontSize:28}}>{unlinked}</strong><p className="small muted">Recruiter follows up with the lead or closes the stale role</p></div>
    </div>

    {!showAll?<div className="info-banner" style={{marginBottom:18}}><strong>Normal curated roles are intentionally hidden.</strong><p style={{margin:"6px 0 0"}}>The assigned recruiter qualifies the brief, prepares the standard placement terms, and follows client approval. Admin should not become a routine bottleneck.</p></div>:null}

    <div className="stack">{visible.length?visible.map((job)=>{const commercial=cm.get(job.id);const owner=job.recruiter_id?recruiterMap.get(job.recruiter_id):null;const publication=publicationBlocker(job,commercial);return <article className="card" key={job.id}>
      <div className="row-between wrap"><div><div className="row wrap"><span className={`badge ${job.status==="published"?"badge-success":job.status==="pending"?"badge-warning":""}`}>{job.status==="published"?"Recruiting":job.status}</span><span className={`badge ${publication.key==="published"?"badge-success":["waiting_client_approval","needs_role_details"].includes(publication.key)?"badge-warning":""}`}>{publication.label}</span><span className={`badge ${job.service_model==="managed_service"?"badge-warning":""}`}>{job.service_model==="managed_service"?"Managed service":"Curated placement"}</span>{commercial?<span className="badge">Terms: {String(commercial.commercial_status).replaceAll("_"," ")}</span>:null}<span className="small muted">{dateShort(job.created_at)}</span></div><h3 style={{margin:"8px 0 4px"}}>{job.title}</h3><div className="small muted">{job.company_name||"Client"} · {job.hours_per_week?`${job.hours_per_week} hrs/week`:"Hours not set"} · VA pay from {money(job.min_hourly_rate)}/hr · Owner: {owner||"Unassigned"}</div><div className="small muted" style={{marginTop:6}}>{publication.detail}</div></div><Link className="btn btn-primary btn-sm" href={`/workspace/admin/jobs/${job.id}`}>{publication.key==="needs_role_details"?"Complete role":job.service_model==="managed_service"&&job.status==="pending"?"Resolve exception":"View role"}</Link></div>
      {job.service_model==="managed_service"&&job.status==="pending"&&!commercial?<div className="alert" style={{marginTop:12}}><strong>Admin decision required:</strong> set the managed-service margin and send terms to the client.</div>:null}
      {showAll&&job.service_model!=="managed_service"&&job.status==="pending"&&!commercial?<div className="small muted" style={{marginTop:10}}>Waiting on assigned recruiter to complete the role quality gate and prepare standard terms.</div>:null}
    </article>}):<div className="card empty"><strong>No admin job exceptions.</strong><p>That is the desired state. Recruiters can keep standard curated placements moving without an admin click.</p></div>}</div>
  </>;
}
