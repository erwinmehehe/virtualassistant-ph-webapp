import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, ArrowLeft, CheckCircle2, Clock3, EyeOff, Globe2, Heart, ShieldCheck, Sparkles, Star } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PublicAvatar } from "@/components/public-avatar";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { PUBLIC_VA_MIN_EXPERIENCE, isUuid, publicDisplayName } from "@/lib/public-routing";
import { dateShort } from "@/lib/format";
import { mergeUniqueStrings, uniqueStrings } from "@/lib/collections";
import { toggleSavedVaAction } from "@/app/actions/saved-vas";
import { canonicalPath } from "@/lib/seo-url";

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
  if (!va) return { title: "Vetted Virtual Assistant Profile" };
  const name = publicDisplayName(va.full_name);
  return {
    title: `${name} | ${va.headline || va.primary_category || "Virtual Assistant"}`,
    description: va.bio ? String(va.bio).slice(0, 155) : `View this approved ${va.primary_category || "Filipino virtual assistant"} profile with ${va.years_experience || 2}+ years of experience.`,
    alternates: { canonical: canonicalPath(`/va/${encodeURIComponent(va.slug || slug)}`) }
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
  const { user, profile } = await getSessionProfile();
  let isSaved = false;
  if (user && profile?.role === "client") {
    const supabase = await createClient();
    const { data: savedRow } = await supabase.from("saved_vas").select("va_id").eq("client_id",user.id).eq("va_id",va.user_id).maybeSingle();
    isSaved = Boolean(savedRow);
  }
  const reviews = publicReviews || [];
  const averageRating = reviews.length ? reviews.reduce((sum:any, review:any) => sum + Number(review.rating || 0), 0) / reviews.length : 0;
  const displayName = publicDisplayName(va.full_name);
  const requestHref = profile?.role === "client" ? `/workspace/client?talent=${encodeURIComponent(slug)}` : `/hire?talent=${encodeURIComponent(slug)}`;
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
  const categories = mergeUniqueStrings(va.primary_category, va.categories);
  const skills = uniqueStrings(va.skills);
  const tools = uniqueStrings(va.tools);
  const industries = uniqueStrings(va.industries);
  const languages = uniqueStrings(va.languages);
  return <><SiteHeader/><main id="main-content" className="public-talent-profile"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(personJsonLd).replace(/</g,"\\u003c")}}/>
    <div className="container">
      <Link className="profile-back-link" href="/find-talent"><ArrowLeft size={15}/> Browse VAs</Link>
      <div className="public-talent-grid">
        <article className="public-talent-main">
          <header className="public-talent-hero-card">
            <div className="public-talent-avatar"><PublicAvatar name={displayName} src={va.avatar_url}/></div>
            <div className="public-talent-identity"><div className="public-talent-status"><span><CheckCircle2 size={15}/> Approved VA profile</span><span className="availability-dot">Available now</span>{va.email_verified?<span><CheckCircle2 size={14}/> Email verified</span>:null}{va.identity_verified_at?<span><ShieldCheck size={14}/> Identity verified</span>:null}</div><h1>{displayName}</h1><p className="public-talent-headline">{va.headline || va.primary_category || "Virtual Assistant"}</p><div className="public-profile-quickfacts"><span><strong>{va.years_experience}+ yrs</strong> experience</span><span><strong>{va.weekly_hours ? `${va.weekly_hours} hrs/week` : "Flexible"}</strong> availability</span>{va.hourly_rate?<span><strong>${Number(va.hourly_rate).toFixed(2)}/hr</strong> preferred</span>:null}<span><strong>{va.preferred_timezone || va.schedule || "Flexible"}</strong> timezone / schedule</span></div><div className="pill-list">{skills.slice(0,5).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div></div>
          </header>

          <section className="public-profile-section"><h2>Overview</h2><p className="public-profile-copy">{va.bio || "This approved VA has completed the platform vetting workflow. Ask for an introduction to discuss role-specific experience and fit."}</p></section>

          {reviews.length ? <section className="public-profile-section public-review-section"><div className="public-profile-section-head"><div><h2>Verified client reviews</h2><p className="public-review-intro">Only reviews from confirmed placements can appear here.</p></div><div className="public-review-summary"><span className="review-stars" aria-label={`${averageRating.toFixed(1)} out of 5 stars`}>{Array.from({length:5},(_,i)=><Star key={i} size={15} className={i < Math.round(averageRating) ? "filled" : ""}/>)}</span><strong>{averageRating.toFixed(1)}</strong><span>{reviews.length} {reviews.length===1?"review":"reviews"}</span></div></div><div className="public-review-list">{reviews.slice(0,6).map((review:any)=><article className="public-review-card" key={review.id}><div className="row-between wrap"><span className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{Array.from({length:5},(_,i)=><Star key={i} size={14} className={i < Number(review.rating) ? "filled" : ""}/>)}</span><span className="review-public-state"><Globe2 size={13}/> Public review</span></div><p>{review.body}</p><div className="public-review-meta"><strong>{review.reviewer_label || "Verified client"}</strong><span>Confirmed placement · {dateShort(review.created_at)}</span></div></article>)}</div></section> : null}

          {certifications?.length ? <section className="public-profile-section"><div className="public-profile-section-head"><h2>Skill certifications</h2><span>{certifications.length} earned</span></div><div className="pill-list">{certifications.map((cert:any,index:number)=><span className="badge badge-success" key={`${cert.category}-${index}`}><Award size={13}/> {cert.category}</span>)}</div><p className="muted small" style={{marginTop:8}}>Earned by passing a proctored, category-specific skills test on VirtualAssistant.com.ph.</p></section> : null}

          <section className="public-profile-section"><div className="public-profile-section-head"><h2>Core skills</h2><span>{skills.length} listed</span></div>{skills.length ? <div className="profile-skill-grid">{skills.map((skill,index)=><span key={`${String(skill)}-${index}`}>{skill}</span>)}</div> : <p className="muted">No public skills listed yet.</p>}</section>

          <section className="public-profile-section two-column-profile-section"><div><h2>Tools</h2>{tools.length ? <div className="profile-text-list">{tools.map((tool,index)=><span key={`${String(tool)}-${index}`}>{tool}</span>)}</div> : <p className="muted">No public tools listed.</p>}</div><div><h2>Industries & languages</h2><div className="profile-detail-list"><div><span>Industries</span><strong>{industries.join(" · ") || "Flexible"}</strong></div><div><span>Languages</span><strong>{languages.join(" · ") || "English / Filipino"}</strong></div></div></div></section>

          <section className="public-profile-section public-vetting-section"><div><ShieldCheck size={21}/><div><h2>What has been reviewed</h2><p>Public profiles appear only after the required profile, category skills test, video introduction, recruiter review, and final approval stages.</p></div></div><div className="public-vetting-grid"><span><CheckCircle2 size={15}/> Structured profile</span><span><CheckCircle2 size={15}/> Category skills test</span><span><CheckCircle2 size={15}/> Video communication review</span><span><CheckCircle2 size={15}/> Recruiter scorecard</span><span><CheckCircle2 size={15}/> Final approval</span></div></section>

          <div className="public-profile-privacy"><EyeOff size={16}/><span>Private test answers, recruiter notes, contact details, and uploaded resumes are never shown on this public profile.</span></div>
        </article>

        <aside className="public-talent-sidebar">
          <div className="public-talent-action-card"><div className="public-talent-action-head"><span>Working fit</span><strong>{va.primary_category || "Virtual Assistant"}</strong></div><div className="public-fit-grid"><div><span>Experience</span><strong>{va.years_experience}+ years</strong></div><div><span>Availability</span><strong>{va.weekly_hours ? `${va.weekly_hours} hrs/week` : "Flexible"}</strong></div><div><span>Schedule</span><strong>{va.schedule || "Flexible"}</strong></div><div><span>Live overlap</span><strong>{va.overlap_hours != null ? `Up to ${va.overlap_hours} hrs/day` : "Flexible"}</strong></div>{va.hourly_rate ? <div className="public-rate-row"><span>Preferred rate</span><strong>${Number(va.hourly_rate).toFixed(2)}/hr</strong></div> : null}</div><div className="public-talent-cta-copy"><Sparkles size={17}/><div><strong>Interested in {displayName}?</strong><span>Attach this profile to your private hiring request. We will confirm current availability and role fit.</span></div></div><Link className="btn btn-primary btn-lg" href={requestHref}>Request an introduction</Link>{profile?.role === "client" ? <form action={toggleSavedVaAction}><input type="hidden" name="va_id" value={va.user_id}/><input type="hidden" name="return_to" value={`/va/${va.slug || slug}`}/><button className="btn" type="submit"><Heart size={15}/>{isSaved?" Remove from saved VAs":" Save VA"}</button></form> : null}<Link className="btn" href="/find-talent">Compare other VAs</Link></div>
          <div className="public-talent-note"><Clock3 size={16}/><span>Availability, rate, and schedule are self-reported and can change. Confirm the final working arrangement before hiring.</span></div>
          <div className="public-talent-note"><Globe2 size={16}/><span>Public identity is intentionally limited to first name + last initial until the hiring workflow permits more detail.</span></div>
        </aside>
      </div>
    </div>
  </main><SiteFooter/></>;
}
