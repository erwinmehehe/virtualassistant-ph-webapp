import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, CheckCircle2, Filter, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PublicAvatar } from "@/components/public-avatar";
import { createClient } from "@/lib/supabase/server";
import { VA_CATEGORIES } from "@/lib/constants";
import { PUBLIC_VA_MIN_EXPERIENCE } from "@/lib/public-routing";
import { mergeUniqueStrings, uniqueStrings } from "@/lib/collections";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "Browse Vetted Filipino Virtual Assistants",
  description: "Browse approved Filipino virtual assistants with at least two years of experience by specialty, tools, availability, and schedule fit.",
  keywords: ["vetted virtual assistants philippines", "hire filipino virtual assistant", "browse virtual assistants", "filipino va directory"],
  alternates: { canonical: canonicalPath("/find-talent") }
};

function includesText(value: unknown, query: string) {
  if (!query) return true;
  if (Array.isArray(value)) return value.some((x) => String(x).toLowerCase().includes(query));
  return String(value ?? "").toLowerCase().includes(query);
}

const TALENT_PAGE_SIZE = 24;
function talentPageHref(params: Record<string,string|undefined>, page: number) {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value && key !== "page") out.set(key, value);
  if (page > 1) out.set("page", String(page));
  const query = out.toString();
  return `/find-talent${query ? `?${query}` : ""}`;
}

