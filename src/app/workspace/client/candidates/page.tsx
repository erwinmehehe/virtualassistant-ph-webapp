import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";
import { matchLabel } from "@/lib/matching";
import { clientShortlistDecisionAction } from "@/app/actions/client-shortlist";
import { candidateAccessUnlocked } from "@/lib/candidate-access";

export default async function ClientCandidatesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const { user } = await requireRole("client");
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: jobs } = await supabase.from("jobs").select("id,title,status,created_at").eq("client_id", user.id).order("created_at", { ascending: false });
  const jobRows=jobs||[];
  const jobIds=jobRows.map((job:any)=>job.id);
  const jobMap=new Map(jobRows.map((job:any)=>[job.id,job]));
  if(!jobIds.length) return <><div className="page-head"><div><h1>Candidates</h1><p>Your recruiting team screens and recommends candidates against a real hiring request.</p></div></div><div className="card empty"><p>Start with a hiring request so we have a role to recruit against.</p><Link className="btn btn-primary" href="/workspace/client/jobs/new">Start a hiring request</Link></div></>;

  const activeJobs=jobRows.filter((job:any)=>job.status!=="closed");
  const selectedJob=activeJobs.find((job:any)=>job.id===query.role)||activeJobs[0]||null;
  const [{data:applications},{data:releasedRows},{data:existingInvites},{data:accessRows}]=await Promise.all([
    admin.from("applications").select("id,job_id,status,match_score,applied_at").in("job_id",jobIds).order("applied_at",{ascending:false}),
    admin.from("job_shortlist_candidates").select("job_id,va_id,match_score,match_confidence,released_at,client_recommendation,client_decision,client_decision_note,client_decision_at").in("job_id",jobIds).eq("shortlist_status","released").order("match_score",{ascending:false}),
    admin.from("job_invites").select("job_id,va_id,status").in("job_id",jobIds),
    admin.from("job_candidate_access").select("job_id,access_status").in("job_id",jobIds)
  ]);

  const accessMap=new Map((accessRows||[]).map((row:any)=>[row.job_id,row.access_status]));
  const reviewableJobIds=new Set(jobRows.filter((job:any)=>job.status==="published"&&candidateAccessUnlocked(accessMap.get(job.id))).map((job:any)=>job.id));
  const reviewableApplications=(applications||[]).filter((app:any)=>reviewableJobIds.has(app.job_id));
  const applicationIds=reviewableApplications.map((app:any)=>app.id);
  const {data:detailRows}=applicationIds.length?await admin.from("applications").select("id,profile_snapshot").in("id",applicationIds):{data:[]};
  const detailMap=new Map((detailRows||[]).map((row:any)=>[row.id,row.profile_snapshot||{}]));

  const selectedReleased=(releasedRows||[]).filter((row:any)=>row.job_id===selectedJob?.id);
  const selectedPublished=selectedJob?.status==="published";
  const selectedAccessUnlocked=selectedJob?candidateAccessUnlocked(accessMap.get(selectedJob.id)):false;
  if(selectedJob&&selectedPublished&&selectedAccessUnlocked&&selectedReleased.length){
    try{
      const cutoff=new Date(Date.now()-6*60*60*1000).toISOString();
      const {count}=await admin.from("recruiter_activity").select("id",{count:"exact",head:true}).eq("subject_type","job").eq("subject_id",selectedJob.id).eq("action","client_shortlist_viewed").eq("actor_id",user.id).gte("created_at",cutoff);
      if(!count) await admin.from("recruiter_activity").insert({subject_type:"job",subject_id:selectedJob.id,action:"client_shortlist_viewed",description:"Client viewed the curated shortlist",actor_id:user.id,metadata:{released_count:selectedReleased.length}});
    }catch{}
  }
  const releasedVaIds=selectedPublished&&selectedAccessUnlocked?[...new Set(selectedReleased.map((row:any)=>row.va_id))]:[];
  const [{data:profiles},{data:vas}]=releasedVaIds.length?await Promise.all([
    admin.from("profiles").select("id,full_name").in("id",releasedVaIds),
    admin.from("va_profiles").select("user_id,slug,headline,primary_category,weekly_hours,hourly_rate,skills,availability_status,availability_confirmed_at").in("user_id",releasedVaIds)
  ]):[{data:[]},{data:[]}];
  const profileMap=new Map((profiles||[]).map((row:any)=>[row.id,row]));
  const vaMap=new Map((vas||[]).map((row:any)=>[row.user_id,row]));
  const inviteMap=new Map<string,string>((existingInvites||[]).map((row:any)=>[`${row.job_id}:${row.va_id}`,String(row.status)]));

  const readyToReview=reviewableApplications.filter((app:any)=>["new","reviewing","shortlisted"].includes(app.status)).length;
  const interviews=reviewableApplications.filter((app:any)=>app.status==="interview").length;
  const offers=reviewableApplications.filter((app:any)=>app.status==="offered").length;
  const shortlistDecisions=selectedReleased.filter((row:any)=>row.client_decision).length;
  const next=offers?{title:`${offers} decision${offers===1?"":"s"} ready`,copy:"A candidate is waiting for your final hiring decision.",label:"Review decisions"}:interviews?{title:`${interviews} interview${interviews===1?"":"s"} in progress`,copy:"Review interview-stage candidates and keep decisions moving.",label:"Review interviews"}:readyToReview?{title:`${readyToReview} candidate${readyToReview===1?"":"s"} ready for review`,copy:"Compare the strongest candidates and decide who should move forward.",label:"Review candidates"}:selectedReleased.length?selectedPublished&&selectedAccessUnlocked?{title:`${selectedReleased.length-shortlistDecisions} shortlist decision${selectedReleased.length-shortlistDecisions===1?"":"s"} remaining`,copy:"Mark each recruiter-selected VA as interested, request an interview, or pass.",label:"Review shortlist"}:{title:`${selectedReleased.length} recruiter match${selectedReleased.length===1?"":"es"} prepared`,copy:selectedPublished?"Your shortlist is prepared. Activate candidate access to review full identities and evidence.":"Your recruiter has prepared matches while the role is in review.",label:"View role"}:{title:"We’re finding candidates",copy:"Your recruiting team is screening approved Virtual Assistants against your role.",label:"View roles"};

  return <>
    <div className="page-head"><div><h1>Your shortlist</h1><p>Review the candidates your recruiting team has selected for your active roles.</p></div></div>
    <section className="candidate-next-action"><div className="candidate-next-icon"><Sparkles size={21}/></div><div><span className="small">Your next action</span><h2>{next.title}</h2><p>{next.copy}</p><small className="muted">{offers||interviews||readyToReview||(selectedReleased.length&&selectedPublished&&selectedAccessUnlocked)?"Waiting on you":"Waiting on our recruiting team"}</small></div><Link className="btn btn-primary" href={selectedJob?`/workspace/client/candidates?role=${encodeURIComponent(selectedJob.id)}#recruiter-shortlist`:"/workspace/client/jobs"}>{next.label}<ArrowRight size={16}/></Link></section>

    {activeJobs.length>1?<div className="row wrap" style={{marginBottom:16}}><span className="small muted">Role:</span>{activeJobs.slice(0,8).map((job:any)=><Link key={job.id} className={`btn btn-sm ${selectedJob?.id===job.id?"btn-primary":""}`} href={`/workspace/client/candidates?role=${encodeURIComponent(job.id)}`}>{job.title}</Link>)}</div>:null}

    <section className="card dashboard-section-card" id="recruiter-shortlist">
      <div className="dashboard-section-head"><div><h2>Recruiter shortlist{selectedJob?` for ${selectedJob.title}`:""}</h2><p>These are staff-selected matches. Your feedback goes directly back to the recruiting team.</p></div></div>
      {selectedReleased.length?(selectedPublished&&selectedAccessUnlocked?<div className="grid-3 browse-va-grid">{selectedReleased.map((row:any)=>{
        const profile=profileMap.get(row.va_id) as any; const va=vaMap.get(row.va_id) as any; const invited=selectedJob?inviteMap.get(`${selectedJob.id}:${row.va_id}`):null; const decision=String(row.client_decision||"");
        return <article className="card browse-va-card" key={row.va_id}>
          <div className="row-between wrap"><div><strong>{profile?.full_name||"Matched Virtual Assistant"}</strong><div className="small muted">{va?.headline||va?.primary_category||"Virtual Assistant"}</div></div><span className="badge">{row.match_score}% · {matchLabel(Number(row.match_score||0))}</span></div>
          <div className="small muted">Match confidence: {row.match_confidence}%</div>
          <div className="small muted browse-va-facts">{va?.weekly_hours?`${va.weekly_hours} hrs/week`:"Availability not set"}{va?.hourly_rate?` · $${Number(va.hourly_rate).toFixed(2)}/hr`:""}</div>
          <div className="pill-list">{(va?.skills||[]).slice(0,3).map((skill:string,index:number)=><span className="badge" key={`${skill}-${index}`}>{skill}</span>)}</div>
          {row.client_recommendation?<div className="info-banner"><strong>Why your recruiter recommends this VA</strong><p style={{margin:"6px 0 0"}}>{row.client_recommendation}</p></div>:null}
          <div className="row wrap browse-va-actions">{va?.slug?<Link className="btn btn-sm" href={`/va/${va.slug}`} target="_blank">View profile</Link>:null}{decision?<span className={`badge ${decision==="pass"?"badge-warning":"badge-success"}`}>{decision==="interested"?"Interested":decision==="interview"?"Interview requested":"Passed"}</span>:null}{invited?<span className="badge">Invite: {invited}</span>:null}</div>
          {selectedJob?<div className="stack" style={{marginTop:10}}><div className="row wrap">
            <form action={clientShortlistDecisionAction}><input type="hidden" name="job_id" value={selectedJob.id}/><input type="hidden" name="va_id" value={row.va_id}/><input type="hidden" name="decision" value="interested"/><input type="hidden" name="return_to" value={`/workspace/client/candidates?role=${selectedJob.id}#recruiter-shortlist`}/><button className={`btn btn-sm ${decision==="interested"?"btn-primary":""}`} type="submit">Interested</button></form>
            <form action={clientShortlistDecisionAction}><input type="hidden" name="job_id" value={selectedJob.id}/><input type="hidden" name="va_id" value={row.va_id}/><input type="hidden" name="decision" value="interview"/><input type="hidden" name="return_to" value={`/workspace/client/candidates?role=${selectedJob.id}#recruiter-shortlist`}/><button className={`btn btn-sm ${decision==="interview"?"btn-primary":""}`} type="submit">Request interview</button></form>
            <details><summary className="btn btn-sm">Pass</summary><form action={clientShortlistDecisionAction} className="stack" style={{marginTop:8}}><input type="hidden" name="job_id" value={selectedJob.id}/><input type="hidden" name="va_id" value={row.va_id}/><input type="hidden" name="decision" value="pass"/><input type="hidden" name="return_to" value={`/workspace/client/candidates?role=${selectedJob.id}#recruiter-shortlist`}/><select name="pass_reason" defaultValue=""><option value="">Reason optional</option><option value="skills">Skills</option><option value="rate">Rate</option><option value="schedule_timezone">Schedule / timezone</option><option value="experience">Experience</option><option value="communication_video">Communication / video</option><option value="industry_fit">Industry fit</option><option value="availability">Availability</option><option value="other">Other</option></select><input name="decision_note" maxLength={300} placeholder="Optional note for your recruiter"/><button className="btn btn-sm" type="submit">Confirm pass</button></form></details>
          </div>{row.client_decision_note?<div className="small muted">Feedback: {row.client_decision_note}</div>:null}</div>:null}
        </article>;
      })}</div>:selectedPublished?<div className="empty"><strong>{selectedReleased.length} curated match{selectedReleased.length===1?" is":"es are"} ready.</strong><p>Candidate identities and private profile evidence remain protected until candidate access is active.</p><Link className="btn btn-primary" href={`/workspace/client/jobs/${selectedJob?.id}`}>View candidate access</Link></div>:<div className="empty"><strong>{selectedReleased.length} match{selectedReleased.length===1?" is":"es are"} prepared.</strong><p>Full profiles will appear after the role is approved and candidate access is active.</p></div>):<div className="empty">Your recruiter has not released a shortlist for this role yet.</div>}
    </section>

    <section className="card dashboard-section-card" id="candidate-list"><div className="dashboard-section-head"><div><h2>Candidate pipeline</h2><p>Applications and interview-stage candidates across your approved roles with active candidate access.</p></div></div>{reviewableApplications.length?<form action="/workspace/client/compare" method="get"><div className="row-between wrap" style={{marginBottom:12}}><p className="small muted" style={{margin:0}}>Select 2 to 4 candidates to compare role fit side by side.</p><button className="btn btn-sm" type="submit">Compare selected</button></div><div className="table-wrap responsive-table candidate-review-table"><table><thead><tr><th><span className="sr-only">Compare</span></th><th>Candidate</th><th>Role</th><th>Fit</th><th>Status</th><th>Applied</th><th></th></tr></thead><tbody>{reviewableApplications.map((app:any)=>{const profile=detailMap.get(app.id) as any||{}; const score=Number(app.match_score||0); const job=jobMap.get(app.job_id) as any; return <tr key={app.id}><td data-label="Compare"><label className="compare-check"><input type="checkbox" name="ids" value={app.id}/><span className="sr-only">Compare {profile.full_name||"candidate"}</span></label></td><td data-label="Candidate"><strong>{profile.full_name||"Virtual Assistant applicant"}</strong><div className="small muted">{profile.primary_category||"Virtual Assistant"}</div></td><td data-label="Role"><Link className="text-link" href={`/workspace/client/jobs/${app.job_id}`}>{job?.title||"Role"}</Link></td><td data-label="Fit"><div className="candidate-fit"><strong>{score}%</strong><span>{matchLabel(score)}</span></div></td><td data-label="Status"><span className={`badge ${app.status==="hired"?"badge-success":""}`}>{String(app.status).replaceAll("_"," ")}</span></td><td data-label="Applied">{dateShort(app.applied_at)}</td><td><Link className="btn btn-sm" href={`/workspace/client/candidates/${app.id}`}>{app.status==="hired"?"View hire":"Review candidate"}</Link></td></tr>;})}</tbody></table></div></form>:<div className="empty">No candidate applications are ready for your review yet.</div>}</section>
  </>;
}
