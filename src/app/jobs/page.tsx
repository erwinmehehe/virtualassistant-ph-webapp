import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Globe2,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JobCard } from "@/components/job-card";
import { createClient } from "@/lib/supabase/server";
import { VA_CATEGORIES } from "@/lib/constants";
import { getBusinessSettings } from "@/lib/business-settings";
import { canonicalPath, canonicalUrl } from "@/lib/seo-url";
import { jobPublicHref } from "@/lib/public-routing";
import { socialMetadata } from "@/lib/og";
import "./jobs-marketplace.css";

export const metadata: Metadata = {
  title: "Virtual Assistant Jobs Philippines | Free VA Job Website",
  description:
    "Browse virtual assistant jobs in the Philippines for free. Find remote VA work with published pay and clear role details, or post a VA job for Filipino talent.",
  keywords: [
    "free virtual assistant job websites philippines",
    "virtual assistant jobs philippines",
    "virtual assistant job philippines",
    "virtual assistant jobs in philippines",
    "philippines virtual assistant jobs",
    "remote virtual assistant jobs philippines",
    "work from home virtual assistant jobs philippines",
    "filipino virtual assistant jobs",
  ],
  alternates: { canonical: canonicalPath("/jobs") },
  ...socialMetadata({
    title: "Virtual Assistant Jobs Philippines | Free VA Job Website",
    description:
      "Browse virtual assistant jobs in the Philippines for free, compare published pay and role details, or post a VA job for Filipino talent.",
    path: canonicalPath("/jobs"),
    category: "jobs",
    eyebrow: "Virtual Assistant Jobs Philippines",
    points: ["Free for VA applicants","Published pay","Remote Philippines","Post a VA job"],
  }),
};

const PAGE_SIZE = 20;
const EMPLOYER_POST_HREF = "/post-a-job";
const EMPLOYER_LOGIN_HREF = "/auth/login?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew";

const jobFaqs = [
  [
    "Where can I find free virtual assistant job websites in the Philippines?",
    "VirtualAssistant.com.ph lets Filipino Virtual Assistants browse jobs, create a profile, apply, complete vetting, accept a placement, and receive their agreed compensation without a VA-side platform fee.",
  ],
  [
    "How do I apply for virtual assistant jobs in the Philippines?",
    "Create one free VirtualAssistant.com.ph profile, complete the required vetting steps, and then express interest in published roles that match your skills, schedule, and experience.",
  ],
  [
    "Are these virtual assistant jobs remote?",
    "Yes. Published opportunities on this directory are remote Virtual Assistant roles intended for applicants based in the Philippines. Each listing shows the client schedule or working-region context when available.",
  ],
  [
    "Do job listings show the pay rate?",
    "Published listings show the client-posted Virtual Assistant compensation range or minimum hourly rate so applicants can evaluate the opportunity before expressing interest.",
  ],
  [
    "How do I post a Virtual Assistant job in the Philippines?",
    "Start on the public Post a Job page with no account required. Add the role, hours, compensation, timezone, and skills, preview the posting, then create or sign in to a client account to submit it.",
  ],
  [
    "Is posting a job free for employers?",
    "VA applicants are not charged platform fees. Employer recruiting, candidate-access, placement, or managed-service fees are separate and depend on the hiring model selected.",
  ],
] as const;

function pageHref(params: Record<string, string | undefined>, page: number) {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value && key !== "page") out.set(key, value);
  if (page > 1) out.set("page", String(page));
  const query = out.toString();
  return `/jobs${query ? `?${query}` : ""}`;
}

