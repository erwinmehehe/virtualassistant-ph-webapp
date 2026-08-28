import Link from "next/link";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";
import { candidateAccessUnlocked, protectedCandidateName } from "@/lib/candidate-access";
import { matchLabel } from "@/lib/matching";

export default async function ClientCandidatesPage(){
  const {user}=await requireRole("client"); const supabase=await createClient(); const admin=createAdminClient();
  const {data:jobs}=await supabase.from("jobs").select("id,title").eq("client_id",user.id);
  const jobIds=(jobs||[]).map((j:any)=>j.id); const jobMap=new Map((jobs||[]).map((j:any)=>[j.id,j.title]));
  if(!jobIds.length) return <><div className="page-head"><div><h1>Candidates</h1><p>Applicant identities and private evidence are protected until candidate access is activated for a role.</p></div></div><div className="card empty"><p>Create a role first. Applicants and curated matches will appear here.</p><Link className="btn btn-primary" href="/workspace/client/jobs/new">Create a role</Link></div></>;

  const [{data:accessRows},{data:applicationRows}]=await Promise.all([
    admin.from("job_candidate_access").select("job_id,access_status,access_fee").in("job_id",jobIds),
    admin.from("applications").select("id,job_id,status,match_score,applied_at").in("job_id",jobIds).order("applied_at",{ascending:false})
  ]);
  const accessMap=new Map((accessRows||[]).map((a:any)=>[a.job_id,a]));
  const applications=applicationRows||[];
  const unlockedApplications=applications.filter((a:any)=>candidateAccessUnlocked((accessMap.get(a.job_id) as any)?.access_status));
  const unlockedIds=unlockedApplications.map((a:any)=>a.id);
  const {data:detailRows}=unlockedIds.length?await admin.from("applications").select("id,profile_snapshot").in("id",unlockedIds):{data:[]};
  const detailMap=new Map((detailRows||[]).map((row:any)=>[row.id,row.profile_snapshot||{}]));
  const readyToReview=applications.filter((a:any)=>["new","reviewing","shortlisted"].includes(a.status)).length;
  const interviews=applications.filter((a:any)=>a.status==="interview").length;
  const offers=applications.filter((a:any)=>a.status==="offered").length;
  const next=offers?{title:`${offers} decision${offers===1?"":"s"} ready`,copy:"A candidate is waiting for your final hiring decision.",label:"Review decisions"}:interviews?{title:`${interviews} interview${interviews===1?"":"s"} in progress`,copy:"Review candidates and keep the interview process moving.",label:"Review interviews"}:readyToReview?{title:`${readyToReview} candidate${readyToReview===1?"":"s"} ready for review`,copy:"Compare role fit and decide who should move forward.",label:"Review candidates"}:{title:"We’re looking for candidates",copy:"Your recruiting team is matching approved VAs to your role.",label:"View roles"};

  return <>
    <div className="page-head"><div><h1>Review candidates</h1><p>See role fit first, then compare candidates and move the strongest people forward.</p></div></div>
    <section className="candidate-next-action"><div className="candidate-next-icon"><Sparkles size={21}/></div><div><span className="small">Your next action</span><h2>{next.title}</h2><p>{next.copy}</p><small className="muted">{offers||interviews||readyToReview?"Waiting on you":"Waiting on our recruiting team"}</small></div><a className="btn btn-primary" href="#candidate-list">{next.label}<ArrowRight size={16}/></a></section>
    {applications.length?<form id="candidate-list" action="/workspace/client/compare" method="get"><div className="row-between wrap" style={{marginBottom:12}}><p className="small muted" style={{margin:0}}>{unlockedApplications.length>=2?"Select 2 to 4 unlocked candidates to compare their role fit side by side.":"Comparison becomes available after candidate access is active for at least two applicants."}</p>{unlockedApplications.length>=2?<button className="btn btn-sm" type="submit">Compare selected</button>:null}</div><div className="table-wrap responsive-table candidate-review-table"><table><thead><tr><th><span className="sr-only">Compare</span></th><th>Candidate</th><th>Job</th><th>Fit</th><th>Status</th><th>Applied</th><th></th></tr></thead><tbody>{applications.map((a:any,index:number)=>{const access=accessMap.get(a.job_id) as any;const unlocked=candidateAccessUnlocked(access?.access_status);const p=detailMap.get(a.id) as any || {};const score=Number(a.match_score||0);return <tr key={a.id}><td data-label="Compare">{unlocked?<label className="compare-check"><input type="checkbox" name="ids" value={a.id}/><span className="sr-only">Compare {p.full_name||"candidate"}</span></label>:<LockKeyhole size={14} aria-label="Locked"/>}</td><td data-label="Candidate"><strong>{unlocked?(p.full_name||"VA applicant"):protectedCandidateName(index)}</strong><div className="small muted">{unlocked?(p.primary_category||"Virtual Assistant"):"Identity protected"}</div></td><td data-label="Job"><Link className="text-link" href={`/workspace/client/jobs/${a.job_id}`}>{jobMap.get(a.job_id)||"Role"}</Link></td><td data-label="Fit"><div className="candidate-fit"><strong>{score}%</strong><span>{matchLabel(score)}</span></div></td><td data-label="Status"><span className={`badge ${a.status==="hired"?"badge-success":""}`}>{String(a.status).replaceAll("_"," ")}</span></td><td data-label="Applied">{dateShort(a.applied_at)}</td><td>{unlocked?<Link className="btn btn-sm" href={`/workspace/client/candidates/${a.id}`}>{a.status==="hired"?"View hire":"Review candidate"}</Link>:<Link className="btn btn-sm" href={`/workspace/client/jobs/${a.job_id}`}>Unlock details</Link>}</td></tr>})}</tbody></table></div></form>:<div className="card empty">Candidates will appear here after VAs apply or accept an invitation.</div>}
  </>;
}
