import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateShort } from "@/lib/format";
import { matchLabel } from "@/lib/matching";
import { respondToInviteAction, withdrawApplicationAction } from "@/app/actions/applications";
import { jobPublicHref } from "@/lib/public-routing";

function statusLabel(status:string){
  const labels:Record<string,string>={new:"Recruiter review",reviewing:"Recruiter review",shortlisted:"Recruiter shortlist",interview:"Interview",offered:"Offer",hired:"Placed",rejected:"Not selected",withdrawn:"Withdrawn"};
  return labels[status]||status.replaceAll("_"," ");
}

export default async function VaApplicationsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {user}=await requireRole("va");
  const supabase=await createClient();
  const [{data:apps},{data:invites}]=await Promise.all([
    supabase.from("applications").select("*,jobs(id,slug,title,company_name,status)").eq("va_id",user.id).order("applied_at",{ascending:false}),
    supabase.from("job_invites").select("*,jobs(id,slug,title,company_name,hours_per_week,min_hourly_rate)").eq("va_id",user.id).order("created_at",{ascending:false})
  ]);

  return <>
    {params.interest?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Your interest was sent to the recruiter. The client does not see your profile unless the recruiting team approves you for the shortlist.</div>:null}
    {params.invite?<div className="success-banner" role="status">Invitation {params.invite}. Your recruiter remains responsible for the client handoff and next step.</div>:null}
    <div className="page-head"><div><h1>Recruiter opportunities</h1><p>Track roles you are interested in and opportunities where the recruiting team has moved you forward.</p></div><div className="row wrap"><Link className="btn" href="/workspace/va/interviews">Interviews</Link><Link className="btn" href="/workspace/va/offers">Offers</Link></div></div>

    {(invites||[]).some((x:any)=>x.status==="pending")?<div className="card" style={{marginBottom:18}}><h3>Recruiter-approved invitations</h3><p className="small muted">Review the role and confirm whether you want to be considered. Accepting does not bypass the recruiter or send you directly to the client.</p><div className="stack">{(invites||[]).filter((x:any)=>x.status==="pending").map((i:any)=><div className="card row-between wrap" key={i.id}><div><strong>{i.jobs?.title}</strong><div className="small muted">{i.jobs?.company_name||"Client role"}</div>{i.note?<p className="small" style={{marginBottom:0}}>{i.note}</p>:null}</div><div className="row"><form action={respondToInviteAction}><input type="hidden" name="invite_id" value={i.id}/><button className="btn btn-primary btn-sm" name="decision" value="accepted">Interested</button></form><form action={respondToInviteAction}><input type="hidden" name="invite_id" value={i.id}/><button className="btn btn-sm" name="decision" value="declined">Not interested</button></form></div></div>)}</div></div>:null}

    <div className="table-wrap responsive-table">{apps?.length?<table><thead><tr><th>Role</th><th>Fit</th><th>Recruiting stage</th><th>Updated</th><th></th></tr></thead><tbody>{apps.map((a:any)=>{const score=Number(a.match_score||0);return <tr key={a.id}><td data-label="Role"><strong>{a.jobs?.title}</strong><div className="small muted">{a.jobs?.company_name||"Confidential client"}</div></td><td data-label="Fit"><strong>{matchLabel(score)}</strong><div className="small muted">Recruiter screening aid</div></td><td data-label="Recruiting stage"><span className={`badge ${a.status==="hired"?"badge-success":a.status==="interview"?"badge-warning":""}`}>{statusLabel(a.status)}</span></td><td data-label="Updated">{dateShort(a.updated_at||a.applied_at)}</td><td><div className="row wrap"><Link className="btn btn-sm" href={jobPublicHref(a.jobs||{id:a.job_id})}>View role</Link>{!["hired","rejected","withdrawn"].includes(a.status)?<form action={withdrawApplicationAction}><input type="hidden" name="application_id" value={a.id}/><button className="btn btn-sm btn-danger" type="submit">Withdraw interest</button></form>:null}</div></td></tr>})}</tbody></table>:<div className="empty">You have not expressed interest in a role yet. <Link href="/workspace/va/jobs" className="text-link">Browse recruiter-reviewed roles</Link>.</div>}</div>
  </>;
}
