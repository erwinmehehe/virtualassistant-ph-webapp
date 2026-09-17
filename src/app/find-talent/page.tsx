import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Filter, Heart, Search } from "lucide-react";
import { toggleSavedVaAction } from "@/app/actions/saved-vas";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PublicAvatar } from "@/components/public-avatar";
import { createClient } from "@/lib/supabase/server";
import { VA_CATEGORIES } from "@/lib/constants";
import { PUBLIC_VA_MIN_EXPERIENCE } from "@/lib/public-routing";
import { uniqueStrings } from "@/lib/collections";
import { canonicalPath } from "@/lib/seo-url";
import "../cro-hiring-tools.css";

export const metadata: Metadata = {
  title: "Browse Vetted Filipino Virtual Assistants",
  description: "Browse recruiter-reviewed Filipino virtual assistants with at least two years of experience, then tell us the role and we will build your shortlist.",
  keywords: ["vetted virtual assistants philippines", "hire filipino virtual assistant", "browse virtual assistants", "filipino va directory"],
  alternates: { canonical: canonicalPath("/find-talent") },
};

type PublicVaRow = {
  user_id: string;
  slug: string;
  full_name: string;
  avatar_url?: string | null;
  headline?: string | null;
  bio?: string | null;
  primary_category?: string | null;
  categories?: string[] | null;
  skills?: string[] | null;
  tools?: string[] | null;
  industries?: string[] | null;
  languages?: string[] | null;
  weekly_hours?: number | null;
  years_experience?: number | null;
  overlap_hours?: number | null;
  preferred_timezone?: string | null;
  schedule?: string | null;
  has_portfolio?: boolean | null;
  created_at?: string | null;
};

function includesText(value: unknown, query: string) {
  if (!query) return true;
  if (Array.isArray(value)) return value.some((item) => String(item).toLowerCase().includes(query));
  return String(value ?? "").toLowerCase().includes(query);
}

const TALENT_PAGE_SIZE = 24;

function talentPageHref(params: Record<string, string | undefined>, page: number) {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page" && key !== "saved") out.set(key, value);
  }
  if (page > 1) out.set("page", String(page));
  const query = out.toString();
  return `/find-talent${query ? `?${query}` : ""}`;
}

