import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, EyeOff, Globe2, ShieldCheck, Star } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PublicAvatar } from "@/components/public-avatar";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_VA_MIN_EXPERIENCE, isUuid, publicDisplayName } from "@/lib/public-routing";
import { dateShort } from "@/lib/format";
import { uniqueStrings } from "@/lib/collections";
import { canonicalPath } from "@/lib/seo-url";
import "../../cro-hiring-tools.css";

async function getPublicVaByRoute(slug: string, fields = "*") {
  const supabase = await createClient();
  const query = supabase.from("public_va_directory").select(fields).gte("years_experience", PUBLIC_VA_MIN_EXPERIENCE);
  const { data } = isUuid(slug)
    ? await query.eq("user_id", slug).maybeSingle()
    : await query.eq("slug", slug).maybeSingle();
  return data as any;
}

export async function generateMetadata({ params }: { params: Promise<{slug:string}> }): Promise<Metadata> {
  const { slug } = await params;
  const va = await getPublicVaByRoute(slug, "user_id,slug,full_name,headline,primary_category,bio,years_experience");
  if (!va) return { title: "Vetted Virtual Assistant Profile", robots: { index: false, follow: true } };
  const name = publicDisplayName(va.full_name);
  return {
    title: `${name} | ${va.headline || va.primary_category || "Virtual Assistant"}`,
    description: va.bio ? String(va.bio).slice(0, 155) : `View this recruiter-reviewed ${va.primary_category || "Filipino virtual assistant"} profile with ${va.years_experience || 2}+ years of experience.`,
    alternates: { canonical: canonicalPath(`/va/${encodeURIComponent(va.slug || slug)}`) },
    robots: { index: false, follow: true }
  };
}

