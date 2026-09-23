import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayCircle, ShieldCheck } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientMatchLabel } from "@/lib/matching";
import { uniqueStrings } from "@/lib/collections";
import { recordProductEvent } from "@/lib/product-events";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { CandidateAccessGate } from "@/components/candidate-access-gate";
import { maskVaName } from "@/lib/va-identity";
import { getTrainingCredentialsForUser } from "@/lib/training-credentials";
import { TrainingCredentials } from "@/components/training-credentials";

export default async function CandidateReviewPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const {userId}=await requireRoleFast("client");const admin=createAdminClient();
  const {data:summary}=await admin.from("applications").select("id,job_id,va_id,status,match_score,profile_snapshot,cover_note,jobs!inner(id,title,status,client_id)").eq("id",id).eq("jobs.client_id",userId).single();
  if(!summary)notFound();
  const job=Array.isArray(summary.jobs)?summary.jobs[0]:summary.jobs;
  const [{data:shortlist},{data:access},{count:releasedCount}]=await Promise.all([
    admin.from("job_shortlist_candidates").select("id,client_recommendation,match_score,client_decision").eq("job_id",summary.job_id).eq("va_id",summary.va_id).eq("shortlist_status","released").maybeSingle(),
    admin.from("job_candidate_access").select("*").eq("job_id",summary.job_id).maybeSingle(),
    admin.from("job_shortlist_candidates").select("id",{count:"exact",head:true}).eq("job_id",summary.job_id).eq("shortlist_status","released")
  ]);

  // Raw VA interest and applications are recruiter-only. A client can open a
  // candidate detail only after the recruiter intentionally releases that VA.
  if(!shortlist)notFound();
  if(job?.status!=="published")return <><div className="page-head"><div><Link className="text-link small" href={`/workspace/client/candidates?role=${summary.job_id}`}>← Back to shortlist</Link><h1 style={{marginTop:8}}>Candidate profile is being prepared</h1><p>Your recruiter has selected this VA, but the role is not active for client review yet.</p></div></div></>;
  if(!candidateAccessUnlocked(access?.access_status))return <><div className="page-head"><div><Link className="text-link small" href={`/workspace/client/candidates?role=${summary.job_id}`}>← Back to shortlist</Link><h1 style={{marginTop:8}}>Candidate access required</h1><p>Private hiring evidence remains protected until candidate access is active.</p></div></div><CandidateAccessGate jobId={summary.job_id} access={access} applicantCount={0} releasedCount={releasedCount||0} returnTo={`/workspace/client/candidates/${id}`}/></>;

  await recordProductEvent("candidate_viewed",{userId:userId,path:`/workspace/client/candidates/${id}`,metadata:{application_id:id,job_id:summary.job_id,recruiter_released:true}});
  try{const cutoff=new Date(Date.now()-6*60*60*1000).toISOString();const {count}=await admin.from("recruiter_activity").select("id",{count:"exact",head:true}).eq("subject_type","va").eq("subject_id",summary.va_id).eq("action","client_viewed").gte("created_at",cutoff).contains("metadata",{application_id:id});if(!count)await admin.from("recruiter_activity").insert({subject_type:"va",subject_id:summary.va_id,action:"client_viewed",description:`Client viewed recruiter-released candidate for ${job?.title||"role"}`,actor_id:userId,metadata:{application_id:id,job_id:summary.job_id}});}catch{}

  const [{data:vetting},trainingCredentials]=await Promise.all([
    admin.from("va_vetting").select("video_url").eq("va_id",summary.va_id).maybeSingle(),
    getTrainingCredentialsForUser(summary.va_id),
  ]);
  const profile:any=summary.profile_snapshot||{};const score=Number(shortlist.match_score??summary.match_score??0);

  return <>
    <div className="page-head"><div><Link className="text-link small" href={`/workspace/client/candidates?role=${summary.job_id}`}>← Back to recruiter shortlist</Link><h1 style={{marginTop:8}}>{profile.full_name?maskVaName(profile.full_name):"Vetted Virtual Assistant"}</h1><p>{profile.headline||profile.primary_category||"Virtual Assistant"} · for {job?.title}</p></div><span className="badge badge-success"><ShieldCheck size={14}/> Recruiter released</span></div>

    <div className="profile-layout">
      <article className="card candidate-review-card">
        <div className="row wrap"><span className="badge badge-success"><ShieldCheck size={14}/> Vetted VA</span><span className="badge">{clientMatchLabel(score)}</span></div>
        {shortlist.client_recommendation?<div className="info-banner" style={{marginTop:16}}><strong>Why we recommend this VA</strong><p style={{margin:"6px 0 0"}}>{shortlist.client_recommendation}</p></div>:null}
        <h2>Professional summary</h2><p className="muted profile-copy">{profile.bio||"This VA has completed our screening process. Your recruiter can provide additional role-specific context."}</p>
        {summary.cover_note?<><h2>VA interest note</h2><div className="detail-note"><p>{summary.cover_note}</p></div></>:null}
        {vetting?.video_url?<><h2>Vetting video</h2><div className="candidate-video-row"><PlayCircle size={20}/><div><strong>Recorded introduction</strong><span className="small muted">Recorded during vetting and provided as supporting evidence.</span></div><a className="btn btn-primary" href={vetting.video_url} target="_blank" rel="noopener noreferrer">Watch video</a></div></>:null}
        <div className="grid-2"><section><h2>Skills</h2><div className="pill-list">{uniqueStrings(profile.skills).length?uniqueStrings(profile.skills).map((value,index)=><span className="badge" key={`${String(value)}-${index}`}>{value}</span>):<span className="small muted">No skills listed.</span>}</div></section><section><h2>Tools</h2><div className="pill-list">{uniqueStrings(profile.tools).length?uniqueStrings(profile.tools).map((value,index)=><span className="badge" key={`${String(value)}-${index}`}>{value}</span>):<span className="small muted">No tools listed.</span>}</div></section></div>
        {uniqueStrings(profile.industries).length?<><h2>Industries</h2><div className="pill-list">{uniqueStrings(profile.industries).map((value,index)=><span className="badge" key={`${String(value)}-${index}`}>{value}</span>)}</div></>:null}
        <TrainingCredentials credentials={trainingCredentials} heading="Training completed"/>
      </article>

      <aside className="profile-sidebar stack">
        <div className="card profile-facts"><h3>Working fit</h3><div><span>Primary specialty</span><strong>{profile.primary_category||"Not set"}</strong></div><div><span>Experience</span><strong>{profile.years_experience!=null?`${profile.years_experience}+ years`:"Not set"}</strong></div><div><span>Availability</span><strong>{profile.weekly_hours?`${profile.weekly_hours} hrs/week`:"Not set"}</strong></div><div><span>Preferred rate</span><strong>{profile.hourly_rate?`USD ${profile.hourly_rate}/hr`:"Not set"}</strong></div><div><span>Schedule</span><strong>{profile.schedule||"Flexible"}</strong></div><div><span>Live overlap</span><strong>{profile.overlap_hours!=null?`${profile.overlap_hours} hrs/day`:"Flexible"}</strong></div></div>
        <div className="card stack"><strong>Next step</strong><p className="small muted">Use the recruiter shortlist to mark interest, request an interview, or pass. Final terms are prepared by your recruiter after the interview process.</p><Link className="btn btn-primary" href={`/workspace/client/candidates?role=${summary.job_id}#recruiter-shortlist`}>{shortlist.client_decision==="interview"?"Interview requested":"Back to shortlist decisions"}</Link>{shortlist.client_decision==="interview"?<Link className="btn" href="/workspace/client/interviews">Open interviews</Link>:null}</div>
        <div className="info-banner"><strong>Recruiter-managed contact</strong><p style={{margin:"6px 0 0"}}>Candidate contact details stay private during screening. Interviews and final terms are coordinated through the managed hiring workflow.</p></div>
      </aside>
    </div>
  </>;
}
