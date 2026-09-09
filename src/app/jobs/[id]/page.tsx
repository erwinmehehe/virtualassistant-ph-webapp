import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Clock3, Globe2, ShieldCheck, WalletCards } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { applyToJobAction, saveJobAction } from "@/app/actions/applications";
import { money, dateShort } from "@/lib/format";
import { isUuid, jobPublicHref } from "@/lib/public-routing";
import { mergeUniqueStrings, uniqueStrings } from "@/lib/collections";
import { canonicalPath } from "@/lib/seo-url";

async function getPublishedJob(key: string) {
  try {
    const supabase = await createClient();
    const query = supabase.from("jobs").select("*").eq("status", "published").not("client_id", "is", null);
    const { data } = isUuid(key) ? await query.eq("id", key).maybeSingle() : await query.eq("slug", key).maybeSingle();
    return data;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("[jobs/[id]] Supabase unavailable:", (err as Error).message);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{id:string}> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getPublishedJob(id);
  if (!job) return { title: "Virtual Assistant Job" };
  return { title: `${job.title} | VA Job`, description: job.summary || `${job.title} virtual assistant opportunity${job.company_name ? ` with ${job.company_name}` : ""}.`, alternates: { canonical: canonicalPath(jobPublicHref(job)) } };
}

export default async function JobPage({ params, searchParams }: { params: Promise<{id:string}>; searchParams: Promise<Record<string,string|undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const job = await getPublishedJob(id);
  if (!job) notFound();
  const canonicalHref = jobPublicHref(job);
  if (isUuid(id) && job.slug) redirect(canonicalHref);

  const { user, profile } = await getSessionProfile();
  let company: any = null;
  if (job.client_id) { try { const publicDb = await createClient(); const { data } = await publicDb.from("public_company_profiles").select("company_name,logo_url,website,industry,location,team_size,company_description,verified_at,hires_count").eq("user_id",job.client_id).maybeSingle(); company=data; } catch {} }
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

  const jsonLd = {
    "@context": "https://schema.org", "@type": "JobPosting", title: job.title,
    description: [job.summary, job.description, ...(job.responsibilities || [])].filter(Boolean).join("\n"),
    datePosted: job.published_at || job.created_at,
    employmentType: job.hours_per_week && job.hours_per_week >= 35 ? "FULL_TIME" : "PART_TIME",
    jobLocationType: "TELECOMMUTE",
    hiringOrganization: { "@type": "Organization", name: company?.company_name || job.company_name || "Confidential client" },
    baseSalary: job.min_hourly_rate ? { "@type": "MonetaryAmount", currency: "USD", value: { "@type": "QuantitativeValue", minValue: job.min_hourly_rate, ...(job.max_hourly_rate ? { maxValue: job.max_hourly_rate } : {}), unitText: "HOUR" } } : undefined
  };

  const rateText = job.max_hourly_rate ? `${money(job.min_hourly_rate)}–${money(job.max_hourly_rate)}/hr` : `${money(job.min_hourly_rate)}/hr`;
  return <><SiteHeader/><main id="main-content" className="public-job-detail"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/><div className="container">
    <Link className="profile-back-link" href="/jobs"><ArrowLeft size={15}/> Back to VA jobs</Link>
    {query.applied ? <div className="success-banner" role="status">Application sent. Track it from your VA workspace.</div> : null}
    <div className="public-job-grid">
      <article className="public-job-main">
        <header className="public-job-hero-card"><div className="job-detail-badges"><span className="badge badge-success"><ShieldCheck size={14}/> Reviewed role</span>{job.engagement_length ? <span className="badge">{job.engagement_length}</span> : null}</div><h1>{job.title}</h1><div className="public-job-company"><BriefcaseBusiness size={16}/><strong>{company?.company_name || job.company_name || "Confidential client"}</strong>{company?.verified_at ? <span className="badge badge-success">Verified client</span> : null}{Number(company?.hires_count||0)>0 ? <span>{company.hires_count} hire{company.hires_count===1?"":"s"}</span> : null}{job.published_at ? <span>Posted {dateShort(job.published_at)}</span> : null}</div>{job.summary ? <p>{job.summary}</p> : null}<div className="job-detail-facts"><div><WalletCards size={18}/><span>Compensation<strong>{rateText}</strong></span></div><div><Clock3 size={18}/><span>Hours<strong>{job.hours_per_week ? `${job.hours_per_week} hrs/week` : "Flexible"}</strong></span></div><div><Globe2 size={18}/><span>Working region<strong>{job.timezone || "Flexible"}</strong></span></div></div></header>

        <section className="job-detail-section"><h2>About the role</h2><p>{job.description || "The client will share additional context during the hiring process."}</p></section>{company?<section className="job-detail-section company-public-card"><div className="row wrap">{company.logo_url?<img className="company-logo-public" src={company.logo_url} alt={`${company.company_name} logo`}/>:null}<div><h2>About {company.company_name}</h2><p className="small muted">{[company.industry,company.location,company.team_size?`${company.team_size} people`:null].filter(Boolean).join(" · ")}</p></div></div>{company.company_description?<p>{company.company_description}</p>:null}{company.website?<a className="text-link" href={company.website} target="_blank" rel="noreferrer">Visit company website</a>:null}</section>:null}
        <section className="job-detail-section"><h2>What you will own</h2>{uniqueStrings(job.responsibilities).length ? <ul className="job-responsibility-list">{uniqueStrings(job.responsibilities).map((x,index)=><li key={`${String(x)}-${index}`}><CheckCircle2 size={17}/><span>{x}</span></li>)}</ul> : <p className="muted">Responsibilities will be discussed with shortlisted candidates.</p>}</section>
        <section className="job-detail-section"><h2>Skills & tools</h2><div className="pill-list job-detail-skill-list">{mergeUniqueStrings(job.required_skills, job.required_tools).length ? mergeUniqueStrings(job.required_skills, job.required_tools).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>) : <span className="small muted">No specific tools listed.</span>}</div></section>
        <section className="job-detail-section"><h2>Working setup</h2><div className="job-working-grid"><div><span>Live overlap</span><strong>{job.overlap_hours ? `${job.overlap_hours} hrs/day` : "Not required"}</strong></div><div><span>Start timing</span><strong>{job.start_timing || "Flexible"}</strong></div><div><span>Engagement</span><strong>{job.engagement_length || "Not specified"}</strong></div><div><span>Feedback</span><strong>{job.direct_feedback ? "Direct manager access" : "To be confirmed"}</strong></div></div>{job.schedule_notes ? <div className="job-detail-note"><strong>Schedule notes</strong><p>{job.schedule_notes}</p></div> : null}</section>
        <section className="job-detail-section"><h2>Onboarding</h2><p>{job.onboarding_plan || "The client will confirm onboarding details before the hire starts."}</p></section>
      </article>

      <aside className="public-job-sidebar"><div className="job-apply-card"><div><span className="job-apply-rate">{rateText}</span><small>{job.hours_per_week ? `${job.hours_per_week} hours/week` : "Flexible weekly hours"}</small></div>{profile?.role === "va" ? applied ? <div className="success-state"><strong>Application submitted</strong><span className="small">Track status and messages from Applications.</span><Link className="btn" href="/workspace/va/applications">View applications</Link></div> : vetted ? <form action={applyToJobAction} className="stack"><input type="hidden" name="job_id" value={job.id}/><div className="field"><label>Why are you a good fit?</label><textarea name="cover_note" minLength={20} maxLength={1500} placeholder="Mention the most relevant experience, skill, or result for this role." required/></div><button className="btn btn-primary btn-lg" type="submit">Submit application</button></form> : <><div className="job-apply-lock"><ShieldCheck size={19}/><div><strong>Complete vetting to apply</strong><span>Your profile, skills test, video, recruiter review, and final approval must be complete first.</span></div></div><Link className="btn btn-primary" href="/workspace/va/vetting">Continue vetting</Link></> : <><p className="small muted">Create one VA profile, complete screening, then apply to reviewed client roles.</p><Link className="btn btn-primary btn-lg" href={`/auth/join/va?next=${encodeURIComponent(canonicalHref)}`}>Create VA profile</Link><Link className="btn" href={`/auth/login?next=${encodeURIComponent(canonicalHref)}`}>Log in</Link></>}
        {profile?.role === "va" ? <form action={saveJobAction}><input type="hidden" name="job_id" value={job.id}/><input type="hidden" name="return_to" value={canonicalHref}/><button className="btn" style={{width:"100%"}} type="submit">{saved ? "Remove saved job" : "Save job"}</button></form> : null}<div className="job-apply-privacy"><ShieldCheck size={15}/><span>Client contact details remain private until the platform workflow permits direct communication.</span></div></div></aside>
    </div>
  </div></main><SiteFooter/></>;
}
