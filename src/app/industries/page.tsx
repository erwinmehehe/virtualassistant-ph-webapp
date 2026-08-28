import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Search, ShieldCheck, UsersRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { INDUSTRIES, type IndustryPage } from "@/lib/industries";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "Hire Virtual Assistants by Industry Philippines",
  description: "Find Philippines-based virtual assistants by industry. Explore hiring guides for healthcare, legal, real estate, construction, ecommerce, finance, trades, and more.",
  keywords: ["virtual assistant by industry", "industry-specific virtual assistant philippines", "hire virtual assistant for my industry"],
  alternates: { canonical: canonicalPath("/industries") }
};

function IndustryCard({ industry, compact }: { industry: IndustryPage; compact?: boolean }) {
  return <article className={`industry-directory-card ${compact ? "industry-directory-card-compact" : ""}`}>
    <div className="industry-directory-card-top">
      <div className="industry-directory-icon"><BriefcaseBusiness size={19}/></div>
      <div>
        <h2>{industry.label}</h2>
        <p>{industry.metaDescription}</p>
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
    <section className="industries-hero">
      <div className="container industries-hero-grid">
        <div className="industries-hero-copy">
          <div className="industries-eyebrow">Industry-specific VA hiring</div>
          <h1>Hire a virtual assistant who already understands your type of business.</h1>
          <p>Start with your workflow, not a generic VA job description. Compare Philippines-based talent against the tools, handoffs, schedule, customer expectations, and decision boundaries that matter in your industry.</p>
          <div className="industries-hero-actions">
            <Link className="btn btn-primary btn-lg" href="/hire">Hire a Virtual Assistant <ArrowRight size={16}/></Link>
            <Link className="btn btn-lg" href="/auth/join/client?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew">Post a Job</Link>
          </div>
          <div className="industries-proof-row">
            <span><ShieldCheck size={16}/>Approved talent</span>
            <span><UsersRound size={16}/>Role-specific matching</span>
            <span><Search size={16}/>Industry hiring guides</span>
          </div>
        </div>
        <aside className="industries-hero-panel">
          <div className="industries-panel-kicker">A better way to scope the role</div>
          <h2>Use the guide before you write the job post.</h2>
          <div className="industries-panel-step"><span>01</span><div><strong>Choose your industry</strong><p>Start with the closest operating context, even if your company spans several services.</p></div></div>
          <div className="industries-panel-step"><span>02</span><div><strong>Pick the workflows to delegate</strong><p>Separate recurring admin from decisions that must stay with your local team.</p></div></div>
          <div className="industries-panel-step"><span>03</span><div><strong>Hire against evidence</strong><p>Compare relevant experience, tools, communication, schedule, and examples of similar work.</p></div></div>
          <Link className="text-link" href="/how-vetting-works">See how VA vetting works <ArrowRight size={14}/></Link>
        </aside>
      </div>
    </section>

    <section className="industries-stat-strip" aria-label="Industry directory summary">
      <div className="container industries-stats">
        <div><strong>{standalone.length}</strong><span>core industry guides</span></div>
        <div><strong>{specializationCount}</strong><span>specialized workflows</span></div>
        <div><strong>Philippines</strong><span>focused talent pool</span></div>
        <div><strong>Free</strong><span>for VAs to join and apply</span></div>
      </div>
    </section>

    <section className="section industries-directory-section">
      <div className="container">
        <div className="industries-directory-head">
          <div><div className="kicker">Browse by industry</div><h2>Choose the business context closest to yours.</h2><p>Each guide explains what can be delegated, common systems, useful interview questions, and where approvals or regulated decisions should stay internal.</p></div>
          <Link className="btn" href="/services">Browse all VA services <ArrowRight size={15}/></Link>
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
          <h2>Describe the work. We can help define the VA role.</h2>
          <p className="muted">You do not need to know the perfect job title. Tell us what repeats every week, which tools your team uses, the hours you need covered, and where work is getting stuck. That is enough to start a useful role brief.</p>
        </div>
        <div className="industries-bottom-actions">
          <Link className="btn btn-primary btn-lg" href="/hire">Start a Hiring Request <ArrowRight size={16}/></Link>
          <Link className="text-link" href="/find-talent">Browse approved VAs <ArrowRight size={14}/></Link>
        </div>
      </div>
    </section>
  </main><SiteFooter/></>;
}
