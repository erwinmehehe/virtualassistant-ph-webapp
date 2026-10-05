import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Clock3, Globe2, ShieldCheck, WalletCards } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth";
import { applyToJobAction, saveJobAction } from "@/app/actions/applications";
import { money, dateShort } from "@/lib/format";
import { isUuid, jobPublicHref } from "@/lib/public-routing";
import { mergeUniqueStrings, uniqueStrings } from "@/lib/collections";
import { canonicalPath } from "@/lib/seo-url";
import { socialMetadata } from "@/lib/og";
import { isPublishableCompanyName } from "@/lib/job-publication";
import { organizationId, websiteId } from "@/lib/organization";
import { MIN_HOURLY_RATE } from "@/lib/constants";
import "./job-detail.css";

async function getPublishedJob(key: string) {
  try {
    const supabase = await createClient();
    const query = supabase.from("public_jobs").select("*").gte("min_hourly_rate", MIN_HOURLY_RATE);
    const { data } = isUuid(key) ? await query.eq("id", key).maybeSingle() : await query.eq("slug", key).maybeSingle();
    return data;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("[jobs/[id]] Supabase unavailable:", (err as Error).message);
    return null;
  }
}


async function wasPreviouslyPublicJob(key: string) {
  try {
    const admin = createAdminClient();
    let query = admin.from("jobs").select("id,slug,status,published_at,expires_at");
    query = isUuid(key) ? query.eq("id", key) : query.eq("slug", key);
    const { data } = await query.maybeSingle();
    if (!data?.published_at) return false;

    const expired = Boolean(data.expires_at && new Date(data.expires_at).getTime() <= Date.now());
    return data.status === "closed" || expired;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("[jobs/[id]] retired job lookup unavailable:", (err as Error).message);
    return false;
  }
}

function publicCompanyFromJob(job: any) {
  if (!job) return null;
  return {
    company_name: job.company_name,
    logo_url: job.company_logo_url,
    website: job.company_website,
    industry: job.company_industry,
    location: job.company_location,
    team_size: job.company_team_size,
    company_description: job.company_description,
    verified_at: job.company_verified_at,
    hires_count: job.company_hires_count,
  };
}

