import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Search, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JobCard } from "@/components/job-card";
import { createClient } from "@/lib/supabase/server";
import { VA_CATEGORIES, MIN_HOURLY_RATE } from "@/lib/constants";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "Virtual Assistant Jobs Philippines",
  description: "Browse virtual assistant jobs in the Philippines. Remote roles with published pay, clear scope, and a reviewed client brief. Apply with one vetted profile.",
  keywords: ["virtual assistant jobs philippines", "remote va jobs", "work from home virtual assistant jobs", "filipino virtual assistant jobs"],
  alternates: { canonical: canonicalPath("/jobs") }
};

const PAGE_SIZE = 20;
function pageHref(params: Record<string,string|undefined>, page: number) {
  const out = new URLSearchParams();
  for (const [key,value] of Object.entries(params)) if (value && key !== "page") out.set(key,value);
  if (page > 1) out.set("page",String(page));
  const query = out.toString();
  return `/jobs${query ? `?${query}` : ""}`;
}

export default async function PublicJobsPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  const q = String(params.q || "").trim().replace(/[,%()]/g," ");
  const category = String(params.category || "").trim();
  const minRate = Number(params.min_rate || 0);
  const hours = String(params.hours || "");
  const sort = String(params.sort || "newest");
  const requestedPage = Math.max(1, Number(params.page || 1) || 1);
  let jobs: any[] = [];
  let total = 0;
  let companyMap = new Map<string, any>();

  try {
    const supabase = await createClient();
    let query: any = supabase.from("jobs").select("id,slug,title,company_name,client_id,summary,categories,required_skills,hours_per_week,min_hourly_rate,max_hourly_rate,timezone,engagement_length,published_at", { count: "exact" }).eq("status","published").not("client_id","is",null);
    if (q) query = query.or(`title.ilike.%${q}%,company_name.ilike.%${q}%,summary.ilike.%${q}%`);
    if (category) query = query.contains("categories",[category]);
    if (minRate) query = query.gte("min_hourly_rate",minRate);
    if (hours === "full") query = query.gte("hours_per_week",35);
    if (hours === "part") query = query.gt("hours_per_week",0).lt("hours_per_week",35);
    if (sort === "rate") query = query.order("min_hourly_rate",{ascending:false,nullsFirst:false});
    else if (sort === "hours") query = query.order("hours_per_week",{ascending:false,nullsFirst:false});
    else query = query.order("published_at",{ascending:false,nullsFirst:false});

    const from = (requestedPage - 1) * PAGE_SIZE;
    const result = await query.range(from,from+PAGE_SIZE-1);
    jobs = result.data || [];
    total = result.count || 0;
    const clientIds = [...new Set(jobs.map((j:any) => j.client_id).filter(Boolean))];
    if (clientIds.length) {
      const { data: companies } = await supabase.from("public_company_profiles").select("user_id,company_name,logo_url,industry,location,verified_at,hires_count").in("user_id", clientIds);
      companyMap = new Map((companies || []).map((c:any) => [c.user_id,c]));
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("[jobs] Supabase unavailable:", (err as Error).message);
  }

  const pages = Math.max(1,Math.ceil(total/PAGE_SIZE));
  const page = Math.min(requestedPage,pages);

  return <><SiteHeader/><main id="main-content" className="public-jobs-page">
    <section className="jobs-hero"><div className="container"><div className="jobs-hero-grid"><div><span className="jobs-eyeline"><ShieldCheck size={15}/> Reviewed client opportunities</span><h1>Virtual assistant jobs in the Philippines</h1><p>Remote virtual assistant jobs with published pay, clear scope, and a reviewed client brief behind every listing. Build one VA profile, complete vetting, and apply to any role with the same approved profile.</p></div><div className="jobs-hero-side"><BriefcaseBusiness size={25}/><strong>{total} open role{total===1?"":"s"}</strong><span>New roles appear after client review and commercial approval.</span></div></div></div></section>

    <section className="section jobs-directory"><div className="container">
      <form className="jobs-filterbar" method="get"><div className="jobs-search"><Search size={17}/><input name="q" defaultValue={params.q} placeholder="Search title, company, or description" aria-label="Search jobs"/></div><select name="category" defaultValue={category} aria-label="Specialty"><option value="">All specialties</option>{VA_CATEGORIES.map((x,index)=><option key={`${String(x)}-${index}`}>{x}</option>)}</select><select name="hours" defaultValue={hours} aria-label="Hours"><option value="">Any hours</option><option value="full">35+ hrs/week</option><option value="part">Under 35 hrs/week</option></select><select name="min_rate" defaultValue={params.min_rate || ""} aria-label="Minimum rate"><option value="">Any rate</option><option value={MIN_HOURLY_RATE}>${MIN_HOURLY_RATE}+/hr</option><option value="8">$8+/hr</option><option value="10">$10+/hr</option><option value="12">$12+/hr</option></select><select name="sort" defaultValue={sort} aria-label="Sort"><option value="newest">Newest</option><option value="rate">Highest rate</option><option value="hours">Most hours</option></select><button className="btn btn-primary" type="submit">Search</button><Link className="directory-reset" href="/jobs">Reset</Link></form>

      <div className="jobs-results-head"><div><strong>{total} open role{total===1?"":"s"}</strong><span>Rates shown are client-posted VA compensation.</span></div><Link href="/auth/join/va" className="text-link">Create a VA profile</Link></div>
      <div className="jobs-list">{jobs.length ? jobs.map((job)=><JobCard key={job.id} job={job} company={companyMap.get(job.client_id)}/>) : <div className="card empty"><h3>No jobs match those filters.</h3><p>Try a broader search or clear the rate and specialty filters.</p><Link className="btn" href="/jobs">Clear filters</Link></div>}</div>
      {pages > 1 ? <nav className="pagination" aria-label="Job result pages"><Link className={`btn btn-sm ${page<=1?"disabled":""}`} aria-disabled={page<=1} href={pageHref(params,Math.max(1,page-1))}>Previous</Link><span className="small muted">Page {page} of {pages}</span><Link className={`btn btn-sm ${page>=pages?"disabled":""}`} aria-disabled={page>=pages} href={pageHref(params,Math.min(pages,page+1))}>Next</Link></nav> : null}
    </div></section>
  </main><SiteFooter/></>;
}
