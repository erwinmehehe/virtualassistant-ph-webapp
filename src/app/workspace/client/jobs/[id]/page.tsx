import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateApplicationStatusAction, inviteVaAction } from "@/app/actions/applications";
import { acceptCommercialTermsAction, closeJobAction } from "@/app/actions/jobs";
import { matchLabel } from "@/lib/matching";
import { dateShort, money } from "@/lib/format";
import { mergeUniqueStrings } from "@/lib/collections";

const stages = [["new","Applied"],["reviewing","Reviewing"],["shortlisted","Shortlisted"],["interview","Interview"],["offered","Offered"],["rejected","Rejected"]] as const;
const stageFilters = [["","All"],["new","Applied"],["reviewing","Reviewing"],["shortlisted","Shortlisted"],["interview","Interview"],["offered","Offered"],["hired","Hired"],["rejected","Rejected"]] as const;

export default async function ClientJobDetail({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const {id}=await params;
  const query=await searchParams;
  const {user}=await requireRole("client");
  const supabase=await createClient();
  const {data:job}=await supabase.from("jobs").select("*").eq("id",id).eq("client_id",user.id).single();
  if(!job)notFound();

  const admin=createAdminClient();
  const [{data:commercial},{data:releasedRows}]=await Promise.all([
    supabase.from("job_commercials").select("*").eq("job_id",id).maybeSingle(),
    admin.from("job_shortlist_candidates")
      .select("va_id,match_score,match_confidence,released_at")
      .eq("job_id",id)
      .eq("shortlist_status","released")
      .order("match_score",{ascending:false})
  ]);

  const canReviewCandidates=job.status==="published"||commercial?.commercial_status==="accepted";
  const {data:applications}=canReviewCandidates
    ? await admin.from("applications").select("*").eq("job_id",id).order("applied_at",{ascending:false})
    : await admin.from("applications").select("id,status,match_score,applied_at").eq("job_id",id).order("applied_at",{ascending:false});

  const releasedIds=(releasedRows||[]).map((row:any)=>row.va_id);
  let shortlistProfiles:any[]=[];
  let shortlistVas:any[]=[];
  let invites:any[]=[];
  if(canReviewCandidates&&releasedIds.length){
    const results=await Promise.all([
      admin.from("profiles").select("id,full_name,avatar_url").in("id",releasedIds),
      admin.from("va_profiles").select("user_id,headline,primary_category,categories,skills,tools,years_experience,weekly_hours,hourly_rate,availability_status,directory_visible,slug").in("user_id",releasedIds),
      admin.from("job_invites").select("va_id,status").eq("job_id",id).in("va_id",releasedIds)
    ]);
    shortlistProfiles=results[0].data||[];
    shortlistVas=results[1].data||[];
    invites=results[2].data||[];
  }
  const profileMap=new Map(shortlistProfiles.map((p:any)=>[p.id,p]));
  const vaMap=new Map(shortlistVas.map((v:any)=>[v.user_id,v]));
  const inviteMap=new Map(invites.map((row:any)=>[row.va_id,row.status]));

  const applicantCount=applications?.length||0;
  const selectedStage=String(query.stage||"");
  const visibleApplications=selectedStage?(applications||[]).filter((row:any)=>row.status===selectedStage):(applications||[]);
  const stageCounts=new Map(stageFilters.map(([value])=>[value,value?(applications||[]).filter((row:any)=>row.status===value).length:applicantCount]));
  const releasedCount=releasedRows?.length||0;
  const shortlistedCount=(applications||[]).filter((row:any)=>row.status==="shortlisted").length;
  const interviewCount=(applications||[]).filter((row:any)=>["interview","offered","hired"].includes(row.status)).length;

  return <>
    {query.saved?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Hiring request saved.</div>:null}
    {query.invited?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Invitation sent. The Virtual Assistant can review the role from their workspace.</div>:null}
    {query.status_updated?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Candidate stage updated.</div>:null}

    <div className="page-head">
      <div>
        <div className="row wrap"><span className={`badge ${job.status==="published"?"badge-success":job.status==="pending"?"badge-warning":""}`}>{job.status==="published"?"Recruiting":job.status==="pending"?"In review":String(job.status).replaceAll("_"," ")}</span><span className="small muted">Created {dateShort(job.created_at)}</span></div>
        <h1 style={{marginTop:8}}>{job.title}</h1>
        <p>{job.company_name||"Your company"} · {job.hours_per_week?`${job.hours_per_week} hrs/week`:"Flexible hours"} · Virtual Assistant pay from {money(job.min_hourly_rate)}/hr</p>
      </div>
      <div className="row wrap">
        {job.status!=="closed"?<Link className="btn" href={`/workspace/client/jobs/${job.id}/edit`}>Edit request</Link>:null}
        {job.status!=="closed"?<form action={closeJobAction}><input type="hidden" name="job_id" value={job.id}/><button className="btn btn-danger" type="submit">Close request</button></form>:null}
      </div>
    </div>

    {job.status==="pending"?<div className="alert" style={{marginBottom:18}}>{commercial?.commercial_status==="quoted"?"Your hiring brief has been reviewed. Approve the service terms below and recruiting can begin.":"Your hiring request is with our team. We can prepare matches privately while the brief and commercial terms are reviewed."}</div>:null}
    {job.rejection_note?<div className="alert" style={{marginBottom:18}}><strong>Review note:</strong> {job.rejection_note}</div>:null}

    <div className="card commercial-card" style={{marginBottom:18}}>
      <div className="row-between wrap">
        <div><div className="small muted">Hiring service</div><strong>{job.service_model==="managed_service"?"Managed Virtual Assistant service":"Curated placement"}</strong><div className="small muted">Virtual Assistant compensation is separate from this service fee.</div></div>
        <div><div className="small muted">VirtualAssistant.com.ph service fee</div><strong>{commercial?commercial.service_model==="managed_service"?`${commercial.managed_markup_percent||0}% managed-service margin`:`USD ${commercial.placement_fee||0} placement fee`:"Confirmed during role review"}</strong>{commercial?<div className="small muted">Status: {String(commercial.commercial_status).replaceAll("_"," ")}</div>:null}</div>
      </div>
      {commercial?.commercial_status==="quoted"?<form action={acceptCommercialTermsAction} style={{marginTop:14}}><input type="hidden" name="job_id" value={job.id}/><label className="confirmation-check" style={{marginBottom:12}}><input type="checkbox" name="fee_ack" required/><span>I understand this service fee is separate from the Virtual Assistant’s compensation.</span></label><button className="btn btn-primary" type="submit">Approve terms and start recruiting</button></form>:null}
    </div>

    {!canReviewCandidates?<div className="card recruiter-prep-card" style={{marginBottom:18}}>
      <div className="row-between wrap"><div><h3 style={{margin:"0 0 4px"}}>Your recruiter is preparing the shortlist</h3><p className="small muted" style={{margin:0}}>We can screen and rank candidates privately while the role is in review. Full candidate profiles appear automatically after the role is approved.</p></div><span className="badge">{releasedCount} match{releasedCount===1?"":"es"} prepared</span></div>
    </div>:null}

    <div className="grid-3" style={{marginBottom:18}}>
      <div className="card"><div className="small muted">Candidates</div><strong style={{fontSize:28}}>{applicantCount}</strong></div>
      <div className="card"><div className="small muted">Shortlisted</div><strong style={{fontSize:28}}>{canReviewCandidates?shortlistedCount:releasedCount}</strong>{!canReviewCandidates?<div className="small muted">Prepared by your recruiting team</div>:null}</div>
      <div className="card"><div className="small muted">Interviewing / hired</div><strong style={{fontSize:28}}>{canReviewCandidates?interviewCount:0}</strong></div>
    </div>

    <div className="card" style={{marginBottom:18}}>
      <div className="row-between wrap" style={{marginBottom:14}}>
        <div><h3 style={{margin:0}}>Candidate pipeline</h3><span className="small muted">{canReviewCandidates?"Review profiles and move strong candidates through shortlist, interview, offer, and hire.":"Candidate identities and evidence appear here once the role is approved."}</span></div>
        {canReviewCandidates?<div className="pipeline-filter" aria-label="Filter applicant stage">{stageFilters.map(([value,label])=><Link key={value||"all"} className={`btn btn-sm ${selectedStage===value?"btn-primary":""}`} href={`/workspace/client/jobs/${job.id}${value?`?stage=${value}`:""}`}>{label} ({stageCounts.get(value)||0})</Link>)}</div>:null}
      </div>
      {canReviewCandidates?(visibleApplications.length?<div className="table-wrap responsive-table"><table>
        <thead><tr><th>Candidate</th><th>Fit</th><th>Availability</th><th>Rate</th><th>Status</th><th>Applied</th><th></th></tr></thead>
        <tbody>{visibleApplications.map((application:any)=>{const score=Number(application.match_score||0);const profile=application.profile_snapshot||{};return <tr key={application.id}>
          <td data-label="Candidate"><strong>{profile.full_name||"Virtual Assistant applicant"}</strong><div className="small muted">{profile.headline||profile.primary_category||"Virtual Assistant"}</div></td>
          <td data-label="Fit"><strong>{matchLabel(score)}</strong><div className="small muted">{score}/100</div></td>
          <td data-label="Availability">{profile.weekly_hours?`${profile.weekly_hours} hrs/week`:"Not set"}</td>
          <td data-label="Rate">{profile.hourly_rate?`USD ${profile.hourly_rate}/hr`:"Not set"}</td>
          <td data-label="Status">{application.status==="hired"?<span className="badge badge-success">Hired</span>:<form action={updateApplicationStatusAction} className="row"><input type="hidden" name="application_id" value={application.id}/><input type="hidden" name="return_to" value={`/workspace/client/jobs/${job.id}`}/><label className="sr-only" htmlFor={`job-status-${application.id}`}>Candidate status</label><select id={`job-status-${application.id}`} name="status" defaultValue={application.status} className="compact-select">{stages.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><button className="btn btn-sm" type="submit">Save</button></form>}</td>
          <td data-label="Applied">{dateShort(application.applied_at)}</td>
          <td><div className="row wrap"><Link className="btn btn-sm" href={`/workspace/client/candidates/${application.id}`}>{application.status==="hired"?"View hire":"Review profile"}</Link>{profile.resume_path?<a className="btn btn-sm" href={`/api/resume/${application.id}`} target="_blank">Private resume</a>:null}</div></td>
        </tr>})}</tbody>
      </table></div>:<div className="empty">{selectedStage?"No candidates are in this stage yet.":"No applicants have reached this role yet."}</div>):<div className="empty">Your recruiting team is working privately. Candidate profiles will appear after approval.</div>}
    </div>

    <div className="card curated-shortlist-card">
      <div className="row-between wrap" style={{marginBottom:14}}>
        <div><div className="row wrap"><Sparkles size={18}/><h3 style={{margin:0}}>Recruiter shortlist</h3></div><span className="small muted">We rank the vetted pool against this role before applications arrive and release the strongest matches for your review.</span></div>
      </div>
      {releasedRows?.length?(canReviewCandidates?<div className="grid-3">{releasedRows.map((row:any)=>{const profile=profileMap.get(row.va_id) as any;const va=vaMap.get(row.va_id) as any;const inviteStatus=inviteMap.get(row.va_id);return <div className="card recommendation-card" key={row.va_id}>
        <div className="row-between"><div><strong>{profile?.full_name||"Matched Virtual Assistant"}</strong><div className="small muted">{va?.headline||va?.primary_category||"Virtual Assistant"}</div></div><div className="fit-badge"><strong>{matchLabel(Number(row.match_score||0))}</strong><span>{row.match_score}/100</span></div></div>
        <div className="small muted">Match confidence: {row.match_confidence}% of weighted criteria could be assessed.</div>
        <div className="pill-list" style={{margin:"12px 0"}}>{mergeUniqueStrings(va?.primary_category,va?.categories).slice(0,3).map((value,index)=><span className="badge" key={`${String(value)}-${index}`}>{value}</span>)}</div>
        <div className="small muted" style={{marginBottom:10}}>{va?.weekly_hours?`${va.weekly_hours} hrs/week`:"Availability not set"}{va?.hourly_rate?` · USD ${Number(va.hourly_rate).toFixed(2)}/hr`:""}</div>
        <div className="row wrap">{va?.directory_visible&&va?.slug?<Link className="btn btn-sm" href={`/va/${va.slug}`} target="_blank">View profile</Link>:null}{inviteStatus?<span className="badge">Invite: {inviteStatus}</span>:job.status!=="published"?null:<details className="invite-details"><summary className="btn btn-sm btn-primary">Invite to role</summary><form action={inviteVaAction} className="invite-popover stack"><input type="hidden" name="job_id" value={job.id}/><input type="hidden" name="va_id" value={row.va_id}/><div className="field"><label>Personal note</label><textarea name="note" maxLength={500} placeholder={`Hi ${String(profile?.full_name||"").split(" ")[0]}, your background looks relevant to this role. Would you like to review it?`}/></div><button className="btn btn-primary btn-sm" type="submit">Send invitation</button></form></details>}</div>
      </div>})}</div>:<div className="empty">{releasedCount} strong match{releasedCount===1?" has":"es have"} already been prepared. Profiles will appear automatically after you approve the role.</div>):<div className="empty">No recruiter-selected matches have been released yet. Matching can continue while the role is still in review.</div>}
    </div>
  </>;
}
