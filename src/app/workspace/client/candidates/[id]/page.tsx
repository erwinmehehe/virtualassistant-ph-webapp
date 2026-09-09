import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayCircle, CheckCircle2, Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hireCandidateAction, updateApplicationStatusAction } from "@/app/actions/applications";
import { matchLabel } from "@/lib/matching";
import { dateShort } from "@/lib/format";
import { MIN_HOURLY_RATE } from "@/lib/constants";
import { uniqueStrings } from "@/lib/collections";
import { recordProductEvent } from "@/lib/product-events";

const statusOptions = [["new","Applied"],["reviewing","Reviewing"],["shortlisted","Shortlisted"],["interview","Interview"],["offered","Offered"],["rejected","Rejected"]] as const;

export default async function CandidateReviewPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const {id}=await params;
  const query=await searchParams;
  const {user}=await requireRole("client");
  const admin=createAdminClient();

  const {data:summary}=await admin.from("applications")
    .select("id,job_id,va_id,status,match_score,applied_at,jobs!inner(id,title,status,client_id,min_hourly_rate,start_timing,schedule_notes)")
    .eq("id",id)
    .eq("jobs.client_id",user.id)
    .single();
  if(!summary)notFound();

  const job=Array.isArray(summary.jobs)?summary.jobs[0]:summary.jobs;
  const approved=job?.status==="published";
  await recordProductEvent("candidate_viewed",{userId:user.id,path:`/workspace/client/candidates/${id}`,metadata:{application_id:id,job_id:summary.job_id,approved}});

  if(!approved){
    return <>
      <div className="page-head">
        <div><Link className="text-link small" href={`/workspace/client/jobs/${summary.job_id}`}>← Back to role</Link><h1 style={{marginTop:8}}>Candidate profile is being prepared</h1><p>Applicant for {job?.title}</p></div>
        <span className="badge badge-warning">Role in review</span>
      </div>
      <div className="card empty"><h3>Your recruiter is still preparing this role.</h3><p>Full candidate profiles become available automatically when the hiring request is approved.</p><Link className="btn btn-primary" href={`/workspace/client/jobs/${summary.job_id}`}>View role progress</Link></div>
    </>;
  }

  try{
    const cutoff=new Date(Date.now()-6*60*60*1000).toISOString();
    const {count}=await admin.from("recruiter_activity").select("id",{count:"exact",head:true}).eq("subject_type","va").eq("subject_id",summary.va_id).eq("action","client_viewed").gte("created_at",cutoff).contains("metadata",{application_id:id});
    if(!count)await admin.from("recruiter_activity").insert({subject_type:"va",subject_id:summary.va_id,action:"client_viewed",description:`Client viewed candidate for ${job?.title||"role"}`,actor_id:user.id,metadata:{application_id:id,job_id:summary.job_id}});
  }catch{}

  const [{data:application},{data:conversation},{data:history},{data:vetting}]=await Promise.all([
    admin.from("applications").select("*").eq("id",id).single(),
    admin.from("conversations").select("id").eq("application_id",id).maybeSingle(),
    admin.from("application_status_history").select("*").eq("application_id",id).order("created_at",{ascending:true}),
    admin.from("va_vetting").select("video_url").eq("va_id",summary.va_id).maybeSingle()
  ]);
  if(!application)notFound();

  const {data:authUser}=await admin.auth.admin.getUserById(application.va_id);
  const vaEmail=authUser.user?.email||null;
  const profile=application.profile_snapshot||{};
  const score=Number(application.match_score||0);

  return <>
    {query.hired?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Hire confirmed. The Virtual Assistant has been notified and the workroom is ready for onboarding.</div>:null}
    {query.status_updated?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Candidate stage updated.</div>:null}

    <div className="page-head">
      <div><Link className="text-link small" href={`/workspace/client/jobs/${application.job_id}`}>← Back to role</Link><h1 style={{marginTop:8}}>{profile.full_name||"VA applicant"}</h1><p>{profile.headline||profile.primary_category||"Virtual Assistant"} · for {job?.title}</p></div>
      {application.status==="hired"?<span className="badge badge-success">Hired</span>:<form action={updateApplicationStatusAction} className="row wrap"><input type="hidden" name="application_id" value={application.id}/><input type="hidden" name="return_to" value={`/workspace/client/candidates/${application.id}`}/><label className="sr-only" htmlFor="candidate-status">Candidate status</label><select id="candidate-status" name="status" defaultValue={application.status} className="compact-select">{statusOptions.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><button className="btn" type="submit">Update stage</button></form>}
    </div>

    <div className="profile-layout">
      <article className="card candidate-review-card">
        <div className="row wrap"><span className="badge badge-success"><ShieldCheck size={14}/> Vetted VA</span><span className="badge">{matchLabel(score)} · {score}/100</span></div>
        <h2>Professional summary</h2><p className="muted profile-copy">{profile.bio||"No professional summary was included in this application."}</p>
        {application.cover_note?<><h2>Application note</h2><div className="detail-note"><p>{application.cover_note}</p></div></>:null}
        {vetting?.video_url?<><h2>Video introduction</h2><div className="candidate-video-row"><PlayCircle size={20}/><div><strong>Recorded introduction</strong><span className="small muted">Two minutes, recorded during vetting. Opens in a new tab.</span></div><a className="btn btn-primary" href={vetting.video_url} target="_blank" rel="noopener noreferrer">Watch video</a></div></>:null}

        <div className="grid-2">
          <section><h2>Skills</h2><div className="pill-list">{uniqueStrings(profile.skills).length?uniqueStrings(profile.skills).map((value,index)=><span className="badge" key={`${String(value)}-${index}`}>{value}</span>):<span className="small muted">No skills listed.</span>}</div></section>
          <section><h2>Tools</h2><div className="pill-list">{uniqueStrings(profile.tools).length?uniqueStrings(profile.tools).map((value,index)=><span className="badge" key={`${String(value)}-${index}`}>{value}</span>):<span className="small muted">No tools listed.</span>}</div></section>
        </div>

        {uniqueStrings(profile.industries).length?<><h2>Industries</h2><div className="pill-list">{uniqueStrings(profile.industries).map((value,index)=><span className="badge" key={`${String(value)}-${index}`}>{value}</span>)}</div></>:null}

        <section className="candidate-timeline"><h2>Pipeline history</h2>{history?.length?history.map((item:any,index:number)=><div className="timeline-row" key={item.id}><span className={`timeline-dot ${index===history.length-1?"active":"done"}`}/><div><strong>{item.from_status?`${String(item.from_status).replaceAll("_"," ")} → `:""}{String(item.to_status).replaceAll("_"," ")}</strong><div className="small muted">{dateShort(item.created_at)}{item.note?` · ${item.note}`:""}</div></div></div>):<><div className="timeline-row"><span className="timeline-dot done"/><div><strong>Applied</strong><div className="small muted">{dateShort(application.applied_at)}</div></div></div><div className="timeline-row"><span className="timeline-dot active"/><div><strong>{String(application.status).replaceAll("_"," ")}</strong><div className="small muted">Last updated {dateShort(application.updated_at)}</div></div></div></>}</section>
      </article>

      <aside className="profile-sidebar stack">
        <div className="card candidate-contact-card"><div className="row"><Mail size={18}/><div><div className="small muted">Contact email</div>{vaEmail?<a className="contact-email-link" href={`mailto:${vaEmail}`}>{vaEmail}</a>:<strong>Not available</strong>}</div></div><p className="small muted">Included with your approved hiring request.</p></div>

        <div className="card profile-facts"><h3>Working fit</h3><div><span>Primary specialty</span><strong>{profile.primary_category||"Not set"}</strong></div><div><span>Experience</span><strong>{profile.years_experience!=null?`${profile.years_experience}+ years`:"Not set"}</strong></div><div><span>Availability</span><strong>{profile.weekly_hours?`${profile.weekly_hours} hrs/week`:"Not set"}</strong></div><div><span>Preferred rate</span><strong>{profile.hourly_rate?`USD ${profile.hourly_rate}/hr`:"Not set"}</strong></div><div><span>Schedule</span><strong>{profile.schedule||"Flexible"}</strong></div><div><span>Live overlap</span><strong>{profile.overlap_hours!=null?`${profile.overlap_hours} hrs/day`:"Flexible"}</strong></div></div>

        <div className="card stack">{conversation?<Link className="btn btn-primary" href={`/workspace/client/messages?thread=${conversation.id}`}><MessageSquare size={16}/> Open this conversation</Link>:<div className="alert">The conversation has not been created yet.</div>}{profile.resume_path?<a className="btn" href={`/api/resume/${application.id}`} target="_blank">Open private resume</a>:null}{profile.portfolio_url?<a className="btn" href={profile.portfolio_url} target="_blank" rel="noreferrer">Portfolio</a>:null}{profile.linkedin_url?<a className="btn" href={profile.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>:null}</div>

        {application.status!=="hired"&&!["rejected","withdrawn"].includes(application.status)?<details className="card hire-confirm-card"><summary>Hire this candidate</summary><form action={hireCandidateAction} className="stack hire-form"><input type="hidden" name="application_id" value={application.id}/><p className="small muted">Confirm the terms you and the Virtual Assistant have agreed before the workroom is created.</p><div className="field"><label>Final hourly rate, USD</label><input type="number" name="agreed_hourly_rate" min={MIN_HOURLY_RATE} step="0.01" required defaultValue={profile.hourly_rate||job?.min_hourly_rate||MIN_HOURLY_RATE}/></div><div className="field"><label>Start date</label><input type="date" name="start_date" required/></div><div className="field"><label>Agreed working schedule</label><textarea name="agreed_schedule" required minLength={3} maxLength={500} defaultValue={job?.schedule_notes||""} placeholder="Example: Monday to Friday, 9am to 1pm US Eastern overlap, remaining hours flexible."/></div><label className="confirmation-check"><input type="checkbox" name="confirm_hire" required/><span>I confirm the final rate, start date, and schedule have been agreed with this candidate.</span></label><button className="btn btn-primary" type="submit">Confirm hire and create workroom</button></form></details>:null}
      </aside>
    </div>
  </>;
}