export default async function TalentProfilePage({ params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params;
  let va: any = null;
  let publicReviews: any[] | null = null;
  let certifications: any[] | null = null;
  try {
    va = await getPublicVaByRoute(slug);
    if (!va) notFound();
    const supabase = await createClient();
    const { data: reviewsData } = await supabase.from("public_va_reviews").select("id,rating,body,created_at,reviewer_label").eq("reviewee_id", va.user_id).order("created_at", { ascending: false });
    publicReviews = reviewsData;
    const { data: certData } = await supabase.from("public_va_certifications").select("category,test_title,reviewed_at").eq("va_id", va.user_id).order("reviewed_at", { ascending: false });
    certifications = certData;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("[va/[slug]] Supabase unavailable:", (err as Error).message);
    notFound();
  }

  const reviews = publicReviews || [];
  const averageRating = reviews.length ? reviews.reduce((sum:any, review:any) => sum + Number(review.rating || 0), 0) / reviews.length : 0;
  const displayName = publicDisplayName(va.full_name);
  const requestHref = `/hire?talent=${encodeURIComponent(va.slug || slug)}`;
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph";
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    jobTitle: va.headline || va.primary_category || "Virtual Assistant",
    description: va.bio || undefined,
    url: `${base}/va/${encodeURIComponent(va.slug || slug)}`,
    image: va.avatar_url || undefined,
    knowsAbout: [...(va.skills || []), ...(va.tools || []), va.primary_category].filter(Boolean)
  };

  if (reviews.length) {
    (personJsonLd as any).aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(averageRating.toFixed(1)),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1
    };
  }

  const skills = uniqueStrings(va.skills);
  const tools = uniqueStrings(va.tools);
  const industries = uniqueStrings(va.industries);
  const languages = uniqueStrings(va.languages);
  const reviewedSkills = uniqueStrings((certifications || []).map((cert:any) => cert.category));

  return <><SiteHeader/><main id="main-content" className="public-talent-profile"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(personJsonLd).replace(/</g,"\\u003c")}}/>
    <div className="container">
      <Link className="profile-back-link" href="/find-talent"><ArrowLeft size={15}/> Browse talent</Link>
      <div className="public-talent-grid">
        <article className="public-talent-main">
          <header className="public-talent-hero-card">
            <div className="public-talent-avatar"><PublicAvatar name={displayName} src={va.avatar_url}/></div>
            <div className="public-talent-identity"><div className="public-talent-status"><span><CheckCircle2 size={15}/> Recruiter reviewed</span></div><h1>{displayName}</h1><p className="public-talent-headline">{va.headline || va.primary_category || "Virtual Assistant"}</p><div className="public-profile-quickfacts"><span><strong>{va.years_experience}+ yrs</strong> experience</span><span><strong>{va.weekly_hours ? `${va.weekly_hours} hrs/week` : "Flexible"}</strong> availability</span><span><strong>{va.preferred_timezone || va.schedule || "Flexible"}</strong> schedule</span></div></div>
          </header>

          <section className="public-profile-section"><h2>Overview</h2><p className="public-profile-copy">{va.bio || "This profile has been reviewed by our recruiting team. Tell us the role and we will confirm current availability and role-specific fit before presenting a shortlist."}</p></section>

          {reviews.length ? <section className="public-profile-section public-review-section"><div className="public-profile-section-head"><div><h2>Client reviews</h2><p className="public-review-intro">Reviews shown here come from confirmed placements.</p></div><div className="public-review-summary"><span className="review-stars" aria-label={`${averageRating.toFixed(1)} out of 5 stars`}>{Array.from({length:5},(_,i)=><Star key={i} size={15} className={i < Math.round(averageRating) ? "filled" : ""}/>)}</span><strong>{averageRating.toFixed(1)}</strong><span>{reviews.length} {reviews.length===1?"review":"reviews"}</span></div></div><div className="public-review-list">{reviews.slice(0,6).map((review:any)=><article className="public-review-card" key={review.id}><div className="row-between wrap"><span className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{Array.from({length:5},(_,i)=><Star key={i} size={14} className={i < Number(review.rating) ? "filled" : ""}/>)}</span></div><p>{review.body}</p><div className="public-review-meta"><strong>{review.reviewer_label || "Verified client"}</strong><span>Confirmed placement · {dateShort(review.created_at)}</span></div></article>)}</div></section> : null}

          {reviewedSkills.length ? <section className="public-profile-section"><h2>Skills reviewed</h2><div className="profile-text-list">{reviewedSkills.map((skill,index)=><span key={`${skill}-${index}`}>{skill}</span>)}</div></section> : null}

          <section className="public-profile-section"><h2>Core skills</h2>{skills.length ? <div className="profile-skill-grid">{skills.map((skill,index)=><span key={`${String(skill)}-${index}`}>{skill}</span>)}</div> : <p className="muted">No public skills listed yet.</p>}</section>

          <section className="public-profile-section two-column-profile-section"><div><h2>Tools</h2>{tools.length ? <div className="profile-text-list">{tools.map((tool,index)=><span key={`${String(tool)}-${index}`}>{tool}</span>)}</div> : <p className="muted">No public tools listed.</p>}</div><div><h2>Industries & languages</h2><div className="profile-detail-list"><div><span>Industries</span><strong>{industries.join(" · ") || "Flexible"}</strong></div><div><span>Languages</span><strong>{languages.join(" · ") || "English / Filipino"}</strong></div></div></div></section>

          <section className="public-profile-section public-vetting-section"><div><ShieldCheck size={21}/><div><h2>Recruiter review</h2><p>Our recruiting team reviews the profile, skills evidence, communication, and role readiness before a candidate is presented to a client.</p></div></div></section>

          <div className="public-profile-privacy"><EyeOff size={16}/><span>Private assessments, recruiter notes, contact details, and uploaded resumes are not shown on public profiles.</span></div>
        </article>

        <aside className="public-talent-sidebar">
          <div className="public-talent-action-card"><div className="public-talent-action-head"><span>Profile at a glance</span><strong>{va.primary_category || "Virtual Assistant"}</strong></div><div className="public-fit-grid"><div><span>Experience</span><strong>{va.years_experience}+ years</strong></div><div><span>Availability</span><strong>{va.weekly_hours ? `${va.weekly_hours} hrs/week` : "Flexible"}</strong></div><div><span>Schedule</span><strong>{va.schedule || "Flexible"}</strong></div><div><span>Live overlap</span><strong>{va.overlap_hours != null ? `Up to ${va.overlap_hours} hrs/day` : "Flexible"}</strong></div></div><div className="public-talent-cta-copy"><div><strong>Need someone for this kind of work?</strong><span>Tell us the role. We will confirm current availability and recommend the strongest fits, including this profile when appropriate.</span></div></div><Link className="btn btn-primary btn-lg" href={requestHref}>Get a vetted shortlist</Link><Link className="btn" href="/find-talent">Browse more profiles</Link></div>
          <div className="public-talent-note"><ShieldCheck size={16}/><span>Availability and schedule are reconfirmed before a candidate is presented to a client.</span></div>
          <div className="public-talent-note"><Globe2 size={16}/><span>Public identity is intentionally limited until the hiring workflow permits more detail.</span></div>
        </aside>
      </div>
    </div>
  </main><SiteFooter/></>;
}
