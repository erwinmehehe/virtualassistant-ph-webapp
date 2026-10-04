import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, PlayCircle, ShieldCheck } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientMatchLabel, matchAssessment } from "@/lib/matching";
import { uniqueStrings } from "@/lib/collections";
import { recordProductEvent } from "@/lib/product-events";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { CandidateAccessGate } from "@/components/candidate-access-gate";
import { maskVaName } from "@/lib/va-identity";
import { getTrainingCredentialsForUser } from "@/lib/training-credentials";
import { TrainingCredentials } from "@/components/training-credentials";
import { clientShortlistDecisionAction } from "@/app/actions/client-shortlist";
import { PendingSubmitButton } from "@/components/pending-submit-button";

export default async function CandidateReviewPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const {userId}=await requireRoleFast("client");
  const admin=createAdminClient();

  const [{data:shortlistById},{data:applicationById}]=await Promise.all([
    admin
      .from("job_shortlist_candidates")
      .select("id,job_id,va_id,match_score,client_recommendation,client_decision,client_decision_note,shortlist_status,jobs!inner(id,title,status,client_id)")
      .eq("id",id)
      .eq("jobs.client_id",userId)
      .eq("shortlist_status","released")
      .maybeSingle(),
    admin
      .from("applications")
      .select("id,job_id,va_id,status,match_score,profile_snapshot,cover_note,jobs!inner(id,title,status,client_id)")
      .eq("id",id)
      .eq("jobs.client_id",userId)
      .maybeSingle(),
  ]);

  let shortlist:any=shortlistById;
  let application:any=applicationById;
  let jobId=String(shortlistById?.job_id||applicationById?.job_id||"");
  let vaId=String(shortlistById?.va_id||applicationById?.va_id||"");
  if(!jobId||!vaId)notFound();

  if(!shortlist){
    const {data}=await admin
      .from("job_shortlist_candidates")
      .select("id,job_id,va_id,match_score,client_recommendation,client_decision,client_decision_note,shortlist_status")
      .eq("job_id",jobId)
      .eq("va_id",vaId)
      .eq("shortlist_status","released")
      .maybeSingle();
    shortlist=data;
  }
  if(!shortlist)notFound();

  if(!application){
    const {data}=await admin
      .from("applications")
      .select("id,job_id,va_id,status,match_score,profile_snapshot,cover_note")
      .eq("job_id",jobId)
      .eq("va_id",vaId)
      .maybeSingle();
    application=data;
  }

  const [{data:job},{data:access},{count:releasedCount},{data:identity},{data:va},{data:vetting},trainingCredentials]=await Promise.all([
    admin
      .from("jobs")
      .select("id,title,status,client_id,categories,required_skills,required_tools,nice_to_have_skills,must_have_skills,must_have_tools,required_industries,minimum_years_experience,hours_per_week,max_hourly_rate,communication_requirement,dealbreakers")
      .eq("id",jobId)
      .eq("client_id",userId)
      .maybeSingle(),
    admin.from("job_candidate_access").select("*").eq("job_id",jobId).maybeSingle(),
    admin.from("job_shortlist_candidates").select("id",{count:"exact",head:true}).eq("job_id",jobId).eq("shortlist_status","released"),
    admin.from("profiles").select("id,full_name").eq("id",vaId).maybeSingle(),
    admin.from("va_profiles").select("user_id,headline,primary_category,categories,bio,skills,tools,industries,years_experience,weekly_hours,hourly_rate,schedule,overlap_hours").eq("user_id",vaId).maybeSingle(),
    admin.from("va_vetting").select("video_url").eq("va_id",vaId).maybeSingle(),
    getTrainingCredentialsForUser(vaId),
  ]);

  if(!job)notFound();
  if(job.status!=="published")return <div className="client-candidate-review-page client-candidate-review-state"><div className="page-head client-candidate-review-head"><div><Link className="text-link small" href={`/workspace/client/candidates?role=${jobId}`}>← Back to shortlist</Link><h1 style={{marginTop:8}}>Candidate profile is being prepared</h1><p>Your recruiter selected this VA, but the role is not active for client review yet.</p></div></div></div>;
  if(!candidateAccessUnlocked(access?.access_status))return <div className="client-candidate-review-page client-candidate-access-page"><div className="page-head client-candidate-review-head"><div><Link className="text-link small" href={`/workspace/client/candidates?role=${jobId}`}>← Back to shortlist</Link><h1 style={{marginTop:8}}>Candidate access required</h1><p>Private hiring evidence remains protected until candidate access is active.</p></div></div><CandidateAccessGate jobId={jobId} access={access} applicantCount={0} releasedCount={releasedCount||0} returnTo={`/workspace/client/candidates/${id}`}/></div>;

  const snapshot:any=application?.profile_snapshot||{};
  const profile:any={
    ...snapshot,
    ...(va||{}),
    full_name:identity?.full_name||snapshot.full_name||null,
  };
  const score=Number(shortlist.match_score??application?.match_score??0);
  const assessment=va?matchAssessment(job,va,trainingCredentials):null;
  const whyMatches=[
    assessment?.roleMatch?.matchedKeywords?.length?`Role fit: ${assessment.roleMatch.matchedKeywords.slice(0,3).join(", ")}`:null,
    assessment?.matchedSkills?.length?`Matched skills: ${assessment.matchedSkills.slice(0,4).join(", ")}`:null,
    assessment?.matchedTools?.length?`Matched tools: ${assessment.matchedTools.slice(0,4).join(", ")}`:null,
    job.minimum_years_experience!=null&&profile.years_experience!=null&&Number(profile.years_experience)>=Number(job.minimum_years_experience)?`${profile.years_experience}+ years experience meets the role preference`:null,
    job.hours_per_week&&profile.weekly_hours&&Number(profile.weekly_hours)>=Number(job.hours_per_week)?`${profile.weekly_hours} hrs/week availability covers the requested ${job.hours_per_week} hrs/week`:null,
    assessment?.trainingMatch?.matchedCourseTitles?.length?`Verified training: ${assessment.trainingMatch.matchedCourseTitles.slice(0,2).join(", ")}`:null,
  ].filter((value):value is string=>Boolean(value));

  await recordProductEvent("candidate_viewed",{userId,path:`/workspace/client/candidates/${id}`,metadata:{application_id:application?.id||null,shortlist_candidate_id:shortlist.id,job_id:jobId,va_id:vaId,recruiter_released:true}});
  try{
    const cutoff=new Date(Date.now()-6*60*60*1000).toISOString();
    const {count}=await admin.from("recruiter_activity").select("id",{count:"exact",head:true}).eq("subject_type","va").eq("subject_id",vaId).eq("action","client_viewed").gte("created_at",cutoff).contains("metadata",{shortlist_candidate_id:shortlist.id});
    if(!count)await admin.from("recruiter_activity").insert({subject_type:"va",subject_id:vaId,action:"client_viewed",description:`Client viewed recruiter-released candidate for ${job.title||"role"}`,actor_id:userId,metadata:{application_id:application?.id||null,shortlist_candidate_id:shortlist.id,job_id:jobId}});
  }catch{}

  const decision=String(shortlist.client_decision||"");
  const returnTo=`/workspace/client/candidates/${id}`;

  return <div className="client-candidate-review-page">
    <div className="page-head client-candidate-review-head"><div><Link className="text-link small" href={`/workspace/client/candidates?role=${jobId}`}>← Back to recruiter shortlist</Link><h1 style={{marginTop:8}}>{profile.full_name?maskVaName(profile.full_name):"Vetted Virtual Assistant"}</h1><p>{profile.headline||profile.primary_category||"Virtual Assistant"} · for {job.title}</p></div><span className="badge badge-success"><ShieldCheck size={14}/> Recruiter released</span></div>

    <div className="profile-layout client-candidate-review-layout">
      <article className="card candidate-review-card client-candidate-review-card">
        <div className="row wrap"><span className="badge badge-success"><ShieldCheck size={14}/> Vetted VA</span><span className="badge">{clientMatchLabel(score)}</span></div>
        {whyMatches.length?<div className="info-banner" style={{marginTop:16}}><strong>Why this VA matches</strong><div className="stack" style={{gap:7,marginTop:8}}>{whyMatches.map((reason)=><span className="small" key={reason} style={{display:"flex",gap:7,alignItems:"flex-start"}}><CheckCircle2 size={14} style={{marginTop:1,flex:"none"}}/><span>{reason}</span></span>)}</div></div>:null}
        {shortlist.client_recommendation?<div className="info-banner" style={{marginTop:16}}><strong>Recruiter recommendation</strong><p style={{margin:"6px 0 0"}}>{shortlist.client_recommendation}</p></div>:null}
        <h2>Professional summary</h2><p className="muted profile-copy">{profile.bio||"This VA completed our screening process. Your recruiter can provide additional role-specific context."}</p>
        {application?.cover_note?<><h2>VA interest note</h2><div className="detail-note"><p>{application.cover_note}</p></div></>:null}
        {vetting?.video_url?<><h2>Vetting video</h2><div className="candidate-video-row client-candidate-video-row"><PlayCircle size={20}/><div><strong>Recorded introduction</strong><span className="small muted">Recorded during vetting and provided as supporting evidence.</span></div><a className="btn btn-primary" href={vetting.video_url} target="_blank" rel="noopener noreferrer">Watch video</a></div></>:null}
        <div className="grid-2 client-candidate-skill-grid"><section><h2>Skills</h2><div className="pill-list">{uniqueStrings(profile.skills).length?uniqueStrings(profile.skills).map((value,index)=><span className="badge" key={`${String(value)}-${index}`}>{value}</span>):<span className="small muted">No skills listed.</span>}</div></section><section><h2>Tools</h2><div className="pill-list">{uniqueStrings(profile.tools).length?uniqueStrings(profile.tools).map((value,index)=><span className="badge" key={`${String(value)}-${index}`}>{value}</span>):<span className="small muted">No tools listed.</span>}</div></section></div>
        {uniqueStrings(profile.industries).length?<><h2>Industries</h2><div className="pill-list">{uniqueStrings(profile.industries).map((value,index)=><span className="badge" key={`${String(value)}-${index}`}>{value}</span>)}</div></>:null}
        <TrainingCredentials credentials={trainingCredentials} heading="Verified training"/>
      </article>

      <aside className="profile-sidebar stack client-candidate-sidebar">
        <div className="card profile-facts client-candidate-facts"><h3>Working fit</h3><div><span>Primary specialty</span><strong>{profile.primary_category||"Not set"}</strong></div><div><span>Experience</span><strong>{profile.years_experience!=null?`${profile.years_experience}+ years`:"Not set"}</strong></div><div><span>Availability</span><strong>{profile.weekly_hours?`${profile.weekly_hours} hrs/week`:"Not set"}</strong></div><div><span>Preferred rate</span><strong>{profile.hourly_rate?`USD ${profile.hourly_rate}/hr`:"Not set"}</strong></div><div><span>Schedule</span><strong>{profile.schedule||"Flexible"}</strong></div><div><span>Live overlap</span><strong>{profile.overlap_hours!=null?`${profile.overlap_hours} hrs/day`:"Flexible"}</strong></div></div>

        <div className="card stack client-candidate-next-step">
          <strong>Make a decision</strong>
          <p className="small muted">Requesting an interview creates the interview workflow immediately and alerts the recruiting team. Keeping a VA shortlisted preserves them for comparison.</p>
          <form action={clientShortlistDecisionAction} className="stack">
            <input type="hidden" name="job_id" value={jobId}/>
            <input type="hidden" name="va_id" value={vaId}/>
            <input type="hidden" name="return_to" value={returnTo}/>
            <input name="decision_note" maxLength={300} placeholder="Optional note for your recruiter"/>
            <PendingSubmitButton className="btn btn-primary" label={decision==="interview"?"Interview requested":"Request interview"} pendingLabel="Requesting…" name="decision" value="interview"/>
            <PendingSubmitButton className="btn" label={decision==="interested"?"Kept shortlisted":"Keep shortlisted"} pendingLabel="Saving…" name="decision" value="interested"/>
            <details>
              <summary className="btn">Pass</summary>
              <div className="stack" style={{marginTop:8}}>
                <select name="pass_reason" defaultValue="">
                  <option value="">Pass reason optional</option>
                  <option value="skills">Skills</option>
                  <option value="rate">Rate</option>
                  <option value="schedule_timezone">Schedule / timezone</option>
                  <option value="experience">Experience</option>
                  <option value="communication_video">Communication / video</option>
                  <option value="industry_fit">Industry fit</option>
                  <option value="availability">Availability</option>
                  <option value="other">Other</option>
                </select>
                <PendingSubmitButton className="btn" label="Confirm pass" pendingLabel="Saving…" name="decision" value="pass"/>
              </div>
            </details>
          </form>
          {decision==="interview"?<Link className="btn" href="/workspace/client/interviews">Open interviews</Link>:null}
        </div>

        <div className="info-banner client-candidate-contact"><strong>Recruiter-managed contact</strong><p style={{margin:"6px 0 0"}}>Candidate contact details stay private during screening. Interviews and final terms are coordinated through the managed hiring workflow.</p></div>
      </aside>
    </div>
  </div>;
}
