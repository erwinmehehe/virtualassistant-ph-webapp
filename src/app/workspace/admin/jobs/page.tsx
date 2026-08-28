import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { autoQuoteStraightforwardJobsFormAction } from "@/app/actions/admin";
import { dateShort, money } from "@/lib/format";
import { candidateAccessLabel, candidateAccessUnlocked } from "@/lib/candidate-access";
import { uniqueStrings } from "@/lib/collections";
export default async function AdminJobsPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }){
  const params = await searchParams;
  await requireRole("admin");const admin=createAdminClient();
  const [{data:jobs},{data:commercials},{data:accessRows},{data:shortlistRows}]=await Promise.all([admin.from("jobs").select("*").order("created_at",{ascending:false}).limit(100),admin.from("job_commercials").select("*"),admin.from("job_candidate_access").select("job_id,access_status,access_fee"),admin.from("job_shortlist_candidates").select("job_id,shortlist_status")]);
  const cm=new Map((commercials||[]).map((x:any)=>[x.job_id,x]));
  const am=new Map((accessRows||[]).map((x:any)=>[x.job_id,x]));
  const sm=new Map<string,number>();for(const row of shortlistRows||[]){if(row.shortlist_status==="released")sm.set(row.job_id,(sm.get(row.job_id)||0)+1);}
  const eligibleForAutoQuote=(jobs||[]).filter((j:any)=>j.status==="pending"&&j.service_model!=="managed_service"&&j.client_id&&(!cm.has(j.id)||(cm.get(j.id) as any)?.commercial_status==="quoted")).length;
  return <><div className="page-head"><div><h1>Job review</h1><p>Open the full role evidence, confirm feasibility, then send the service fee for client acceptance before publication.</p></div></div>
    {params.auto_quoted?<div className="alert alert-success" style={{marginBottom:16}}>Published {params.auto_quoted} job{params.auto_quoted==="1"?"":"s"} (free for each client's first placement, the default fee after that), matches run automatically.{Number(params.skipped_managed)?` ${params.skipped_managed} managed-service job(s) still need a manual markup decision.`:""}{Number(params.skipped_unlinked)?` ${params.skipped_unlinked} unlinked-lead job(s) can't publish until the client creates an account.`:""}</div>:null}
    {params.auto_quote_error==="no_default_fee"?<div className="alert" style={{marginBottom:16}}>Set a default placement fee in Marketplace settings before auto-publishing.</div>:null}
    <div className="card" style={{marginBottom:18}}>
      <h3 style={{marginTop:0}}>Auto-publish straightforward jobs</h3>
      <p className="small muted" style={{marginBottom:14}}>Publishes immediately &mdash; no client acceptance click required &mdash; for pending curated-placement jobs that already have a client account linked. A client's first placement is free (founding-cohort offer); the default placement fee applies after that. Managed-service jobs and unlinked leads still need manual review.</p>
      <form action={autoQuoteStraightforwardJobsFormAction}>
        <button className="btn btn-primary btn-sm" type="submit" disabled={!eligibleForAutoQuote}>Auto-publish {eligibleForAutoQuote} eligible job{eligibleForAutoQuote===1?"":"s"}</button>
      </form>
    </div>
    <div className="stack">{jobs?.length?jobs.map((j:any)=>{const c=cm.get(j.id) as any;return <div className="card" key={j.id}><div className="row-between wrap"><div><div className="row wrap"><span className={`badge ${j.status==="published"?"badge-success":j.status==="pending"?"badge-warning":""}`}>{j.status}</span><span className="badge">{j.service_model==="managed_service"?"Managed service":"Curated placement"}</span>{c?<span className="badge">Fee: {String(c.commercial_status).replaceAll("_"," ")}</span>:null}{am.get(j.id)?<span className={`badge ${candidateAccessUnlocked((am.get(j.id) as any)?.access_status)?"badge-success":(am.get(j.id) as any)?.access_status==="requested"?"badge-warning":""}`}>Candidate access: {candidateAccessLabel((am.get(j.id) as any)?.access_status)}</span>:null}{sm.get(j.id)?<span className="badge">{sm.get(j.id)} released match{sm.get(j.id)===1?"":"es"}</span>:null}<span className="small muted">{dateShort(j.created_at)}</span></div><h3 style={{margin:"8px 0 4px"}}>{j.title}</h3><div className="small muted">{j.company_name||"Client"} · {j.hours_per_week?`${j.hours_per_week} hrs/week`:"Flexible"} · VA pay from {money(j.min_hourly_rate)}/hr</div></div><Link className="btn btn-primary btn-sm" href={`/workspace/admin/jobs/${j.id}`}>{j.status==="pending"?"Review evidence":"View role"}</Link></div><p className="muted">{j.summary||"No summary provided."}</p><div className="pill-list">{uniqueStrings(j.categories).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div></div>}):<div className="card empty">No jobs found.</div>}</div></>;
}
