import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientMatchLabel } from "@/lib/matching";
import { clientShortlistDecisionAction } from "@/app/actions/client-shortlist";
import { candidateAccessUnlocked } from "@/lib/candidate-access";

type ClientJobRow = { id: string; title: string | null; status: string; created_at: string };
type ReleasedCandidateRow = { id: string; job_id: string; va_id: string; match_score: number | null; released_at: string | null; client_recommendation: string | null; client_decision: string | null; client_decision_note: string | null; client_decision_at: string | null };
type ShortlistVaRow = { user_id: string; slug: string | null; headline: string | null; primary_category: string | null; weekly_hours: number | null; hourly_rate: number | null; skills: string[] | null; tools: string[] | null; years_experience: number | null; schedule: string | null; overlap_hours: number | null };

export default async function ClientCandidatesPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const query=await searchParams;const {user}=await requireRole("client");const supabase=await createClient();const admin=createAdminClient();
  const {data:jobs}=await supabase.from("jobs").select("id,title,status,created_at").eq("client_id",user.id).order("created_at",{ascending:false});
  const jobRows=(jobs||[]) as ClientJobRow[];const jobIds=jobRows.map((job)=>job.id);
  if(!jobIds.length)return <><div className="page-head"><div><h1>Your shortlist</h1><p>Our recruiting team screens and recommends candidates against a real hiring request.</p></div></div><div className="card empty"><p>Start with a hiring request so we have a role to recruit against.</p><Link className="btn btn-primary" href="/workspace/client/jobs/new">Start a hiring request</Link></div></>;

  const activeJobs=jobRows.filter((job)=>job.status!=="closed");const selectedJob=activeJobs.find((job)=>job.id===query.role)||activeJobs[0]||null;
  const [{data:releasedData},{data:accessRows},{data:interviewData},{data:offerData}]=await Promise.all([
    admin.from("job_shortlist_candidates").select("id,job_id,va_id,match_score,released_at,client_recommendation,client_decision,client_decision_note,client_decision_at").in("job_id",jobIds).eq("shortlist_status","released").order("released_at",{ascending:false}),
    admin.from("job_candidate_access").select("job_id,access_status").in("job_id",jobIds),
    admin.from("candidate_interviews").select("id,job_id,va_id,status,client_decision").in("job_id",jobIds).neq("status","cancelled"),
    admin.from("placement_offers").select("id,job_id,va_id,status").in("job_id",jobIds)
  ]);
  const releasedRows=(releasedData||[]) as ReleasedCandidateRow[];
  const interviews=(interviewData||[]) as {id:string;job_id:string;va_id:string;status:string;client_decision:string|null}[];
  const offers=(offerData||[]) as {id:string;job_id:string;va_id:string;status:string}[];
  const accessMap=new Map(((accessRows||[]) as {job_id:string;access_status:string|null}[]).map((row)=>[row.job_id,row.access_status]));
  const selectedReleased=releasedRows.filter((row)=>row.job_id===selectedJob?.id);const selectedPublished=selectedJob?.status==="published";const selectedAccessUnlocked=selectedJob?candidateAccessUnlocked(accessMap.get(selectedJob.id)):false;

  if(selectedJob&&selectedPublished&&selectedAccessUnlocked&&selectedReleased.length){try{const cutoff=new Date(Date.now()-6*60*60*1000).toISOString();const {count}=await admin.from("recruiter_activity").select("id",{count:"exact",head:true}).eq("subject_type","job").eq("subject_id",selectedJob.id).eq("action","client_shortlist_viewed").eq("actor_id",user.id).gte("created_at",cutoff);if(!count)await admin.from("recruiter_activity").insert({subject_type:"job",subject_id:selectedJob.id,action:"client_shortlist_viewed",description:"Client viewed the recruiter-curated shortlist",actor_id:user.id,metadata:{released_count:selectedReleased.length}});}catch{}}

  const releasedVaIds=selectedPublished&&selectedAccessUnlocked?[...new Set(selectedReleased.map((row)=>row.va_id))]:[];
  const [{data:profiles},{data:vas}]=releasedVaIds.length?await Promise.all([
    admin.from("profiles").select("id,full_name").in("id",releasedVaIds),
    admin.from("va_profiles").select("user_id,slug,headline,primary_category,weekly_hours,hourly_rate,skills,tools,years_experience,schedule,overlap_hours").in("user_id",releasedVaIds)
  ]):[{data:[]},{data:[]}];
  const profileMap=new Map(((profiles||[]) as {id:string;full_name:string|null}[]).map((row)=>[row.id,row]));const vaMap=new Map(((vas||[]) as ShortlistVaRow[]).map((row)=>[row.user_id,row]));

  const activeOffers=offers.filter((row)=>["pending_va","pending_client"].includes(row.status)).length;const activeInterviews=interviews.filter((row)=>["requested","scheduled"].includes(row.status)&&!row.client_decision).length;const remaining=selectedReleased.filter((row)=>!row.client_decision).length;const interested=selectedReleased.filter((row)=>row.client_decision==="interested").length;const allPassed=selectedReleased.length>0&&selectedReleased.every((row)=>row.client_decision==="pass");
  const next=activeOffers?{title:`${activeOffers} placement offer${activeOffers===1?"":"s"} needs attention`,copy:"Review recruiter-prepared final terms. The VA accepts first, then you confirm the placement.",href:"/workspace/client/offers",label:"Review offers",waiting:"Waiting on you"}:activeInterviews?{title:`${activeInterviews} interview${activeInterviews===1?"":"s"} to manage`,copy:"Choose or review interview times and keep the hiring decision moving.",href:"/workspace/client/interviews",label:"Open interviews",waiting:"Waiting on you"}:remaining?{title:`${remaining} shortlist decision${remaining===1?"":"s"} remaining`,copy:"Mark each recruiter-selected VA as interested, request an interview, or pass.",href:selectedJob?`/workspace/client/candidates?role=${encodeURIComponent(selectedJob.id)}#recruiter-shortlist`:"/workspace/client/candidates",label:"Review shortlist",waiting:"Waiting on you"}:interested?{title:"Your recruiter has your feedback",copy:"You marked a candidate as interested. Our recruiting team will coordinate the appropriate next step.",href:"/workspace/client/interviews",label:"View interviews",waiting:"Waiting on our recruiting team"}:allPassed?{title:"We’re finding replacement options",copy:"You passed on the current shortlist. Your recruiter can now bring forward better-matched alternatives.",href:"/workspace/client/jobs",label:"View role",waiting:"Waiting on our recruiting team"}:{title:"We’re screening the vetted pool",copy:"Your recruiter is reviewing fit, evidence, rate, schedule, and capacity before anyone is presented to you.",href:"/workspace/client/jobs",label:"View role progress",waiting:"Waiting on our recruiting team"};

  return <>
    <div className="page-head"><div><h1>Your recruiter shortlist</h1><p>Only candidates selected by our recruiting team appear here. You do not need to sort through raw applicants.</p></div></div>
    <section className="candidate-next-action"><div className="candidate-next-icon"><Sparkles size={21}/></div><div><span className="small">Your next action</span><h2>{next.title}</h2><p>{next.copy}</p><small className="muted">{next.waiting}</small></div><Link className="btn btn-primary" href={next.href}>{next.label}<ArrowRight size={16}/></Link></section>

    {activeJobs.length>1?<div className="row wrap" style={{marginBottom:16}}><span className="small muted">Role:</span>{activeJobs.slice(0,8).map((job)=><Link key={job.id} className={`btn btn-sm ${selectedJob?.id===job.id?"btn-primary":""}`} href={`/workspace/client/candidates?role=${encodeURIComponent(job.id)}`}>{job.title}</Link>)}</div>:null}

    <section className="card dashboard-section-card" id="recruiter-shortlist">
      <div className="dashboard-section-head"><div><h2>Recruiter shortlist{selectedJob?` for ${selectedJob.title}`:""}</h2><p>We have already screened these VAs. Your feedback goes back to the recruiting team so we can coordinate the next step.</p></div></div>
      {selectedReleased.length?(selectedPublished&&selectedAccessUnlocked?<div className="grid-3 browse-va-grid">{selectedReleased.map((row)=>{const profile=profileMap.get(row.va_id);const va=vaMap.get(row.va_id);const decision=String(row.client_decision||"");return <article className="card browse-va-card" key={row.va_id}>
        <div className="row-between wrap"><div><strong>{profile?.full_name||"Matched Virtual Assistant"}</strong><div className="small muted">{va?.headline||va?.primary_category||"Virtual Assistant"}</div></div><span className="badge">{clientMatchLabel(Number(row.match_score||0))}</span></div>
        <div className="small muted browse-va-facts">{va?.years_experience!=null?`${va.years_experience}+ yrs experience · `:""}{va?.weekly_hours?`${va.weekly_hours} hrs/week`:"Flexible hours"}{va?.hourly_rate?` · $${Number(va.hourly_rate).toFixed(2)}/hr`:""}</div>
        <div className="pill-list">{[...(va?.skills||[]),...(va?.tools||[])].slice(0,4).map((item,index)=><span className="badge" key={`${item}-${index}`}>{item}</span>)}</div>
        {row.client_recommendation?<div className="info-banner"><strong>Why we recommend this VA</strong><p style={{margin:"6px 0 0"}}>{row.client_recommendation}</p></div>:<div className="info-banner"><strong>Recruiter reviewed</strong><p style={{margin:"6px 0 0"}}>This VA passed our internal screening for this role. Ask your recruiter if you want more context before deciding.</p></div>}
        <div className="row wrap browse-va-actions">{va?.slug?<Link className="btn btn-sm" href={`/va/${va.slug}`} target="_blank">View vetted profile</Link>:null}{decision?<span className={`badge ${decision==="pass"?"badge-warning":"badge-success"}`}>{decision==="interested"?"Interested":decision==="interview"?"Interview requested":"Passed"}</span>:null}</div>
        {selectedJob?<div className="stack" style={{marginTop:10}}><div className="row wrap">
          <form action={clientShortlistDecisionAction}><input type="hidden" name="job_id" value={selectedJob.id}/><input type="hidden" name="va_id" value={row.va_id}/><input type="hidden" name="decision" value="interested"/><input type="hidden" name="return_to" value={`/workspace/client/candidates?role=${selectedJob.id}#recruiter-shortlist`}/><button className={`btn btn-sm ${decision==="interested"?"btn-primary":""}`} type="submit">Interested</button></form>
          <form action={clientShortlistDecisionAction}><input type="hidden" name="job_id" value={selectedJob.id}/><input type="hidden" name="va_id" value={row.va_id}/><input type="hidden" name="decision" value="interview"/><input type="hidden" name="return_to" value={`/workspace/client/candidates?role=${selectedJob.id}#recruiter-shortlist`}/><button className={`btn btn-sm ${decision==="interview"?"btn-primary":""}`} type="submit">Request interview</button></form>
          <details><summary className="btn btn-sm">Pass</summary><form action={clientShortlistDecisionAction} className="stack" style={{marginTop:8}}><input type="hidden" name="job_id" value={selectedJob.id}/><input type="hidden" name="va_id" value={row.va_id}/><input type="hidden" name="decision" value="pass"/><input type="hidden" name="return_to" value={`/workspace/client/candidates?role=${selectedJob.id}#recruiter-shortlist`}/><select name="pass_reason" defaultValue=""><option value="">Reason optional</option><option value="skills">Skills</option><option value="rate">Rate</option><option value="schedule_timezone">Schedule / timezone</option><option value="experience">Experience</option><option value="communication_video">Communication / video</option><option value="industry_fit">Industry fit</option><option value="availability">Availability</option><option value="other">Other</option></select><input name="decision_note" maxLength={300} placeholder="Optional note for your recruiter"/><button className="btn btn-sm" type="submit">Confirm pass</button></form></details>
        </div>{row.client_decision_note?<div className="small muted">Feedback: {row.client_decision_note}</div>:null}</div>:null}
      </article>})}</div>:selectedPublished?<div className="empty"><strong>{selectedReleased.length} curated match{selectedReleased.length===1?" is":"es are"} ready.</strong><p>Your recruiting team will make the approved shortlist available once candidate access is active.</p><Link className="btn btn-primary" href={`/workspace/client/jobs/${selectedJob?.id}`}>View role progress</Link></div>:<div className="empty"><strong>{selectedReleased.length} match{selectedReleased.length===1?" is":"es are"} being prepared.</strong><p>Full profiles appear after the role and service terms are active.</p></div>):<div className="empty"><strong>Your recruiter is working the role.</strong><p>We will only add candidates here after screening them against your requirements.</p></div>}
    </section>
  </>;
}
