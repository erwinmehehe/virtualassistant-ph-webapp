import Link from "next/link";
import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";
import { saveJobAction } from "@/app/actions/applications";
import { jobPublicHref } from "@/lib/public-routing";

export default async function VaSavedPage() {
  const { userId } = await requireRoleFast("va");
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("saved_jobs")
    .select("job_id,jobs(id,slug,title,company_name,summary,hours_per_week,min_hourly_rate,timezone,status)")
    .eq("va_id", userId)
    .order("created_at", { ascending: false });

  return (
    <div className="va-saved-page">
      <div className="va-jobs-head">
        <div>
          <h1>Saved jobs</h1>
          <p>Roles you bookmarked to review later.</p>
        </div>
        <Link className="btn btn-sm" href="/workspace/va/jobs">Find jobs</Link>
      </div>

      <div className="va-saved-list">
        {items?.length ? (
          items.map((item: any) => {
            const job = item.jobs;
            return (
              <article className="va-saved-row" key={item.job_id}>
                <div className="va-saved-main">
                  <div className="va-saved-title-row">
                    <h2><Link href={jobPublicHref(job || {})}>{job?.title}</Link></h2>
                    {job?.status && job.status !== "published" ? <span className="badge">{job.status}</span> : null}
                  </div>
                  <p>{job?.company_name || "Confidential client"}</p>
                  <div className="va-job-meta">
                    <span>{job?.hours_per_week ? `${job.hours_per_week} hrs/week` : "Flexible hours"}</span>
                    <span>{job?.min_hourly_rate != null ? `From ${money(job.min_hourly_rate)}/hr` : "Rate shown in role"}</span>
                    <span>{job?.timezone || "Flexible timezone"}</span>
                  </div>
                </div>
                <div className="va-job-actions">
                  <Link className="btn btn-primary btn-sm" href={jobPublicHref(job || {})}>View role</Link>
                  <form action={saveJobAction}>
                    <input type="hidden" name="job_id" value={item.job_id} />
                    <button className="btn btn-sm" type="submit">Remove</button>
                  </form>
                </div>
              </article>
            );
          })
        ) : (
          <div className="workspace-empty-card">
            <h2>No saved jobs</h2>
            <p>Save roles you want to compare or come back to later.</p>
            <div className="workspace-empty-actions row">
              <Link href="/workspace/va/jobs" className="btn btn-primary">Find jobs</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
