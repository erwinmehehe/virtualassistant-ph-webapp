import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Globe2,
  Search,
  ShieldCheck
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JobCard } from "@/components/job-card";
import { createClient } from "@/lib/supabase/server";
import { MIN_HOURLY_RATE, VA_CATEGORIES } from "@/lib/constants";
import { getBusinessSettings } from "@/lib/business-settings";
import { canonicalPath, canonicalUrl } from "@/lib/seo-url";
import { jobPublicHref } from "@/lib/public-routing";
import { socialMetadata } from "@/lib/og";
import { AnswerFirst } from "@/components/answer-first";
import { faqSchema } from "@/lib/faq-schema";
import "./jobs-marketplace.css";

export const metadata: Metadata = {
  title: { absolute: "Virtual Assistant Jobs Philippines" },
  description:
    "Find published remote Virtual Assistant jobs in the Philippines. Employers can submit a hiring request with clear role requirements, pay, and hours.",
  alternates: { canonical: canonicalPath("/jobs") },
  ...socialMetadata({
    title: "Virtual Assistant Jobs Philippines",
    description:
      "Browse published Virtual Assistant opportunities, or post a role for recruiter review with clear pay, hours, and requirements.",
    path: canonicalPath("/jobs"),
    category: "jobs",
    eyebrow: "Remote VA jobs and hiring requests",
    points: ["Browse remote jobs","Post a VA request","Clear pay & hours","Recruiter-supported hiring"],
  }),
};

const PAGE_SIZE = 20;
const EMPLOYER_POST_HREF = "/post-a-job";
const EMPLOYER_LOGIN_HREF = "/auth/login?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew";
const VA_JOIN_HREF = "/auth/join/va";

