import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { StaffJobMatching } from "@/components/staff-job-matching";
import { RecruiterCopilotPanel } from "@/components/recruiter-copilot-panel";
import { addRecruiterNoteAction, closeRecruiterRoleAction, sendClientFollowupAction } from "@/app/actions/recruiter";
import { createPlacementOfferAction, updateRoleHardRequirementsAction } from "@/app/actions/recruiter-operations-system";
import { dateShort, money } from "@/lib/format";
import type { RecruiterActivityRow } from "@/lib/workspace-rows";

type MatchShortlistRow = { va_id: string; shortlist_status: string; client_decision: string | null; match_score: number | null };
type MatchVaRow = { user_id: string; hourly_rate: number | null; weekly_hours: number | null; schedule: string | null; preferred_timezone: string | null };

export default async function RecruiterJobMatchingDetail({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const {id}=await params;const query=await searchParams;await requireRole("recruiter");const admin=createAdminClient();
  const [{data:job},{data:noteData},{data:activityData},{data:shortlistData}]=await Promise.all([
    admin.from("jobs").select("*").eq("id",id).single(),
    admin.from("recruiter_notes").select("id,note,created_at").eq("subject_type","job").eq("subject_id",id).order("created_at",{ascending:false}).limit(20),
    admin.from("recruiter_activity").select("id,action,description,created_at,metadata").eq("subject_type","job").eq("subject_id",id).order("created_at",{ascending:false}).limit(40),
    admin.from("job_shortlist_candidates").select("va_id,shortlist_status,client_decision,match_score").eq("job_id",id).in("shortlist_status",["proposed","released"]).order("match_score",{ascending:false})
  ]);
  if(!job)notFound();

  const notes=(noteData||[]) as {id:string;note:string;created_at:string}[];
  const activity=(activityData||[]) as (RecruiterActivityRow & {id:string})[];
  const shortlist=(shortlistData||[]) as MatchShortlistRow[];
  const candidateIds=[...new Set(shortlist.map((row)=>row.va_id))];
  const [{data:client},{data:lead},clientAuth,{data:candidateProfiles},{data:candidateVas}]=await Promise.all([
    job.client_id?admin.from("profiles").select("full_name").eq("id",job.client_id).maybeSingle():Promise.resolve({data:null}),
    job.lead_id?admin.from("lead_intake").select("name,email,phone,company").eq("id",job.lead_id).maybeSingle():Promise.resolve({data:null}),
    job.client_id?admin.auth.admin.getUserById(job.client_id):Promise.resolve({data:{user:null}}),
    candidateIds.length?admin.from("profiles").select("id,full_name").in("id",candidateIds):Promise.resolve({data:[]}),
    candidateIds.length?admin.from("va_profiles").select("user_id,hourly_rate,weekly_hours,schedule,preferred_timezone").in("user_id",candidateIds):Promise.resolve({data:[]})
  ]);
  const clientEmail=clientAuth?.data?.user?.email||lead?.email||"";
  const clientPhone=lead?.phone||"";
  const clientName=client?.full_name||lead?.name||(job.client_id?"Client account":"No account yet, from a lead");
  const emailSubject=`VirtualAssistant.com.ph - ${job.title}`;
  const nameMap=new Map(((candidateProfiles||[]) as {id:string;full_name:string|null}[]).map((row)=>[row.id,row.full_name||"VA candidate"]));
  const vaMap=new Map(((candidateVas||[]) as MatchVaRow[]).map((row)=>[row.user_id,row]));
  const candidateOptions=shortlist.map((row)=>({id:row.va_id,name:String(nameMap.get(row.va_id)||"VA candidate"),status:row.shortlist_status==="released"?(row.client_decision?`client ${row.client_decision}`:"client review"):"recruiter suggestion"}));
  const offerCandidates=shortlist.filter((row)=>row.shortlist_status==="released"&&["interested","interview"].includes(String(row.client_decision))).map((row)=>({id:row.va_id,name:String(nameMap.get(row.va_id)||"VA candidate"),va:vaMap.get(row.va_id)}));

  return <>
    {query.contact_sent?<div className="success-banner">Client follow-up email sent and logged.</div>:null}{query.role_archived?<div className="success-banner">Role closed and archived. History is retained.</div>:null}{query.contact_error?<div className="alert" role="alert">{query.contact_error}</div>:null}
    {query.shortlist_saved?<div className="success-banner">Internal assignments saved.</div>:null}{query.shortlist_released?<div className="success-banner">Selected Virtual Assistants released to the client shortlist.</div>:null}{query.client_invited?<div className="success-banner">Shortlist saved and the client was invited to claim their account. The invited VAs will move into client review automatically after the account is linked.</div>:null}{query.shortlist_error?<div className="alert">{query.shortlist_error}</div>:null}{query.note_saved?<div className="success-banner">Private role note saved.</div>:null}
    {query.requirements_saved?<div className="success-banner">Hard requirements saved. Automatic matching was refreshed for recruiter review.</div>:null}{query.offer_sent?<div className="success-banner">Placement offer sent to the VA for acceptance.</div>:null}
    <div className="page-head"><div><Link className="text-link small" href="/workspace/recruiter/matching">← Role board</Link><div className="row wrap" style={{marginTop:8}}><span className="badge">{job.status}</span><span className="badge"><Sparkles size={13}/> Recruiter matching</span></div><h1 style={{marginTop:8}}>{job.title}</h1><p>{job.company_name||lead?.company||"Client role"} · {job.hours_per_week?`${job.hours_per_week} hrs/week`:"Flexible hours"} · from {money(job.min_hourly_rate)}/hr · submitted {dateShort(job.created_at)}</p></div><div className="row wrap">{clientEmail?<a className="btn" href={`mailto:${clientEmail}?subject=${encodeURIComponent(emailSubject)}`}><Mail size={15}/> Email client</a>:null}{clientPhone?<a className="btn" href={`tel:${String(clientPhone).replace(/[^+\d]/g,"")}`}><Phone size={15}/> Call client</a>:null}{["pending","published"].includes(job.status)?<form action={closeRecruiterRoleAction}><input type="hidden" name="job_id" value={job.id}/><input type="hidden" name="return_to" value={`/workspace/recruiter/matching/${job.id}`}/><button className="btn" type="submit">Close role</button></form>:null}<a className="btn btn-primary" href="#matching">Review matches</a></div></div>

    <RecruiterCopilotPanel jobId={job.id} candidates={candidateOptions}/>

    <section className="card" style={{marginBottom:18}}>
      <div className="row-between wrap"><div><div className="row"><ShieldCheck size={18}/><h2 style={{margin:0}}>Hard requirements & dealbreakers</h2></div><p className="small muted">These are recruiter guardrails, not soft scoring preferences. A VA who fails a hard requirement is flagged ineligible for automatic suggestions until a recruiter changes the requirement.</p></div><span className="badge">Recruiter controlled</span></div>
      <form action={updateRoleHardRequirementsAction} className="form-grid" style={{marginTop:14}}><input type="hidden" name="job_id" value={job.id}/><input type="hidden" name="return_to" value={`/workspace/recruiter/matching/${job.id}`}/>
        <div className="field span-2"><label>Must-have skills</label><input name="must_have_skills" defaultValue={(job.must_have_skills||[]).join(", ")} placeholder="QuickBooks, Accounts payable"/><span className="small muted">All listed skills must be present.</span></div>
        <div className="field span-2"><label>Nice-to-have skills</label><input name="nice_to_have_skills" defaultValue={(job.nice_to_have_skills||[]).join(", ")} placeholder="Reporting, Payroll support"/></div>
        <div className="field"><label>Required tools</label><input name="must_have_tools" defaultValue={(job.must_have_tools||[]).join(", ")} placeholder="QuickBooks, Google Workspace"/></div>
        <div className="field"><label>Required industry experience</label><input name="required_industries" defaultValue={(job.required_industries||[]).join(", ")} placeholder="Dental, Healthcare"/></div>
        <div className="field"><label>Minimum years experience</label><input type="number" min="0" max="60" name="minimum_years_experience" defaultValue={job.minimum_years_experience??""}/></div>
        <div className="field"><label>Communication requirement</label><input name="communication_requirement" defaultValue={job.communication_requirement||""} placeholder="Client calls in fluent business English"/></div>
        <div className="field span-2"><label>Dealbreakers</label><textarea className="textarea-mini" name="dealbreakers" defaultValue={(job.dealbreakers||[]).join("\n")} placeholder={'Cannot work required overlap\nNo direct client calls\nRate above approved ceiling'}/></div>
        <div className="span-2"><button className="btn btn-primary" type="submit">Save requirements & refresh matches</button></div>
      </form>
    </section>

    <section className="card staff-client-contact-card" style={{marginBottom:18}}>
      <div className="row-between wrap"><div><h2 style={{margin:0}}>Client follow-up</h2><p className="small muted">Send a tracked email without leaving the role. Replies go to the configured VirtualAssistant.com.ph sender inbox.</p></div><div className="row wrap">{clientEmail?<a className="btn btn-sm" href={`mailto:${clientEmail}?subject=${encodeURIComponent(emailSubject)}`}><Mail size={14}/> Open email app</a>:null}{clientPhone?<a className="btn btn-sm" href={`tel:${String(clientPhone).replace(/[^+\d]/g,"")}`}><Phone size={14}/> Call</a>:null}</div></div>
      {clientEmail?<details className="staff-followup-details" style={{marginTop:12}}><summary className="btn btn-primary btn-sm">Send from platform</summary><form action={sendClientFollowupAction} className="stack staff-followup-form"><input type="hidden" name="job_id" value={job.id}/><input type="hidden" name="return_to" value={`/workspace/recruiter/matching/${job.id}`}/><div className="field"><label>Subject</label><input name="subject" required minLength={3} maxLength={180} defaultValue={emailSubject}/></div><div className="field"><label>Message</label><textarea name="message" required minLength={10} maxLength={5000} defaultValue={`Hi ${String(clientName).trim().split(/\s+/)[0]||"there"},\n\nI am following up on your ${job.title} hiring request. We can confirm the shortlist, answer any role questions, and keep the next hiring step moving.`}/></div><button className="btn btn-primary" type="submit">Send and log email</button></form></details>:<div className="alert" style={{marginTop:12}}>No client email is attached to this role yet.</div>}
    </section>

    <section className="card role-match-brief"><div><strong>Client</strong><p className="muted">{clientName}</p>{clientEmail?<a className="text-link small" href={`mailto:${clientEmail}`}>{clientEmail}</a>:null}{clientPhone?<div><a className="text-link small" href={`tel:${String(clientPhone).replace(/[^+\d]/g,"")}`}>{clientPhone}</a></div>:null}</div><div><strong>Timezone</strong><p className="muted">{job.timezone||"Not set"}</p></div><div><strong>Pay range</strong><p className="muted">{money(job.min_hourly_rate)}{job.max_hourly_rate?` to ${money(job.max_hourly_rate)}`:"+"}/hr</p></div><div><strong>Experience level</strong><p className="muted">{job.experience_level||"Not set"}</p></div><div><strong>Start timing</strong><p className="muted">{job.start_timing||"Not set"}</p></div><div><strong>Categories</strong><p className="muted">{(job.categories||[]).join(", ")||"Not set"}</p></div><div><strong>Required skills</strong><p className="muted">{(job.required_skills||[]).join(", ")||"Not set"}</p></div><div><strong>Required tools</strong><p className="muted">{(job.required_tools||[]).join(", ")||"Not set"}</p></div>{job.summary?<div className="span-2"><strong>Summary</strong><p className="muted">{job.summary}</p></div>:null}{job.description?<div className="span-2"><strong>Description</strong><p className="muted" style={{whiteSpace:"pre-wrap"}}>{job.description}</p></div>:null}</section>

    {offerCandidates.length?<section className="card" style={{marginBottom:18}}><div><h2 style={{margin:0}}>Prepare placement offer</h2><p className="small muted">Enter final terms once. The VA accepts first, then the client confirms. Only after both confirmations does the system mark the candidate hired and open onboarding.</p></div><form action={createPlacementOfferAction} className="form-grid" style={{marginTop:14}}><input type="hidden" name="job_id" value={job.id}/><div className="field span-2"><label>VA</label><select name="va_id" required defaultValue=""><option value="" disabled>Choose client-approved VA…</option>{offerCandidates.map((candidate)=><option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></div><div className="field"><label>Final hourly rate, USD</label><input name="hourly_rate" type="number" min="5" step="0.01" required defaultValue={job.min_hourly_rate||""}/></div><div className="field"><label>Weekly hours</label><input name="weekly_hours" type="number" min="1" max="80" required defaultValue={job.hours_per_week||40}/></div><div className="field"><label>Start date</label><input name="start_date" type="date" required/></div><div className="field"><label>Timezone</label><input name="timezone" defaultValue={job.timezone||""}/></div><div className="field span-2"><label>Final schedule</label><textarea className="textarea-mini" name="schedule" required minLength={3} defaultValue={job.schedule_notes||""} placeholder="Mon–Fri, 9am–1pm ET with agreed overlap"/></div><div className="field"><label>Service type</label><select name="service_type" defaultValue={job.service_model||"curated_placement"}><option value="curated_placement">Curated placement</option><option value="managed_service">Managed service</option></select></div><div className="field"><label>Internal / offer note</label><input name="notes" placeholder="Optional terms note"/></div><div className="span-2"><button className="btn btn-primary" type="submit">Send offer to VA</button></div></form></section>:null}

    <section className="card" style={{marginBottom:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Private recruiter notes & role timeline</h2><p className="small muted">Keep role context, client feedback, and matching decisions in one place.</p></div></div><form action={addRecruiterNoteAction} className="row wrap recruiter-note-form"><input type="hidden" name="subject_type" value="job"/><input type="hidden" name="subject_id" value={job.id}/><input type="hidden" name="return_to" value={`/workspace/recruiter/matching/${job.id}`}/><textarea name="note" required minLength={2} maxLength={4000} placeholder="Client feedback, matching instruction, follow-up…"/><button className="btn btn-primary" type="submit">Add note</button></form><div className="grid-2" style={{marginTop:18}}><div>{notes?.length?<div className="notes-list">{notes.map((n)=><div className="note-card" key={n.id}><p>{n.note}</p><small>{dateShort(n.created_at)}</small></div>)}</div>:<div className="empty">No private notes yet.</div>}</div><div className="timeline-list">{activity.length?activity.map((row)=><div className="timeline-item" key={row.id}><span className="timeline-dot"/><div><strong>{String(row.action).replaceAll("_"," ")}</strong><p>{row.description||"Role activity"}</p><small>{dateShort(row.created_at)}</small></div></div>):<div className="empty">Assignment and client-stage activity will appear here.</div>}</div></div></section>
    <div id="matching"><StaffJobMatching job={job} viewerRole="recruiter" returnTo={`/workspace/recruiter/matching/${job.id}`}/></div>
  </>;
}
