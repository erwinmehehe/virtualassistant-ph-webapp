import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Mail, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimCandidateAction, submitScorecardAction } from "@/app/actions/vetting";
import { getVaCompletion } from "@/lib/profile-completeness";
import { dateShort } from "@/lib/format";
import { vettingStatusLabel } from "@/lib/vetting";
import { uniqueStrings } from "@/lib/collections";
import { PublicAvatar } from "@/components/public-avatar";

const Rating=({name,label}:{name:string;label:string})=><div className="field"><label>{label}</label><select name={name} defaultValue="3" required><option value="1">1 - weak</option><option value="2">2 - below standard</option><option value="3">3 - meets standard</option><option value="4">4 - strong</option><option value="5">5 - excellent</option></select></div>;

export default async function RecruiterCandidate({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const {user}=await requireRole("recruiter");
  const admin=createAdminClient();
  const [{data:profile},{data:va},{data:vetting},{data:attempt},{data:scorecards},{data:authUser}]=await Promise.all([
    admin.from("profiles").select("id,full_name,avatar_url,created_at").eq("id",id).eq("role","va").maybeSingle(),
    admin.from("va_profiles").select("*").eq("user_id",id).maybeSingle(),
    admin.from("va_vetting").select("*").eq("va_id",id).maybeSingle(),
    admin.from("va_test_attempts").select("*,skills_tests(title,category,questions,passing_score)").eq("va_id",id).order("submitted_at",{ascending:false}).limit(1).maybeSingle(),
    admin.from("vetting_scorecards").select("*").eq("va_id",id).order("created_at",{ascending:false}).limit(5),
    admin.auth.admin.getUserById(id)
  ]);
  if(!profile)notFound();
  const candidateVa = va || {};

  const stage=vetting?.stage||"profile";
  const vaEmail=authUser.user?.email||null;
  const questions=Array.isArray(attempt?.skills_tests?.questions)?attempt.skills_tests.questions:[];
  const answers=attempt?.answers||{};
  const completion=getVaCompletion(va, profile.avatar_url).score;
  const assignedToYou=Boolean(vetting&&vetting.recruiter_id===user.id);
  const unassigned=!vetting?.recruiter_id;
  const reviewable=stage==="recruiter_review"&&(assignedToYou||unassigned);

  return <>
    <div className="page-head"><div><div className="row wrap"><span className="badge">{vettingStatusLabel(stage)}</span><span className="small muted">Profile {completion}% complete</span>{assignedToYou?<span className="badge badge-success">Assigned to you</span>:vetting?.recruiter_id?<span className="badge badge-warning">Assigned to another recruiter</span>:<span className="badge">Unassigned</span>}</div><div className="row" style={{marginTop:10,alignItems:"center"}}><PublicAvatar name={profile.full_name||"VA"} src={profile.avatar_url}/><div><h1 style={{margin:0}}>{profile.full_name||"VA candidate"}</h1><p style={{margin:"4px 0 0"}}>{candidateVa.headline||candidateVa.primary_category||"Virtual Assistant"}</p></div></div></div><div className="row wrap"><Link className="btn" href="/workspace/recruiter/talent">Back to VA directory</Link>{unassigned&&stage==="recruiter_review"?<form action={claimCandidateAction}><input type="hidden" name="va_id" value={id}/><button className="btn" type="submit">Claim candidate</button></form>:null}{vetting?.video_url?<a className="btn btn-primary" href={vetting.video_url} target="_blank" rel="noreferrer">Watch video intro</a>:null}</div></div>

    <div className="profile-layout"><div className="stack">
      <section className="card">{!va?<div className="notice notice-warning" style={{marginBottom:16}}><strong>VA profile record is missing.</strong><p className="small" style={{margin:"6px 0 0"}}>The account exists, but its structured VA profile has not been created yet. The recruiter can still see the account and email instead of hitting a 404.</p></div>:null}<div className="row-between wrap"><div><h3 style={{margin:0}}>Structured profile</h3><p className="small muted" style={{margin:"5px 0 0"}}>Private recruiter view. This page is not exposed to clients or public visitors.</p></div><span className="badge"><ShieldCheck size={13}/> Internal</span></div><p>{candidateVa.bio||"No professional summary yet."}</p><div className="score-grid"><div><span>Category</span><strong>{candidateVa.primary_category||"Not set"}</strong></div><div><span>Experience</span><strong>{candidateVa.years_experience??0} years</strong></div><div><span>Availability</span><strong>{candidateVa.weekly_hours?`${candidateVa.weekly_hours} hrs/week`:"Not set"}</strong></div><div><span>Rate</span><strong>{candidateVa.hourly_rate?`USD ${candidateVa.hourly_rate}/hr`:"Not set"}</strong></div><div><span>Overlap</span><strong>{candidateVa.overlap_hours??0} hrs/day</strong></div></div><div style={{marginTop:16}}><div className="small muted">Skills</div><div className="pill-list" style={{marginTop:7}}>{uniqueStrings(candidateVa.skills).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div></div><div style={{marginTop:16}}><div className="small muted">Tools</div><div className="pill-list" style={{marginTop:7}}>{uniqueStrings(candidateVa.tools).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div></div></section>

      <section className="card"><div className="row-between"><div><h3 style={{margin:0}}>Skills test</h3><p className="small muted" style={{margin:"5px 0 0"}}>{attempt?.skills_tests?.title||"No test submitted"}</p></div>{attempt?<strong className="score-big">{attempt.final_score??attempt.auto_score??0}%</strong>:null}</div>{attempt?<div className="stack" style={{marginTop:16}}>{questions.map((q:any,index:number)=><div className="review-answer" key={q.id}><div className="small muted">Question {index+1}</div><strong>{q.prompt}</strong><p>{answers[q.id]||"No answer"}</p>{q.type==="choice"?<span className={`badge ${answers[q.id]===q.correct?"badge-success":"badge-warning"}`}>{answers[q.id]===q.correct?"Correct":"Incorrect"}</span>:null}</div>)}</div>:<div className="empty">The candidate has not submitted a test.</div>}</section>

      {scorecards?.length?<section className="card"><h3>Previous scorecards</h3><div className="stack">{scorecards.map((s:any)=><div className="review-answer" key={s.id}><div className="row-between"><strong>{s.total_score}% · {s.recommendation}</strong><span className="small muted">{dateShort(s.created_at)}</span></div>{s.notes?<p className="small muted">{s.notes}</p>:null}</div>)}</div></section>:null}
    </div>

    <aside className="profile-sidebar stack">
      <div className="card recruiter-contact-card"><div className="row"><Mail size={18}/><div><div className="small muted">VA account email</div>{vaEmail?<a className="contact-email-link" href={`mailto:${vaEmail}`}>{vaEmail}</a>:<strong>Not available</strong>}</div></div><p className="small muted">Visible to recruiters for vetting and placement coordination. This contact detail is not part of the public VA profile.</p>{candidateVa.resume_path?<a className="btn btn-sm" href={`/api/admin/va-resume/${id}`} target="_blank"><FileText size={15}/> Open private resume</a>:<span className="small muted">No resume uploaded.</span>}{candidateVa.directory_visible&&candidateVa.slug?<Link className="btn btn-sm" href={`/va/${candidateVa.slug}`} target="_blank">Open public profile</Link>:null}</div>

      {reviewable?<form action={submitScorecardAction} className="card stack"><input type="hidden" name="va_id" value={id}/><div><h3 style={{margin:0}}>Recruiter scorecard</h3><p className="small muted" style={{margin:"5px 0 0"}}>Use the same five dimensions for every candidate. Finalists need a score of at least 75% before escalation.</p></div><Rating name="role_skills" label="Role skills"/><Rating name="communication" label="Communication"/><Rating name="judgment" label="Judgment and problem solving"/><Rating name="reliability" label="Reliability and process"/><Rating name="client_readiness" label="Client readiness"/><label className="choice"><input type="checkbox" name="interview_completed" required/><span><strong>First-pass interview completed</strong><span className="small muted" style={{display:"block"}}>Confirm you reviewed the resume, test, video, and completed the recruiter interview before scoring.</span></span></label><div className="field"><label>Recommendation</label><select name="recommendation" defaultValue="hold"><option value="hold">Hold for more review</option><option value="finalist">Escalate as finalist</option><option value="reject">Reject</option></select></div><div className="field"><label>Reviewer notes</label><textarea name="notes" required minLength={30} placeholder="Evidence from the resume, test, video, interview, concerns, and follow-up notes."/></div><button className="btn btn-primary" type="submit">Save scorecard</button></form>:<div className="card"><h3>Scorecard status</h3><p className="small muted">{vetting?.recruiter_id&&vetting.recruiter_id!==user.id?"This candidate is owned by another recruiter.":stage!=="recruiter_review"?`This VA is currently in ${vettingStatusLabel(stage).toLowerCase()}. You can still view the full recruiter profile, email, resume, and history.`:"Claim this candidate before scoring."}</p></div>}
    </aside></div>
  </>;
}
