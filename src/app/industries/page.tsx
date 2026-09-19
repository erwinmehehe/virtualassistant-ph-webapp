import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompactPageHeader } from "@/components/compact-page-header";
import { Band, CtaBand, SectionHead } from "@/components/hiring-page-sections";
import { INDUSTRIES, type IndustryPage } from "@/lib/industries";
import { industryMetaDescription, industrySeoTitle } from "@/lib/industry-seo-content";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { canonicalPath } from "@/lib/seo-url";
import "../homepage-sections.css";
import "../hiring-pages.css";
import "../info-pages.css";

export const metadata: Metadata = {
  title: "Virtual Assistant Services by Industry",
  description: "Explore Virtual Assistant services by industry, including legal, healthcare, real estate, finance, construction, ecommerce, home services and more.",
  keywords: ["virtual assistant services by industry", "industry-specific virtual assistant services", "hire virtual assistant for my industry"],
  alternates: { canonical: canonicalPath("/industries") }
};

function capitalise(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function IndustryCard({ industry, spokes }: { industry: IndustryPage; spokes: IndustryPage[] }) {
  return <article className="ip-industry">
    <div className="ip-industry-head">
      <span className="sp-card-icon" aria-hidden="true"><BriefcaseBusiness size={18}/></span>
      <h3><Link href={`/industries/${industry.slug}`}>{industrySeoTitle(industry)}</Link></h3>
    </div>
    <p className="ip-industry-desc">{industryMetaDescription(industry)}</p>
    <ul className="ip-bullets" aria-label={`Common ${industry.label} workflows`}>
      {industry.workflows.slice(0, 3).map((workflow, index) => <li key={`${workflow}-${index}`}>{capitalise(workflow)}</li>)}
    </ul>
    {spokes.length ? <div className="ip-spokes">
      <span>Specialized guides</span>
      <div>{spokes.map((spoke) => <Link key={spoke.slug} href={`/industries/${spoke.slug}`}>{spoke.label}</Link>)}</div>
    </div> : null}
    <Link className="hs-link ip-industry-link" href={`/industries/${industry.slug}`}>Explore {industry.label} <ArrowRight size={14}/></Link>
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
    <CompactPageHeader
      eyebrow="Virtual Assistant services by industry"
      title={<h1>Find VA support by business workflow.</h1>}
      description={<p>Choose the business context closest to yours, then compare the roles, systems, handoffs, schedules, and approval boundaries that matter.</p>}
      actions={<><Link className="btn btn-primary" href="/hire">Hire a Virtual Assistant <ArrowRight size={16}/></Link><Link className="btn" href="/find-talent">Browse Virtual Assistants</Link></>}
    />

    <section className="ip-stats" aria-label="Industry directory summary">
      <div className="container ip-stats-grid">
        <div><strong>{standalone.length}</strong><span>core industry guides</span></div>
        <div><strong>{specializationCount}</strong><span>specialized workflow guides</span></div>
        <div><strong>{SERVICE_PAGES.length}</strong><span>Virtual Assistant roles</span></div>
        <div><strong>Workflow-first</strong><span>role scoping and matching</span></div>
      </div>
    </section>

    <div className="hs-root sp-root">
      <Band tone="soft">
        <SectionHead
          kicker="Browse by industry"
          title="Choose the business context closest to yours."
          lede="Each guide explains what can be delegated, the systems involved, useful interview scenarios, a practical first-30-days plan, metrics to watch, and where approvals or regulated decisions should stay internal."
          action={<Link className="hs-btn hs-btn-ghost" href="/services">Browse all Virtual Assistant services <ArrowRight size={16}/></Link>}
        />
        <div className="ip-industry-grid">
          {standalone.map((industry) => <IndustryCard key={industry.slug} industry={industry} spokes={spokesByHub.get(industry.slug) || []}/>)}
        </div>
      </Band>

      <CtaBand
        kicker="Not sure which guide fits?"
        title="Describe the work. We can help define the Virtual Assistant role."
        body="You do not need to know the perfect job title. Tell us what repeats every week, which tools your team uses, the hours you need covered, and where work is getting stuck. That is enough to start a useful role brief."
        primary={{ href: "/hire", label: "Start a Hiring Request", track: "industries_index_final_cta" }}
        secondary={{ href: "/find-talent", label: "Browse approved Virtual Assistants" }}
      />
    </div>
  </main><SiteFooter/></>;
}
