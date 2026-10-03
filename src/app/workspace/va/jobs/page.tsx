import Link from "next/link";
import { Filter, Search, X } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { matchAssessment, matchLabel } from "@/lib/matching";
import { money } from "@/lib/format";
import { saveJobAction } from "@/app/actions/applications";
import { jobPublicHref } from "@/lib/public-routing";
import { uniqueStrings } from "@/lib/collections";
import { VA_CATEGORIES } from "@/lib/constants";

function fitText(score: number, eligible: boolean) {
  if (!eligible) return "Check requirements";
  return matchLabel(score);
}

export default async function VaJobsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const query=await searchParams;
  const { userId } = await requireRoleFast("va");
  const supabase = await createClient();

  const [{ data: va }, { data: jobs }, { data: saved }, { data: apps }, { data: vetting }] = await Promise.all([
    supabase.from("va_profiles").select("*").eq("user_id", userId).single(),
    supabase.from("public_jobs").select("*").order("published_at", { ascending: false }).limit(120),
    supabase.from("saved_jobs").select("job_id").eq("va_id", userId),
    supabase.from("applications").select("job_id,status").eq("va_id", userId),
    supabase.from("va_vetting").select("stage").eq("va_id", userId).maybeSingle(),
  ]);

  const canApply = Boolean(vetting && ["approved", "bench"].includes(vetting.stage));
  const savedSet = new Set((saved || []).map((item: any) => item.job_id));
  const appMap = new Map((apps || []).map((item: any) => [item.job_id, item.status]));
  const q=String(query.q||"").trim().toLowerCase();
  const category=String(query.category||"").trim();
  const hours=String(query.hours||"").trim();
  const maxRate=Number(query.rate||0);
  const savedOnly=query.saved==="1";

  const ranked = (jobs || [])
    .map((job: any) => ({ job, ...matchAssessment(job, va || {}) }))
    .filter(({job}:any)=>{
      const haystack=[job.title,job.company_name,job.summary,...uniqueStrings(job.categories),...(job.required_skills||[])].filter(Boolean).join(" ").toLowerCase();
      if(q&&!haystack.includes(q))return false;
      if(category&&!uniqueStrings(job.categories).includes(category))return false;
      if(savedOnly&&!savedSet.has(job.id))return false;
      if(maxRate&&Number(job.min_hourly_rate||0)>maxRate)return false;
      if(hours==="part-time"&&Number(job.hours_per_week||40)>25)return false;
      if(hours==="full-time"&&Number(job.hours_per_week||0)<30)return false;
      return true;
    })
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return b.score - a.score;
    });

  const filtersActive=Boolean(q||category||hours||maxRate||savedOnly);

  return <div className="va-jobs-page">
    <div className="va-jobs-head va-jobs-mobile-head">
      <div><div className="kicker">Open opportunities</div><h1>Find jobs</h1><p>{canApply ? "Browse roles that fit your skills, schedule and rate." : "Browse open roles now. Complete vetting to unlock applications."}</p></div>
      <Link className="btn btn-sm va-jobs-update-profile" href="/workspace/va/profile">Update profile</Link>
    </div>

    <form className="va-job-filters" method="get">
      <div className="va-job-search"><Search size={16}/><input name="q" defaultValue={query.q||""} placeholder="Search role, skill or company" aria-label="Search jobs"/></div>
      <label><span className="sr-only">Specialty</span><select name="category" defaultValue={category}><option value="">All specialties</option>{VA_CATEGORIES.map((item)=><option value={String(item)} key={String(item)}>{item}</option>)}</select></label>
      <label><span className="sr-only">Hours</span><select name="hours" defaultValue={hours}><option value="">Any hours</option><option value="part-time">Part-time</option><option value="full-time">Full-time</option></select></label>
      <label><span className="sr-only">Maximum starting rate</span><select name="rate" defaultValue={query.rate||""}><option value="">Any rate</option><option value="8">Up to $8/hr</option><option value="10">Up to $10/hr</option><option value="12">Up to $12/hr</option><option value="15">Up to $15/hr</option><option value="20">Up to $20/hr</option></select></label>
      <label className="va-job-saved-filter"><input type="checkbox" name="saved" value="1" defaultChecked={savedOnly}/><span>Saved only</span></label>
      <button className="btn btn-primary btn-sm" type="submit"><Filter size={14}/> Apply</button>
      {filtersActive?<Link className="btn btn-sm va-job-clear" href="/workspace/va/jobs"><X size={14}/> Clear</Link>:null}
    </form>

    <div className="va-job-results-head"><span>{ranked.length} role{ranked.length===1?"":"s"}</span><small>{filtersActive?"Filtered results":"Sorted by fit to your current profile"}</small></div>

    <div className="va-jobs-list">
      {ranked.length ? ranked.map(({ job, score, confidence, eligible }: any) => {
        const categories = uniqueStrings(job.categories).slice(0, 3);
        const applied = appMap.has(job.id);
        return <article className="va-job-card va-job-mobile-card" key={job.id}>
          <div className="va-job-main">
            <div className="va-job-status-row">
              <span className="badge badge-success">Open</span>
              {applied ? <span className="badge">Applied</span> : null}
              {confidence >= 40 ? <span className={`va-job-fit ${eligible ? "" : "needs-review"}`}>{fitText(score, eligible)}{eligible ? <span>{score}%</span> : null}</span> : null}
            </div>
            <div className="va-job-title-block"><h2><Link href={jobPublicHref(job)}>{job.title}</Link></h2><p>{job.company_name || "Confidential client"}</p></div>
            {job.summary ? <p className="va-job-summary">{job.summary}</p> : null}
            <div className="va-job-meta" aria-label="Job details"><span>{job.hours_per_week ? `${job.hours_per_week} hrs/week` : "Flexible hours"}</span><span>{job.min_hourly_rate != null ? `From ${money(job.min_hourly_rate)}/hr` : "Rate shown in role"}</span><span>{job.timezone || "Flexible timezone"}</span></div>
            {categories.length ? <div className="va-job-categories">{categories.map((item,index)=><span key={`${String(item)}-${index}`}>{item}</span>)}</div> : null}
          </div>
          <div className="va-job-actions va-job-mobile-actions">
            <Link className="btn btn-primary btn-sm" href={jobPublicHref(job)}>{applied ? "View application" : canApply ? "View and apply" : "View role"}</Link>
            <form action={saveJobAction}><input type="hidden" name="job_id" value={job.id}/><button className="btn btn-sm" type="submit">{savedSet.has(job.id) ? "Saved" : "Save"}</button></form>
          </div>
        </article>;
      }) : <div className="workspace-empty-card va-jobs-empty"><h2>No roles match these filters</h2><p>Try a broader specialty, hours or rate range.</p>{filtersActive?<Link className="btn btn-primary" href="/workspace/va/jobs">Clear filters</Link>:null}</div>}
    </div>
  </div>;
}
