import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessLabel, candidateAccessUnlocked } from "@/lib/candidate-access";
import { dateShort } from "@/lib/format";

export default async function ClientJobsPage(){
  const {user}=await requireRole("client"); const supabase=await createClient();
  const {data:jobs}=await supabase.from("jobs").select("id,title,status,hours_per_week,min_hourly_rate,created_at").eq("client_id",user.id).order("created_at",{ascending:false});
  const ids=(jobs||[]).map((j:any)=>j.id); const admin=createAdminClient();
  const [{data:applicationRows},{data:accessRows}]=ids.length?await Promise.all([
    admin.from("applications").select("job_id").in("job_id",ids),
    admin.from("job_candidate_access").select("job_id,access_status").in("job_id",ids)
  ]):[{data:[]},{data:[]} as any];
  const counts=new Map<string,number>(); for(const row of applicationRows||[]) counts.set(row.job_id,(counts.get(row.job_id)||0)+1);
  const accessMap=new Map<string,string>((accessRows||[]).map((row:any)=>[String(row.job_id),String(row.access_status)] as [string,string]));
  return <><div className="page-head"><div><h1>Your jobs</h1><p>Create, review, and manage every VA role from one place.</p></div><Link className="btn btn-primary" href="/workspace/client/jobs/new">Post a job</Link></div><div className="table-wrap responsive-table">{jobs?.length?<table><thead><tr><th>Job</th><th>Status</th><th>Hours</th><th>Applicants</th><th>Candidate access</th><th>Created</th><th></th></tr></thead><tbody>{jobs.map((j:any)=>{const accessStatus=accessMap.get(j.id);return <tr key={j.id}><td data-label="Job"><strong>{j.title}</strong><div className="small muted">From USD {j.min_hourly_rate||5}/hr</div></td><td data-label="Status"><span className={`badge ${j.status==="published"?"badge-success":j.status==="pending"?"badge-warning":""}`}>{j.status}</span></td><td data-label="Hours">{j.hours_per_week?`${j.hours_per_week}/week`:"Flexible"}</td><td data-label="Applicants">{counts.get(j.id)||0}</td><td data-label="Candidate access"><span className={`badge ${candidateAccessUnlocked(accessStatus)?"badge-success":""}`}>{candidateAccessLabel(accessStatus)}</span></td><td data-label="Created">{dateShort(j.created_at)}</td><td data-label="Action"><Link className="btn btn-sm" href={`/workspace/client/jobs/${j.id}`}>Open</Link></td></tr>})}</tbody></table>:<div className="empty"><p>You have not created a job yet.</p><Link className="btn btn-primary" href="/workspace/client/jobs/new">Create your first job</Link></div>}</div></>;
}
