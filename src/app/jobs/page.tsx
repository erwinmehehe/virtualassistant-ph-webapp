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
import { canonicalPath } from "@/lib/seo-url";
import "./jobs-marketplace.css";

export const metadata: Metadata = {
  title: "Virtual Assistant Jobs Philippines",
  description:
    "Browse remote virtual assistant jobs in the Philippines with published pay, clear role scope, and recruiter-reviewed client opportunities.",
  keywords: [
    "virtual assistant jobs philippines",
    "remote virtual assistant jobs",
    "work from home virtual assistant jobs",
    "filipino virtual assistant jobs",
    "online virtual assistant jobs philippines",
  ],
  alternates: { canonical: canonicalPath("/jobs") },
};

const PAGE_SIZE = 20;
const EMPLOYER_POST_HREF = "/auth/login?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew";

const jobFaqs = [
  [
    "How do I apply for virtual assistant jobs in the Philippines?",
    "Create one VirtualAssistant.com.ph profile, complete the required vetting steps, and then express interest in published roles that match your skills, schedule, and experience.",
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
    "Can businesses post a Virtual Assistant job?",
    "Yes. Client accounts can create hiring requests. Selected approved client accounts can publish complete curated-placement roles directly, while other roles go through recruiter review before becoming public.",
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

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="public-jobs-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
        />

        <section className="jobs-market-hero">
          <div className="jobs-market-glow" aria-hidden="true" />
          <div className="container jobs-market-hero-grid">
            <div className="jobs-market-copy">
              <span className="jobs-market-eyebrow">
                <ShieldCheck size={15} /> Recruiter-reviewed opportunities
              </span>
              <h1>Virtual assistant jobs in the Philippines</h1>
              <p>
                Find remote Virtual Assistant jobs with visible pay, clear role expectations, and a real hiring
                process behind every public listing.
              </p>
              <div className="jobs-market-actions">
                <Link className="btn btn-primary btn-lg" href="/auth/join/va">
                  Create your VA profile <ArrowRight size={16} />
                </Link>
                <Link className="btn btn-lg" href={EMPLOYER_POST_HREF}>
                  Post a VA job
                </Link>
              </div>
              <div className="jobs-market-proof" aria-label="Job marketplace benefits">
                <span><CheckCircle2 size={15} /> Published compensation</span>
                <span><ShieldCheck size={15} /> Vetted applicant flow</span>
                <span><Globe2 size={15} /> Remote Philippines roles</span>
              </div>
            </div>

            <aside className="jobs-market-summary-card">
              <div className="jobs-market-summary-icon"><BriefcaseBusiness size={24} /></div>
              <strong>{total} open role{total === 1 ? "" : "s"}</strong>
              <p>New opportunities appear after the client or recruiting team completes the publication checks.</p>
              <div className="jobs-market-summary-row">
                <span>For VAs</span>
                <b>One vetted profile</b>
              </div>
              <div className="jobs-market-summary-row">
                <span>For clients</span>
                <b>Clear role + pay</b>
              </div>
            </aside>
          </div>
        </section>

        <section className="jobs-market-paths">
          <div className="container jobs-market-path-grid">
            <div>
              <UsersRound size={20} />
              <span>Looking for work?</span>
              <strong>Build one profile and use it across matching opportunities.</strong>
              <Link href="/auth/join/va">Start your VA profile <ArrowRight size={14} /></Link>
            </div>
            <div>
              <BriefcaseBusiness size={20} />
              <span>Hiring a Virtual Assistant?</span>
              <strong>Post a complete role or send a hiring brief for recruiter review.</strong>
              <Link href={EMPLOYER_POST_HREF}>Post a job <ArrowRight size={14} /></Link>
            </div>
          </div>
        </section>

        <section className="section jobs-directory">
          <div className="container">
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
                  company={job.company_name ? {
                    company_name: job.company_name,
                    logo_url: job.company_logo_url,
                    industry: job.company_industry,
                    location: job.company_location,
                    verified_at: job.company_verified_at,
                    hires_count: job.company_hires_count,
                  } : null}
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
              <span className="kicker">Virtual Assistant careers</span>
              <h2>Finding remote virtual assistant jobs in the Philippines</h2>
              <p>
                VirtualAssistant.com.ph is built for Filipino professionals who want remote work with clearer role
                expectations. Public job listings show the work the client needs, expected weekly hours, working
                region or timezone, and the advertised VA compensation so you can decide whether a role fits before
                entering the recruiting process.
              </p>
            </div>

            <div className="jobs-seo-grid">
              <article>
                <ShieldCheck size={20} />
                <h3>Reviewed opportunities</h3>
                <p>
                  Public roles are not raw anonymous posts. A role must reach the publication stage before it appears
                  here, and the candidate process stays recruiter-managed.
                </p>
              </article>
              <article>
                <BriefcaseBusiness size={20} />
                <h3>Different VA specialties</h3>
                <p>
                  Opportunities can include administrative support, executive assistance, customer service,
                  ecommerce, bookkeeping, sales support, marketing, social media, real estate, and other remote work.
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
                <span>For Filipino Virtual Assistants</span>
                <h2>Ready for your next remote VA role?</h2>
                <p>Create your profile now so your experience is ready when the right job is published.</p>
              </div>
              <div className="jobs-bottom-actions">
                <Link className="btn btn-primary btn-lg" href="/auth/join/va">Create VA profile</Link>
                <Link className="btn btn-lg" href={EMPLOYER_POST_HREF}>I’m hiring a VA</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