export async function generateMetadata({ params }: { params: Promise<{id:string}> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getPublishedJob(id);
  if (!job) return { title: "Virtual Assistant Job", robots: { index: false, follow: false } };
  const company = publicCompanyFromJob(job);
  const companyName = String(company?.company_name || "").trim();
  if (!isPublishableCompanyName(companyName)) {
    return { title: "Virtual Assistant Job", robots: { index: false, follow: false } };
  }
  const title = `${job.title} | ${companyName}`;
  const description = job.summary || `${job.title} virtual assistant opportunity with ${companyName}.`;
  const canonical = canonicalPath(jobPublicHref(job));
  return {
    title,
    description,
    alternates: { canonical },
    ...socialMetadata({
      title,
      description,
      path: canonical,
      category: "jobs",
      eyebrow: companyName,
      points: [
        job.hours_per_week ? `${job.hours_per_week} hrs/week` : "Remote role",
        job.timezone || "Schedule in listing",
        job.min_hourly_rate ? `From ${job.min_hourly_rate}/hr` : "Pay in listing",
        "Philippines applicants",
      ],
    }),
  };
}

export default async function JobPage({ params, searchParams }: { params: Promise<{id:string}>; searchParams: Promise<Record<string,string|undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const job = await getPublishedJob(id);
  if (!job) {
    if (await wasPreviouslyPublicJob(id)) permanentRedirect("/jobs?closed=1");
    notFound();
  }
  const canonicalHref = jobPublicHref(job);
  if (isUuid(id) && job.slug) redirect(canonicalHref);

  const { user, profile } = await getSessionProfile();
  const company = publicCompanyFromJob(job);
  const companyName = String(company?.company_name || "").trim();
  if (!isPublishableCompanyName(companyName)) notFound();
  const companyWebsite = company?.website || null;
  const companyHiresCount = Number(company?.hires_count || 0);
  let applied = false;
  let vetted = false;
  let saved = false;
  if (user && profile?.role === "va") {
    try {
      const supabase = await createClient();
      const [{ data: application }, { data: vetting }, { data: savedRow }] = await Promise.all([
        supabase.from("applications").select("id").eq("job_id", job.id).eq("va_id", user.id).maybeSingle(),
        supabase.from("va_vetting").select("stage").eq("va_id",user.id).maybeSingle(),
        supabase.from("saved_jobs").select("job_id").eq("job_id",job.id).eq("va_id",user.id).maybeSingle()
      ]);
      applied = Boolean(application);
      vetted = Boolean(vetting && ["approved","bench"].includes(vetting.stage));
      saved = Boolean(savedRow);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") console.warn("[jobs/[id]] VA status lookup unavailable:", (err as Error).message);
    }
  }

  const structuredDescription = [
    job.summary,
    job.description,
    "This is a 100% remote virtual assistant role for applicants based in the Philippines.",
    uniqueStrings(job.responsibilities).length ? `Responsibilities: ${uniqueStrings(job.responsibilities).join("; ")}` : null,
    uniqueStrings(job.required_skills).length ? `Required skills: ${uniqueStrings(job.required_skills).join(", ")}` : null,
    uniqueStrings(job.required_tools).length ? `Required tools: ${uniqueStrings(job.required_tools).join(", ")}` : null,
    job.hours_per_week ? `Working hours: approximately ${job.hours_per_week} hours per week.` : null,
    job.experience_level ? `Experience level: ${job.experience_level}.` : null,
    job.timezone ? `Client timezone or working-region context: ${job.timezone}.` : null
  ].filter(Boolean).join("\n");

  const base=(process.env.NEXT_PUBLIC_APP_URL||"https://virtualassistant.com.ph").replace(/\/$/,"");
  const pageUrl = `${base}${canonicalHref}`;
  const jobSchemaId = `${pageUrl}#job`;
  const webpageId = `${pageUrl}#webpage`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const orgId = organizationId(base);
  const siteId = websiteId(base);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": webpageId,
        url: pageUrl,
        name: job.title,
        description: structuredDescription,
        inLanguage: "en-PH",
        isPartOf: { "@id": siteId },
        about: { "@id": jobSchemaId },
        mainEntity: { "@id": jobSchemaId },
        breadcrumb: { "@id": breadcrumbId },
        publisher: { "@id": orgId },
      },
      {
        "@type": "JobPosting",
        "@id": jobSchemaId,
        title: job.title,
        description: structuredDescription,
        identifier: { "@type": "PropertyValue", name: "VirtualAssistant.com.ph", value: job.id },
        datePosted: job.published_at || job.created_at,
        validThrough: job.expires_at || undefined,
        url: pageUrl,
        mainEntityOfPage: { "@id": webpageId },
        employmentType: job.hours_per_week ? (job.hours_per_week >= 35 ? "FULL_TIME" : "PART_TIME") : undefined,
        jobLocationType: "TELECOMMUTE",
        applicantLocationRequirements: { "@type": "Country", name: "Philippines" },
        hiringOrganization: {
          "@type": "Organization",
          name: companyName,
          ...(companyWebsite ? { url: companyWebsite, sameAs: companyWebsite } : {}),
          ...(company?.logo_url ? { logo: company.logo_url } : {}),
        },
        responsibilities: uniqueStrings(job.responsibilities).length ? uniqueStrings(job.responsibilities).join("; ") : undefined,
        skills: mergeUniqueStrings(job.required_skills, job.required_tools).length ? mergeUniqueStrings(job.required_skills, job.required_tools).join(", ") : undefined,
        workHours: job.hours_per_week ? `${job.hours_per_week} hours per week` : undefined,
        experienceRequirements: job.experience_level ? `Experience level: ${job.experience_level}` : undefined,
        baseSalary: job.min_hourly_rate ? {
          "@type": "MonetaryAmount",
          currency: "USD",
          value: {
            "@type": "QuantitativeValue",
            minValue: job.min_hourly_rate,
            ...(job.max_hourly_rate ? { maxValue: job.max_hourly_rate } : {}),
            unitText: "HOUR"
          }
        } : undefined
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: base },
          { "@type": "ListItem", position: 2, name: "Virtual Assistant Jobs", item: `${base}/jobs` },
          { "@type": "ListItem", position: 3, name: job.title, item: pageUrl }
        ]
      }
    ]
  };

  const rateText = job.max_hourly_rate ? `${money(job.min_hourly_rate)}–${money(job.max_hourly_rate)}/hr` : `${money(job.min_hourly_rate)}/hr`;
  const employerLabel = companyName;
  const skillsAndTools = mergeUniqueStrings(job.required_skills, job.required_tools);
  const responsibilities = uniqueStrings(job.responsibilities);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="public-job-detail">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <div className="container">
          <Link className="profile-back-link" href="/jobs"><ArrowLeft size={15}/> Back to jobs</Link>

          {query.applied ? (
            <div className="success-banner job-success-banner" role="status">
              <CheckCircle2 size={17}/>
              <div>
                <strong>Application submitted.</strong>
                <span>Your application is now in recruiter review. VAPH will handle the next employer step and notify the job poster when a client account is attached to the role.</span>
              </div>
            </div>
          ) : null}

          <div className="public-job-grid">
            <article className="public-job-main">
              <header className="public-job-hero-card">
                <div className="job-detail-badges">
                  <span className="badge badge-success"><ShieldCheck size={14}/> Recruiter reviewed</span>
                  <span className="badge">Remote · Philippines</span>
                </div>

                <h1>{job.title}</h1>

                <div className="job-employer-row">
                  <div className="job-employer-mark"><BriefcaseBusiness size={18}/></div>
                  <div>
                    <span className="job-employer-label">Hiring company</span>
                    <strong>{employerLabel}</strong>
                  </div>
                  {company?.verified_at ? <span className="badge badge-success">Verified employer</span> : null}
                </div>

                {job.summary ? <p className="job-hero-summary">{job.summary}</p> : null}

                <div className="job-detail-facts">
                  <div>
                    <WalletCards size={18}/>
                    <span>Compensation<strong>{rateText}</strong></span>
                  </div>
                  <div>
                    <Clock3 size={18}/>
                    <span>Hours<strong>{job.hours_per_week ? `${job.hours_per_week} hrs/week` : "Flexible"}</strong></span>
                  </div>
                  <div>
                    <Globe2 size={18}/>
                    <span>Working region<strong>{job.timezone || "Flexible"}</strong></span>
                  </div>
                  <div>
                    <BriefcaseBusiness size={18}/>
                    <span>Engagement<strong>{job.engagement_length || "Ongoing role"}</strong></span>
                  </div>
                </div>

                <div className="job-post-meta">
                  {job.published_at ? <span>Posted {dateShort(job.published_at)}</span> : null}
                  {job.expires_at ? <span>Applications close {dateShort(job.expires_at)}</span> : null}
                  {companyHiresCount > 0 ? <span>{companyHiresCount} previous hire{companyHiresCount === 1 ? "" : "s"}</span> : null}
                </div>
              </header>

              <section className="job-detail-section">
                <span className="job-section-kicker">Role overview</span>
                <h2>About the role</h2>
                <p>{job.description || "Additional role context will be shared with recruiter-selected candidates."}</p>
              </section>

              <section className="job-detail-section">
                <span className="job-section-kicker">Responsibilities</span>
                <h2>What you will own</h2>
                {responsibilities.length ? (
                  <ul className="job-responsibility-list">
                    {responsibilities.map((item, index) => (
                      <li key={`${String(item)}-${index}`}>
                        <span className="job-check"><CheckCircle2 size={16}/></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="muted">Responsibilities will be confirmed during recruiter review.</p>}
              </section>

              <section className="job-detail-section">
                <span className="job-section-kicker">Requirements</span>
                <h2>Skills and tools</h2>
                <div className="pill-list job-detail-skill-list">
                  {skillsAndTools.length
                    ? skillsAndTools.map((item, index) => <span className="badge" key={`${String(item)}-${index}`}>{item}</span>)
                    : <span className="small muted">No specific tools listed.</span>}
                </div>
              </section>

              <section className="job-detail-section">
                <span className="job-section-kicker">Schedule</span>
                <h2>Working setup</h2>
                <div className="job-working-grid">
                  <div><span>Timezone</span><strong>{job.timezone || "Flexible"}</strong></div>
                  <div><span>Live overlap</span><strong>{job.overlap_hours ? `${job.overlap_hours} hrs/day` : "Not required"}</strong></div>
                  <div><span>Start</span><strong>{job.start_timing || "Flexible"}</strong></div>
                  <div><span>Manager feedback</span><strong>{job.direct_feedback ? "Direct access" : "To be confirmed"}</strong></div>
                </div>
                {job.schedule_notes ? (
                  <div className="job-detail-note"><strong>Schedule notes</strong><p>{job.schedule_notes}</p></div>
                ) : null}
              </section>

              {company && (company.company_description || company.industry || company.location || company.team_size || companyWebsite) ? (
                <section className="job-detail-section company-public-card">
                  <span className="job-section-kicker">Employer</span>
                  <div className="company-public-head">
                    {company.logo_url ? <img className="company-logo-public" src={company.logo_url} alt={`${employerLabel} logo`}/> : <div className="company-logo-fallback"><BriefcaseBusiness size={18}/></div>}
                    <div>
                      <h2>About {employerLabel}</h2>
                      <p className="small muted">{[company.industry, company.location, company.team_size ? `${company.team_size} people` : null].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>
                  {company.company_description ? <p>{company.company_description}</p> : null}
                  {companyWebsite ? <a className="text-link" href={companyWebsite} target="_blank" rel="noreferrer">Visit company website</a> : null}
                </section>
              ) : null}

              <section className="job-detail-section job-hiring-process">
                <span className="job-section-kicker">Hiring process</span>
                <h2>What happens after you apply</h2>
                <div className="job-process-grid">
                  <div><span>1</span><strong>Apply</strong><p>Send a short note about the experience most relevant to this role.</p></div>
                  <div><span>2</span><strong>Recruiter review</strong><p>VAPH checks role fit and your vetted profile before client presentation.</p></div>
                  <div><span>3</span><strong>Employer review</strong><p>Approved candidates move into the client interview and decision flow.</p></div>
                </div>
              </section>
            </article>

            <aside className="public-job-sidebar">
              <div className="job-apply-card">
                <div className="job-apply-head">
                  <span className="job-apply-eyebrow">Apply to this role</span>
                  <span className="job-apply-rate">{rateText}</span>
                  <small>{job.hours_per_week ? `${job.hours_per_week} hours/week` : "Flexible weekly hours"} · Remote</small>
                </div>

                <div className="job-sidebar-employer">
                  <BriefcaseBusiness size={16}/>
                  <div><span>Employer</span><strong>{employerLabel}</strong></div>
                </div>

                {profile?.role === "va" ? (
                  applied ? (
                    <div className="success-state">
                      <strong>Application submitted</strong>
                      <span className="small">Your application is in recruiter review. VAPH will handle the next employer step and notify the job poster when a client account is attached to the role.</span>
                      <Link className="btn" href="/workspace/va/applications">View my applications</Link>
                    </div>
                  ) : vetted ? (
                    <form action={applyToJobAction} className="stack">
                      <input type="hidden" name="job_id" value={job.id}/>
                      <div className="field">
                        <label>Short note to the recruiter</label>
                        <textarea name="cover_note" minLength={20} maxLength={1500} placeholder="What experience or result is most relevant to this role?" required/>
                        <span className="small muted">Keep it specific. One or two short paragraphs is enough.</span>
                      </div>
                      <button className="btn btn-primary btn-lg job-apply-primary" type="submit">Apply for this job</button>
                      <p className="small muted job-apply-note">The job poster is notified when you apply. Your private details stay protected until candidate access is active.</p>
                    </form>
                  ) : (
                    <>
                      <div className="job-apply-lock">
                        <ShieldCheck size={19}/>
                        <div><strong>Complete vetting to apply</strong><span>Approved and bench-vetted VAs can apply directly to published jobs.</span></div>
                      </div>
                      <Link className="btn btn-primary" href="/workspace/va/vetting">Continue vetting</Link>
                    </>
                  )
                ) : profile?.role === "client" ? (
                  <div className="stack">
                    <div className="job-apply-lock">
                      <BriefcaseBusiness size={19}/>
                      <div><strong>You’re signed in as a client</strong><span>VA applications are available to vetted VA accounts. Manage your roles from the client dashboard.</span></div>
                    </div>
                    <Link className="btn btn-primary btn-lg" href="/workspace/client/jobs">Manage my jobs</Link>
                    <Link className="btn" href="/workspace/client/jobs/new">Post another job</Link>
                  </div>
                ) : user ? (
                  <div className="stack">
                    <div className="job-apply-lock">
                      <ShieldCheck size={19}/>
                      <div><strong>You’re already signed in</strong><span>This account cannot apply to VA jobs. Open your workspace to continue.</span></div>
                    </div>
                    <Link className="btn btn-primary btn-lg" href="/workspace">Go to workspace</Link>
                  </div>
                ) : (
                  <>
                    <div className="job-apply-intro">
                      <strong>Want to apply?</strong>
                      <p>Create your free VA profile. We’ll return you to this exact job after signup, then you can complete vetting and apply once approved.</p>
                    </div>
                    <Link className="btn btn-primary btn-lg job-apply-primary" href={`/auth/join/va?next=${encodeURIComponent(canonicalHref)}`}>Create VA profile to apply</Link>
                    <Link className="btn" href={`/auth/login?next=${encodeURIComponent(canonicalHref)}`}>Already have an account? Log in</Link>
                  </>
                )}

                {profile?.role === "va" ? (
                  <form action={saveJobAction}>
                    <input type="hidden" name="job_id" value={job.id}/>
                    <input type="hidden" name="return_to" value={canonicalHref}/>
                    <button className="btn" style={{ width: "100%" }} type="submit">{saved ? "Remove saved job" : "Save job"}</button>
                  </form>
                ) : null}

                <div className="job-apply-privacy">
                  <ShieldCheck size={15}/>
                  <span>Your private contact details stay protected until candidate access is active.</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter/>
    </>
  );
}
