import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Search, ShieldCheck, UsersRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHero } from "@/components/marketing-hero";
import { DiscoveryCallCard } from "@/components/hiring-brief-form";
import { INDUSTRIES, type IndustryPage } from "@/lib/industries";
import { industryMetaDescription, industrySeoTitle } from "@/lib/industry-seo-content";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "Virtual Assistant Services by Industry",
  description: "Explore Virtual Assistant services by industry, including legal, healthcare, real estate, finance, construction, ecommerce, home services and more.",
  keywords: ["virtual assistant services by industry", "industry-specific virtual assistant services", "hire virtual assistant for my industry"],
  alternates: { canonical: canonicalPath("/industries") }
};

function IndustryCard({ industry, compact }: { industry: IndustryPage; compact?: boolean }) {
  return <article className={`industry-directory-card ${compact ? "industry-directory-card-compact" : ""}`}>
    <div className="industry-directory-card-top">
      <div className="industry-directory-icon"><BriefcaseBusiness size={19}/></div>
      <div>
        <h2>{industrySeoTitle(industry)}</h2>
        <p>{industryMetaDescription(industry)}</p>
      </div>
    </div>
    <div className="industry-workflow-list" aria-label={`Common ${industry.label} workflows`}>
      {industry.workflows.slice(0, compact ? 2 : 4).map((workflow, index) => <span key={`${workflow}-${index}`}><CheckCircle2 size={13}/>{workflow}</span>)}
    </div>
    <Link className="industry-card-link" href={`/industries/${industry.slug}`}>Explore {industry.label} <ArrowRight size={14}/></Link>
  </article>;
}

export default function IndustriesPage() {
  const bySlug = new Map(INDUSTRIES.map((i) => [i.slug, i]));
  const spokesByHub = new Map<string, IndustryPage[]>();
  for (const industry of INDUSTRIES) {
    if (industry.clusterSlug && bySlug.has(industry.clusterSlug)) {
      const list = spokesByHub.get(industry.clusterSlug) || [];
      list.push(industry);
      spokesByHub.set(industry.clusterSlug, list);
    }
  }
  const standalone = INDUSTRIES.filter((industry) => !industry.clusterSlug || !bySlug.has(industry.clusterSlug));
  const specializationCount = INDUSTRIES.length - standalone.length;

  return <><SiteHeader/><main id="main-content">
    <MarketingHero
      className="industries-hero"
      eyebrow="Virtual Assistant services by industry"
      title={<h1>Virtual Assistant services built around how your business actually works.</h1>}
      intro={<p>Start with the workflow, not a generic job description. Compare talent against the systems, handoffs, schedule, customer expectations and decision boundaries that matter in your industry.</p>}
      actions={<><Link className="btn btn-primary btn-lg" href="/hire">Hire a Virtual Assistant <ArrowRight size={16}/></Link><Link className="btn btn-lg" href="/find-talent">Browse Virtual Assistants</Link></>}
      trust={<><span><ShieldCheck size={16}/>Approved talent</span><span><UsersRound size={16}/>Role-specific matching</span><span><Search size={16}/>Industry workflow guides</span></>}
      form={<DiscoveryCallCard />}
    />

    <section className="industries-stat-strip" aria-label="Industry directory summary">
      <div className="container industries-stats">
        <div><strong>{standalone.length}</strong><span>core industry guides</span></div>
        <div><strong>{specializationCount}</strong><span>specialized workflows</span></div>
        <div><strong>Workflow-first</strong><span>role scoping and matching</span></div>
        <div><strong>Free</strong><span>for Virtual Assistants to join and apply</span></div>
      </div>
    </section>

    <section className="section industries-directory-section">
      <div className="container">
        <div className="industries-directory-head">
          <div><div className="kicker">Browse by industry</div><h2>Choose the business context closest to yours.</h2><p>Each guide explains what can be delegated, the systems involved, useful interview scenarios, a practical first-30-days plan, metrics to watch, and where approvals or regulated decisions should stay internal.</p></div>
          <Link className="btn" href="/services">Browse all Virtual Assistant services <ArrowRight size={15}/></Link>
        </div>

        <div className="industries-directory-grid">
          {standalone.map((industry) => {
            const spokes = spokesByHub.get(industry.slug) || [];
            return <div className="industry-cluster" key={industry.slug}>
              <IndustryCard industry={industry}/>
              {spokes.length ? <div className="industry-specializations">
                <div className="industry-specializations-label">Specialized guides</div>
                <div className="industry-specializations-grid">{spokes.map((spoke) => <IndustryCard industry={spoke} compact key={spoke.slug}/>)}</div>
              </div> : null}
            </div>;
          })}
        </div>
      </div>
    </section>

    <section className="section section-white">
      <div className="container industries-bottom-grid">
        <div>
          <div className="kicker">Not sure which guide fits?</div>
          <h2>Describe the work. We can help define the Virtual Assistant role.</h2>
          <p className="muted">You do not need to know the perfect job title. Tell us what repeats every week, which tools your team uses, the hours you need covered, and where work is getting stuck. That is enough to start a useful role brief.</p>
        </div>
        <div className="industries-bottom-actions">
          <Link className="btn btn-primary btn-lg" href="/hire">Start a Hiring Request <ArrowRight size={16}/></Link>
          <Link className="text-link" href="/find-talent">Browse approved Virtual Assistants <ArrowRight size={14}/></Link>
        </div>
      </div>
    </section>
  </main><SiteFooter/></>;
}