export default async function FindTalentPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  let data: any[] | null = null;
  let certCounts = new Map<string, number>();
  try {
    const supabase = await createClient();
    const result = await supabase.from("public_va_directory").select("*").gte("years_experience", PUBLIC_VA_MIN_EXPERIENCE).limit(200);
    data = result.data;
    const { data: certs } = await supabase.from("public_va_certifications").select("va_id");
    for (const c of certs || []) certCounts.set(c.va_id, (certCounts.get(c.va_id) || 0) + 1);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("[find-talent] Supabase unavailable:", (err as Error).message);
  }
  const q = String(params.q ?? "").trim().toLowerCase();
  const category = String(params.category ?? "").trim();
  const tool = String(params.tool ?? "").trim().toLowerCase();
  const minHours = Number(params.min_hours || 0);
  const minExperience = Math.max(PUBLIC_VA_MIN_EXPERIENCE, Number(params.min_experience || PUBLIC_VA_MIN_EXPERIENCE));
  const minOverlap = Number(params.min_overlap || 0);
  const minRate = Number(params.min_rate || 0);
  const maxRate = Number(params.max_rate || 0);
  const timezone = String(params.timezone ?? "").trim().toLowerCase();
  const portfolioOnly = params.portfolio === "1";
  const sort = params.sort || "recommended";

  let vas = (data || []).filter((va:any) => {
    if (!va.slug) return false;
    const categories = [va.primary_category, ...(va.categories || [])].filter(Boolean);
    const matchesCategory = !category || categories.includes(category);
    const matchesQuery = !q || [va.full_name, va.headline, va.bio, va.primary_category].some((v) => includesText(v, q)) || [va.categories, va.skills, va.tools, va.industries, va.languages].some((v) => includesText(v, q));
    const matchesTool = !tool || (va.tools || []).some((x:string) => x.toLowerCase().includes(tool));
    const matchesHours = !minHours || Number(va.weekly_hours || 0) >= minHours;
    const matchesExperience = Number(va.years_experience || 0) >= minExperience;
    const matchesOverlap = !minOverlap || Number(va.overlap_hours || 0) >= minOverlap;
    const rate = Number(va.hourly_rate || 0);
    const matchesMinRate = !minRate || rate >= minRate;
    const matchesMaxRate = !maxRate || (rate > 0 && rate <= maxRate);
    const matchesTimezone = !timezone || String(va.preferred_timezone || va.schedule || "").toLowerCase().includes(timezone);
    const matchesPortfolio = !portfolioOnly || Boolean(va.has_portfolio);
    return matchesCategory && matchesQuery && matchesTool && matchesHours && matchesExperience && matchesOverlap && matchesMinRate && matchesMaxRate && matchesTimezone && matchesPortfolio;
  });

  if (sort === "experience") vas = vas.sort((a:any,b:any) => Number(b.years_experience || 0) - Number(a.years_experience || 0));
  if (sort === "availability") vas = vas.sort((a:any,b:any) => Number(b.weekly_hours || 0) - Number(a.weekly_hours || 0));
  if (sort === "rate") vas = vas.sort((a:any,b:any) => Number(a.hourly_rate || 9999) - Number(b.hourly_rate || 9999));
  if (sort === "newest") vas = vas.sort((a:any,b:any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  const totalResults = vas.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / TALENT_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(params.page || 1) || 1));
  const pageVas = vas.slice((page - 1) * TALENT_PAGE_SIZE, page * TALENT_PAGE_SIZE);

  return <><SiteHeader/><main id="main-content" className="talent-directory-page">
    <section className="public-directory-hero"><div className="container"><div className="public-directory-hero-grid"><div><h1>Find experienced Filipino virtual assistants.</h1><p>Browse approved talent with <strong>2+ years of professional experience</strong>, or send us the role and let our recruiting team build a focused shortlist for you.</p></div><div className="row wrap"><Link className="btn btn-primary btn-lg" href="/hire">Start a Hiring Request <ArrowRight size={16}/></Link><Link className="btn btn-lg" href="/how-vetting-works">How we screen</Link></div></div></div></section>

    <section className="section directory-section"><div className="container">
      <form className="directory-filterbar" method="get">
        <div className="directory-filter-search"><Search size={16}/><input name="q" defaultValue={params.q} aria-label="Search talent" placeholder="Search skills, tools, or specialty"/></div>
        <select name="category" defaultValue={category} aria-label="Specialty"><option value="">All specialties</option>{VA_CATEGORIES.map((x,index)=><option key={`${String(x)}-${index}`}>{x}</option>)}</select>
        <select name="min_experience" defaultValue={String(minExperience)} aria-label="Experience"><option value="2">2+ years</option><option value="3">3+ years</option><option value="5">5+ years</option><option value="8">8+ years</option></select>
        <select name="min_hours" defaultValue={params.min_hours || ""} aria-label="Availability"><option value="">Any availability</option><option value="10">10+ hrs/week</option><option value="20">20+ hrs/week</option><option value="30">30+ hrs/week</option><option value="40">40+ hrs/week</option></select>
        <details className="directory-more-filters"><summary><Filter size={15}/> More</summary><div className="directory-more-panel"><label>Tool keyword<input name="tool" defaultValue={params.tool} placeholder="HubSpot, Canva..."/></label><label>Live overlap<select name="min_overlap" defaultValue={params.min_overlap || ""}><option value="">Any overlap</option><option value="2">2+ hrs/day</option><option value="4">4+ hrs/day</option><option value="6">6+ hrs/day</option></select></label><label>Min hourly rate<input type="number" min="5" step="1" name="min_rate" defaultValue={params.min_rate} placeholder="5"/></label><label>Max hourly rate<input type="number" min="5" step="1" name="max_rate" defaultValue={params.max_rate} placeholder="20"/></label><label>Timezone / schedule<input name="timezone" defaultValue={params.timezone} placeholder="US Eastern, GMT+8..."/></label><label className="inline-check"><input type="checkbox" name="portfolio" value="1" defaultChecked={portfolioOnly}/><span>Has portfolio</span></label></div></details>
        <select name="sort" defaultValue={sort} aria-label="Sort"><option value="recommended">Recommended</option><option value="experience">Most experienced</option><option value="availability">Most available</option><option value="rate">Lowest rate</option><option value="newest">Newest profiles</option></select>
        <button className="btn btn-primary directory-apply" type="submit">Apply</button>
        <Link className="directory-reset" href="/find-talent">Reset</Link>
      </form>

      <div className="directory-result-head"><div><strong>{totalResults} available profile{totalResults === 1 ? "" : "s"}</strong><span className="small muted">Only approved, available VAs with 2+ years of experience are shown.</span></div></div>
      {pageVas.length ? <><div className="talent-directory-grid">{pageVas.map((va:any)=><article className="talent-market-card" key={va.user_id}>
        <div className="talent-market-head"><PublicAvatar name={va.full_name} src={va.avatar_url}/><div><div className="talent-name-row"><h2>{va.full_name}</h2><span className="verified-dot" title="Approved profile"><CheckCircle2 size={15}/></span></div><p>{va.headline || va.primary_category || "Virtual Assistant"}</p></div></div>
        <div className="talent-market-meta"><span><strong>{va.years_experience} yrs</strong> experience</span><span><strong>{va.weekly_hours || "Flexible"}</strong>{va.weekly_hours ? " hrs/week" : " availability"}</span>{va.hourly_rate ? <span><strong>${Number(va.hourly_rate).toFixed(0)}/hr</strong> preferred</span> : null}{certCounts.get(va.user_id) ? <span><Award size={13}/> <strong>{certCounts.get(va.user_id)}</strong> certified</span> : null}{va.email_verified ? <span><CheckCircle2 size={13}/> Email verified</span> : null}{va.identity_verified_at ? <span><CheckCircle2 size={13}/> Identity verified</span> : null}{va.last_active_at ? <span>Active {Math.max(0, Math.floor((Date.now()-new Date(va.last_active_at).getTime())/86400000))}d ago</span> : null}</div>
        <div className="pill-list">{mergeUniqueStrings(va.primary_category, va.categories).slice(0,3).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div>
        <p className="talent-market-summary">{va.bio ? `${va.bio.slice(0,155)}${va.bio.length>155?"…":""}` : "Open the profile to review skills, tools, experience, availability, and approved vetting milestones."}</p>
        <div className="talent-skill-preview">{uniqueStrings(va.skills).slice(0,4).map((skill,index)=><span key={`${String(skill)}-${index}`}>{skill}</span>)}</div>
        <Link className="btn talent-card-cta" href={`/va/${va.slug}`}>View profile <ArrowRight size={15}/></Link>
      </article>)}</div>{totalPages > 1 ? <nav className="pagination" aria-label="Talent results pages"><Link className={`btn btn-sm ${page <= 1 ? "disabled" : ""}`} aria-disabled={page <= 1} href={talentPageHref(params, Math.max(1,page-1))}>Previous</Link><span className="small muted">Page {page} of {totalPages}</span><Link className={`btn btn-sm ${page >= totalPages ? "disabled" : ""}`} aria-disabled={page >= totalPages} href={talentPageHref(params, Math.min(totalPages,page+1))}>Next</Link></nav> : null}</> : <div className="card empty"><h3>No profiles match those filters.</h3><p>Try a broader specialty or availability range, or send us the role and we can match the approved pool directly.</p><div className="row wrap" style={{justifyContent:"center"}}><Link className="btn" href="/find-talent">Clear filters</Link><Link className="btn btn-primary" href="/hire">Start a Hiring Request</Link></div></div>}
    </div></section>
  </main><SiteFooter/></>;
}
