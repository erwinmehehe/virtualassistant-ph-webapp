import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateShort } from "@/lib/format";
import { matchLabel } from "@/lib/matching";
import { respondToInviteAction, withdrawApplicationAction } from "@/app/actions/applications";
import { jobPublicHref } from "@/lib/public-routing";

function stageLabel(status:string){const labels:Record<string,string>={new:"Recruiter review",reviewing:"Recruiter review",shortlisted:"Presented to client",interview:"Interview",offered:"Offer",hired:"Placed",rejected:"Not selected",withdrawn:"Withdrawn"};return labels[status]||String(status).replaceAll("_"," ");}

export default async function VaApplicationsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;const {userId}=await requireRoleFast("va");const supabase=await createClient();
  const [{data:apps},{data:invites}]=await Promise.all([
    supabase.from("applications").select("*,jobs(id,slug,title,company_name,status)").eq("va_id",userId).order("applied_at",{ascending:false}),
    supabase.from("job_invites").select("*,jobs(id,slug,title,company_name,hours_per_week,min_hourly_rate)").eq("va_id",userId).order("created_at",{ascending:false})
  ]);
  return <>
    {params.interest==="1"?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Interest sent to the recruiting team. A recruiter will review your fit before anything is shown to the client.</div>:null}
    {params.interest==="already"?<div className="alert" role="status">You already expressed interest in this role.</div>:null}
    {params.invite?<div className="success-banner" role="status">Interview request {params.invite}. {params.invite==="accepted"?"The recruiting team and client can now coordinate the next interview step.":"The recruiting team has been updated."}</div>:null}
    <div className="page-head"><div><h1>Recruiter review</h1><p>Track roles you expressed interest in, recruiter decisions, interview requests, and placement progress.</p></div></div>
    {(invites||[]).some((x:any)=>x.status==="pending")?<div className="card" style={{marginBottom:18}}><h3>Interview requests</h3><p className="small muted">These requests come from the managed shortlist process. Review the role and confirm whether you want to continue.</p><div className="stack">{(invites||[]).filter((x:any)=>x.status==="pending").map((i:any)=><div className="card row-between wrap" key={i.id}><div><strong>{i.jobs?.title}</strong><div className="small muted">{i.jobs?.company_name||"Client role"}</div>{i.note?<p className="small" style={{marginBottom:0}}>{i.note}</p>:null}</div><div className="row"><form action={respondToInviteAction}><input type="hidden" name="invite_id" value={i.id}/><button className="btn btn-primary btn-sm" name="decision" value="accepted">Accept request</button></form><form action={respondToInviteAction}><input type="hidden" name="invite_id" value={i.id}/><button className="btn btn-sm" name="decision" value="declined">Decline</button></form></div></div>)}</div></div>:null}
    <div className="table-wrap responsive-table">{apps?.length?<table><thead><tr><th>Role</th><th>Fit</th><th>Stage</th><th>Interested since</th><th></th></tr></thead><tbody>{apps.map((a:any)=>{const score=Number(a.match_score||0);return <tr key={a.id}><td data-label="Role"><strong>{a.jobs?.title}</strong><div className="small muted">{a.jobs?.company_name||"Confidential client"}</div></td><td data-label="Fit"><strong>{matchLabel(score)}</strong><div className="small muted">Recruiter screening aid</div></td><td data-label="Stage"><span className={`badge ${a.status==="hired"?"badge-success":a.status==="interview"?"badge-warning":""}`}>{stageLabel(a.status)}</span></td><td data-label="Interested since">{dateShort(a.applied_at)}</td><td><div className="row wrap"><Link className="btn btn-sm" href={jobPublicHref(a.jobs||{id:a.job_id})}>Role</Link>{!["hired","rejected","withdrawn"].includes(a.status)?<form action={withdrawApplicationAction}><input type="hidden" name="application_id" value={a.id}/><button className="btn btn-sm btn-danger" type="submit">Withdraw interest</button></form>:null}</div></td></tr>})}</tbody></table>:<div className="empty">You have not expressed interest in a role yet. <Link href="/workspace/va/jobs" className="text-link">Browse recruiter-reviewed roles</Link>.</div>}</div>
  </>;
}
