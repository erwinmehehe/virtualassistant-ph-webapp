import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, LockKeyhole, Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CandidateAccessGate } from "@/components/candidate-access-gate";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { hireCandidateAction, updateApplicationStatusAction } from "@/app/actions/applications";
import { matchLabel } from "@/lib/matching";
import { dateShort } from "@/lib/format";
import { MIN_HOURLY_RATE } from "@/lib/constants";
import { uniqueStrings } from "@/lib/collections";
import { recordProductEvent } from "@/lib/product-events";

const statusOptions = [["new","Applied"],["reviewing","Reviewing"],["shortlisted","Shortlisted"],["interview","Interview"],["offered","Offered"],["rejected","Rejected"]] as const;

export default async function CandidateReviewPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const {id}=await params; const query=await searchParams; const {user}=await requireRole("client"); const admin=createAdminClient();
  const {data:summary}=await admin.from("applications").select("id,job_id,va_id,status,match_score,applied_at,jobs!inner(id,title,client_id,min_hourly_rate,start_timing,schedule_notes)").eq("id",id).eq("jobs.client_id",user.id).single();
  if(!summary)notFound();
  const job=Array.isArray(summary.jobs)?summary.jobs[0]:summary.jobs;
  const [{data:access},{count:applicantCount},{count:releasedCount}]=await Promise.all([
    admin.from("job_candidate_access").select("*").eq("job_id",summary.job_id).maybeSingle(),
    admin.from("applications").select("id",{count:"exact",head:true}).eq("job_id",summary.job_id),
    admin.from("job_shortlist_candidates").select("id",{count:"exact",head:true}).eq("job_id",summary.job_id).eq("shortlist_status","released")
  ]);
  const unlocked=candidateAccessUnlocked(access?.access_status);
  await recordProductEvent("candidate_viewed", { userId: user.id, path: `/workspace/client/candidates/${id}`, metadata: { application_id: id, job_id: summary.job_id, unlocked } });
  // Keep the recruiter timeline useful without flooding it on refresh: record at
  // most one client-view event for this VA/application every six hours.
  try {
    const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { count } = await admin.from("recruiter_activity").select("id", { count: "exact", head: true }).eq("subject_type", "va").eq("subject_id", summary.va_id).eq("action", "client_viewed").gte("created_at", cutoff).contains("metadata", { application_id: id });
    if (!count) await admin.from("recruiter_activity").insert({ subject_type: "va", subject_id: summary.va_id, action: "client_viewed", description: `Client viewed candidate for ${job?.title || "role"}`, actor_id: user.id, metadata: { application_id: id, job_id: summary.job_id, unlocked } });
  } catch {}

  if(!unlocked){
    const score=Number(summary.match_score||0);
    return <>
      {query.access_requested?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Candidate access request sent to the hiring team.</div>:null}
      <div className="page-head"><div><Link className="text-link small" href={`/workspace/client/jobs/${summary.job_id}`}>← Back to role</Link><h1 style={{marginTop:8}}>Protected candidate</h1><p>Applicant for {job?.title}</p></div><span className="badge"><LockKeyhole size={14}/> Details locked</span></div>
      <CandidateAccessGate jobId={summary.job_id} access={access} applicantCount={applicantCount||0} releasedCount={releasedCount||0} returnTo={`/workspace/client/candidates/${summary.id}`}/>
      <div className="card protected-candidate-summary"><div><span className="small muted">Role fit</span><strong>{score}/100</strong><p>{matchLabel(score)}</p></div><div><span className="small muted">Application status</span><strong>{String(summary.status).replaceAll("_"," ")}</strong><p>Applied {dateShort(summary.applied_at)}</p></div><div><span className="small muted">Protected evidence</span><strong>Identity & profile</strong><p>Resume, bio, rate, skills, links, messaging, and hiring controls are withheld until access is active.</p></div></div>
    </>;
  }

  const [{data:a},{data:conversation},{data:history}]=await Promise.all([
    admin.from("applications").select("*").eq("id",id).single(),
    admin.from("conversations").select("id").eq("application_id",id).maybeSingle(),
    admin.from("application_status_history").select("*").eq("application_id",id).order("created_at",{ascending:true})
  ]);
  if(!a)notFound();
  const {data:authUser}=await admin.auth.admin.getUserById(a.va_id);
  const vaEmail=authUser.user?.email||null;
  const p=a.profile_snapshot||{}; const score=Number(a.match_score||0);
  return <>{query.hired?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Hire confirmed. The VA has been notified and the workroom is ready for onboarding.</div>:null}{query.status_updated?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Candidate stage updated.</div>:null}
    <div className="page-head"><div><Link className="text-link small" href={`/workspace/client/jobs/${a.job_id}`}>← Back to role</Link><h1 style={{marginTop:8}}>{p.full_name||"VA applicant"}</h1><p>{p.headline||p.primary_category||"Virtual Assistant"} · for {job?.title}</p></div>{a.status==="hired"?<span className="badge badge-success">Hired</span>:<form action={updateApplicationStatusAction} className="row wrap"><input type="hidden" name="application_id" value={a.id}/><input type="hidden" name="return_to" value={`/workspace/client/candidates/${a.id}`}/><label className="sr-only" htmlFor="candidate-status">Candidate status</label><select id="candidate-status" name="status" defaultValue={a.status} className="compact-select">{statusOptions.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><button className="btn" type="submit">Update stage</button></form>}</div>
    <div className="profile-layout"><article className="card candidate-review-card"><div className="row wrap"><span className="badge badge-success"><ShieldCheck size={14}/> Vetted VA</span><span className="badge">{matchLabel(score)} · {score}/100</span></div><h2>Professional summary</h2><p className="muted profile-copy">{p.bio||"No professional summary was included in this application."}</p>{a.cover_note?<><h2>Application note</h2><div className="detail-note"><p>{a.cover_note}</p></div></>:null}
      <div className="grid-2"><section><h2>Skills</h2><div className="pill-list">{uniqueStrings(p.skills).length?uniqueStrings(p.skills).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>):<span className="small muted">No skills listed.</span>}</div></section><section><h2>Tools</h2><div className="pill-list">{uniqueStrings(p.tools).length?uniqueStrings(p.tools).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>):<span className="small muted">No tools listed.</span>}</div></section></div>
      {uniqueStrings(p.industries).length?<><h2>Industries</h2><div className="pill-list">{uniqueStrings(p.industries).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div></>:null}
      <section className="candidate-timeline"><h2>Pipeline history</h2>{history?.length?history.map((h:any,index:number)=><div className="timeline-row" key={h.id}><span className={`timeline-dot ${index===history.length-1?"active":"done"}`}/><div><strong>{h.from_status?`${String(h.from_status).replaceAll("_"," ")} → `:""}{String(h.to_status).replaceAll("_"," ")}</strong><div className="small muted">{dateShort(h.created_at)}{h.note?` · ${h.note}`:""}</div></div></div>):<><div className="timeline-row"><span className="timeline-dot done"/><div><strong>Applied</strong><div className="small muted">{dateShort(a.applied_at)}</div></div></div><div className="timeline-row"><span className="timeline-dot active"/><div><strong>{String(a.status).replaceAll("_"," ")}</strong><div className="small muted">Last updated {dateShort(a.updated_at)}</div></div></div></>}</section>
    </article>
    <aside className="profile-sidebar stack"><div className="card candidate-contact-card"><div className="row"><Mail size={18}/><div><div className="small muted">Contact email</div>{vaEmail?<a className="contact-email-link" href={`mailto:${vaEmail}`}>{vaEmail}</a>:<strong>Not available</strong>}</div></div><p className="small muted">Available because candidate access is active for this role.</p></div><div className="card profile-facts"><h3>Working fit</h3><div><span>Primary specialty</span><strong>{p.primary_category||"Not set"}</strong></div><div><span>Experience</span><strong>{p.years_experience!=null?`${p.years_experience}+ years`:"Not set"}</strong></div><div><span>Availability</span><strong>{p.weekly_hours?`${p.weekly_hours} hrs/week`:"Not set"}</strong></div><div><span>Preferred rate</span><strong>{p.hourly_rate?`USD ${p.hourly_rate}/hr`:"Not set"}</strong></div><div><span>Schedule</span><strong>{p.schedule||"Flexible"}</strong></div><div><span>Live overlap</span><strong>{p.overlap_hours!=null?`${p.overlap_hours} hrs/day`:"Flexible"}</strong></div></div>
      <div className="card stack">{conversation?<Link className="btn btn-primary" href={`/workspace/client/messages?thread=${conversation.id}`}><MessageSquare size={16}/> Open this conversation</Link>:<div className="alert">The conversation has not been created yet.</div>}{p.resume_path?<a className="btn" href={`/api/resume/${a.id}`} target="_blank">Open private resume</a>:null}{p.portfolio_url?<a className="btn" href={p.portfolio_url} target="_blank" rel="noreferrer">Portfolio</a>:null}{p.linkedin_url?<a className="btn" href={p.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>:null}</div>
      {a.status!=="hired"&&!['rejected','withdrawn'].includes(a.status)?<details className="card hire-confirm-card"><summary>Hire this candidate</summary><form action={hireCandidateAction} className="stack hire-form"><input type="hidden" name="application_id" value={a.id}/><p className="small muted">Hiring is intentionally separate from the pipeline status menu. Confirm the terms you and the VA have agreed before the workroom is created.</p><div className="field"><label>Final hourly rate, USD</label><input type="number" name="agreed_hourly_rate" min={MIN_HOURLY_RATE} step="0.01" required defaultValue={p.hourly_rate||job?.min_hourly_rate||MIN_HOURLY_RATE}/></div><div className="field"><label>Start date</label><input type="date" name="start_date" required/></div><div className="field"><label>Agreed working schedule</label><textarea name="agreed_schedule" required minLength={3} maxLength={500} defaultValue={job?.schedule_notes||""} placeholder="Example: Monday to Friday, 9am to 1pm US Eastern overlap, remaining hours flexible."/></div><label className="confirmation-check"><input type="checkbox" name="confirm_hire" required/><span>I confirm the final rate, start date, and schedule have been agreed with this candidate.</span></label><button className="btn btn-primary" type="submit">Confirm hire and create workroom</button></form></details>:null}
    </aside></div></>;
}
