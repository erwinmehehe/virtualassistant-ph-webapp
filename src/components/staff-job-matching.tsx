import Link from "next/link";
import { Sparkles, UsersRound } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchAssessment } from "@/lib/matching";
import { hideShortlistCandidateAction, saveJobShortlistAction } from "@/app/actions/matching";
import { saveClientRecommendationAction } from "@/app/actions/client-shortlist";
import { MatchingCandidateTable } from "@/components/matching-candidate-table";

type Props={job:any;viewerRole:"admin"|"recruiter";returnTo:string};

export async function StaffJobMatching({job,viewerRole,returnTo}:Props){
  const admin=createAdminClient();
  const [{data:vettingRows},{data:shortlistRows},{data:interestRows}]=await Promise.all([
    admin.from("va_vetting").select("va_id,stage").in("stage",["approved","bench"]),
    admin.from("job_shortlist_candidates").select("va_id,match_score,match_confidence,shortlist_status,client_recommendation,client_decision,client_decision_note,client_decision_at,released_at").eq("job_id",job.id),
    admin.from("applications").select("id,va_id,status,cover_note,match_score,applied_at").eq("job_id",job.id).not("status","in",'(withdrawn,rejected)')
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
  const pool=(vas||[]).map((va:any)=>{
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
  const canSendClient=Boolean(job.client_id&&job.status==="published");

  return <section className="card staff-matching-card">
    <div className="row-between wrap staff-matching-head"><div><div className="row wrap"><Sparkles size={18}/><h2>Recruit this role</h2></div><p className="muted">Review recruiter-only match suggestions and VA interest, verify hard requirements, then present only the candidates you are willing to stand behind.</p></div><div className="row wrap"><span className="badge">{pool.length} vetted VAs assessed</span><span className="badge">{interested.length} expressed interest</span>{viewerRole==="recruiter"?<Link className="btn btn-sm" href="/workspace/recruiter/client-review">Waiting for client{awaitingClientCount?` · ${awaitingClientCount}`:""}</Link>:null}</div></div>

    <div className="matching-workflow-steps"><span className="done">1. Qualify role</span><span className="current">2. Recruiter review</span><span>3. Client shortlist</span><span>4. Interview & offer</span></div>

    {interested.length?<div className="info-banner" style={{marginBottom:14}}><strong>{interested.length} vetted VA{interested.length===1?" has":"s have"} expressed interest</strong><p style={{margin:"5px 0 8px"}}>Interest is internal. Review their evidence and fit before adding them to the recruiter shortlist.</p><div className="row wrap">{interested.slice(0,8).map((row:any)=><Link className="badge" key={row.va.user_id} href={`/workspace/recruiter/candidates/${row.va.user_id}`}>{row.account?.full_name||"VA candidate"} · {row.score}% internal match</Link>)}</div></div>:null}

    {recommended.length?<div className="recommended-match-panel"><div><span className="small">Recommended starting point</span><h3>Review the strongest {recommended.length} matches</h3><p>Match scores are recruiter-only screening aids. Hard requirements, verified evidence, capacity, and recruiter judgment should decide who reaches the client.</p></div><div className="recommended-match-names">{recommended.map((row:any)=><span key={row.va.user_id}><strong>{row.account?.full_name||"Virtual Assistant candidate"}</strong> · {row.score}% internal match{row.interest?" · interested":""}</span>)}</div></div>:null}

    <div className="matching-summary-grid"><div className="matching-summary-card"><span>Recruiter shortlist</span><strong>{proposedCount}</strong><small>Internal only</small></div><div className="matching-summary-card"><span>Sent to client</span><strong>{releasedCount}</strong><small>{awaitingClientCount?`${awaitingClientCount} waiting on feedback`:"No client decisions waiting"}</small></div><div className="matching-summary-card"><span>Role readiness</span><strong>{canSendClient?"Ready":"Internal only"}</strong><small>{canSendClient?"Terms active · client can review":"Client/terms must be active before sending"}</small></div></div>

    {!canSendClient&&job.client_id?<div className="info-banner"><strong>Keep this shortlist internal for now.</strong> The role must be published with approved service terms before anything can be marked as sent to the client.</div>:!job.client_id?<div className="info-banner"><strong>Client account not linked yet.</strong> Build the internal shortlist, then invite the lead to claim the client workspace. Candidates stay recruiter-only until the account and service terms are active.</div>:null}

    {pool.length?<form action={saveJobShortlistAction} className="staff-match-form"><input type="hidden" name="job_id" value={job.id}/><input type="hidden" name="return_to" value={returnTo}/><div className="row-between wrap shortlist-controls"><div><strong>Reviewed candidates</strong><div className="small muted">Select only candidates you have reviewed. Add a client-facing “Why we recommend this VA” note. Internal match percentages never appear to the client.</div></div><div className="row wrap"><button className="btn" type="submit" name="mode" value="save">Save recruiter shortlist</button>{canSendClient?<button className="btn btn-primary" type="submit" name="mode" value="release">Send selected to client</button>:canInviteClient?<button className="btn btn-primary" type="submit" name="mode" value="invite">Save + invite client</button>:null}</div></div><MatchingCandidateTable pool={pool} hideShortlistCandidateAction={hideShortlistCandidateAction} saveClientRecommendationAction={saveClientRecommendationAction}/></form>:<div className="empty"><UsersRound size={22}/><p>No approved or bench Virtual Assistants are available to assess yet.</p></div>}
  </section>;
}
