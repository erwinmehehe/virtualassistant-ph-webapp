import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { StaffJobMatching } from "@/components/staff-job-matching";
import { addRecruiterNoteAction } from "@/app/actions/recruiter";
import { dateShort, money } from "@/lib/format";

export default async function RecruiterJobMatchingDetail({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const {id}=await params;const query=await searchParams;await requireRole("recruiter");const admin=createAdminClient();
  const [{data:job},{data:notes},{data:activity}]=await Promise.all([
    admin.from("jobs").select("*").eq("id",id).single(),
    admin.from("recruiter_notes").select("id,note,created_at").eq("subject_type","job").eq("subject_id",id).order("created_at",{ascending:false}).limit(20),
    admin.from("recruiter_activity").select("id,action,description,created_at,metadata").eq("subject_type","job").eq("subject_id",id).order("created_at",{ascending:false}).limit(40)
  ]);
  if(!job)notFound();

  const [{data:client},{data:lead},clientAuth]=await Promise.all([
    job.client_id?admin.from("profiles").select("full_name").eq("id",job.client_id).maybeSingle():Promise.resolve({data:null} as any),
    job.lead_id?admin.from("lead_intake").select("name,email,phone,company").eq("id",job.lead_id).maybeSingle():Promise.resolve({data:null} as any),
    job.client_id?admin.auth.admin.getUserById(job.client_id):Promise.resolve({data:{user:null}} as any)
  ]);
  const clientEmail=clientAuth?.data?.user?.email||lead?.email||"";
  const clientPhone=lead?.phone||"";
  const clientName=client?.full_name||lead?.name||(job.client_id?"Client account":"No account yet, from a lead");
  const emailSubject=`VirtualAssistant.com.ph - ${job.title}`;

  return <>
    {query.shortlist_saved?<div className="success-banner">Internal assignments saved.</div>:null}{query.shortlist_released?<div className="success-banner">Selected VAs released to the client shortlist.</div>:null}{query.shortlist_error?<div className="alert">{query.shortlist_error}</div>:null}{query.note_saved?<div className="success-banner">Private role note saved.</div>:null}
    <div className="page-head"><div><Link className="text-link small" href="/workspace/recruiter/matching">← Role board</Link><div className="row wrap" style={{marginTop:8}}><span className="badge">{job.status}</span><span className="badge"><Sparkles size={13}/> Recruiter matching</span></div><h1 style={{marginTop:8}}>{job.title}</h1><p>{job.company_name||lead?.company||"Client role"} · {job.hours_per_week?`${job.hours_per_week} hrs/week`:"Flexible hours"} · from {money(job.min_hourly_rate)}/hr · submitted {dateShort(job.created_at)}</p></div><div className="row wrap">{clientEmail?<a className="btn" href={`mailto:${clientEmail}?subject=${encodeURIComponent(emailSubject)}`}><Mail size={15}/> Email client</a>:null}{clientPhone?<a className="btn" href={`tel:${String(clientPhone).replace(/[^+\d]/g,"")}`}><Phone size={15}/> Call client</a>:null}<a className="btn btn-primary" href="#matching">Find Matching VAs</a></div></div>
    <section className="card role-match-brief"><div><strong>Client</strong><p className="muted">{clientName}</p>{clientEmail?<a className="text-link small" href={`mailto:${clientEmail}`}>{clientEmail}</a>:null}{clientPhone?<div><a className="text-link small" href={`tel:${String(clientPhone).replace(/[^+\d]/g,"")}`}>{clientPhone}</a></div>:null}</div><div><strong>Timezone</strong><p className="muted">{job.timezone||"Not set"}</p></div><div><strong>Pay range</strong><p className="muted">{money(job.min_hourly_rate)}{job.max_hourly_rate?` to ${money(job.max_hourly_rate)}`:"+"}/hr</p></div><div><strong>Experience level</strong><p className="muted">{job.experience_level||"Not set"}</p></div><div><strong>Start timing</strong><p className="muted">{job.start_timing||"Not set"}</p></div><div><strong>Categories</strong><p className="muted">{(job.categories||[]).join(", ")||"Not set"}</p></div><div><strong>Required skills</strong><p className="muted">{(job.required_skills||[]).join(", ")||"Not set"}</p></div><div><strong>Required tools</strong><p className="muted">{(job.required_tools||[]).join(", ")||"Not set"}</p></div>{job.summary?<div className="span-2"><strong>Summary</strong><p className="muted">{job.summary}</p></div>:null}{job.description?<div className="span-2"><strong>Description</strong><p className="muted" style={{whiteSpace:"pre-wrap"}}>{job.description}</p></div>:null}</section>
    <section className="card" style={{marginBottom:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Private recruiter notes & role timeline</h2><p className="small muted">Keep role context, client feedback, and matching decisions in one place.</p></div></div><form action={addRecruiterNoteAction} className="row wrap recruiter-note-form"><input type="hidden" name="subject_type" value="job"/><input type="hidden" name="subject_id" value={job.id}/><input type="hidden" name="return_to" value={`/workspace/recruiter/matching/${job.id}`}/><textarea name="note" required minLength={2} maxLength={4000} placeholder="Client feedback, matching instruction, follow-up…"/><button className="btn btn-primary" type="submit">Add note</button></form><div className="grid-2" style={{marginTop:18}}><div>{notes?.length?<div className="notes-list">{notes.map((n:any)=><div className="note-card" key={n.id}><p>{n.note}</p><small>{dateShort(n.created_at)}</small></div>)}</div>:<div className="empty">No private notes yet.</div>}</div><div className="timeline-list">{(activity||[]).length?(activity||[]).map((row:any)=><div className="timeline-item" key={row.id}><span className="timeline-dot"/><div><strong>{String(row.action).replaceAll("_"," ")}</strong><p>{row.description||"Role activity"}</p><small>{dateShort(row.created_at)}</small></div></div>):<div className="empty">Assignment and client-stage activity will appear here.</div>}</div></div></section>
    <div id="matching"><StaffJobMatching job={job} viewerRole="recruiter" returnTo={`/workspace/recruiter/matching/${job.id}`}/></div>
  </>;
}
