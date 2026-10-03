import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Clock3, Plus, UsersRound } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";

function roleStatus(status: string) {
  if (status === "published") return { label: "Recruiting", tone: "badge-success", copy: "Your recruiter is screening and shortlisting vetted VAs." };
  if (status === "pending") return { label: "In review", tone: "badge-warning", copy: "We are checking the brief and confirming the hiring setup." };
  if (status === "draft") return { label: "Draft", tone: "", copy: "Finish the brief when you are ready to start recruiting." };
  if (status === "closed") return { label: "Closed", tone: "", copy: "This hiring request is no longer active." };
  return { label: status.replaceAll("_", " "), tone: "", copy: "Open the role to see its current hiring stage." };
}

export default async function ClientJobsPage(){
  const {userId}=await requireRoleFast("client");
  const supabase=await createClient();
  const [{data:jobs},{data:clientProfile}]=await Promise.all([
    supabase
      .from("jobs")
      .select("id,title,status,hours_per_week,min_hourly_rate,max_hourly_rate,timezone,created_at")
      .eq("client_id",userId)
      .order("created_at",{ascending:false}),
    supabase.from("client_profiles").select("can_self_publish_jobs").eq("user_id",userId).maybeSingle()
  ]);

  const ids=(jobs||[]).map((job:any)=>job.id);
  const admin=createAdminClient();
  const [{data:applicationRows},{data:shortlistRows}]=ids.length
    ? await Promise.all([
        admin.from("applications").select("job_id").in("job_id",ids),
        admin.from("job_shortlist_candidates").select("job_id").in("job_id",ids).eq("shortlist_status","released")
      ])
    : [{data:[]},{data:[]}];
  const applicationCounts=new Map<string,number>();
  for(const row of applicationRows||[]) applicationCounts.set(row.job_id,(applicationCounts.get(row.job_id)||0)+1);
  const shortlistCounts=new Map<string,number>();
  for(const row of shortlistRows||[]) shortlistCounts.set(row.job_id,(shortlistCounts.get(row.job_id)||0)+1);

  const active=(jobs||[]).filter((job:any)=>job.status==="published").length;
  const inReview=(jobs||[]).filter((job:any)=>job.status==="pending").length;
  const applicationTotal=[...applicationCounts.values()].reduce((sum,count)=>sum+count,0);
  const shortlistTotal=[...shortlistCounts.values()].reduce((sum,count)=>sum+count,0);

  return <div className="client-jobs-page">
    <div className="client-jobs-hero">
      <div>
        <div className="kicker">Managed hiring</div>
        <h1>Your hiring requests</h1>
        <p>See what is moving, what needs you, and what your recruiter is handling next.</p>
      </div>
      <Link className="btn btn-primary client-jobs-new" href="/workspace/client/jobs/new"><Plus size={16}/>Post a job</Link>
    </div>

    <div className="client-jobs-summary" aria-label="Hiring request summary">
      <div><BriefcaseBusiness size={17}/><span><strong>{active}</strong> recruiting</span></div>
      <div><Clock3 size={17}/><span><strong>{inReview}</strong> in review</span></div>
      <div><UsersRound size={17}/><span><strong>{applicationTotal}</strong> applications</span></div>
      <div><UsersRound size={17}/><span><strong>{shortlistTotal}</strong> shortlisted</span></div>
    </div>

    {clientProfile?.can_self_publish_jobs?<div className="success-banner client-jobs-publish-note">Direct publishing is enabled for your account. Complete curated-placement roles can go live immediately after your final review.</div>:null}

    {jobs?.length?<div className="client-jobs-grid">
      {jobs.map((job:any)=>{
        const status=roleStatus(job.status);
        const applicationCount=applicationCounts.get(job.id)||0;
        const shortlistCount=shortlistCounts.get(job.id)||0;
        return <article className="client-job-card" key={job.id}>
          <div className="client-job-card-top">
            <div>
              <div className="row wrap"><span className={`badge ${status.tone}`}>{status.label}</span><span className="small muted">Created {dateShort(job.created_at)}</span></div>
              <h2>{job.title}</h2>
              <p>{status.copy}</p>
            </div>
            <Link className="client-job-card-arrow" href={`/workspace/client/jobs/${job.id}`} aria-label={`Open ${job.title}`}><ArrowRight size={18}/></Link>
          </div>
          <div className="client-job-card-meta">
            <div><span>Hours</span><strong>{job.hours_per_week?`${job.hours_per_week}/week`:"Flexible"}</strong></div>
            <div><span>VA budget</span><strong>{job.min_hourly_rate?`USD ${job.min_hourly_rate}${job.max_hourly_rate?`–${job.max_hourly_rate}`:"+"}/hr`:"Not set"}</strong></div>
            <div><span>Applications</span><strong>{applicationCount ? `${applicationCount} received` : "Waiting"}</strong></div>
            <div><span>Shortlist</span><strong>{shortlistCount ? `${shortlistCount} ready` : applicationCount ? "Recruiter reviewing" : "Not sent yet"}</strong></div>
          </div>
          <div className="client-job-card-footer">
            <span className="small muted">{job.timezone||"Timezone not set"}</span>
            <Link className="btn btn-sm client-job-progress" href={`/workspace/client/jobs/${job.id}`}>{job.status==="draft"?"Continue brief":"View progress"}<ArrowRight size={14}/></Link>
          </div>
        </article>;
      })}
    </div>:<div className="empty client-jobs-empty"><BriefcaseBusiness size={28}/><h2>No jobs yet</h2><p>Tell us the work you need handled. We will shape the brief and manage the search from there.</p><Link className="btn btn-primary" href="/workspace/client/jobs/new">Post your first job</Link></div>}
  </div>;
}
