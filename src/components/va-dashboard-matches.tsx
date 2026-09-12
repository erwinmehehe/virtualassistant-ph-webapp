import "server-only";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { JobCard } from "@/components/job-card";
import { matchScore } from "@/lib/matching";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";
import type { VaProfile } from "@/lib/types";

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
    return <div className="card"><div className="dashboard-section-head"><div><h2>Best job matches</h2><p>Your job matches unlock after vetting.</p></div><Link className="btn btn-sm" href="/workspace/va/jobs">View all</Link></div><div className="empty"><p>Your job matches will unlock after vetting.</p><Link className="btn btn-primary" href="/workspace/va/vetting">Complete vetting</Link></div></div>;
  }

  const { data: jobs, error } = await withServerTiming("va.job_matches", getPublishedJobsForDashboard);
  if (error) {
    return <div className="card"><div className="dashboard-section-head"><div><h2>Best job matches</h2><p>We could not load matching roles right now.</p></div><Link className="btn btn-sm" href="/workspace/va/jobs">Browse jobs</Link></div><div className="empty">Open the jobs page to see the latest published roles.</div></div>;
  }

  const matches = (jobs || [])
    .map((job: any) => ({ job, score: matchScore(job, va) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return <div className="card"><div className="dashboard-section-head"><div><h2>Best job matches</h2><p>The % shows how well your skills, tools, availability and rate fit the role. It is a guide, not a gate — you can apply to any open role.</p></div><Link className="btn btn-sm" href="/workspace/va/jobs">View all</Link></div><div className="stack">{matches.length ? matches.map(({ job, score }: any) => <JobCard key={job.id} job={job} match={score}/>) : <div className="empty">No strong matches are available right now. Keep your profile and availability current.</div>}</div></div>;
}
