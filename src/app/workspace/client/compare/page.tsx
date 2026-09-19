import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientMatchLabel } from "@/lib/matching";
import { uniqueStrings } from "@/lib/collections";

type CompareProfileSnapshot = { full_name?: string | null; headline?: string | null; primary_category?: string | null; hourly_rate?: number | null; weekly_hours?: number | null; overlap_hours?: number | null; years_experience?: number | null; schedule?: string | null; skills?: string[] | null; tools?: string[] | null };
type CompareApplication = { id: string; job_id: string; va_id: string; match_score: number | null; profile_snapshot: CompareProfileSnapshot | null; jobs: { id: string; title: string | null; status: string; client_id: string } | null };
type ApplicationSummary = Pick<CompareApplication, "id" | "job_id" | "va_id" | "jobs">;
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { maskVaName } from "@/lib/va-identity";

export default async function CompareCandidatesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const query=await searchParams;const {user}=await requireRole("client");const admin=createAdminClient();const raw=Array.isArray(query.ids)?query.ids:query.ids?[query.ids]:[];const ids=raw.filter(Boolean).slice(0,4);
  let candidates:CompareApplication[]=[];let excludedCount=0;
  if(ids.length){
    const {data:summaryData}=await admin.from("applications").select("id,job_id,va_id,jobs!inner(id,title,status,client_id)").in("id",ids).eq("jobs.client_id",user.id);
    const summaries=(summaryData||[]) as unknown as ApplicationSummary[];
    const jobIds=[...new Set(summaries.map((row)=>String(row.job_id)).filter(Boolean))];
    const [{data:accessRows},{data:releasedRows}]=jobIds.length?await Promise.all([
      admin.from("job_candidate_access").select("job_id,access_status").in("job_id",jobIds),
      admin.from("job_shortlist_candidates").select("job_id,va_id").in("job_id",jobIds).eq("shortlist_status","released")
    ]):[{data:[]},{data:[]}];
    const accessMap=new Map(((accessRows||[]) as {job_id:string;access_status:string|null}[]).map((row)=>[row.job_id,row.access_status]));const releasedSet=new Set(((releasedRows||[]) as {job_id:string;va_id:string}[]).map((row)=>`${row.job_id}:${row.va_id}`));
    const allowedIds=summaries.filter((row)=>row.jobs?.status==="published"&&candidateAccessUnlocked(accessMap.get(row.job_id))&&releasedSet.has(`${row.job_id}:${row.va_id}`)).map((row)=>row.id);
    excludedCount=summaries.length-allowedIds.length;
    if(allowedIds.length){const {data}=await admin.from("applications").select("*,jobs!inner(id,title,status,client_id)").in("id",allowedIds).eq("jobs.client_id",user.id);candidates=(data||[]) as unknown as CompareApplication[];}
  }
  const jobTitles=new Set(candidates.map((candidate)=>candidate.jobs?.title).filter(Boolean));
  return <>
    <div className="page-head"><div><div className="row wrap"><Link className="text-link small" href="/workspace/client/candidates">← Recruiter shortlist</Link></div><h1>Compare shortlisted candidates</h1><p>Compare evidence only for candidates your recruiter has intentionally released for client review.</p></div></div>
    {excludedCount?<div className="alert" style={{marginBottom:16}}>{excludedCount} selected candidate{excludedCount===1?" was":"s were"} excluded because they were not released by your recruiter or the role is not ready for client review.</div>:null}
    {candidates.length<2?<div className="card empty"><p>Select at least two recruiter-released candidates.</p><Link className="btn btn-primary" href="/workspace/client/candidates">Return to shortlist</Link></div>:<>
      {jobTitles.size>1?<div className="alert" style={{marginBottom:16}}>You selected candidates from different roles. Each fit label is based on that candidate&apos;s own hiring request.</div>:null}
      <div className="compare-grid">{candidates.map((application)=>{const profile:CompareProfileSnapshot=application.profile_snapshot||{};const score=Number(application.match_score||0);return <article className="card stack" key={application.id}>
        <div><span className="badge">Recruiter released</span><h2 style={{margin:"10px 0 2px"}}>{profile.full_name?maskVaName(profile.full_name):"Vetted Virtual Assistant"}</h2><p className="muted" style={{margin:0}}>{profile.headline||profile.primary_category||"Virtual Assistant"}</p></div>
        <div className="compare-score"><strong>{clientMatchLabel(score)}</strong><span>Recruiter screening aid, shown as a qualitative fit</span></div>
        <dl className="compare-facts"><div><dt>Role</dt><dd>{application.jobs?.title||"Not set"}</dd></div><div><dt>Experience</dt><dd>{profile.years_experience!=null?`${profile.years_experience} years`:"Not set"}</dd></div><div><dt>Availability</dt><dd>{profile.weekly_hours?`${profile.weekly_hours} hrs/week`:"Not set"}</dd></div><div><dt>Preferred rate</dt><dd>{profile.hourly_rate?`USD ${profile.hourly_rate}/hr`:"Not set"}</dd></div><div><dt>Schedule</dt><dd>{profile.schedule||"Not set"}</dd></div><div><dt>Overlap</dt><dd>{profile.overlap_hours!=null?`${profile.overlap_hours} hrs/day`:"Not set"}</dd></div></dl>
        <div><strong className="small">Skills</strong><div className="pill-list" style={{marginTop:7}}>{uniqueStrings(profile.skills).slice(0,8).map((value,index)=><span className="badge" key={`${String(value)}-${index}`}>{value}</span>)}</div></div>
        <div><strong className="small">Tools</strong><div className="pill-list" style={{marginTop:7}}>{uniqueStrings(profile.tools).slice(0,8).map((value,index)=><span className="badge" key={`${String(value)}-${index}`}>{value}</span>)}</div></div>
        <Link className="btn btn-primary" href={`/workspace/client/candidates/${application.id}`}>Review evidence</Link>
      </article>})}</div>
    </>}
  </>;
}
