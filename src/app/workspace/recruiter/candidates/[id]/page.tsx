import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FileText, Globe2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitScorecardAction } from "@/app/actions/vetting";
import { addRecruiterNoteAction, assignVaToRoleAction, markVaReviewEvidenceAction } from "@/app/actions/recruiter";
import { getVaCompletion } from "@/lib/profile-completeness";
import { dateShort } from "@/lib/format";
import { vettingStatusLabel } from "@/lib/vetting";
import { uniqueStrings } from "@/lib/collections";
import { PublicAvatar } from "@/components/public-avatar";
import { publicVisibilityRequirements } from "@/lib/public-visibility";
import { PUBLIC_PROFILE_CONSENT_VERSION } from "@/lib/privacy-consent";

const Rating=({name,label}:{name:string;label:string})=><div className="field"><label>{label}</label><select name={name} defaultValue="3" required><option value="1">1 - weak</option><option value="2">2 - below standard</option><option value="3">3 - meets standard</option><option value="4">4 - strong</option><option value="5">5 - excellent</option></select></div>;

export default async function RecruiterCandidate({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const {id}=await params;const query=await searchParams;await requireRole("recruiter");const admin=createAdminClient();
  const [{data:profile},{data:va},{data:vetting},{data:attempt},{data:scorecards},{data:authUser},{data:roles},{data:notes},{data:activity},{data:publicListing}]=await Promise.all([
    admin.from("profiles").select("id,full_name,avatar_url,created_at,email_verified,identity_verified_at,last_active_at").eq("id",id).eq("role","va").maybeSingle(),
    admin.from("va_profiles").select("*").eq("user_id",id).maybeSingle(),
    admin.from("va_vetting").select("*").eq("va_id",id).maybeSingle(),
    admin.from("va_test_attempts").select("*,skills_tests(title,category,questions,passing_score)").eq("va_id",id).order("submitted_at",{ascending:false}).limit(1).maybeSingle(),
    admin.from("vetting_scorecards").select("*").eq("va_id",id).order("created_at",{ascending:false}).limit(5),
    admin.auth.admin.getUserById(id),
    admin.from("jobs").select("id,title,company_name,status").in("status",["pending","published"]).order("created_at",{ascending:false}).limit(100),
    admin.from("recruiter_notes").select("id,note,created_at").eq("subject_type","va").eq("subject_id",id).order("created_at",{ascending:false}).limit(20),
    admin.from("recruiter_activity").select("id,action,description,created_at,metadata").eq("subject_type","va").eq("subject_id",id).order("created_at",{ascending:false}).limit(30),
    admin.from("public_va_directory").select("slug").eq("user_id",id).maybeSingle()
  ]);
  if(!profile)notFound();const candidateVa=va||{};const stage=vetting?.stage||"profile";const vaEmail=authUser.user?.email||null;const questions=Array.isArray(attempt?.skills_tests?.questions)?attempt.skills_tests.questions:[];const answers=attempt?.answers||{};const completionData=getVaCompletion(va,profile.avatar_url);const missing=completionData.items.filter(x=>!x.done).map(x=>x.label);const reviewable=stage==="recruiter_review";
  const approved=["approved","bench"].includes(stage);
  const consentActive=Boolean(candidateVa.public_profile_consent&&candidateVa.public_profile_consent_at&&!candidateVa.public_profile_consent_withdrawn_at&&candidateVa.public_profile_consent_version===PUBLIC_PROFILE_CONSENT_VERSION);
  const visibilityRequirements=publicVisibilityRequirements(candidateVa,profile.avatar_url);
  const publicMissing=visibilityRequirements.filter((item)=>!item.done);
  const publicLive=Boolean(publicListing?.slug);
  const publicState=publicLive?"Public now":!approved?"Awaiting approval":!consentActive?"Consent required":!candidateVa.directory_visible?"Visibility off":publicMissing.length?"Blocked":"Eligible";
  const consentDate=candidateVa.public_profile_consent_at?dateShort(candidateVa.public_profile_consent_at):null;
  return <div className="recruiter-candidate-page">
    {query.assigned?<div className="success-banner">VA assigned to the selected role.</div>:null}{query.note_saved?<div className="success-banner">Private recruiter note saved.</div>:null}
    <div className="internal-view-banner"><ShieldCheck size={18}/><div><strong>Internal Recruiter View</strong><span>Full identity, account email, resume, notes, and operational history are private and never shown on the public VA profile.</span></div></div>
    <section className="candidate-overview-card">
      <div className="candidate-overview-main">
        <PublicAvatar name={profile.full_name||"VA"} src={profile.avatar_url} size="lg"/>
        <div className="candidate-overview-copy">
          <div className="row wrap candidate-overview-badges">
            <span className="badge">{vettingStatusLabel(stage)}</span>
            {publicLive?<span className="badge badge-success"><Globe2 size={12}/> Public</span>:<span className="badge">{publicState}</span>}
          </div>
          <h1>{profile.full_name||"VA candidate"}</h1>
          <p>{candidateVa.headline||candidateVa.primary_category||"Virtual Assistant"}</p>
          <div className="candidate-overview-meta">
            <span>{candidateVa.primary_category||"Category not set"}</span>
            <span>{candidateVa.years_experience??0} yrs experience</span>
            <span>{candidateVa.hourly_rate?"USD "+Number(candidateVa.hourly_rate).toFixed(2)+"/hr":"Rate not set"}</span>
            <span>{candidateVa.availability_status||"Availability not set"}</span>
          </div>
        </div>
      </div>
      <div className="candidate-overview-actions">
        <Link className="btn" href="/workspace/recruiter/talent">Back to directory</Link>
        {vetting?.video_url?<a className="btn" href={vetting.video_url} target="_blank" rel="noreferrer">Watch video</a>:null}
        {publicListing?.slug?<Link className="btn btn-primary" href={"/va/"+publicListing.slug} target="_blank">Open public profile</Link>:null}
      </div>
    </section>
    <div className="candidate-status-grid">
      <div><span>Profile completion</span><strong>{completionData.score}%</strong><small>{missing.length?missing.length+" readiness item"+(missing.length===1?"":"s")+" missing":"Recruiter-ready"}</small></div>
      <div><span>Public consent</span><strong>{consentActive?"Active":"Not active"}</strong><small>{consentActive?"Current notice"+(consentDate?" · "+consentDate:""):"VA must opt in"}</small></div>
      <div><span>Directory status</span><strong>{publicState}</strong><small>{publicLive?"Visible in public talent directory":publicMissing[0]?.label?"Needs "+publicMissing[0].label:"Not public"}</small></div>
      <div><span>Trust</span><strong>{profile.identity_verified_at?"Identity verified":profile.email_verified?"Email verified":"Pending"}</strong><small>{vetting?.profile_reviewed_at?"Profile reviewed":"Recruiter review pending"}</small></div>
    </div>
    <div className="profile-layout recruiter-candidate-layout"><div className="stack recruiter-candidate-main">
      <section className="card"><div className="row-between wrap"><div><h3 style={{margin:0}}>Profile readiness</h3><p className="small muted">Exactly what is missing before this profile is recruiter-ready.</p></div><strong className="score-big">{completionData.score}%</strong></div><div className="progress" style={{margin:"12px 0"}}><span style={{width:`${completionData.score}%`}}/></div>{missing.length?<div className="pill-list">{missing.map(item=><span className="badge badge-warning" key={item}>{item}</span>)}</div>:<div className="success-banner"><CheckCircle2 size={16}/> All profile readiness items are complete.</div>}</section>
      <section className="card"><div className="row-between wrap"><div><h3 style={{margin:0}}>Structured profile</h3><p className="small muted">Recruiter hiring evidence and working preferences.</p></div><form action={markVaReviewEvidenceAction}><input type="hidden" name="va_id" value={id}/><input type="hidden" name="kind" value="profile"/><input type="hidden" name="return_to" value={`/workspace/recruiter/candidates/${id}`}/><button className="btn btn-sm" type="submit">{vetting?.profile_reviewed_at?"Reviewed ✓":"Mark profile reviewed"}</button></form></div><p>{candidateVa.bio||"No professional summary yet."}</p><div className="score-grid"><div><span>Category</span><strong>{candidateVa.primary_category||"Not set"}</strong></div><div><span>Experience</span><strong>{candidateVa.years_experience??0} years</strong></div><div><span>Availability</span><strong>{candidateVa.weekly_hours?`${candidateVa.weekly_hours} hrs/week`:"Not set"}</strong></div><div><span>Rate</span><strong>{candidateVa.hourly_rate?`USD ${candidateVa.hourly_rate}/hr`:"Not set"}</strong></div><div><span>Timezone</span><strong>{candidateVa.preferred_timezone||candidateVa.schedule||"Not set"}</strong></div><div><span>Last active</span><strong>{profile.last_active_at?dateShort(profile.last_active_at):dateShort(profile.created_at)}</strong></div></div><div style={{marginTop:16}}><div className="small muted">Skills</div><div className="pill-list" style={{marginTop:7}}>{uniqueStrings(candidateVa.skills).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div></div><div style={{marginTop:16}}><div className="small muted">Tools</div><div className="pill-list" style={{marginTop:7}}>{uniqueStrings(candidateVa.tools).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div></div></section>
      <section className="card"><div className="row-between"><div><h3 style={{margin:0}}>Skills test</h3><p className="small muted">{attempt?.skills_tests?.title||"No test submitted"}</p></div>{attempt?<strong className="score-big">{attempt.final_score??attempt.auto_score??0}%</strong>:null}</div>{attempt?<div className="stack" style={{marginTop:16}}>{questions.map((q:any,index:number)=><div className="review-answer" key={q.id}><div className="small muted">Question {index+1}</div><strong>{q.prompt}</strong><p>{answers[q.id]||"No answer"}</p></div>)}</div>:<div className="empty">The candidate has not submitted a test.</div>}</section>
      <section className="card"><div className="row-between"><div><h3 style={{margin:0}}>Private recruiter notes & timeline</h3><p className="small muted">Keep context attached to the VA instead of in spreadsheets or inboxes.</p></div></div><form action={addRecruiterNoteAction} className="row wrap recruiter-note-form"><input type="hidden" name="subject_type" value="va"/><input type="hidden" name="subject_id" value={id}/><input type="hidden" name="return_to" value={`/workspace/recruiter/candidates/${id}`}/><textarea name="note" required minLength={2} maxLength={4000} placeholder="Interview note, follow-up, client fit, concern…"/><button className="btn btn-primary" type="submit">Add note</button></form>{notes?.length?<div className="notes-list">{notes.map((n:any)=><div className="note-card" key={n.id}><p>{n.note}</p><small>{dateShort(n.created_at)}</small></div>)}</div>:null}<div className="timeline-list" style={{marginTop:18}}>{(activity||[]).map((row:any)=><div className="timeline-item" key={row.id}><span className="timeline-dot"/><div><strong>{String(row.action).replaceAll("_"," ")}</strong><p>{row.description||"Recruiter activity"}</p><small>{dateShort(row.created_at)}</small></div></div>)}</div></section>
      {scorecards?.length?<section className="card"><h3>Previous scorecards</h3><div className="stack">{scorecards.map((s:any)=><div className="review-answer" key={s.id}><div className="row-between"><strong>{s.total_score}% · {s.recommendation}</strong><span className="small muted">{dateShort(s.created_at)}</span></div>{s.notes?<p className="small muted">{s.notes}</p>:null}</div>)}</div></section>:null}
    </div><aside className="profile-sidebar stack recruiter-candidate-sidebar">
      <div className="card recruiter-contact-card"><div className="row"><Mail size={18}/><div><div className="small muted">VA account email</div>{vaEmail?<a className="contact-email-link" href={`mailto:${vaEmail}`}>{vaEmail}</a>:<strong>Not available</strong>}</div></div><p className="small muted">Recruiter-only contact detail.</p>{candidateVa.resume_path?<><a className="btn btn-sm" href={`/api/admin/va-resume/${id}`} target="_blank"><FileText size={15}/> Open private resume</a><form action={markVaReviewEvidenceAction}><input type="hidden" name="va_id" value={id}/><input type="hidden" name="kind" value="resume"/><input type="hidden" name="return_to" value={`/workspace/recruiter/candidates/${id}`}/><button className="btn btn-sm" type="submit">{vetting?.resume_reviewed_at?"Resume reviewed ✓":"Mark resume reviewed"}</button></form></>:<span className="small muted">No resume uploaded.</span>}{publicListing?.slug?<Link className="btn btn-sm" href={`/va/${publicListing.slug}`} target="_blank">Open public profile</Link>:<span className="small muted">Public profile is not currently eligible.</span>}</div>
      <form action={assignVaToRoleAction} className="card stack"><input type="hidden" name="va_id" value={id}/><input type="hidden" name="return_to" value={`/workspace/recruiter/candidates/${id}`}/><div><div className="row"><Sparkles size={18}/><h3 style={{margin:0}}>Assign to role</h3></div><p className="small muted">Add this approved/bench VA to an internal role shortlist without leaving the profile.</p></div><select name="job_id" required defaultValue=""><option value="" disabled>Choose active role…</option>{(roles||[]).map((job:any)=><option key={job.id} value={job.id}>{job.title} — {job.company_name||job.status}</option>)}</select><button className="btn btn-primary" type="submit" disabled={!['approved','bench'].includes(stage)}>Assign VA to role</button>{!['approved','bench'].includes(stage)?<span className="small muted">Approve or bench this VA before role assignment.</span>:null}</form>
      {reviewable?<form action={submitScorecardAction} className="card stack"><input type="hidden" name="va_id" value={id}/><div><h3 style={{margin:0}}>Recruiter scorecard</h3><p className="small muted">No claim step required. Save the review when screening is complete.</p></div><Rating name="role_skills" label="Role skills"/><Rating name="communication" label="Communication"/><Rating name="judgment" label="Judgment"/><Rating name="reliability" label="Reliability"/><Rating name="client_readiness" label="Client readiness"/><label className="choice"><input type="checkbox" name="interview_completed" required/><span><strong>First-pass interview completed</strong></span></label><div className="field"><label>Recommendation</label><select name="recommendation" defaultValue="hold"><option value="hold">Hold for more review</option><option value="finalist">Escalate as finalist</option><option value="reject">Reject</option></select></div><div className="field"><label>Reviewer notes</label><textarea name="notes" required minLength={30}/></div><button className="btn btn-primary" type="submit">Save scorecard</button></form>:<div className="card"><h3>Vetting stage</h3><p className="small muted">Currently {vettingStatusLabel(stage).toLowerCase()}. You can still review, note, and assign approved talent from this internal profile.</p></div>}
    </aside></div>
  </div>;
}
