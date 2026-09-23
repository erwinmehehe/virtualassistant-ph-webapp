import "server-only";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { matchScore } from "@/lib/matching";
import { money } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";
import type { VaProfile } from "@/lib/types";
import { jobPublicHref } from "@/lib/public-routing";

const getPublishedJobsForDashboard = unstable_cache(async () => {
  const admin = createAdminClient();
  return admin.from("jobs")
    .select("id,slug,title,company_name,published_at,summary,categories,required_skills,required_tools,hours_per_week,overlap_hours,min_hourly_rate,max_hourly_rate,timezone,engagement_length")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);
}, ["va-dashboard-published-jobs-v1"], { revalidate: 60 });

export async function VaDashboardMatches({ va, vetted }: { va: Partial<VaProfile>; vetted: boolean }) {
  if (!vetted) {
    return (
      <div className="card">
        <div className="dashboard-section-head">
          <div>
            <h2>Recommended roles</h2>
            <p>Complete vetting to unlock role recommendations.</p>
          </div>
          <Link className="btn btn-sm" href="/workspace/va/vetting">Continue vetting</Link>
        </div>
      </div>
    );
  }

  const { data: jobs, error } = await withServerTiming("va.job_matches", getPublishedJobsForDashboard);
  if (error) {
    return (
      <div className="card">
        <div className="dashboard-section-head">
          <div>
            <h2>Recommended roles</h2>
            <p>Role recommendations are temporarily unavailable.</p>
          </div>
          <Link className="btn btn-sm" href="/workspace/va/jobs">Browse jobs</Link>
        </div>
      </div>
    );
  }

  const matches = (jobs || [])
    .map((job: any) => ({ job, score: matchScore(job, va) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="card">
      <div className="dashboard-section-head">
        <div>
          <h2>Recommended roles</h2>
          <p>Based on the profile and availability you have on file.</p>
        </div>
        <Link className="btn btn-sm" href="/workspace/va/jobs">View all</Link>
      </div>

      {matches.length ? (
        <div className="va-recommended-list">
          {matches.map(({ job }: any) => (
            <Link className="va-recommended-row" href={jobPublicHref(job)} key={job.id}>
              <span>
                <strong>{job.title}</strong>
                <small>{job.company_name || "Confidential client"}</small>
              </span>
              <span className="va-recommended-meta">
                {job.hours_per_week ? `${job.hours_per_week} hrs/week` : "Flexible hours"}
                {job.min_hourly_rate != null ? ` · From ${money(job.min_hourly_rate)}/hr` : ""}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">No recommended roles right now.</div>
      )}
    </div>
  );
}