const jobFaqs = [
  [
    "Is it free for Virtual Assistants to apply?",
    "Creating a VA profile is free. Training is free and optional. Published roles accept applications from eligible vetted VAs; joining or completing training does not guarantee employment.",
  ],
  [
    "Can I apply for a role before it is published?",
    "No. Employer job requests are private while awaiting review. Only published opportunities appear in the public job directory.",
  ],
  [
    "How do I post a Virtual Assistant job in the Philippines?",
    "Start your job draft before creating an account. Add the role, hours, compensation, timezone, and key skills, review the posting, then sign in or create a client account to submit it.",
  ],
  [
    "Who can apply to published jobs?",
    "Published roles can receive applications from approved and bench-vetted Filipino Virtual Assistants. New applications begin in recruiter review before the client hiring flow continues.",
  ],
  [
    "Can I set the pay and weekly hours?",
    "Yes. Employers set the advertised Virtual Assistant compensation, weekly hours, timezone or working-region context, and role requirements before submission.",
  ],
  [
    "Will I know when someone applies?",
    "Yes. The job poster receives an in-app notification and a transactional email when a vetted VA submits an application, subject to account notification preferences.",
  ],
  [
    "Are candidate details public?",
    "No. Applicant contact details and protected candidate information remain private until the hiring workflow enables candidate access.",
  ],
  [
    "Are there employer fees?",
    "Employer recruiting, candidate-access, placement, or managed-service fees depend on the hiring model. Any commercial terms are confirmed separately from VA compensation.",
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
      )
      .gte("min_hourly_rate", MIN_HOURLY_RATE);

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
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonicalUrl("/jobs")}#webpage`,
    name: "Virtual Assistant Jobs Philippines",
    url: canonicalUrl("/jobs"),
    description:
      "Public Virtual Assistant roles posted for vetted Filipino VAs, with clear pay, hours, schedule context, and recruiter-supported hiring.",
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

  const pageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      collectionSchema,
      faqSchema(canonicalUrl("/jobs"), jobFaqs.map(([question, answer]) => ({ question, answer }))),
    ],
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="public-jobs-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema).replace(/</g, "\\u003c") }}
        />

        <section className="jobs-market-hero">
          <div className="jobs-market-glow" aria-hidden="true" />
          <div className="container">
            {params.closed === "1" ? (
              <div className="success-banner jobs-closed-notice" role="status">
                <strong>That role has closed.</strong>
                <span>Browse the current published Virtual Assistant opportunities below.</span>
              </div>
            ) : null}
          </div>
          <div className="container jobs-market-hero-grid">
            <div className="jobs-market-copy">
              <span className="jobs-market-eyebrow">
                <ShieldCheck size={15} /> Hire vetted Filipino Virtual Assistants
              </span>
              <h1>Virtual Assistant Jobs Philippines</h1>
              <AnswerFirst
                id="jobs-quick-answer"
                question="Where can Filipino Virtual Assistants find remote VA jobs?"
                answer="VirtualAssistant.com.ph lists published remote Virtual Assistant jobs for Filipino applicants. Compare responsibilities, required skills, weekly hours, pay, and timezone expectations before applying. Employers submit structured job requests for publication or review, and eligible vetted Virtual Assistants can apply to published opportunities. Training is free and optional; applying does not guarantee employment."
              />
              <div className="jobs-market-actions">
                <Link className="btn btn-primary btn-lg" href={EMPLOYER_POST_HREF}>
                  Post a VA job <ArrowRight size={16} />
                </Link>
                <a className="btn btn-lg" href="#open-jobs">
                  Browse open jobs <ArrowRight size={16} />
                </a>
              </div>
              <div className="jobs-market-proof" aria-label="Job marketplace benefits">
                <span><CheckCircle2 size={15} /> Employers submit a hiring request</span>
                <span><CheckCircle2 size={15} /> VAs browse published roles for free</span>
                <span><Globe2 size={15} /> Remote hiring across timezones</span>
              </div>
            </div>

            <aside className="jobs-employer-card">
              <span className="jobs-employer-kicker">For employers</span>
              <div className="jobs-market-summary-icon"><BriefcaseBusiness size={24} /></div>
              <h2>Hiring a Filipino Virtual Assistant?</h2>
              <p>
                Post a Virtual Assistant job in the Philippines. Describe the role, schedule, and compensation; most submissions go to a recruiter for review before becoming public.
              </p>
              <ul>
                <li><CheckCircle2 size={15} /> Recruiter support throughout hiring</li>
                <li><CheckCircle2 size={15} /> Set compensation and schedule up front</li>
                <li><CheckCircle2 size={15} /> Keep drafts private until publication</li>
              </ul>
              <Link className="btn btn-primary btn-lg jobs-employer-button" href={EMPLOYER_POST_HREF}>
                Post a VA job <ArrowRight size={16} />
              </Link>
              <Link className="jobs-employer-help" href="/hire">Prefer recruiter assistance? Send a hiring request without creating an account.</Link>
              <Link className="jobs-employer-note" href={EMPLOYER_LOGIN_HREF}>Already have a client account? Sign in.</Link>
            </aside>
          </div>
        </section>

        <section className="section jobs-directory" id="open-jobs">
          <div className="container">
            <div className="jobs-directory-intro">
              <div>
                <span className="kicker">Remote opportunities</span>
                <h2>Browse current Virtual Assistant jobs</h2>
                <p>Search published opportunities by specialty, hours, pay, and recency. Applying is free.</p>
              </div>
              <Link className="btn jobs-directory-post" href={VA_JOIN_HREF}>
                <ArrowRight size={16} /> Create free VA profile
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
                <strong>{total} published role{total === 1 ? "" : "s"}</strong>
                <span>Only published roles appear here. Private employer requests await review.</span>
              </div>
              <Link href="/for-virtual-assistants" className="text-link">How applications work</Link>
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
                    <h2>{q || category || minRate || hours ? "Try broader job filters." : "More VA jobs are being prepared."}</h2>
                    <p>{q || category || minRate || hours ? "No published roles match these filters. Clear the filters to see all open opportunities." : "Check back for new published roles. You can prepare your free VA profile in the meantime; training is optional."}</p>
                  </div>
                  <div className="jobs-empty-actions">
                    {(q || category || minRate || hours)
                      ? <Link className="btn btn-primary" href="/jobs">Clear filters</Link>
                      : <Link className="btn btn-primary" href={VA_JOIN_HREF}>Create free VA profile</Link>}
                    <Link className="btn" href="/training">Explore free training</Link>
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

        <section className="jobs-candidate-guide" aria-labelledby="jobs-candidate-guide-title">
          <div className="container">
            <span className="kicker">For Virtual Assistants</span>
            <h2 id="jobs-candidate-guide-title">How do you apply for a remote VA job?</h2>
            <div className="jobs-candidate-guide-grid">
              <div><strong>Review the role</strong><p>Check tasks, weekly hours, pay, timezone, and required tools before applying.</p></div>
              <div><strong>Build your free VA profile</strong><p>Share your relevant experience and complete the platform's recruiter vetting process.</p></div>
              <div><strong>Apply when eligible</strong><p>Apply to published roles that fit your skills. Recruiters review applications before client presentation.</p></div>
            </div>
            <p>Training courses and certificates are free and optional. Training completion is not a requirement to apply, and does not guarantee a job.</p>
            <div className="jobs-candidate-guide-actions">
              <Link className="btn btn-primary" href={VA_JOIN_HREF}>Create free VA profile <ArrowRight size={15}/></Link>
              <Link className="btn" href="/training">Explore free VA training</Link>
            </div>
          </div>
        </section>

        <section className="jobs-seo-section">
          <div className="container">
            <div className="jobs-seo-intro">
              <span className="kicker">For employers</span>
              <h2>Post a clear VA job and make it easier to find the right fit</h2>
              <p>
                Strong job posts answer the questions candidates care about before they apply: what they will own,
                how many hours you need, which timezone matters, what skills are required, and what compensation you
                are offering. VAPH keeps those details structured so vetted Filipino VAs can assess fit quickly.
              </p>
            </div>

            <div className="jobs-seo-grid">
              <article>
                <CheckCircle2 size={20} />
                <h3>Start before signup</h3>
                <p>Draft the role first, review the public posting, then create or sign in to your client account.</p>
              </article>
              <article>
                <ShieldCheck size={20} />
                <h3>Vetted applicants</h3>
                <p>Approved and bench-vetted VAs can apply to published roles. New applications enter recruiter review.</p>
              </article>
              <article>
                <Globe2 size={20} />
                <h3>Clear schedule and pay</h3>
                <p>Publish weekly hours, timezone expectations, and VA compensation so applicants can judge fit before applying.</p>
              </article>
            </div>

            <div className="jobs-how-it-works">
              <div>
                <span className="kicker">Employer flow</span>
                <h2>From job draft to reviewed applicants</h2>
                <p>Create the role once, then manage applications and hiring activity from your client workspace.</p>
              </div>
              <ol>
                <li><span>1</span><div><strong>Draft the role</strong><p>Describe the work, then set hours, timezone, compensation, and requirements.</p></div></li>
                <li><span>2</span><div><strong>Review the posting</strong><p>See the role in job-post format before account creation and submission.</p></div></li>
                <li><span>3</span><div><strong>Publish or review</strong><p>Eligible accounts can publish directly; other roles follow the required recruiter and commercial review flow.</p></div></li>
                <li><span>4</span><div><strong>Receive applications</strong><p>When a vetted VA applies, the job poster receives an in-app notification and email.</p></div></li>
              </ol>
            </div>

            <div className="jobs-faq">
              <div className="jobs-faq-head">
                <span className="kicker">Employer FAQ</span>
                <h2>Questions about posting a VA job</h2>
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
                <span>Ready to hire?</span>
                <h2>Post your Virtual Assistant job</h2>
                <p>Draft the work, hours, timezone, and pay first. Create your client account only after you review the posting.</p>
              </div>
              <div className="jobs-bottom-actions">
                <Link className="btn btn-primary btn-lg" href={EMPLOYER_POST_HREF}>Post a VA job</Link>
                <Link className="btn btn-lg" href={EMPLOYER_LOGIN_HREF}>Client sign in</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
