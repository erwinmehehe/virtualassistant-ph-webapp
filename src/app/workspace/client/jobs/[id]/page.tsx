import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, MessageSquare, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { acceptCommercialTermsAction, closeJobAction } from "@/app/actions/jobs";
import { dateShort, money } from "@/lib/format";
import { uniqueStrings } from "@/lib/collections";

export default async function ClientJobDetail({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const {id}=await params;
  const query=await searchParams;
  const {user}=await requireRole("client");
  const supabase=await createClient();
  const {data:job}=await supabase.from("jobs").select("*").eq("id",id).eq("client_id",user.id).single();
  if(!job)notFound();

  const admin=createAdminClient();
  const [{data:commercial},{data:released},{data:interviews},{data:offers},{data:workrooms},{data:recruiter}]=await Promise.all([
    supabase.from("job_commercials").select("*").eq("job_id",id).maybeSingle(),
    admin.from("job_shortlist_candidates").select("va_id,client_decision").eq("job_id",id).eq("shortlist_status","released"),
    admin.from("candidate_interviews").select("id,status,client_decision").eq("job_id",id).neq("status","cancelled"),
    admin.from("placement_offers").select("id,status").eq("job_id",id),
    admin.from("workrooms").select("id,status").eq("job_id",id),
    job.recruiter_id?admin.from("profiles").select("id,full_name").eq("id",job.recruiter_id).maybeSingle():Promise.resolve({data:null} as any)
  ]);

  const shortlistCount=(released||[]).filter((row:any)=>row.client_decision!=="pass").length;
  const waitingDecision=(released||[]).filter((row:any)=>!row.client_decision).length;
  const interviewCount=(interviews||[]).filter((row:any)=>["requested","scheduled","completed"].includes(row.status)&&!row.client_decision).length;
  const offerCount=(offers||[]).filter((row:any)=>["pending_va","pending_client"].includes(row.status)).length;
  const hiredCount=(workrooms||[]).filter((row:any)=>row.status==="active").length;
  const roleApproved=job.status==="published"||commercial?.commercial_status==="accepted";

  const current=job.status==="closed"?{label:"Closed",copy:"This hiring request is closed.",href:"/workspace/client/jobs",action:"View roles"}
    : hiredCount?{label:"Placement active",copy:"The VA is hired. Continue onboarding and day-to-day work in the workroom.",href:"/workspace/client/workroom",action:"Open workroom"}
    : offerCount?{label:"Final offer",copy:"Final placement terms are moving through VA acceptance and client confirmation.",href:"/workspace/client/offers",action:"Open offers"}
    : interviewCount?{label:"Interview",copy:"An interview is waiting for scheduling, completion, or feedback.",href:"/workspace/client/interviews",action:"Open interviews"}
    : waitingDecision?{label:"Your decision",copy:`${waitingDecision} recruiter-selected VA${waitingDecision===1?" is":"s are"} waiting for Interested / Interview / Pass feedback.`,href:`/workspace/client/candidates?role=${job.id}`,action:"Review shortlist"}
    : roleApproved?{label:"Recruiting",copy:"Your recruiter is screening the vetted VA pool and preparing the next shortlist.",href:"/workspace/client/candidates?role="+job.id,action:"View shortlist"}
    : commercial?.commercial_status==="quoted"?{label:"Terms approval",copy:"Approve the service terms so the managed recruiting search can begin.",href:`/workspace/client/jobs/${job.id}#terms`,action:"Review terms"}
    : {label:"Recruiter review",copy:"Your recruiter is reviewing the hiring brief and commercial setup before recruiting begins.",href:"/workspace/client/messages",action:"Message recruiter"};

  return <>
    {query.saved?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Hiring request saved.</div>:null}
    <div className="page-head"><div><div className="row wrap"><span className={`badge ${job.status==="published"?"badge-success":job.status==="pending"?"badge-warning":""}`}>{job.status==="published"?"Recruiting":job.status==="pending"?"In review":String(job.status).replaceAll("_"," ")}</span><span className="small muted">Created {dateShort(job.created_at)}</span></div><h1 style={{marginTop:8}}>{job.title}</h1><p>{job.company_name||"Your company"} · {job.hours_per_week?`${job.hours_per_week} hrs/week`:"Flexible hours"} · VA pay from {money(job.min_hourly_rate)}/hr</p></div><div className="row wrap">{job.status!=="closed"?<Link className="btn" href={`/workspace/client/jobs/${job.id}/edit`}>Edit brief</Link>:null}<Link className="btn" href="/workspace/client/messages"><MessageSquare size={15}/> Message recruiter</Link>{job.status!=="closed"?<form action={closeJobAction}><input type="hidden" name="job_id" value={job.id}/><button className="btn btn-danger" type="submit">Close request</button></form>:null}</div></div>

    {job.rejection_note?<div className="alert" style={{marginBottom:18}}><strong>Recruiter note:</strong> {job.rejection_note}</div>:null}

    <section className="candidate-next-action" style={{marginBottom:18}}><div className="candidate-next-icon"><Sparkles size={21}/></div><div><span className="small">Current stage</span><h2>{current.label}</h2><p>{current.copy}</p>{recruiter?.full_name?<small className="muted">Recruiter owner: {recruiter.full_name}</small>:null}</div><Link className="btn btn-primary" href={current.href}>{current.action}<ArrowRight size={16}/></Link></section>

    <section className="card commercial-card" id="terms" style={{marginBottom:18}}><div className="row-between wrap"><div><div className="small muted">Hiring service</div><strong>{job.service_model==="managed_service"?"Managed VA service":"Recruiter-led curated placement"}</strong><div className="small muted">Recruiting, vetting, shortlist access, interview coordination, and placement workflow are handled by the agency.</div></div><div><div className="small muted">Service terms</div><strong>{commercial?commercial.service_model==="managed_service"?`${commercial.managed_markup_percent||0}% managed-service margin`:`USD ${commercial.placement_fee||0} placement fee`:"Being prepared"}</strong>{commercial?<div className="small muted">Status: {String(commercial.commercial_status).replaceAll("_"," ")}</div>:null}</div></div>{commercial?.commercial_status==="quoted"?<form action={acceptCommercialTermsAction} style={{marginTop:14}}><input type="hidden" name="job_id" value={job.id}/><label className="confirmation-check" style={{marginBottom:12}}><input type="checkbox" name="fee_ack" required/><span>I understand this service fee is separate from the VA’s compensation and includes recruiter-managed candidate access.</span></label><button className="btn btn-primary" type="submit">Approve terms and start recruiting</button></form>:null}</section>

    <div className="grid-4" style={{marginBottom:18}}><div className="card"><div className="small muted">Recruiter shortlist</div><strong style={{fontSize:28}}>{shortlistCount}</strong><div className="small muted">Client-visible only after recruiter release</div></div><div className="card"><div className="small muted">Waiting on you</div><strong style={{fontSize:28}}>{waitingDecision}</strong><div className="small muted">Shortlist decisions</div></div><div className="card"><div className="small muted">Interviews</div><strong style={{fontSize:28}}>{interviewCount}</strong></div><div className="card"><div className="small muted">Active placements</div><strong style={{fontSize:28}}>{hiredCount}</strong></div></div>

    <div className="grid-2"><section className="card"><h3>Role brief</h3><div className="score-grid"><div><span>Hours</span><strong>{job.hours_per_week?`${job.hours_per_week}/week`:"Flexible"}</strong></div><div><span>VA pay</span><strong>{money(job.min_hourly_rate)}{job.max_hourly_rate?`–${money(job.max_hourly_rate)}`:"+"}/hr</strong></div><div><span>Timezone</span><strong>{job.timezone||"Not set"}</strong></div><div><span>Live overlap</span><strong>{job.overlap_hours!=null?`${job.overlap_hours} hrs/day`:"Not set"}</strong></div></div>{job.summary?<><h4>What this VA should own</h4><p>{job.summary}</p></>:null}{job.description?<p className="small muted" style={{whiteSpace:"pre-wrap"}}>{job.description}</p>:null}</section>

      <section className="card"><h3>Recruiting requirements</h3><div><strong className="small">Skills</strong><div className="pill-list" style={{marginTop:8}}>{uniqueStrings(job.required_skills).length?uniqueStrings(job.required_skills).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>):<span className="small muted">None listed</span>}</div></div><div style={{marginTop:16}}><strong className="small">Tools</strong><div className="pill-list" style={{marginTop:8}}>{uniqueStrings(job.required_tools).length?uniqueStrings(job.required_tools).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>):<span className="small muted">None listed</span>}</div></div><div style={{marginTop:16}}><strong className="small">Schedule</strong><p className="small muted">{job.schedule_notes||"No additional schedule notes."}</p></div><div className="info-banner" style={{marginTop:16}}><strong>You do not manage raw applicants.</strong><p style={{margin:"6px 0 0"}}>Your recruiter screens interest, applications, evidence, and fit internally. Only recruiter-approved VAs appear in your shortlist.</p></div></section></div>
  </>;
}
