import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle2, Filter, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompactPageHeader } from "@/components/compact-page-header";
import { PublicAvatar } from "@/components/public-avatar";
import { VA_CATEGORIES } from "@/lib/constants";
import { PUBLIC_VA_MIN_EXPERIENCE } from "@/lib/public-routing";
import { uniqueStrings } from "@/lib/collections";
import { searchPublicTalent } from "@/lib/talent-search";
import { canonicalPath } from "@/lib/seo-url";
import { getTrainingCredentialsForUsers } from "@/lib/training-credentials";
import "../cro-hiring-tools.css";

export const metadata: Metadata = {
  title: "Browse Vetted Filipino Virtual Assistants",
  description: "Browse recruiter-reviewed Filipino virtual assistants with at least two years of experience, then tell us the role and we will build your shortlist.",
  keywords: ["vetted virtual assistants philippines", "hire filipino virtual assistant", "browse virtual assistants", "filipino va directory"],
  alternates: { canonical: canonicalPath("/find-talent") }
};

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
  const q = String(params.q ?? "").trim();
  const category = String(params.category ?? "").trim();
  const tool = String(params.tool ?? "").trim();
  const minHours = Number(params.min_hours || 0);
  const minExperience = Math.max(PUBLIC_VA_MIN_EXPERIENCE, Number(params.min_experience || PUBLIC_VA_MIN_EXPERIENCE));
  const minOverlap = Number(params.min_overlap || 0);
  const timezone = String(params.timezone ?? "").trim();
  const portfolioOnly = params.portfolio === "1";
  const sort = params.sort || "recommended";
  const requestedPage = Math.max(1, Number(params.page || 1) || 1);

  let pageVas: any[] = [];
  let totalResults = 0;
  let semanticSearchActive = false;
  try {
    const result = await searchPublicTalent({
      query: q,
      category,
      tool,
      minHours,
      minExperience,
      minOverlap,
      timezone,
      portfolioOnly,
      sort,
      page: requestedPage,
      pageSize: TALENT_PAGE_SIZE,
    });
    pageVas = result.rows;
    totalResults = result.total;
    semanticSearchActive = result.semantic;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("[find-talent] Search unavailable:", (err as Error).message);
  }

  const publicTrainingByUser = await getTrainingCredentialsForUsers(
    pageVas.map((va) => String(va.user_id || "")).filter(Boolean),
    { publicOnly: true },
  );

  const totalPages = Math.max(1, Math.ceil(totalResults / TALENT_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  return <><SiteHeader/><main id="main-content" className="talent-directory-page">
    <CompactPageHeader
      eyebrow="Recruiter-approved talent"
      title={<h1>Meet experienced Filipino virtual assistants.</h1>}
      description={<p>Filter by specialty, experience, availability, tools, and schedule. We confirm current fit before presenting a shortlist.</p>}
      meta={<span><strong>{totalResults}</strong> approved profile{totalResults===1?"":"s"}</span>}
      actions={<><Link className="btn btn-primary" href="/hire">Get a vetted shortlist <ArrowRight size={16}/></Link><Link className="btn" href="/how-vetting-works">How we screen</Link></>}
    />

    <section className="section directory-section"><div className="container">
      <form className="directory-filterbar" method="get">
        <div className="directory-filter-search"><Search size={16}/><input name="q" defaultValue={params.q} aria-label="Search talent" placeholder="Search skills, tools, or specialty"/></div>
        <select name="category" defaultValue={category} aria-label="Specialty"><option value="">All specialties</option>{VA_CATEGORIES.map((x,index)=><option key={`${String(x)}-${index}`}>{x}</option>)}</select>
        <select name="min_experience" defaultValue={String(minExperience)} aria-label="Experience"><option value="2">2+ years</option><option value="3">3+ years</option><option value="5">5+ years</option><option value="8">8+ years</option></select>
        <select name="min_hours" defaultValue={params.min_hours || ""} aria-label="Availability"><option value="">Any availability</option><option value="10">10+ hrs/week</option><option value="20">20+ hrs/week</option><option value="30">30+ hrs/week</option><option value="40">40+ hrs/week</option></select>
        <details className="directory-more-filters"><summary><Filter size={15}/> More</summary><div className="directory-more-panel"><label>Tool keyword<input name="tool" defaultValue={params.tool} placeholder="HubSpot, Canva..."/></label><label>Live overlap<select name="min_overlap" defaultValue={params.min_overlap || ""}><option value="">Any overlap</option><option value="2">2+ hrs/day</option><option value="4">4+ hrs/day</option><option value="6">6+ hrs/day</option></select></label><label>Timezone / schedule<input name="timezone" defaultValue={params.timezone} placeholder="US Eastern, GMT+8..."/></label><label className="inline-check"><input type="checkbox" name="portfolio" value="1" defaultChecked={portfolioOnly}/><span>Has portfolio</span></label></div></details>
        <select name="sort" defaultValue={sort} aria-label="Sort"><option value="recommended">Recommended</option><option value="experience">Most experienced</option><option value="availability">Most available</option><option value="newest">Newest profiles</option></select>
        <button className="btn btn-primary directory-apply" type="submit">Apply</button>
        <Link className="directory-reset" href="/find-talent">Reset</Link>
      </form>

      <div className="directory-result-head"><div><strong>{totalResults} approved profile{totalResults === 1 ? "" : "s"}</strong><span className="small muted">{q && semanticSearchActive ? "Search combines meaning, skills, tools, and your structured filters. " : ""}These are talent examples. Your recruiter confirms current fit and availability before presenting anyone to you.</span></div></div>
      {pageVas.length ? <><div className="talent-directory-grid">{pageVas.map((va:any)=>{
        const skills = uniqueStrings(va.skills).slice(0,3);
        const publicTraining = (publicTrainingByUser.get(String(va.user_id)) || []).slice(0, 2);
        return <article className="talent-market-card" key={va.user_id}>
          <div className="talent-market-head"><PublicAvatar name={va.full_name} src={va.avatar_url}/><div><div className="talent-name-row"><h2>{va.full_name}</h2><span className="verified-dot" title="Recruiter reviewed"><CheckCircle2 size={15}/></span></div><p>{va.headline || va.primary_category || "Virtual Assistant"}</p></div></div>
          <div className="talent-market-meta"><span><strong>{va.years_experience} yrs</strong> experience</span><span><strong>{va.weekly_hours || "Flexible"}</strong>{va.weekly_hours ? " hrs/week" : " availability"}</span></div>
          <p className="talent-market-summary">{va.bio ? `${va.bio.slice(0,155)}${va.bio.length>155?"…":""}` : "Review this profile for experience, skills, tools, and schedule fit. Our recruiter confirms the final match before client introduction."}</p>
          {skills.length ? <div className="talent-skill-preview">{skills.map((skill,index)=><span key={`${String(skill)}-${index}`}>{skill}</span>)}</div> : null}
          {publicTraining.length ? (
            <div className="talent-training-preview" aria-label="Public training certificates">
              <span className="talent-training-label"><BadgeCheck size={13}/> Verified training</span>
              <div>
                {publicTraining.map((credential) => (
                  <Link
                    key={credential.id}
                    href={`/training/certificates/${encodeURIComponent(credential.credentialCode)}`}
                    target="_blank"
                  >
                    {credential.courseTitle}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </article>;
      })}</div>{totalPages > 1 ? <nav className="pagination" aria-label="Talent results pages"><Link className={`btn btn-sm ${page <= 1 ? "disabled" : ""}`} aria-disabled={page <= 1} href={talentPageHref(params, Math.max(1,page-1))}>Previous</Link><span className="small muted">Page {page} of {totalPages}</span><Link className={`btn btn-sm ${page >= totalPages ? "disabled" : ""}`} aria-disabled={page >= totalPages} href={talentPageHref(params, Math.min(totalPages,page+1))}>Next</Link></nav> : null}</> : <div className="card empty"><h3>No profiles match those filters.</h3><p>Try a broader specialty or availability range, or send us the role and we can match the approved pool directly.</p><div className="row wrap" style={{justifyContent:"center"}}><Link className="btn" href="/find-talent">Clear filters</Link><Link className="btn btn-primary" href="/hire">Get a vetted shortlist</Link></div></div>}
    </div></section>

    <section className="section" aria-labelledby="talent-directory-guide"><div className="container">
      <div className="directory-result-head"><div><h2 id="talent-directory-guide">How to use the Virtual Assistant directory</h2><span className="small muted">Profiles are examples, not an unreviewed marketplace. A recruiter confirms role fit, interest, availability, schedule, and compensation before client presentation.</span></div></div>
      <div className="grid grid-3">
        <article className="card"><h3>Start with the work</h3><p>Use <Link href="/services">Virtual Assistant services</Link> to compare responsibilities and choose the closest role before filtering profiles.</p></article>
        <article className="card"><h3>Check the hiring model</h3><p>Review <Link href="/pricing">pricing and service models</Link> so candidate compensation, recruiting support, and ongoing management are not treated as the same cost.</p></article>
        <article className="card"><h3>Compare provider support</h3><p>Use the <Link href="/blog/virtual-assistant-companies-philippines">Virtual Assistant companies guide</Link> to compare marketplaces, recruitment, direct hire, and managed service.</p></article>
      </div>
    </div></section>
  </main><SiteFooter/></>;
}