export default async function FindTalentPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  let data: PublicVaRow[] = [];
  let isClient = false;
  const savedIds = new Set<string>();

  try {
    const supabase = await createClient();
    const [{ data: directory }, { data: authData }] = await Promise.all([
      supabase.from("public_va_directory").select("*").gte("years_experience", PUBLIC_VA_MIN_EXPERIENCE).limit(200),
      supabase.auth.getUser(),
    ]);
    data = (directory || []) as PublicVaRow[];

    const user = authData.user;
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      isClient = profile?.role === "client";
      if (isClient) {
        const { data: saved } = await supabase.from("saved_vas").select("va_id").eq("client_id", user.id);
        for (const row of saved || []) savedIds.add(String(row.va_id));
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[find-talent] Supabase unavailable:", (error as Error).message);
  }

  const q = String(params.q ?? "").trim().toLowerCase();
  const category = String(params.category ?? "").trim();
  const tool = String(params.tool ?? "").trim().toLowerCase();
  const minHours = Number(params.min_hours || 0);
  const minExperience = Math.max(PUBLIC_VA_MIN_EXPERIENCE, Number(params.min_experience || PUBLIC_VA_MIN_EXPERIENCE));
  const minOverlap = Number(params.min_overlap || 0);
  const timezone = String(params.timezone ?? "").trim().toLowerCase();
  const portfolioOnly = params.portfolio === "1";
  const sort = params.sort || "recommended";

  let vas = data.filter((va) => {
    if (!va.slug) return false;
    const categories = [va.primary_category, ...(va.categories || [])].filter(Boolean);
    const matchesCategory = !category || categories.includes(category);
    const matchesQuery = !q || [va.full_name, va.headline, va.bio, va.primary_category].some((value) => includesText(value, q)) || [va.categories, va.skills, va.tools, va.industries, va.languages].some((value) => includesText(value, q));
    const matchesTool = !tool || (va.tools || []).some((item) => item.toLowerCase().includes(tool));
    const matchesHours = !minHours || Number(va.weekly_hours || 0) >= minHours;
    const matchesExperience = Number(va.years_experience || 0) >= minExperience;
    const matchesOverlap = !minOverlap || Number(va.overlap_hours || 0) >= minOverlap;
    const matchesTimezone = !timezone || String(va.preferred_timezone || va.schedule || "").toLowerCase().includes(timezone);
    const matchesPortfolio = !portfolioOnly || Boolean(va.has_portfolio);
    return matchesCategory && matchesQuery && matchesTool && matchesHours && matchesExperience && matchesOverlap && matchesTimezone && matchesPortfolio;
  });

  if (sort === "experience") vas = vas.sort((a, b) => Number(b.years_experience || 0) - Number(a.years_experience || 0));
  if (sort === "availability") vas = vas.sort((a, b) => Number(b.weekly_hours || 0) - Number(a.weekly_hours || 0));
  if (sort === "newest") vas = vas.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  const totalResults = vas.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / TALENT_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(params.page || 1) || 1));
  const pageVas = vas.slice((page - 1) * TALENT_PAGE_SIZE, page * TALENT_PAGE_SIZE);
  const currentHref = talentPageHref(params, page);

  return <><SiteHeader/><main id="main-content" className="talent-directory-page">
    <section className="public-directory-hero"><div className="container"><div className="public-directory-hero-grid"><div><h1>Meet experienced Filipino virtual assistants.</h1><p>Review examples of recruiter-approved talent, then tell us what you need. We will confirm availability and present a focused shortlist for your role.</p></div><div className="row wrap"><Link className="btn btn-primary btn-lg" href="/hire">Get a vetted shortlist <ArrowRight size={16}/></Link><Link className="btn btn-lg" href="/how-vetting-works">How we screen</Link></div></div></div></section>

    <section className="section directory-section"><div className="container">
      {params.saved ? <div className="success-banner" role="status">{params.saved === "1" ? "Virtual Assistant saved to your shortlist." : "Virtual Assistant removed from your saved list."} <Link href="/workspace/client/saved">View saved VAs</Link></div> : null}
      <form className="directory-filterbar" method="get">
        <div className="directory-filter-search"><Search size={16}/><input name="q" defaultValue={params.q} aria-label="Search talent" placeholder="Search skills, tools, or specialty"/></div>
        <select name="category" defaultValue={category} aria-label="Specialty"><option value="">All specialties</option>{VA_CATEGORIES.map((item, index)=><option key={`${String(item)}-${index}`}>{item}</option>)}</select>
        <select name="min_experience" defaultValue={String(minExperience)} aria-label="Experience"><option value="2">2+ years</option><option value="3">3+ years</option><option value="5">5+ years</option><option value="8">8+ years</option></select>
        <select name="min_hours" defaultValue={params.min_hours || ""} aria-label="Availability"><option value="">Any availability</option><option value="10">10+ hrs/week</option><option value="20">20+ hrs/week</option><option value="30">30+ hrs/week</option><option value="40">40+ hrs/week</option></select>
        <details className="directory-more-filters"><summary><Filter size={15}/> More</summary><div className="directory-more-panel"><label>Tool keyword<input name="tool" defaultValue={params.tool} placeholder="HubSpot, Canva..."/></label><label>Live overlap<select name="min_overlap" defaultValue={params.min_overlap || ""}><option value="">Any overlap</option><option value="2">2+ hrs/day</option><option value="4">4+ hrs/day</option><option value="6">6+ hrs/day</option></select></label><label>Timezone / schedule<input name="timezone" defaultValue={params.timezone} placeholder="US Eastern, GMT+8..."/></label><label className="inline-check"><input type="checkbox" name="portfolio" value="1" defaultChecked={portfolioOnly}/><span>Has portfolio</span></label></div></details>
        <select name="sort" defaultValue={sort} aria-label="Sort"><option value="recommended">Recommended</option><option value="experience">Most experienced</option><option value="availability">Most available</option><option value="newest">Newest profiles</option></select>
        <button className="btn btn-primary directory-apply" type="submit">Apply</button>
        <Link className="directory-reset" href="/find-talent">Reset</Link>
      </form>

      <div className="directory-result-head"><div><strong>{totalResults} approved profile{totalResults === 1 ? "" : "s"}</strong><span className="small muted">These are talent examples. Your recruiter confirms current fit and availability before presenting anyone to you.</span></div>{isClient ? <Link className="btn btn-sm" href="/workspace/client/saved"><Heart size={14}/> Saved VAs</Link> : null}</div>
      {pageVas.length ? <><div className="talent-directory-grid">{pageVas.map((va)=>{
        const skills = uniqueStrings(va.skills).slice(0,3);
        const isSaved = savedIds.has(va.user_id);
        return <article className="talent-market-card" key={va.user_id}>
          <div className="talent-market-head"><PublicAvatar name={va.full_name} src={va.avatar_url}/><div><div className="talent-name-row"><h2>{va.full_name}</h2><span className="verified-dot" title="Recruiter reviewed"><CheckCircle2 size={15}/></span></div><p>{va.headline || va.primary_category || "Virtual Assistant"}</p></div></div>
          <div className="talent-market-meta"><span><strong>{va.years_experience} yrs</strong> experience</span><span><strong>{va.weekly_hours || "Flexible"}</strong>{va.weekly_hours ? " hrs/week" : " availability"}</span></div>
          <p className="talent-market-summary">{va.bio ? `${va.bio.slice(0,155)}${va.bio.length>155?"…":""}` : "Review this profile for experience, skills, tools, and schedule fit. Our recruiter confirms the final match before client introduction."}</p>
          {skills.length ? <div className="talent-skill-preview">{skills.map((skill,index)=><span key={`${String(skill)}-${index}`}>{skill}</span>)}</div> : null}
          <div className="row wrap" style={{marginTop:16}}><Link className="btn btn-sm btn-primary" href={`/va/${va.slug}`}>View profile</Link>{isClient ? <form action={toggleSavedVaAction}><input type="hidden" name="va_id" value={va.user_id}/><input type="hidden" name="return_to" value={currentHref}/><button className="btn btn-sm" type="submit"><Heart size={14} fill={isSaved ? "currentColor" : "none"}/>{isSaved ? "Saved" : "Save"}</button></form> : null}</div>
        </article>;
      })}</div>{totalPages > 1 ? <nav className="pagination" aria-label="Talent results pages"><Link className={`btn btn-sm ${page <= 1 ? "disabled" : ""}`} aria-disabled={page <= 1} href={talentPageHref(params, Math.max(1,page-1))}>Previous</Link><span className="small muted">Page {page} of {totalPages}</span><Link className={`btn btn-sm ${page >= totalPages ? "disabled" : ""}`} aria-disabled={page >= totalPages} href={talentPageHref(params, Math.min(totalPages,page+1))}>Next</Link></nav> : null}</> : <div className="card empty"><h3>No profiles match those filters.</h3><p>Try a broader specialty or availability range, or send us the role and we can match the approved pool directly.</p><div className="row wrap" style={{justifyContent:"center"}}><Link className="btn" href="/find-talent">Clear filters</Link><Link className="btn btn-primary" href="/hire">Get a vetted shortlist</Link></div></div>}
    </div></section>
  </main><SiteFooter/></>;
}
