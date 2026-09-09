import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { matchLabel } from "@/lib/matching";
import { uniqueStrings } from "@/lib/collections";


export default async function CompareCandidatesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const query=await searchParams; const {user}=await requireRole("client"); const admin=createAdminClient();
  const raw=Array.isArray(query.ids)?query.ids:query.ids?[query.ids]:[]; const ids=raw.filter(Boolean).slice(0,4);
  let candidates:any[]=[]; let lockedCount=0;
  if(ids.length){
    const {data:summaries}=await admin.from("applications").select("id,job_id,jobs!inner(id,title,client_id)").in("id",ids).eq("jobs.client_id",user.id);
    const jobIds=[...new Set((summaries||[]).map((a:any)=>a.job_id))];
    const {data:accessRows}=jobIds.length?await admin.from("job_candidate_access").select("job_id,access_status").in("job_id",jobIds):{data:[]};
    const accessMap=new Map<string,string>((accessRows||[]).map((row:any)=>[String(row.job_id),String(row.access_status)] as [string,string]));
    const allowedIds=(summaries||[]).filter((a:any)=>candidateAccessUnlocked(accessMap.get(a.job_id))).map((a:any)=>a.id);
    lockedCount=(summaries||[]).length-allowedIds.length;
    if(allowedIds.length){const {data}=await admin.from("applications").select("*,jobs!inner(id,title,client_id)").in("id",allowedIds).eq("jobs.client_id",user.id); candidates=data||[];}
  }
  const jobTitles=new Set(candidates.map((c)=>c.jobs?.title).filter(Boolean));
  return <>
    <div className="page-head"><div><div className="row wrap"><Link className="text-link small" href="/workspace/client/candidates">← Candidates</Link></div><h1>Compare candidates</h1><p>Compare evidence, availability, and role fit for candidates whose profile access is active.</p></div></div>
    {lockedCount?<div className="alert" style={{marginBottom:16}}><LockKeyhole size={16}/> {lockedCount} selected candidate{lockedCount===1?" was":"s were"} excluded because candidate access is still locked for that role.</div>:null}
    {candidates.length<2?<div className="card empty"><p>Select at least two unlocked candidates from the Candidates page.</p><Link className="btn btn-primary" href="/workspace/client/candidates">Choose candidates</Link></div>:<>
      {jobTitles.size>1?<div className="alert" style={{marginBottom:16}}>You selected candidates from different roles. Compare their experience carefully because each fit score was calculated against its own job.</div>:null}
      <div className="compare-grid">{candidates.map((a:any)=>{const p=a.profile_snapshot||{};const score=Number(a.match_score||0);return <article className="card stack" key={a.id}><div><span className="badge">{String(a.status).replaceAll("_"," ")}</span><h2 style={{margin:"10px 0 2px"}}>{p.full_name||"Virtual Assistant applicant"}</h2><p className="muted" style={{margin:0}}>{p.headline||p.primary_category||"Virtual Assistant"}</p></div><div className="compare-score"><strong>{matchLabel(score)}</strong><span>{score}/100 role fit</span></div><dl className="compare-facts"><div><dt>Role</dt><dd>{a.jobs?.title||"Not set"}</dd></div><div><dt>Experience</dt><dd>{p.years_experience!=null?`${p.years_experience} years`:"Not set"}</dd></div><div><dt>Availability</dt><dd>{p.weekly_hours?`${p.weekly_hours} hrs/week`:"Not set"}</dd></div><div><dt>Preferred rate</dt><dd>{p.hourly_rate?`USD ${p.hourly_rate}/hr`:"Not set"}</dd></div><div><dt>Schedule</dt><dd>{p.schedule||"Not set"}</dd></div><div><dt>Overlap</dt><dd>{p.overlap_hours!=null?`${p.overlap_hours} hrs/day`:"Not set"}</dd></div></dl><div><strong className="small">Skills</strong><div className="pill-list" style={{marginTop:7}}>{uniqueStrings(p.skills).slice(0,8).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div></div><div><strong className="small">Tools</strong><div className="pill-list" style={{marginTop:7}}>{uniqueStrings(p.tools).slice(0,8).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div></div><div><strong className="small">Application note</strong><p className="small muted">{a.cover_note||"No note."}</p></div><Link className="btn btn-primary" href={`/workspace/client/candidates/${a.id}`}>Review full profile</Link></article>})}</div>
    </>}
  </>;
}
