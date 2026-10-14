import "server-only";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { matchScore } from "@/lib/matching";
import { money } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";
import type { VaProfile } from "@/lib/types";
import { jobPublicHref } from "@/lib/public-routing";
import { MIN_HOURLY_RATE } from "@/lib/constants";

// The same curated, unexpired, moderation-cleared view used by /jobs.
// Never recommend an internal or withdrawn role from the raw jobs table.
const getPublishedJobsForDashboard = unstable_cache(async () => {
  const admin = createAdminClient();
  return admin.from("public_jobs")
    .select("id,slug,title,company_name,published_at,summary,categories,required_skills,required_tools,hours_per_week,overlap_hours,min_hourly_rate,max_hourly_rate,timezone,engagement_length")
    .gte("min_hourly_rate", MIN_HOURLY_RATE)
    .order("published_at", { ascending: false })
    .limit(20);
}, ["va-dashboard-public-jobs-v2"], { revalidate: 60 });

export async function VaDashboardMatches({ va, vetted }: { va: Partial<VaProfile>; vetted: boolean }) {
  if (!vetted) {
    return (
      <div className="va-recommended-state">
        <p>Complete recruiter screening before we can recommend roles based on your profile.</p>
        <Link className="btn btn-primary btn-sm" href="/workspace/va/vetting">Continue screening</Link>
      </div>
    );
  }

  const { data: jobs, error } = await withServerTiming("va.job_matches", getPublishedJobsForDashboard);
  if (error) {
    return (
      <div className="va-recommended-state" role="status">
        <p>Recommended roles could not be loaded. You can still browse public jobs.</p>
        <Link className="btn btn-sm" href="/workspace/va/jobs">Browse jobs</Link>
      </div>
    );
  }

  const matches = (jobs || [])
    .map((job: any) => ({ job, score: matchScore(job, va) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return matches.length ? (
    <div className="va-recommended-list">
      {matches.map(({ job }: any) => (
        <Link className="va-recommended-row" href={jobPublicHref(job)} key={job.id}>
          <span>
            <strong>{job.title}</strong>
            <small>{job.company_name || "Hiring company"}</small>
          </span>
          <span className="va-recommended-meta">
            {job.hours_per_week ? `${job.hours_per_week} hrs/week` : "Flexible hours"}
            {job.min_hourly_rate != null ? ` · From ${money(job.min_hourly_rate)}/hr` : ""}
          </span>
        </Link>
      ))}
    </div>
  ) : (
    <div className="va-recommended-state">
      <p>No new roles match your profile today. You can browse all open jobs or update your availability.</p>
      <Link className="btn btn-sm" href="/workspace/va/jobs">Browse all jobs</Link>
    </div>
  );
}
