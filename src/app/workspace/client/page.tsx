import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { candidateAccessUnlocked, protectedCandidateName } from "@/lib/candidate-access";
import { dateShort } from "@/lib/format";
import { matchLabel } from "@/lib/matching";

export default async function ClientDashboardPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;const {user}=await requireRole("client");const supabase=await createClient();
  const [{data:company},{data:jobs},{count:unread},{data:workrooms},{data:requested}]=await Promise.all([
    supabase.from("client_profiles").select("*").eq("user_id",user.id).single(),
    supabase.from("jobs").select("id,title,status,created_at").eq("client_id",user.id).order("created_at",{ascending:false}),
    supabase.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",user.id).is("read_at",null),
    supabase.from("workrooms").select("id").eq("client_id",user.id),
    params.talent?supabase.from("public_va_directory").select("slug,full_name,headline,primary_category").eq("slug",params.talent).maybeSingle():Promise.resolve({data:null} as any)
  ]);
  if (!company?.onboarding_completed_at && !(jobs||[]).length && !params.talent) redirect("/workspace/client/onboarding");
  const jobIds=(jobs||[]).map((j:any)=>j.id); const jobMap=new Map((jobs||[]).map((j:any)=>[j.id,j.title])); const admin=createAdminClient();
  const [{data:applications},{data:accessRows}]=jobIds.length?await Promise.all([
    admin.from("applications").select("id,job_id,status,applied_at,match_score").in("job_id",jobIds).order("applied_at",{ascending:false}).limit(8),
    admin.from("job_candidate_access").select("job_id,access_status").in("job_id",jobIds)
  ]):[{data:[]},{data:[]} as any];
  const accessMap=new Map<string,string>((accessRows||[]).map((row:any)=>[String(row.job_id),String(row.access_status)] as [string,string]));
  const unlockedIds=(applications||[]).filter((a:any)=>candidateAccessUnlocked(accessMap.get(a.job_id))).map((a:any)=>a.id);
  const {data:detailRows}=unlockedIds.length?await admin.from("applications").select("id,profile_snapshot").in("id",unlockedIds):{data:[]};
  const detailMap=new Map((detailRows||[]).map((row:any)=>[row.id,row.profile_snapshot||{}]));
  const active=(jobs||[]).filter((j:any)=>j.status==="published").length;const shortlisted=(applications||[]).filter((a:any)=>["shortlisted","interview","hired"].includes(a.status)).length;
  const steps=[
    {label:"Complete your company profile",description:"Add your company, timezone, and hiring context.",done:Boolean(company?.company_name&&company?.timezone),href:"/workspace/client/company"},
    {label:"Create your first role",description:"Use the guided role wizard with inline validation and autosave.",done:Boolean(jobs?.length),href:"/workspace/client/jobs/new"},
    {label:"Publish a role",description:"Submitted roles are reviewed and pricing is accepted before publication.",done:Boolean((jobs||[]).some((j:any)=>j.status==="published")),href:"/workspace/client/jobs"},
    {label:"Activate candidate access",description:"Applicant identity and private profile evidence unlock only after access is activated for a role.",done:Boolean((accessRows||[]).some((a:any)=>candidateAccessUnlocked(a.access_status))),href:"/workspace/client/jobs"},
    {label:"Create a shortlist",description:"Move the strongest unlocked candidates to Shortlisted or Interview.",done:Boolean(shortlisted),href:"/workspace/client/candidates"},
    {label:"Confirm a hire",description:"A workroom is created only after final rate, start date, and schedule confirmation.",done:Boolean(workrooms?.length),href:"/workspace/client/workroom"}
  ];
  return <>{requested?<div className="intent-banner"><div><strong>{requested.full_name}</strong><span className="small muted"> · {requested.headline||requested.primary_category||"Virtual Assistant"}</span><p className="small muted">Create a role and this VA preference will stay attached to it.</p></div><div className="row wrap"><Link className="btn" href={`/va/${requested.slug}`} target="_blank">Review profile</Link><Link className="btn btn-primary" href={`/workspace/client/jobs/new?talent=${encodeURIComponent(requested.slug)}`}>Create role for this VA</Link></div></div>:null}
  <div className="page-head"><div><h1>Hiring overview</h1><p>See the next decision across roles, protected candidate access, conversations, and active VA placements.</p></div><Link className="btn btn-primary" href="/workspace/client/jobs/new">Create a role</Link></div>
  <div className="stats"><div className="stat-card"><span className="small muted">Active roles</span><strong>{active}</strong></div><div className="stat-card"><span className="small muted">Recent applicants</span><strong>{applications?.length||0}</strong></div><div className="stat-card"><span className="small muted">Shortlisted or later</span><strong>{shortlisted}</strong></div><Link className="stat-card stat-link" href="/workspace/client/notifications"><span className="small muted">Unread notifications</span><strong>{unread||0}</strong><span className="small text-link">View updates</span></Link></div>
  <OnboardingChecklist title="Hiring setup" steps={steps}/><div className="dashboard-single dashboard-after-onboarding"><div className="card"><div className="row-between" style={{marginBottom:14}}><div><h3 style={{margin:0}}>Recent applicants</h3><span className="small muted">Identity is shown only for roles with active candidate access.</span></div><Link className="btn btn-sm" href="/workspace/client/candidates">View all</Link></div>{applications?.length?<div className="table-wrap responsive-table" style={{border:0}}><table><thead><tr><th>Applicant</th><th>Role</th><th>Fit</th><th>Status</th><th>Applied</th></tr></thead><tbody>{applications.map((a:any,index:number)=>{const unlocked=candidateAccessUnlocked(accessMap.get(a.job_id));const p=detailMap.get(a.id) as any || {};const score=Number(a.match_score||0);return <tr key={a.id}><td data-label="Applicant">{unlocked?<Link href={`/workspace/client/candidates/${a.id}`}><strong>{p.full_name||"VA applicant"}</strong></Link>:<strong className="protected-inline"><LockKeyhole size={13}/>{protectedCandidateName(index)}</strong>}<div className="small muted">{unlocked?(p.primary_category||"Virtual Assistant"):"Identity protected"}</div></td><td data-label="Role"><Link className="text-link" href={`/workspace/client/jobs/${a.job_id}`}>{jobMap.get(a.job_id)||"Role"}</Link></td><td data-label="Fit"><strong>{matchLabel(score)}</strong><div className="small muted">{score}/100</div></td><td data-label="Status"><span className={`badge ${a.status==="hired"?"badge-success":a.status==="interview"?"badge-warning":""}`}>{String(a.status).replaceAll("_"," ")}</span></td><td data-label="Applied">{dateShort(a.applied_at)}</td></tr>})}</tbody></table></div>:<div className="empty">Applications will appear here when VAs apply or accept an invitation.</div>}</div></div></>;
}
