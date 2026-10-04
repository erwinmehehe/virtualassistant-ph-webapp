import Link from "next/link";
import { ArrowRight, Bookmark, BriefcaseBusiness, CheckCircle2, Clock3, Globe2, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { matchAssessment, matchLabel } from "@/lib/matching";
import { dateShort, money } from "@/lib/format";
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

  const [{ data: va }, { data: jobs }, { data: saved }, { data: apps }, { data: vetting }] = await Promise.all([
    supabase.from("va_profiles").select("*").eq("user_id", userId).single(),
    supabase.from("public_jobs").select("*").order("published_at", { ascending: false }).limit(80),
    supabase.from("saved_jobs").select("job_id").eq("va_id", userId),
    supabase.from("applications").select("job_id,status").eq("va_id", userId),
    supabase.from("va_vetting").select("stage").eq("va_id", userId).maybeSingle(),
  ]);

  const canApply = Boolean(vetting && ["approved", "bench"].includes(vetting.stage));

  const savedSet = new Set((saved || []).map((item: any) => item.job_id));
  const appMap = new Map((apps || []).map((item: any) => [item.job_id, item.status]));

  const ranked = (jobs || [])
    .map((job: any) => ({ job, ...matchAssessment(job, va || {}) }))
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return b.score - a.score;
    });

  const applicationCount = appMap.size;
  const savedCount = savedSet.size;
  const openCount = ranked.length;

  return (
    <div className="va-jobs-page">
      <section className={`va-jobs-hero ${canApply ? "is-ready" : "needs-vetting"}`}>
        <div className="va-jobs-hero-copy">
          <span className="va-jobs-eyebrow"><Sparkles size={14}/> Opportunities</span>
          <h1>Jobs matched to your profile</h1>
          <p>
            {canApply
              ? "You’re vetted and ready to apply. Roles are ordered by profile fit so the strongest opportunities appear first."
              : "Browse published roles now. Complete vetting to unlock applications when you find a role that fits."}
          </p>
          <div className="va-jobs-readiness">
            {canApply ? <><CheckCircle2 size={16}/><strong>Vetted and ready to apply</strong><span>Approved VA access is active.</span></> : <><ShieldCheck size={16}/><strong>Applications locked until vetting is complete</strong><span>You can still review and save roles.</span></>}
          </div>
        </div>
        <div className="va-jobs-hero-actions">
          {canApply ? <Link className="btn btn-primary" href="/workspace/va/applications">My applications <ArrowRight size={15}/></Link> : <Link className="btn btn-primary" href="/workspace/va/vetting">Complete vetting <ArrowRight size={15}/></Link>}
          <Link className="btn" href="/workspace/va/profile">Update profile</Link>
        </div>
      </section>

      <section className="va-jobs-summary" aria-label="Job search summary">
        <div><BriefcaseBusiness size={17}/><span><strong>{openCount}</strong> open role{openCount === 1 ? "" : "s"}</span></div>
        <Link href="/workspace/va/applications"><CheckCircle2 size={17}/><span><strong>{applicationCount}</strong> application{applicationCount === 1 ? "" : "s"}</span></Link>
        <Link href="/workspace/va/saved"><Bookmark size={17}/><span><strong>{savedCount}</strong> saved</span></Link>
      </section>

      <div className="va-jobs-section-head">
        <div>
          <span className="va-jobs-section-kicker">Recommended opportunities</span>
          <h2>{openCount ? "Best matches first" : "Open roles"}</h2>
          <p>{canApply ? "Review the details, then apply from the job page." : "Save interesting roles while you finish vetting."}</p>
        </div>
      </div>

      <div className="va-jobs-list">
        {ranked.length ? (
          ranked.map(({ job, score, confidence, eligible }: any, index: number) => {
            const categories = uniqueStrings(job.categories).slice(0, 3);
            const applied = appMap.has(job.id);
            const saved = savedSet.has(job.id);
            const featured = index < 3 && eligible && confidence >= 40;

            return (
              <article className={`va-job-card va-job-mobile-card ${applied ? "is-applied" : ""} ${featured ? "is-featured" : ""}`} key={job.id}>
                <div className="va-job-main">
                  <div className="va-job-status-row">
                    {featured ? <span className="va-job-recommended"><Sparkles size={12}/> Recommended</span> : <span className="badge badge-success">Open</span>}
                    {applied ? <span className="va-job-applied"><CheckCircle2 size={12}/> Applied</span> : null}
                    {confidence >= 40 ? (
                      <span className={`va-job-fit ${eligible ? "" : "needs-review"}`}>
                        {fitText(score, eligible)}
                        {eligible ? <span>{score}% match</span> : null}
                      </span>
                    ) : null}
                  </div>

                  <div className="va-job-title-block">
                    <h3><Link href={jobPublicHref(job)}>{job.title}</Link></h3>
                    <p>{job.company_name || "Confidential client"}{job.published_at ? <span> · Posted {dateShort(job.published_at)}</span> : null}</p>
                  </div>

                  {job.summary ? <p className="va-job-summary">{job.summary}</p> : null}

                  <div className="va-job-facts" aria-label="Job details">
                    <div><WalletCards size={16}/><span>Pay<strong>{job.min_hourly_rate != null ? `From ${money(job.min_hourly_rate)}/hr` : "Shown in role"}</strong></span></div>
                    <div><Clock3 size={16}/><span>Hours<strong>{job.hours_per_week ? `${job.hours_per_week} hrs/week` : "Flexible"}</strong></span></div>
                    <div><Globe2 size={16}/><span>Working region<strong>{job.timezone || "Flexible"}</strong></span></div>
                  </div>

                  {categories.length ? (
                    <div className="va-job-categories">
                      {categories.map((category, categoryIndex) => <span key={`${String(category)}-${categoryIndex}`}>{category}</span>)}
                    </div>
                  ) : null}
                </div>

                <div className="va-job-actions va-job-mobile-actions">
                  <Link className="btn btn-primary va-job-primary-action" href={jobPublicHref(job)}>
                    {applied ? "View application" : canApply ? "View and apply" : "View role"} <ArrowRight size={14}/>
                  </Link>
                  <form action={saveJobAction}>
                    <input type="hidden" name="job_id" value={job.id} />
                    <button className={`btn va-job-save ${saved ? "is-saved" : ""}`} type="submit">
                      <Bookmark size={14} fill={saved ? "currentColor" : "none"}/> {saved ? "Saved" : "Save"}
                    </button>
                  </form>
                </div>
              </article>
            );
          })
        ) : (
          <div className="workspace-empty-card va-jobs-empty">
            <BriefcaseBusiness size={24}/>
            <h2>No open jobs right now</h2>
            <p>New roles will appear here when they are published. Keep your profile current so matching is ready when they do.</p>
            <Link className="btn" href="/workspace/va/profile">Update profile</Link>
          </div>
        )}
      </div>
    </div>
  );
}
