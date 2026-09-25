import Link from "next/link";
import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { matchAssessment, matchLabel } from "@/lib/matching";
import { money } from "@/lib/format";
import { saveJobAction } from "@/app/actions/applications";
import { jobPublicHref } from "@/lib/public-routing";
import { uniqueStrings } from "@/lib/collections";

function fitText(score: number, eligible: boolean) {
  if (!eligible) return "Check requirements";
  return matchLabel(score);
}

export default async function VaJobsPage() {
  const { userId } = await requireRoleFast("va");
  const supabase = await createClient();

  const [{ data: va }, { data: jobs }, { data: saved }, { data: apps }] = await Promise.all([
    supabase.from("va_profiles").select("*").eq("user_id", userId).single(),
    supabase.from("public_jobs").select("*").order("published_at", { ascending: false }).limit(80),
    supabase.from("saved_jobs").select("job_id").eq("va_id", userId),
    supabase.from("applications").select("job_id,status").eq("va_id", userId),
  ]);

  const savedSet = new Set((saved || []).map((item: any) => item.job_id));
  const appMap = new Map((apps || []).map((item: any) => [item.job_id, item.status]));

  const ranked = (jobs || [])
    .map((job: any) => ({ job, ...matchAssessment(job, va || {}) }))
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return b.score - a.score;
    });

  return (
    <div className="va-jobs-page">
      <div className="va-jobs-head va-jobs-mobile-head">
        <div>
          <h1>Find jobs</h1>
          <p>Open roles matched to your profile, experience, and availability.</p>
        </div>
        <Link className="btn btn-sm va-jobs-update-profile" href="/workspace/va/profile">
          Update profile
        </Link>
      </div>

      <div className="va-jobs-list">
        {ranked.length ? (
          ranked.map(({ job, score, confidence, eligible }: any) => {
            const categories = uniqueStrings(job.categories).slice(0, 3);
            const applied = appMap.has(job.id);

            return (
              <article className="va-job-card va-job-mobile-card" key={job.id}>
                <div className="va-job-main">
                  <div className="va-job-status-row">
                    <span className="badge badge-success">Open</span>
                    {applied ? <span className="badge">Applied</span> : null}
                    {confidence >= 40 ? (
                      <span className={`va-job-fit ${eligible ? "" : "needs-review"}`}>
                        {fitText(score, eligible)}
                        {eligible ? <span>{score}%</span> : null}
                      </span>
                    ) : null}
                  </div>

                  <div className="va-job-title-block">
                    <h2>
                      <Link href={jobPublicHref(job)}>{job.title}</Link>
                    </h2>
                    <p>{job.company_name || "Confidential client"}</p>
                  </div>

                  {job.summary ? <p className="va-job-summary">{job.summary}</p> : null}

                  <div className="va-job-meta" aria-label="Job details">
                    <span>{job.hours_per_week ? `${job.hours_per_week} hrs/week` : "Flexible hours"}</span>
                    <span>{job.min_hourly_rate != null ? `From ${money(job.min_hourly_rate)}/hr` : "Rate shown in role"}</span>
                    <span>{job.timezone || "Flexible timezone"}</span>
                  </div>

                  {categories.length ? (
                    <div className="va-job-categories">
                      {categories.map((category, index) => (
                        <span key={`${String(category)}-${index}`}>{category}</span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="va-job-actions va-job-mobile-actions">
                  <Link className="btn btn-primary btn-sm" href={jobPublicHref(job)}>
                    {applied ? "View role" : "View and apply"}
                  </Link>
                  <form action={saveJobAction}>
                    <input type="hidden" name="job_id" value={job.id} />
                    <button className="btn btn-sm" type="submit">
                      {savedSet.has(job.id) ? "Saved" : "Save"}
                    </button>
                  </form>
                </div>
              </article>
            );
          })
        ) : (
          <div className="workspace-empty-card va-jobs-empty">
            <h2>No open jobs right now</h2>
            <p>New roles will appear here when they are published.</p>
          </div>
        )}
      </div>
    </div>
  );
}
