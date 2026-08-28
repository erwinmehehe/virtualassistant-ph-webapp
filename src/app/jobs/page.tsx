import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Search, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JobCard } from "@/components/job-card";
import { createClient } from "@/lib/supabase/server";
import { VA_CATEGORIES, MIN_HOURLY_RATE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Virtual Assistant Jobs for Filipino VAs",
  description: "Browse reviewed remote virtual assistant jobs for Filipino professionals. Filter by specialty, hours, rate, and working region.",
  keywords: ["virtual assistant jobs philippines", "remote va jobs", "work from home virtual assistant jobs", "filipino virtual assistant jobs"]
};

export default async function PublicJobsPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  let data: any[] | null = null;
  try {
    const supabase = await createClient();
    const result = await supabase.from("jobs").select("id,slug,title,company_name,summary,categories,required_skills,hours_per_week,min_hourly_rate,max_hourly_rate,timezone,engagement_length,published_at").eq("status","published").order("published_at",{ascending:false}).limit(100);
    data = result.data;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("[jobs] Supabase unavailable:", (err as Error).message);
  }
  const q = String(params.q || "").trim().toLowerCase();
  const category = String(params.category || "").trim();
  const minRate = Number(params.min_rate || 0);
  const hours = String(params.hours || "");
  const sort = String(params.sort || "newest");
  let jobs = (data || []).filter((job:any) => {
    const haystack = [job.title, job.company_name, job.summary, ...(job.categories || []), ...(job.required_skills || [])].join(" ").toLowerCase();
    const matchesHours = !hours || (hours === "full" ? Number(job.hours_per_week || 0) >= 35 : Number(job.hours_per_week || 0) > 0 && Number(job.hours_per_week || 0) < 35);
    return (!q || haystack.includes(q)) && (!category || (job.categories || []).includes(category)) && (!minRate || Number(job.min_hourly_rate || 0) >= minRate) && matchesHours;
  });
  if (sort === "rate") jobs = jobs.sort((a:any,b:any)=>Number(b.min_hourly_rate||0)-Number(a.min_hourly_rate||0));
  if (sort === "hours") jobs = jobs.sort((a:any,b:any)=>Number(b.hours_per_week||0)-Number(a.hours_per_week||0));

  return <><SiteHeader/><main id="main-content" className="public-jobs-page">
    <section className="jobs-hero"><div className="container"><div className="jobs-hero-grid"><div><span className="jobs-eyeline"><ShieldCheck size={15}/> Reviewed client opportunities</span><h1>Virtual assistant jobs for Filipino professionals.</h1><p>Find remote roles with clear scope, published compensation, and a reviewed client brief. Build one VA profile, complete vetting, and apply with the same approved profile.</p></div><div className="jobs-hero-side"><BriefcaseBusiness size={25}/><strong>{jobs.length} open role{jobs.length===1?"":"s"}</strong><span>New roles appear after client review and commercial approval.</span></div></div></div></section>

    <section className="section jobs-directory"><div className="container">
      <form className="jobs-filterbar" method="get"><div className="jobs-search"><Search size={17}/><input name="q" defaultValue={params.q} placeholder="Search title, skill, or company" aria-label="Search jobs"/></div><select name="category" defaultValue={category} aria-label="Specialty"><option value="">All specialties</option>{VA_CATEGORIES.map((x,index)=><option key={`${String(x)}-${index}`}>{x}</option>)}</select><select name="hours" defaultValue={hours} aria-label="Hours"><option value="">Any hours</option><option value="full">35+ hrs/week</option><option value="part">Under 35 hrs/week</option></select><select name="min_rate" defaultValue={params.min_rate || ""} aria-label="Minimum rate"><option value="">Any rate</option><option value={MIN_HOURLY_RATE}>${MIN_HOURLY_RATE}+/hr</option><option value="8">$8+/hr</option><option value="10">$10+/hr</option><option value="12">$12+/hr</option></select><select name="sort" defaultValue={sort} aria-label="Sort"><option value="newest">Newest</option><option value="rate">Highest rate</option><option value="hours">Most hours</option></select><button className="btn btn-primary" type="submit">Search</button><Link className="directory-reset" href="/jobs">Reset</Link></form>

      <div className="jobs-results-head"><div><strong>{jobs.length} open role{jobs.length===1?"":"s"}</strong><span>Rates shown are client-posted VA compensation.</span></div><Link href="/auth/join/va" className="text-link">Create a VA profile</Link></div>
      <div className="jobs-list">{jobs.length ? jobs.map((job)=><JobCard key={job.id} job={job}/>) : <div className="card empty"><h3>No jobs match those filters.</h3><p>Try a broader search or clear the rate and specialty filters.</p><Link className="btn" href="/jobs">Clear filters</Link></div>}</div>
    </div></section>
  </main><SiteFooter/></>;
}
