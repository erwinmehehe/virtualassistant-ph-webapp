import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchLabel } from "@/lib/matching";
import { uniqueStrings } from "@/lib/collections";

export default async function CompareCandidatesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const query=await searchParams;
  const {user}=await requireRole("client");
  const admin=createAdminClient();
  const raw=Array.isArray(query.ids)?query.ids:query.ids?[query.ids]:[];
  const ids=raw.filter(Boolean).slice(0,4);

  let candidates:any[]=[];
  let excludedCount=0;
  if(ids.length){
    const {data:summaries}=await admin.from("applications")
      .select("id,job_id,jobs!inner(id,title,status,client_id)")
      .in("id",ids)
      .eq("jobs.client_id",user.id);
    const allowedIds=(summaries||[]).filter((row:any)=>row.jobs?.status==="published").map((row:any)=>row.id);
    excludedCount=(summaries||[]).length-allowedIds.length;
    if(allowedIds.length){
      const {data}=await admin.from("applications")
        .select("*,jobs!inner(id,title,status,client_id)")
        .in("id",allowedIds)
        .eq("jobs.client_id",user.id);
      candidates=data||[];
    }
  }

  const jobTitles=new Set(candidates.map((candidate)=>candidate.jobs?.title).filter(Boolean));
  return <>
    <div className="page-head"><div><div className="row wrap"><Link className="text-link small" href="/workspace/client/candidates">← Candidates</Link></div><h1>Compare candidates</h1><p>Compare evidence, availability, and role fit for candidates attached to approved hiring requests.</p></div></div>
    {excludedCount?<div className="alert" style={{marginBottom:16}}>{excludedCount} selected candidate{excludedCount===1?" was":"s were"} excluded because that role is still in review.</div>:null}
    {candidates.length<2?<div className="card empty"><p>Select at least two candidates from approved roles.</p><Link className="btn btn-primary" href="/workspace/client/candidates">Choose candidates</Link></div>:<>
      {jobTitles.size>1?<div className="alert" style={{marginBottom:16}}>You selected candidates from different roles. Each fit score was calculated against its own hiring request.</div>:null}
      <div className="compare-grid">{candidates.map((application:any)=>{const profile=application.profile_snapshot||{};const score=Number(application.match_score||0);return <article className="card stack" key={application.id}>
        <div><span className="badge">{String(application.status).replaceAll("_"," ")}</span><h2 style={{margin:"10px 0 2px"}}>{profile.full_name||"Virtual Assistant applicant"}</h2><p className="muted" style={{margin:0}}>{profile.headline||profile.primary_category||"Virtual Assistant"}</p></div>
        <div className="compare-score"><strong>{matchLabel(score)}</strong><span>{score}/100 role fit</span></div>
        <dl className="compare-facts"><div><dt>Role</dt><dd>{application.jobs?.title||"Not set"}</dd></div><div><dt>Experience</dt><dd>{profile.years_experience!=null?`${profile.years_experience} years`:"Not set"}</dd></div><div><dt>Availability</dt><dd>{profile.weekly_hours?`${profile.weekly_hours} hrs/week`:"Not set"}</dd></div><div><dt>Preferred rate</dt><dd>{profile.hourly_rate?`USD ${profile.hourly_rate}/hr`:"Not set"}</dd></div><div><dt>Schedule</dt><dd>{profile.schedule||"Not set"}</dd></div><div><dt>Overlap</dt><dd>{profile.overlap_hours!=null?`${profile.overlap_hours} hrs/day`:"Not set"}</dd></div></dl>
        <div><strong className="small">Skills</strong><div className="pill-list" style={{marginTop:7}}>{uniqueStrings(profile.skills).slice(0,8).map((value,index)=><span className="badge" key={`${String(value)}-${index}`}>{value}</span>)}</div></div>
        <div><strong className="small">Tools</strong><div className="pill-list" style={{marginTop:7}}>{uniqueStrings(profile.tools).slice(0,8).map((value,index)=><span className="badge" key={`${String(value)}-${index}`}>{value}</span>)}</div></div>
        <div><strong className="small">Application note</strong><p className="small muted">{application.cover_note||"No note."}</p></div>
        <Link className="btn btn-primary" href={`/workspace/client/candidates/${application.id}`}>Review full profile</Link>
      </article>})}</div>
    </>}
  </>;
}
