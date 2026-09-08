import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateApplicationStatusAction, inviteVaAction } from "@/app/actions/applications";
import { acceptCommercialTermsAction, closeJobAction } from "@/app/actions/jobs";
import { CandidateAccessGate } from "@/components/candidate-access-gate";
import { candidateAccessUnlocked, protectedCandidateName } from "@/lib/candidate-access";
import { matchLabel } from "@/lib/matching";
import { dateShort, money } from "@/lib/format";
import { mergeUniqueStrings } from "@/lib/collections";

const stages = [["new","Applied"],["reviewing","Reviewing"],["shortlisted","Shortlisted"],["interview","Interview"],["offered","Offered"],["rejected","Rejected"]] as const;
const stageFilters = [["","All"],["new","Applied"],["reviewing","Reviewing"],["shortlisted","Shortlisted"],["interview","Interview"],["offered","Offered"],["hired","Hired"],["rejected","Rejected"]] as const;

export default async function ClientJobDetail({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const {id}=await params; const query=await searchParams; const {user}=await requireRole("client"); const supabase=await createClient();
  const {data:job}=await supabase.from("jobs").select("*").eq("id",id).eq("client_id",user.id).single(); if(!job)notFound();
  const admin=createAdminClient();
  const [{data:commercial},{data:access},{data:releasedRows}]=await Promise.all([
    supabase.from("job_commercials").select("*").eq("job_id",id).maybeSingle(),
    supabase.from("job_candidate_access").select("*").eq("job_id",id).maybeSingle(),
    admin.from("job_shortlist_candidates").select("va_id,match_score,match_confidence,released_at").eq("job_id",id).eq("shortlist_status","released").order("match_score",{ascending:false})
  ]);
  const unlocked=candidateAccessUnlocked(access?.access_status);
  const {data:applications}=unlocked
    ? await admin.from("applications").select("*").eq("job_id",id).order("applied_at",{ascending:false})
    : await admin.from("applications").select("id,status,match_score,applied_at").eq("job_id",id).order("applied_at",{ascending:false});

  const releasedIds=(releasedRows||[]).map((row:any)=>row.va_id);
  let shortlistProfiles:any[]=[]; let shortlistVas:any[]=[]; let invites:any[]=[];
  if(unlocked&&releasedIds.length){
    const results=await Promise.all([
      admin.from("profiles").select("id,full_name,avatar_url").in("id",releasedIds),
      admin.from("va_profiles").select("user_id,headline,primary_category,categories,skills,tools,years_experience,weekly_hours,hourly_rate,availability_status,directory_visible,slug").in("user_id",releasedIds),
      admin.from("job_invites").select("va_id,status").eq("job_id",id).in("va_id",releasedIds)
    ]);
    shortlistProfiles=results[0].data||[]; shortlistVas=results[1].data||[]; invites=results[2].data||[];
  }
  const profileMap=new Map(shortlistProfiles.map((p:any)=>[p.id,p]));
  const vaMap=new Map(shortlistVas.map((v:any)=>[v.user_id,v]));
  const inviteMap=new Map(invites.map((x:any)=>[x.va_id,x.status]));

  const applicantCount=applications?.length||0;
  const selectedStage=String(query.stage||"");
  const visibleApplications=selectedStage ? (applications||[]).filter((a:any)=>a.status===selectedStage) : (applications||[]);
  const stageCounts=new Map(stageFilters.map(([value])=>[value,value ? (applications||[]).filter((a:any)=>a.status===value).length : applicantCount]));
  const releasedCount=releasedRows?.length||0;
  const shortlistedCount=(applications||[]).filter((a:any)=>a.status==="shortlisted").length;
  const interviewCount=(applications||[]).filter((a:any)=>["interview","offered","hired"].includes(a.status)).length;

  return <>
    {query.saved?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Job saved. {job.status==="draft"?"It remains private until you submit it for review.":"Your changes are reflected below."}</div>:null}
    {query.invited?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Invitation sent. The VA can review it from their Applications workspace.</div>:null}
    {query.status_updated?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Candidate stage updated.</div>:null}
    {query.access_requested?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Candidate access request sent to the hiring team.</div>:null}

    <div className="page-head"><div><div className="row wrap"><span className={`badge ${job.status==="published"?"badge-success":job.status==="pending"?"badge-warning":""}`}>{job.status}</span><span className="small muted">Created {dateShort(job.created_at)}</span></div><h1 style={{marginTop:8}}>{job.title}</h1><p>{job.company_name||"Your company"} · {job.hours_per_week?`${job.hours_per_week} hrs/week`:"Flexible hours"} · VA pay from {money(job.min_hourly_rate)}/hr</p></div><div className="row wrap">{job.status!=="closed"?<Link className="btn" href={`/workspace/client/jobs/${job.id}/edit`}>Edit job</Link>:null}{job.status!=="closed"?<form action={closeJobAction}><input type="hidden" name="job_id" value={job.id}/><button className="btn btn-danger" type="submit">Close job</button></form>:null}</div></div>

    {job.status==="pending"?<div className="alert" style={{marginBottom:18}}>{commercial?.commercial_status==="quoted"?"Your role has been reviewed. Check the service fee below and accept it to publish the role.":"Your role is waiting for review. It stays private while our team can already run pre-application matching against the vetted VA pool."}</div>:null}
    {job.rejection_note?<div className="alert" style={{marginBottom:18}}><strong>Review note:</strong> {job.rejection_note}</div>:null}

    <div className="card commercial-card" style={{marginBottom:18}}><div className="row-between wrap"><div><div className="small muted">Hiring service</div><strong>{job.service_model==="managed_service"?"Managed VA service":"Curated placement"}</strong><div className="small muted">VA compensation is separate from this service fee.</div></div><div><div className="small muted">VirtualAssistant.com.ph service fee</div><strong>{commercial?commercial.service_model==="managed_service"?`${commercial.managed_markup_percent||0}% managed-service margin`:`USD ${commercial.placement_fee||0} placement fee`:"Confirmed during role review"}</strong>{commercial?<div className="small muted">Status: {String(commercial.commercial_status).replaceAll("_"," ")}</div>:null}</div></div>{commercial?.commercial_status==="quoted"?<form action={acceptCommercialTermsAction} style={{marginTop:14}}><input type="hidden" name="job_id" value={job.id}/><label className="confirmation-check" style={{marginBottom:12}}><input type="checkbox" name="fee_ack" required/><span>I understand this service fee is separate from the VA’s compensation.</span></label><button className="btn btn-primary" type="submit">Accept fee and publish job</button></form>:null}</div>

    <CandidateAccessGate jobId={job.id} access={access} applicantCount={applicantCount} releasedCount={releasedCount} returnTo={`/workspace/client/jobs/${job.id}`}/>

    <div className="grid-3" style={{marginBottom:18}}><div className="card"><div className="small muted">Applicants</div><strong style={{fontSize:28}}>{applicantCount}</strong></div><div className="card"><div className="small muted">Shortlisted</div><strong style={{fontSize:28}}>{unlocked?shortlistedCount:"—"}</strong>{!unlocked?<div className="small muted">Unlock to manage stages</div>:null}</div><div className="card"><div className="small muted">Interviewing / hired</div><strong style={{fontSize:28}}>{unlocked?interviewCount:"—"}</strong>{!unlocked?<div className="small muted">Protected until access</div>:null}</div></div>

    <div className="card" style={{marginBottom:18}}><div className="row-between wrap" style={{marginBottom:14}}><div><h3 style={{margin:0}}>Applicant pipeline</h3><span className="small muted">Move applicants through Applied → Shortlisted → Interview → Offered → Hired, with Rejected kept separate. Identity and private evidence require candidate access.</span></div><div className="pipeline-filter" aria-label="Filter applicant stage">{stageFilters.map(([value,label])=><Link key={value||"all"} className={`btn btn-sm ${selectedStage===value?"btn-primary":""}`} href={`/workspace/client/jobs/${job.id}${value?`?stage=${value}`:""}`}>{label} ({stageCounts.get(value)||0})</Link>)}</div></div>{visibleApplications.length?<div className="table-wrap responsive-table"><table><thead><tr><th>Applicant</th><th>Fit</th>{unlocked?<><th>Availability</th><th>Rate</th></>:null}<th>Status</th><th>Applied</th><th></th></tr></thead><tbody>{visibleApplications.map((a:any,index:number)=>{const score=Number(a.match_score||0);const p=a.profile_snapshot||{};return <tr key={a.id}><td data-label="Applicant"><strong>{unlocked?(p.full_name||"VA applicant"):protectedCandidateName(index)}</strong><div className="small muted">{unlocked?(p.headline||p.primary_category||"Virtual Assistant"):"Identity protected"}</div></td><td data-label="Fit"><strong>{matchLabel(score)}</strong><div className="small muted">{score}/100</div></td>{unlocked?<><td data-label="Availability">{p.weekly_hours?`${p.weekly_hours} hrs/week`:"Not set"}</td><td data-label="Rate">{p.hourly_rate?`USD ${p.hourly_rate}/hr`:"Not set"}</td></>:null}<td data-label="Status">{unlocked?(a.status==="hired"?<span className="badge badge-success">Hired</span>:<form action={updateApplicationStatusAction} className="row"><input type="hidden" name="application_id" value={a.id}/><input type="hidden" name="return_to" value={`/workspace/client/jobs/${job.id}`}/><label className="sr-only" htmlFor={`job-status-${a.id}`}>Candidate status</label><select id={`job-status-${a.id}`} name="status" defaultValue={a.status} className="compact-select">{stages.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><button className="btn btn-sm" type="submit">Save</button></form>):<span className="badge">{String(a.status).replaceAll("_"," ")}</span>}</td><td data-label="Applied">{dateShort(a.applied_at)}</td><td>{unlocked?<div className="row wrap"><Link className="btn btn-sm" href={`/workspace/client/candidates/${a.id}`}>{a.status==="hired"?"View hire":"Review profile"}</Link>{p.resume_path?<a className="btn btn-sm" href={`/api/resume/${a.id}`} target="_blank">Private resume</a>:null}</div>:<span className="protected-inline"><LockKeyhole size={14}/> Details locked</span>}</td></tr>})}</tbody></table></div>:<div className="empty">{selectedStage ? "No applicants are in this stage yet." : "No one has applied to this job yet."}</div>}</div>

    <div className="card curated-shortlist-card"><div className="row-between wrap" style={{marginBottom:14}}><div><div className="row wrap"><Sparkles size={18}/><h3 id="curated-shortlist" style={{margin:0,scrollMarginTop:100}}>Your curated shortlist</h3></div><span className="small muted">We rank the vetted pool against this role before applications arrive. Strong, high-confidence matches release automatically; everything else is reviewed and released by our team.</span></div></div>
      {releasedRows?.length?<div className="grid-3">{releasedRows.map((row:any,index:number)=>{const p=profileMap.get(row.va_id) as any;const va=vaMap.get(row.va_id) as any;const inviteStatus=inviteMap.get(row.va_id);return <div className="card recommendation-card" key={row.va_id}><div className="row-between"><div><strong>{unlocked?(p?.full_name||"Matched VA"):`Curated match ${index+1}`}</strong><div className="small muted">{unlocked?(va?.headline||va?.primary_category||"Virtual Assistant"):"Identity protected until access is active"}</div></div><div className="fit-badge"><strong>{matchLabel(Number(row.match_score||0))}</strong><span>{row.match_score}/100</span></div></div><div className="small muted">Match confidence: {row.match_confidence}% of weighted criteria could be assessed.</div>{unlocked?<><div className="pill-list" style={{margin:"12px 0"}}>{mergeUniqueStrings(va?.primary_category, va?.categories).slice(0,3).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div><div className="small muted" style={{marginBottom:10}}>{va?.weekly_hours?`${va.weekly_hours} hrs/week`:"Availability not set"}{va?.hourly_rate?` · USD ${Number(va.hourly_rate).toFixed(2)}/hr`:""}</div><div className="row wrap">{va?.directory_visible&&va?.slug?<Link className="btn btn-sm" href={`/va/${va.slug}`} target="_blank">Public profile</Link>:null}{inviteStatus?<span className="badge">Invite: {inviteStatus}</span>:job.status!=="published"?<span className="small muted">Publish the role before inviting.</span>:<details className="invite-details"><summary className="btn btn-sm btn-primary">Invite to role</summary><form action={inviteVaAction} className="invite-popover stack"><input type="hidden" name="job_id" value={job.id}/><input type="hidden" name="va_id" value={row.va_id}/><div className="field"><label>Personal note</label><textarea name="note" maxLength={500} placeholder={`Hi ${String(p?.full_name||"").split(" ")[0]}, your background looks relevant to this role. Would you like to review it?`}/></div><button className="btn btn-primary btn-sm" type="submit">Send invitation</button></form></details>}</div></>:<div className="protected-shortlist-note"><LockKeyhole size={15}/> Profile, rate, skills, and contact actions unlock with candidate access.</div>}</div>})}</div>:<div className="empty">No staff-curated matches have been released yet. Our team can match this role against the vetted VA pool while the role is still pending.</div>}
    </div>
  </>;
}