export default async function PublicJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [params, settings] = await Promise.all([searchParams, getBusinessSettings()]);
  const q = String(params.q || "").trim().replace(/[,%()]/g, " ");
  const category = String(params.category || "").trim();
  const minRate = Number(params.min_rate || 0);
  const hours = String(params.hours || "");
  const sort = String(params.sort || "newest");
  const requestedPage = Math.max(1, Number(params.page || 1) || 1);
  let jobs: any[] = [];
  let total = 0;

  try {
    const supabase = await createClient();
    let query: any = supabase
      .from("public_jobs")
      .select(
        "id,slug,title,company_name,summary,categories,required_skills,hours_per_week,min_hourly_rate,max_hourly_rate,timezone,engagement_length,published_at,company_logo_url,company_industry,company_location,company_verified_at,company_hires_count",
        { count: "exact" },
      );

    if (q) query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);
    if (category) query = query.contains("categories", [category]);
    if (minRate) query = query.gte("min_hourly_rate", minRate);
    if (hours === "full") query = query.gte("hours_per_week", 35);
    if (hours === "part") query = query.gt("hours_per_week", 0).lt("hours_per_week", 35);
    if (sort === "rate") query = query.order("min_hourly_rate", { ascending: false, nullsFirst: false });
    else if (sort === "hours") query = query.order("hours_per_week", { ascending: false, nullsFirst: false });
    else query = query.order("published_at", { ascending: false, nullsFirst: false });

    const from = (requestedPage - 1) * PAGE_SIZE;
    const result = await query.range(from, from + PAGE_SIZE - 1);
    jobs = result.data || [];
    total = result.count || 0;

  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[jobs] Supabase unavailable:", (err as Error).message);
    }
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  const floor = settings.minHourlyRate;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: jobFaqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Virtual Assistant Jobs Philippines",
    url: canonicalUrl("/jobs"),
    description:
      "Browse remote virtual assistant jobs in the Philippines with published pay, clear role details, and recruiter-reviewed opportunities.",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: jobs.length,
      itemListElement: jobs.map((job, index) => ({
        "@type": "ListItem",
        position: (page - 1) * PAGE_SIZE + index + 1,
        url: canonicalUrl(jobPublicHref(job)),
        name: job.title,
      })),
    },
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="public-jobs-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema).replace(/</g, "\\u003c") }}
        />

        <section className="jobs-market-hero">
          <div className="jobs-market-glow" aria-hidden="true" />
          <div className="container">
            {params.closed === "1" ? (
              <div className="success-banner jobs-closed-notice" role="status">
                <strong>That role has closed.</strong>
                <span>Browse the current recruiter-reviewed Virtual Assistant opportunities below.</span>
              </div>
            ) : null}
          </div>
          <div className="container jobs-market-hero-grid">
            <div className="jobs-market-copy">
              <span className="jobs-market-eyebrow">
                <ShieldCheck size={15} /> Free for Filipino VA applicants
              </span>
              <h1>Virtual Assistant Jobs Philippines</h1>
              <p>
                Browse remote Virtual Assistant jobs in the Philippines for free. Compare published pay, weekly
                hours, and timezone expectations, then apply with one profile.
              </p>
              <div className="jobs-market-actions">
                <Link className="btn btn-primary btn-lg" href="#open-jobs">
                  Browse open VA jobs <ArrowRight size={16} />
                </Link>
                <Link className="btn btn-lg" href="/auth/join/va">
                  Create free VA profile
                </Link>
              </div>
              <div className="jobs-market-proof" aria-label="Job marketplace benefits">
                <span><CheckCircle2 size={15} /> No VA-side platform fee</span>
                <span><CheckCircle2 size={15} /> Published compensation</span>
                <span><Globe2 size={15} /> Remote Philippines roles</span>
              </div>
            </div>

            <aside className="jobs-employer-card">
              <span className="jobs-employer-kicker">For employers</span>
              <div className="jobs-market-summary-icon"><BriefcaseBusiness size={24} /></div>
              <h2>Hiring a Filipino Virtual Assistant?</h2>
              <p>
                Describe the work, hours, schedule, and budget first. Preview the job before creating an account,
                then continue into the hiring process when the role looks right.
              </p>
              <ul>
                <li><CheckCircle2 size={15} /> Reach role-matched Filipino talent</li>
                <li><CheckCircle2 size={15} /> Set compensation and schedule up front</li>
                <li><CheckCircle2 size={15} /> Preview the job before signup</li>
              </ul>
              <Link className="btn btn-primary btn-lg jobs-employer-button" href={EMPLOYER_POST_HREF}>
                Post a VA job <ArrowRight size={16} />
              </Link>
              <Link className="jobs-employer-note" href={EMPLOYER_LOGIN_HREF}>Already have a client account? Sign in.</Link>
            </aside>
          </div>
        </section>

        <section className="section jobs-directory" id="open-jobs">
          <div className="container">
            <div className="jobs-directory-intro">
              <div>
                <span className="kicker">Remote opportunities</span>
                <h2>Latest virtual assistant jobs in the Philippines</h2>
                <p>Search current Philippines virtual assistant jobs by specialty, hours, pay, and recency.</p>
              </div>
              <Link className="btn jobs-directory-post" href={EMPLOYER_POST_HREF}>
                <BriefcaseBusiness size={16} /> Post a job
              </Link>
            </div>
            <form className="jobs-filterbar" method="get">
              <div className="jobs-search">
                <Search size={17} />
                <input
                  name="q"
                  defaultValue={params.q}
                  placeholder="Search job title or description"
                  aria-label="Search jobs"
                />
              </div>
              <select name="category" defaultValue={category} aria-label="Specialty">
                <option value="">All specialties</option>
                {VA_CATEGORIES.map((item, index) => <option key={`${String(item)}-${index}`}>{item}</option>)}
              </select>
              <select name="hours" defaultValue={hours} aria-label="Hours">
                <option value="">Any hours</option>
                <option value="full">35+ hrs/week</option>
                <option value="part">Under 35 hrs/week</option>
              </select>
              <select name="min_rate" defaultValue={params.min_rate || ""} aria-label="Minimum rate">
                <option value="">Any rate</option>
                <option value={floor}>${floor}+/hr</option>
                {floor < 8 ? <option value="8">$8+/hr</option> : null}
                {floor < 10 ? <option value="10">$10+/hr</option> : null}
                <option value="12">$12+/hr</option>
              </select>
              <select name="sort" defaultValue={sort} aria-label="Sort">
                <option value="newest">Newest</option>
                <option value="rate">Highest rate</option>
                <option value="hours">Most hours</option>
              </select>
              <button className="btn btn-primary" type="submit">Search</button>
              <Link className="directory-reset" href="/jobs">Reset</Link>
            </form>

            <div className="jobs-results-head">
              <div>
                <strong>{total} open role{total === 1 ? "" : "s"}</strong>
                <span>Rates shown are client-posted Virtual Assistant compensation.</span>
              </div>
              <Link href="/auth/join/va" className="text-link">Create a Virtual Assistant profile</Link>
            </div>

            <div className="jobs-list">
              {jobs.length ? jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  company={{
                    company_name: job.company_name,
                    logo_url: job.company_logo_url,
                    industry: job.company_industry,
                    location: job.company_location,
                    verified_at: job.company_verified_at,
                    hires_count: job.company_hires_count,
                  }}
                />
              )) : (
                <div className="jobs-empty-market">
                  <div className="jobs-empty-icon"><BriefcaseBusiness size={25} /></div>
                  <div>
                    <span className="small">No public roles match right now</span>
                    <h2>{q || category || minRate || hours ? "Try broader job filters." : "More reviewed VA jobs are being prepared."}</h2>
                    <p>
                      Public roles only appear after the required publishing checks. Create your VA profile now so
                      you are ready when matching opportunities go live.
                    </p>
                  </div>
                  <div className="jobs-empty-actions">
                    <Link className="btn btn-primary" href="/auth/join/va">Create VA profile</Link>
                    {(q || category || minRate || hours) ? <Link className="btn" href="/jobs">Clear filters</Link> : null}
                  </div>
                </div>
              )}
            </div>

            {pages > 1 ? (
              <nav className="pagination" aria-label="Job result pages">
                <Link className={`btn btn-sm ${page <= 1 ? "disabled" : ""}`} aria-disabled={page <= 1} href={pageHref(params, Math.max(1, page - 1))}>Previous</Link>
                <span className="small muted">Page {page} of {pages}</span>
                <Link className={`btn btn-sm ${page >= pages ? "disabled" : ""}`} aria-disabled={page >= pages} href={pageHref(params, Math.min(pages, page + 1))}>Next</Link>
              </nav>
            ) : null}
          </div>
        </section>

        <section className="jobs-seo-section">
          <div className="container">
            <div className="jobs-seo-intro">
              <span className="kicker">Free VA job website for applicants</span>
              <h2>A free virtual assistant job website for the Philippines</h2>
              <p>
                Filipino Virtual Assistants can create a profile, browse and apply for jobs, complete vetting, accept
                a placement, and receive their agreed compensation without a VA-side platform fee. Public listings
                show role scope, hours, timezone context, and advertised compensation so applicants can judge fit
                before entering the recruiting process.
              </p>
              <p className="jobs-seo-support-link">
                Comparing job sites first? <Link href="/blog/free-virtual-assistant-job-websites-philippines">See our 2026 guide to free Virtual Assistant job websites in the Philippines <ArrowRight size={14} /></Link>
              </p>
            </div>

            <div className="jobs-seo-grid">
              <article>
                <CheckCircle2 size={20} />
                <h3>Free for Filipino applicants</h3>
                <p>
                  VAs are not charged to create a profile, apply for jobs, complete vetting, accept a placement, or
                  receive their agreed compensation.
                </p>
              </article>
              <article>
                <ShieldCheck size={20} />
                <h3>Reviewed opportunities</h3>
                <p>
                  Public roles must reach the publication stage before they appear here, and recruiter review remains
                  part of the hiring flow when the role or client account requires it.
                </p>
              </article>
              <article>
                <Globe2 size={20} />
                <h3>Remote schedules and timezones</h3>
                <p>
                  Some clients need US, UK, or Australian business-hour overlap while others offer flexible schedules.
                  Check each job for weekly hours and timezone expectations before expressing interest.
                </p>
              </article>
            </div>

            <div className="jobs-how-it-works">
              <div>
                <span className="kicker">How it works</span>
                <h2>One vetted profile, multiple Virtual Assistant opportunities</h2>
                <p>
                  Instead of sending the same information from scratch for every opening, build a complete profile
                  once and keep your skills, experience, availability, and recruiter review in one place.
                </p>
              </div>
              <ol>
                <li><span>1</span><div><strong>Create your VA profile</strong><p>Add your experience, skills, tools, schedule, and work preferences.</p></div></li>
                <li><span>2</span><div><strong>Complete vetting</strong><p>Finish the required profile, screening, video, and recruiter-review steps.</p></div></li>
                <li><span>3</span><div><strong>Express interest</strong><p>Choose published jobs that fit your skills, rate, and availability.</p></div></li>
                <li><span>4</span><div><strong>Recruiter review</strong><p>The recruiting team reviews fit before presenting candidates to the client.</p></div></li>
              </ol>
            </div>

            <div className="jobs-faq">
              <div className="jobs-faq-head">
                <span className="kicker">VA jobs FAQ</span>
                <h2>Questions about virtual assistant jobs</h2>
              </div>
              <div className="jobs-faq-grid">
                {jobFaqs.map(([question, answer]) => (
                  <details key={question}>
                    <summary>{question}</summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="jobs-bottom-cta">
              <div>
                <span>For employers</span>
                <h2>Post a Virtual Assistant job in the Philippines</h2>
                <p>Post the role with clear pay, hours, timezone, and responsibilities so Filipino VAs can evaluate it quickly.</p>
              </div>
              <div className="jobs-bottom-actions">
                <Link className="btn btn-primary btn-lg" href={EMPLOYER_POST_HREF}>Post a VA job</Link>
                <Link className="btn btn-lg" href="/auth/join/va">I’m looking for VA work</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
