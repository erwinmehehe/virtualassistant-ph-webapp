import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Clock3, Globe2, ShieldCheck, WalletCards } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { saveJobAction } from "@/app/actions/applications";
import { expressInterestAction } from "@/app/actions/va-interest";
import { money, dateShort } from "@/lib/format";
import { isUuid, jobPublicHref } from "@/lib/public-routing";
import { mergeUniqueStrings, uniqueStrings } from "@/lib/collections";
import { canonicalPath } from "@/lib/seo-url";
import { organizationRef } from "@/lib/organization";

async function getPublishedJob(key: string) {
  try {
    const supabase = await createClient();
    const query = supabase.from("public_jobs").select("*");
    const { data } = isUuid(key) ? await query.eq("id", key).maybeSingle() : await query.eq("slug", key).maybeSingle();
    return data;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("[jobs/[id]] Supabase unavailable:", (err as Error).message);
    return null;
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
  if (!job) return { title: "Virtual Assistant Job" };
  const company=await getPublicCompany(job.client_id);
  return { title: `${job.title} | VA Job`, description: job.summary || `${job.title} virtual assistant opportunity${company?.company_name ? ` with ${company.company_name}` : " through VirtualAssistant.com.ph"}.`, alternates: { canonical: canonicalPath(jobPublicHref(job)) } };
}

export default async function JobPage({ params, searchParams }: { params: Promise<{id:string}>; searchParams: Promise<Record<string,string|undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const job = await getPublishedJob(id);
  if (!job) notFound();
  const canonicalHref = jobPublicHref(job);
  if (isUuid(id) && job.slug) redirect(canonicalHref);

  const { user, profile } = await getSessionProfile();
  const company=await getPublicCompany(job.client_id);
  const companyName = company?.company_name || null;
  const companyWebsite = company?.website || null;
  const companyHiresCount = Number(company?.hires_count || 0);
  let interested = false;
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
      interested = Boolean(application);
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: structuredDescription,
    identifier: { "@type": "PropertyValue", name: "VirtualAssistant.com.ph", value: job.id },
    datePosted: job.published_at || job.created_at,
    employmentType: job.hours_per_week && job.hours_per_week >= 35 ? "FULL_TIME" : "PART_TIME",
    jobLocationType: "TELECOMMUTE",
    applicantLocationRequirements: { "@type": "Country", name: "Philippines" },
    hiringOrganization: companyName
      ? { "@type": "Organization", name: companyName, ...(companyWebsite ? { sameAs: companyWebsite } : {}) }
      : organizationRef(base),
    baseSalary: job.min_hourly_rate ? { "@type": "MonetaryAmount", currency: "USD", value: { "@type": "QuantitativeValue", minValue: job.min_hourly_rate, ...(job.max_hourly_rate ? { maxValue: job.max_hourly_rate } : {}), unitText: "HOUR" } } : undefined
  };

  const rateText = job.max_hourly_rate ? `${money(job.min_hourly_rate)}–${money(job.max_hourly_rate)}/hr` : `${money(job.min_hourly_rate)}/hr`;
  return <><SiteHeader/><main id="main-content" className="public-job-detail"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/><div className="container">
    <Link className="profile-back-link" href="/jobs"><ArrowLeft size={15}/> Back to VA jobs</Link>
    {query.interest ? <div className="success-banner" role="status">Interest sent to the recruiting team. A recruiter will review your vetted profile before anything is shown to the client.</div> : null}
    <div className="public-job-grid">
      <article className="public-job-main">
        <header className="public-job-hero-card"><div className="job-detail-badges"><span className="badge badge-success"><ShieldCheck size={14}/> Recruiter-reviewed role</span>{job.engagement_length ? <span className="badge">{job.engagement_length}</span> : null}</div><h1>{job.title}</h1><div className="public-job-company"><BriefcaseBusiness size={16}/><strong>{companyName || "Confidential Client"}</strong>{company?.verified_at ? <span className="badge badge-success">Verified client</span> : null}{companyHiresCount>0 ? <span>{companyHiresCount} hire{companyHiresCount===1?"":"s"}</span> : null}{job.published_at ? <span>Posted {dateShort(job.published_at)}</span> : null}</div>{job.summary ? <p>{job.summary}</p> : null}<div className="job-detail-facts"><div><WalletCards size={18}/><span>Compensation<strong>{rateText}</strong></span></div><div><Clock3 size={18}/><span>Hours<strong>{job.hours_per_week ? `${job.hours_per_week} hrs/week` : "Flexible"}</strong></span></div><div><Globe2 size={18}/><span>Working region<strong>{job.timezone || "Flexible"}</strong></span></div></div></header>

        <section className="job-detail-section"><h2>About the role</h2><p>{job.description || "The client will share additional context during the hiring process."}</p><div className="job-detail-note"><strong>Location</strong><p>This is a 100% remote role for applicants based in the Philippines.</p></div></section>{company?<section className="job-detail-section company-public-card"><div className="row wrap">{company.logo_url?<img className="company-logo-public" src={company.logo_url} alt={`${companyName || "Company"} logo`}/>:null}<div><h2>About {companyName || "the client"}</h2><p className="small muted">{[company.industry,company.location,company.team_size?`${company.team_size} people`:null].filter(Boolean).join(" · ")}</p></div></div>{company.company_description?<p>{company.company_description}</p>:null}{companyWebsite?<a className="text-link" href={companyWebsite} target="_blank" rel="noreferrer">Visit company website</a>:null}</section>:null}
        <section className="job-detail-section"><h2>What you will own</h2>{uniqueStrings(job.responsibilities).length ? <ul className="job-responsibility-list">{uniqueStrings(job.responsibilities).map((x,index)=><li key={`${String(x)}-${index}`}><CheckCircle2 size={17}/><span>{x}</span></li>)}</ul> : <p className="muted">Responsibilities will be discussed with recruiter-selected candidates.</p>}</section>
        <section className="job-detail-section"><h2>Skills & tools</h2><div className="pill-list job-detail-skill-list">{mergeUniqueStrings(job.required_skills, job.required_tools).length ? mergeUniqueStrings(job.required_skills, job.required_tools).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>) : <span className="small muted">No specific tools listed.</span>}</div></section>
        <section className="job-detail-section"><h2>Working setup</h2><div className="job-working-grid"><div><span>Live overlap</span><strong>{job.overlap_hours ? `${job.overlap_hours} hrs/day` : "Not required"}</strong></div><div><span>Start timing</span><strong>{job.start_timing || "Flexible"}</strong></div><div><span>Engagement</span><strong>{job.engagement_length || "Not specified"}</strong></div><div><span>Feedback</span><strong>{job.direct_feedback ? "Direct manager access" : "To be confirmed"}</strong></div></div>{job.schedule_notes ? <div className="job-detail-note"><strong>Schedule notes</strong><p>{job.schedule_notes}</p></div> : null}</section>
        <section className="job-detail-section"><h2>How selection works</h2><p>VirtualAssistant.com.ph recruits, vets, matches and supports experienced Filipino professionals for growing businesses. Expressing interest sends your profile to the recruiter handling this role. The recruiter decides who is ready to be presented to the client.</p></section>
      </article>

      <aside className="public-job-sidebar"><div className="job-apply-card"><div><span className="job-apply-rate">{rateText}</span><small>{job.hours_per_week ? `${job.hours_per_week} hours/week` : "Flexible weekly hours"}</small></div>{profile?.role === "va" ? interested ? <div className="success-state"><strong>Interest received</strong><span className="small">Your recruiter can review your vetted profile for this role. This does not send you directly to the client.</span><Link className="btn" href="/workspace/va/applications">View recruiter opportunities</Link></div> : vetted ? <form action={expressInterestAction} className="stack"><input type="hidden" name="job_id" value={job.id}/><div className="field"><label>What experience should the recruiter review?</label><textarea name="cover_note" minLength={20} maxLength={1500} placeholder="Mention the most relevant experience, skill, result, schedule fit, or tool evidence for this role." required/></div><button className="btn btn-primary btn-lg" type="submit">Send interest to recruiter</button><p className="small muted" style={{margin:0}}>A recruiter reviews this first. The client only sees candidates the recruiting team approves.</p></form> : <><div className="job-apply-lock"><ShieldCheck size={19}/><div><strong>Complete vetting first</strong><span>Your profile, screening, recruiter review, and final approval must be complete before you can join a client shortlist.</span></div></div><Link className="btn btn-primary" href="/workspace/va/vetting">Continue vetting</Link></> : <><p className="small muted">Create one VA profile and complete recruiter vetting before expressing interest in client roles.</p><Link className="btn btn-primary btn-lg" href={`/auth/join/va?next=${encodeURIComponent(canonicalHref)}`}>Create VA profile</Link><Link className="btn" href={`/auth/login?next=${encodeURIComponent(canonicalHref)}`}>Log in</Link></>}
        {profile?.role === "va" ? <form action={saveJobAction}><input type="hidden" name="job_id" value={job.id}/><input type="hidden" name="return_to" value={canonicalHref}/><button className="btn" style={{width:"100%"}} type="submit">{saved ? "Remove saved job" : "Save job"}</button></form> : null}<div className="job-apply-privacy"><ShieldCheck size={15}/><span>Your contact details stay private. Recruiters manage client introductions and interviews.</span></div></div></aside>
    </div>
  </div></main><SiteFooter/></>;
}
