import Link from "next/link";
import { Sparkles, UsersRound } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchAssessment } from "@/lib/matching";
import { hideShortlistCandidateAction, prepareTopMatchesForReviewAction, saveJobShortlistAction } from "@/app/actions/matching";
import { saveClientRecommendationAction } from "@/app/actions/client-shortlist";
import { MatchingCandidateTable } from "@/components/matching-candidate-table";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { isTalentAgencyCertified, talentReadinessActions } from "@/lib/talent-operations";
import { completedTrainingSpecializations, getTrainingCredentialsForUsers } from "@/lib/training-credentials";

type Props={job:any;viewerRole:"admin"|"recruiter";returnTo:string};

export async function StaffJobMatching({job,viewerRole,returnTo}:Props){
  const admin=createAdminClient();
  const [{data:vettingRows},{data:shortlistRows},{data:interestRows},{data:commercial},{data:candidateAccess}]=await Promise.all([
    admin.from("va_vetting").select("va_id,stage").in("stage",["approved","bench"]),
    admin.from("job_shortlist_candidates").select("va_id,match_score,match_confidence,shortlist_status,shortlist_order,client_recommendation,client_decision,client_decision_note,client_decision_at,released_at,created_by").eq("job_id",job.id).order("shortlist_order",{ascending:true,nullsFirst:false}),
    admin.from("applications").select("id,va_id,status,cover_note,match_score,applied_at").eq("job_id",job.id).not("status","in",'(withdrawn,rejected)'),
    admin.from("job_commercials").select("commercial_status,placement_fee,managed_markup_percent,service_model").eq("job_id",job.id).maybeSingle(),
    admin.from("job_candidate_access").select("access_status").eq("job_id",job.id).maybeSingle()
  ]);

  const ids=[...new Set((vettingRows||[]).map((row:any)=>row.va_id))];
  const [{data:profiles},{data:vas},{data:releasedAcross},{data:processRows},{data:activeJobs}]=ids.length?await Promise.all([
    admin.from("profiles").select("id,full_name,avatar_url").in("id",ids),
    admin.from("va_profiles").select("*").in("user_id",ids),
    admin.from("job_shortlist_candidates").select("job_id,va_id,client_decision").in("va_id",ids).eq("shortlist_status","released"),
    admin.from("applications").select("job_id,va_id,status").in("va_id",ids).in("status",["interview","offered","hired"]),
    admin.from("jobs").select("id,title,hours_per_week,status").neq("status","closed")
  ]):[{data:[] as any[]},{data:[] as any[]},{data:[] as any[]},{data:[] as any[]},{data:[] as any[]}];

  const trainingByUser = ids.length ? await getTrainingCredentialsForUsers(ids) : new Map();
  const profileMap=new Map((profiles||[]).map((p:any)=>[p.id,p]));
  const stageMap=new Map((vettingRows||[]).map((row:any)=>[row.va_id,row.stage]));
  const shortlistMap=new Map((shortlistRows||[]).map((row:any)=>[row.va_id,row]));
  const interestMap=new Map((interestRows||[]).map((row:any)=>[row.va_id,row]));
  const activeJobMap=new Map((activeJobs||[]).map((row:any)=>[row.id,row]));
  const validVas=(vas||[]).filter((va:any)=>Boolean(va?.user_id));
  const pool=validVas.map((va:any)=>{
    const trainingCredentials=trainingByUser.get(va.user_id)||[];
    const assessment=matchAssessment(job,va,trainingCredentials);
    const account=profileMap.get(va.user_id) as any;
    const shortlist=shortlistMap.get(va.user_id) as any;
    const interest=interestMap.get(va.user_id) as any;
    const otherClientReviews=(releasedAcross||[]).filter((row:any)=>row.va_id===va.user_id&&row.job_id!==job.id&&row.client_decision!=="pass"&&activeJobMap.has(row.job_id)).length;
    const activeProcesses=(processRows||[]).filter((row:any)=>row.va_id===va.user_id&&row.job_id!==job.id&&activeJobMap.has(row.job_id));
    const potentialCommittedHours=activeProcesses.filter((row:any)=>["offered","hired"].includes(row.status)).reduce((sum:number,row:any)=>sum+Number((activeJobMap.get(row.job_id) as any)?.hours_per_week||0),0);
    const readinessInput={
      stage:stageMap.get(va.user_id),
      activePool:false,
      availabilityStatus:va.availability_status,
      availabilityConfirmedAt:va.availability_confirmed_at
    };
    const clientReady=isTalentAgencyCertified(readinessInput);
    const readinessGaps=clientReady?[]:talentReadinessActions(readinessInput);
    const trainingPaths=completedTrainingSpecializations(trainingCredentials);
    return{va,account,shortlist,job,interest,trainingCredentials,trainingPaths,...assessment,clientReady,readinessGaps,otherClientReviews,activeProcessCount:activeProcesses.length,potentialCommittedHours};
  }).sort((a:any,b:any)=>Number(b.clientReady)-Number(a.clientReady)||b.score-a.score||b.confidence-a.confidence||Number(b.va.availability_status==="available")-Number(a.va.availability_status==="available"));

  const suggestedCount=(shortlistRows||[]).filter((row:any)=>row.shortlist_status==="proposed"&&!row.created_by).length;
  const proposedCount=(shortlistRows||[]).filter((row:any)=>row.shortlist_status==="proposed"&&Boolean(row.created_by)).length;
  const releasedCount=(shortlistRows||[]).filter((row:any)=>row.shortlist_status==="released").length;
  const awaitingClientCount=(shortlistRows||[]).filter((row:any)=>row.shortlist_status==="released"&&!row.client_decision).length;
  const interested=pool.filter((row:any)=>row.interest).sort((a:any,b:any)=>b.score-a.score);
  const clientReadyCount=pool.filter((row:any)=>row.clientReady).length;
  const recommended=pool.filter((row:any)=>row.clientReady&&row.score>=60&&row.eligible!==false).slice(0,3);
  const canInviteClient=!job.client_id&&Boolean(job.lead_id);
  const candidateAccessReady=candidateAccessUnlocked(candidateAccess?.access_status);
  const canSendClient=Boolean(job.client_id&&job.status==="published"&&commercial?.commercial_status==="accepted"&&candidateAccessReady);
  const sendBlockers = [
    !job.client_id ? "Link the client account to this role" : null,
    job.status !== "published" ? "Publish the role" : null,
    commercial?.commercial_status !== "accepted" ? "Obtain client approval of service terms" : null,
    !candidateAccessReady ? "Activate candidate access" : null,
  ].filter((item): item is string => Boolean(item));


  return <section className="card staff-matching-card unified-role-matching">
    <div className="row-between wrap staff-matching-head"><div><div className="row wrap"><Sparkles size={18}/><h2>Matching & shortlist builder</h2></div><p className="muted">Review recruiter-only match suggestions and VA interest, build the shortlist, preview the client experience, then release only candidates you are willing to stand behind.</p></div><div className="row wrap"><span className="badge badge-success">{clientReadyCount} client-ready</span><span className="badge">{pool.length} vetted VAs assessed</span><span className="badge">{interested.length} expressed interest</span>{viewerRole==="recruiter"&&awaitingClientCount?<a className="btn btn-sm" href="#client-handoff">Client feedback · {awaitingClientCount} waiting</a>:null}</div></div>

    {viewerRole==="recruiter"&&releasedCount===0&&proposedCount<3&&recommended.length?<div className="info-banner quick-shortlist-banner"><div><strong>Fast path: prepare the strongest matches for review</strong><p className="small muted" style={{margin:"5px 0 0"}}>This only builds an internal recruiter shortlist. Nothing is emailed or shown to the client until you review the candidates and explicitly send them.</p></div><form action={prepareTopMatchesForReviewAction}><input type="hidden" name="job_id" value={job.id}/><input type="hidden" name="return_to" value={returnTo}/><button className="btn btn-primary" type="submit">Prepare top {Math.min(3,recommended.length)} matches</button></form></div>:null}

    <div className="matching-workflow-steps"><span className="current">1. Recruiter review</span><span>2. Client shortlist</span><span>3. Interview & offer</span></div>


    {interested.length?<div className="info-banner" style={{marginBottom:14}}><strong>{interested.length} vetted VA{interested.length===1?" has":"s have"} expressed interest</strong><p style={{margin:"5px 0 8px"}}>Interest is internal. Review their evidence and fit before adding them to the recruiter shortlist.</p><div className="row wrap">{interested.slice(0,8).map((row:any)=><Link className="badge" key={row.va.user_id} href={`/workspace/recruiter/candidates/${row.va.user_id}`}>{row.account?.full_name||"VA candidate"} · {row.score}% internal match</Link>)}</div></div>:null}

    {recommended.length?<div className="recommended-match-panel"><div><span className="small">Recommended starting point</span><h3>Review the strongest {recommended.length} matches</h3><p>Only client-ready VAs are recommended here: approved talent-pool members with fresh availability. Work-setup verification is tracked separately and no longer blocks matching. Match scores remain recruiter-only screening aids.</p></div><div className="recommended-match-names">{recommended.map((row:any)=><span key={row.va.user_id}><strong>{row.account?.full_name||"Virtual Assistant candidate"}</strong> · {row.score}% internal match{row.interest?" · interested":""}</span>)}</div></div>:null}

    <div className="matching-summary-grid"><div className="matching-summary-card"><span>Match suggestions</span><strong>{suggestedCount}</strong><small>Automatic · not shortlisted</small></div><div className="matching-summary-card"><span>Recruiter shortlist</span><strong>{proposedCount}</strong><small>Selected internally</small></div><div className="matching-summary-card"><span>Sent to client</span><strong>{releasedCount}</strong><small>{awaitingClientCount?`${awaitingClientCount} waiting on feedback`:"No client decisions waiting"}</small></div><div className="matching-summary-card"><span>Role readiness</span><strong>{canSendClient?"Ready":"Internal only"}</strong><small>{canSendClient?"Terms + candidate access active":!candidateAccessReady&&job.client_id?"Candidate access must be activated":"Client + approved terms required"}</small></div></div>

    {!canSendClient&&job.client_id?<div className="info-banner"><strong>Keep this shortlist internal for now.</strong> {!candidateAccessReady?"Candidate access is not active yet. Candidate access must be paid before sending the shortlist.":"The role must be published with client-approved service terms before anything can be marked as sent to the client."}</div>:!job.client_id?<div className="info-banner"><strong>Client account not linked yet.</strong> Build the internal shortlist, then invite the lead to claim the client workspace. Candidates stay recruiter-only until the account and service terms are active.</div>:null}

    {pool.length?<form action={saveJobShortlistAction} className="staff-match-form"><input type="hidden" name="job_id" value={job.id}/><input type="hidden" name="return_to" value={returnTo}/><div className="row-between wrap shortlist-controls"><div><strong>Reviewed candidates</strong><div className="small muted">Select only the VAs you want in this shortlist. Automatic match suggestions stay unselected until you choose them. Client notes are saved with the shortlist and internal match percentages never appear to the client.</div></div></div><MatchingCandidateTable pool={pool} hideShortlistCandidateAction={hideShortlistCandidateAction} saveClientRecommendationAction={saveClientRecommendationAction} canSendClient={canSendClient} canInviteClient={canInviteClient} sendBlockers={sendBlockers}/></form>:<div className="empty"><UsersRound size={22}/><p>No approved or bench Virtual Assistants are available to assess yet.</p></div>}
  </section>;
}
