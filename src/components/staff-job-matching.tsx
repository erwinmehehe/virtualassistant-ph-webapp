import Link from "next/link";
import { ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchAssessment } from "@/lib/matching";
import { hideShortlistCandidateAction, saveJobShortlistAction } from "@/app/actions/matching";
import { saveClientRecommendationAction } from "@/app/actions/client-shortlist";
import { prepareStandardPlacementTermsAction } from "@/app/actions/agency-role";
import { MatchingCandidateTable } from "@/components/matching-candidate-table";

type Props={job:any;viewerRole:"admin"|"recruiter";returnTo:string};

export async function StaffJobMatching({job,viewerRole,returnTo}:Props){
  const admin=createAdminClient();
  const [{data:vettingRows},{data:shortlistRows},{data:interestRows},{data:commercial}]=await Promise.all([
    admin.from("va_vetting").select("va_id,stage").in("stage",["approved","bench"]),
    admin.from("job_shortlist_candidates").select("va_id,match_score,match_confidence,shortlist_status,client_recommendation,client_decision,client_decision_note,client_decision_at,released_at,created_by").eq("job_id",job.id),
    admin.from("applications").select("id,va_id,status,cover_note,match_score,applied_at").eq("job_id",job.id).not("status","in",'(withdrawn,rejected)'),
    admin.from("job_commercials").select("commercial_status,placement_fee,managed_markup_percent,service_model").eq("job_id",job.id).maybeSingle()
  ]);

  const ids=[...new Set((vettingRows||[]).map((row:any)=>row.va_id))];
  const [{data:profiles},{data:vas},{data:releasedAcross},{data:processRows},{data:activeJobs}]=ids.length?await Promise.all([
    admin.from("profiles").select("id,full_name,avatar_url").in("id",ids),
    admin.from("va_profiles").select("*").in("user_id",ids),
    admin.from("job_shortlist_candidates").select("job_id,va_id,client_decision").in("va_id",ids).eq("shortlist_status","released"),
    admin.from("applications").select("job_id,va_id,status").in("va_id",ids).in("status",["interview","offered","hired"]),
    admin.from("jobs").select("id,title,hours_per_week,status").neq("status","closed")
  ]):[{data:[] as any[]},{data:[] as any[]},{data:[] as any[]},{data:[] as any[]},{data:[] as any[]}];

  const profileMap=new Map((profiles||[]).map((p:any)=>[p.id,p]));
  const shortlistMap=new Map((shortlistRows||[]).map((row:any)=>[row.va_id,row]));
  const interestMap=new Map((interestRows||[]).map((row:any)=>[row.va_id,row]));
  const activeJobMap=new Map((activeJobs||[]).map((row:any)=>[row.id,row]));
  const validVas=(vas||[]).filter((va:any)=>Boolean(va?.user_id));
  const pool=validVas.map((va:any)=>{
    const assessment=matchAssessment(job,va);
    const account=profileMap.get(va.user_id) as any;
    const shortlist=shortlistMap.get(va.user_id) as any;
    const interest=interestMap.get(va.user_id) as any;
    const otherClientReviews=(releasedAcross||[]).filter((row:any)=>row.va_id===va.user_id&&row.job_id!==job.id&&row.client_decision!=="pass"&&activeJobMap.has(row.job_id)).length;
    const activeProcesses=(processRows||[]).filter((row:any)=>row.va_id===va.user_id&&row.job_id!==job.id&&activeJobMap.has(row.job_id));
    const potentialCommittedHours=activeProcesses.filter((row:any)=>["offered","hired"].includes(row.status)).reduce((sum:number,row:any)=>sum+Number((activeJobMap.get(row.job_id) as any)?.hours_per_week||0),0);
    return{va,account,shortlist,job,interest,...assessment,otherClientReviews,activeProcessCount:activeProcesses.length,potentialCommittedHours};
  }).sort((a:any,b:any)=>b.score-a.score||b.confidence-a.confidence||Number(b.va.availability_status==="available")-Number(a.va.availability_status==="available"));

  const proposedCount=(shortlistRows||[]).filter((row:any)=>row.shortlist_status==="proposed").length;
  const releasedCount=(shortlistRows||[]).filter((row:any)=>row.shortlist_status==="released").length;
  const awaitingClientCount=(shortlistRows||[]).filter((row:any)=>row.shortlist_status==="released"&&!row.client_decision).length;
  const interested=pool.filter((row:any)=>row.interest).sort((a:any,b:any)=>b.score-a.score);
  const recommended=pool.filter((row:any)=>row.score>=60&&row.eligible!==false).slice(0,3);
  const canInviteClient=!job.client_id&&Boolean(job.lead_id);
  const canSendClient=Boolean(job.client_id&&job.status==="published"&&commercial?.commercial_status==="accepted");

  const missing:string[]=[];
  if(!job.title||String(job.title).trim().length<3)missing.push("role title");
  if(!job.summary||String(job.summary).trim().length<20)missing.push("role outcome / summary");
  if(!Array.isArray(job.responsibilities)||!job.responsibilities.length)missing.push("responsibilities");
  if(!Array.isArray(job.required_skills)||job.required_skills.length<2)missing.push("2+ required skills");
  if(!job.hours_per_week)missing.push("weekly hours");
  if(!job.timezone)missing.push("timezone / working region");
  if(job.min_hourly_rate==null)missing.push("VA budget");
  if(!job.start_timing)missing.push("start timing");
  const roleReady=!missing.length;

  return <section className="card staff-matching-card">
    <div className="row-between wrap staff-matching-head"><div><div className="row wrap"><Sparkles size={18}/><h2>Recruit this role</h2></div><p className="muted">Qualify the role, review recruiter-only match suggestions and VA interest, then present only candidates you are willing to stand behind.</p></div><div className="row wrap"><span className="badge">{pool.length} vetted VAs assessed</span><span className="badge">{interested.length} expressed interest</span>{viewerRole==="recruiter"?<Link className="btn btn-sm" href="/workspace/recruiter/client-review">Waiting for client{awaitingClientCount?` · ${awaitingClientCount}`:""}</Link>:null}</div></div>

    <div className="matching-workflow-steps"><span className={roleReady?"done":"current"}>1. Qualify role</span><span className={roleReady?"current":""}>2. Recruiter review</span><span>3. Client shortlist</span><span>4. Interview & offer</span></div>

    <section className="card" style={{margin:"14px 0"}}><div className="row-between wrap"><div><div className="row"><ShieldCheck size={17}/><strong>Role quality & commercial gate</strong></div><p className="small muted" style={{margin:"5px 0 0"}}>Standard curated-placement roles can be moved forward by the recruiter. Managed-service pricing and unusual commercial exceptions stay with Admin.</p></div><span className={`badge ${roleReady?"badge-success":"badge-warning"}`}>{roleReady?"Brief ready":`${missing.length} item${missing.length===1?"":"s"} missing`}</span></div>{missing.length?<div className="alert" style={{marginTop:12}}><strong>Complete before quoting:</strong> {missing.join(", ")}.</div>:null}{commercial?.commercial_status?<div className="info-banner" style={{marginTop:12}}><strong>Commercial status:</strong> {String(commercial.commercial_status).replaceAll("_"," ")}{commercial.placement_fee!=null?` · USD ${Number(commercial.placement_fee).toFixed(2)} placement fee`:commercial.managed_markup_percent!=null?` · ${Number(commercial.managed_markup_percent).toFixed(2)}% managed-service margin`:""}.</div>:viewerRole==="recruiter"&&job.status==="pending"&&job.service_model!=="managed_service"&&job.client_id&&roleReady?<form action={prepareStandardPlacementTermsAction} style={{marginTop:12}}><input type="hidden" name="job_id" value={job.id}/><button className="btn btn-primary" type="submit">Prepare standard terms for client</button></form>:job.service_model==="managed_service"&&!commercial?<div className="info-banner" style={{marginTop:12}}><strong>Admin exception:</strong> Managed-service margin must be reviewed by Admin before the client can approve terms.</div>:null}</section>

    {interested.length?<div className="info-banner" style={{marginBottom:14}}><strong>{interested.length} vetted VA{interested.length===1?" has":"s have"} expressed interest</strong><p style={{margin:"5px 0 8px"}}>Interest is internal. Review their evidence and fit before adding them to the recruiter shortlist.</p><div className="row wrap">{interested.slice(0,8).map((row:any)=><Link className="badge" key={row.va.user_id} href={`/workspace/recruiter/candidates/${row.va.user_id}`}>{row.account?.full_name||"VA candidate"} · {row.score}% internal match</Link>)}</div></div>:null}

    {recommended.length?<div className="recommended-match-panel"><div><span className="small">Recommended starting point</span><h3>Review the strongest {recommended.length} matches</h3><p>Match scores are recruiter-only screening aids. Hard requirements, verified evidence, capacity, and recruiter judgment should decide who reaches the client.</p></div><div className="recommended-match-names">{recommended.map((row:any)=><span key={row.va.user_id}><strong>{row.account?.full_name||"Virtual Assistant candidate"}</strong> · {row.score}% internal match{row.interest?" · interested":""}</span>)}</div></div>:null}

    <div className="matching-summary-grid"><div className="matching-summary-card"><span>Recruiter shortlist</span><strong>{proposedCount}</strong><small>Internal only</small></div><div className="matching-summary-card"><span>Sent to client</span><strong>{releasedCount}</strong><small>{awaitingClientCount?`${awaitingClientCount} waiting on feedback`:"No client decisions waiting"}</small></div><div className="matching-summary-card"><span>Role readiness</span><strong>{canSendClient?"Ready":"Internal only"}</strong><small>{canSendClient?"Terms active · client can review":"Client + approved terms required"}</small></div></div>

    {!canSendClient&&job.client_id?<div className="info-banner"><strong>Keep this shortlist internal for now.</strong> The role must be published with client-approved service terms before anything can be marked as sent to the client.</div>:!job.client_id?<div className="info-banner"><strong>Client account not linked yet.</strong> Build the internal shortlist, then invite the lead to claim the client workspace. Candidates stay recruiter-only until the account and service terms are active.</div>:null}

    {pool.length?<form action={saveJobShortlistAction} className="staff-match-form"><input type="hidden" name="job_id" value={job.id}/><input type="hidden" name="return_to" value={returnTo}/><div className="row-between wrap shortlist-controls"><div><strong>Reviewed candidates</strong><div className="small muted">Select only the VAs you want in this shortlist. Automatic match suggestions stay unselected until you choose them. Client notes are saved with the shortlist and internal match percentages never appear to the client.</div></div></div><MatchingCandidateTable pool={pool} hideShortlistCandidateAction={hideShortlistCandidateAction} saveClientRecommendationAction={saveClientRecommendationAction} canSendClient={canSendClient} canInviteClient={canInviteClient}/></form>:<div className="empty"><UsersRound size={22}/><p>No approved or bench Virtual Assistants are available to assess yet.</p></div>}
  </section>;
}
