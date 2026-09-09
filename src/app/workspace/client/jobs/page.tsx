import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";

export default async function ClientJobsPage(){
  const {user}=await requireRole("client");
  const supabase=await createClient();
  const {data:jobs}=await supabase
    .from("jobs")
    .select("id,title,status,hours_per_week,min_hourly_rate,created_at")
    .eq("client_id",user.id)
    .order("created_at",{ascending:false});

  const ids=(jobs||[]).map((job:any)=>job.id);
  const admin=createAdminClient();
  const {data:applicationRows}=ids.length
    ? await admin.from("applications").select("job_id").in("job_id",ids)
    : {data:[]};
  const counts=new Map<string,number>();
  for(const row of applicationRows||[]) counts.set(row.job_id,(counts.get(row.job_id)||0)+1);

  return <>
    <div className="page-head">
      <div><h1>Your hiring requests</h1><p>Follow each role from brief review through recruiting, shortlist, interviews, and hire.</p></div>
      <Link className="btn btn-primary" href="/workspace/client/jobs/new">New hiring request</Link>
    </div>
    <div className="table-wrap responsive-table">
      {jobs?.length?<table>
        <thead><tr><th>Role</th><th>Status</th><th>Hours</th><th>Candidates</th><th>Created</th><th></th></tr></thead>
        <tbody>{jobs.map((job:any)=><tr key={job.id}>
          <td data-label="Role"><strong>{job.title}</strong><div className="small muted">VA pay from USD {job.min_hourly_rate||5}/hr</div></td>
          <td data-label="Status"><span className={`badge ${job.status==="published"?"badge-success":job.status==="pending"?"badge-warning":""}`}>{job.status==="published"?"Recruiting":job.status==="pending"?"In review":String(job.status).replaceAll("_"," ")}</span></td>
          <td data-label="Hours">{job.hours_per_week?`${job.hours_per_week}/week`:"Flexible"}</td>
          <td data-label="Candidates">{counts.get(job.id)||0}</td>
          <td data-label="Created">{dateShort(job.created_at)}</td>
          <td data-label="Action"><Link className="btn btn-sm" href={`/workspace/client/jobs/${job.id}`}>View progress</Link></td>
        </tr>)}</tbody>
      </table>:<div className="empty"><p>You have not sent a hiring request yet.</p><Link className="btn btn-primary" href="/workspace/client/jobs/new">Start your first hiring request</Link></div>}
    </div>
  </>;
}
