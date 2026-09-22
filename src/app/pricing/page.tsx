import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, CheckCircle2, ClipboardList, LifeBuoy, Rocket, SearchCheck, UsersRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HiringBriefForm } from "@/components/hiring-brief-form";
import { VaCostCalculator } from "@/components/va-tools";
import { getBusinessSettings } from "@/lib/business-settings";
import { canonicalPath } from "@/lib/seo-url";
import { Band, CheckList, CtaBand, SectionHead, Steps } from "@/components/hiring-page-sections";
import "../homepage-sections.css";
import "../hiring-pages.css";
import "../info-pages.css";
import "./pricing-page.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Virtual Assistant Pricing Philippines | Service Costs", description: "Compare Virtual Assistant pricing, compensation, direct-hire placement costs, managed service terms, and monthly cost estimates before you hire.", keywords: ["virtual assistant pricing philippines", "virtual assistant pricing", "virtual assistant service cost", "how much does a virtual assistant cost", "virtual assistant rates"] , alternates: { canonical: canonicalPath("/pricing") }};

const FEE_INCLUSIONS = [
  { icon: ClipboardList, label: "Role review and hiring brief" },
  { icon: SearchCheck, label: "Recruiting and evidence-based vetting" },
  { icon: UsersRound, label: "Curated 2 to 4 person shortlist" },
  { icon: CalendarCheck, label: "Interview and offer coordination" },
  { icon: Rocket, label: "Placement launch and Client Success" },
  { icon: LifeBuoy, label: "Monitoring, recovery, and replacement support" },
];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default async function PricingPage(){
  const settings=await getBusinessSettings();
  const placementFee=settings.placementFee;

  return <><SiteHeader/><main id="main-content" className="pricing-page">
    <section className="pricing-hero">
      <div className="container pricing-hero-grid">
        <div className="pricing-hero-copy">
          <div className="pricing-kicker">Transparent client pricing</div>
          <h1>Virtual Assistant pricing, without hidden fees.</h1>
          <p className="pricing-hero-lede">See Virtual Assistant compensation, direct-hire pricing, and managed-service terms before you commit.</p>
          <p className="pricing-hero-support">Choose managed support or direct hire. We review the role, hours, budget, and schedule first so your final client price and terms are clear before you move forward.</p>
          <div className="pricing-hero-actions">
            <Link className="btn btn-primary" href="/hire">Get Your Shortlist <ArrowRight size={16}/></Link>
            <Link className="btn" href="/book-client-call">Talk to Our Team</Link>
          </div>
          <div className="pricing-trust-row" aria-label="Pricing assurances">
            <span><CheckCircle2 size={15}/>VA compensation shown separately</span>
            <span><CheckCircle2 size={15}/>Terms before commitment</span>
            <span><CheckCircle2 size={15}/>Replacement support on managed placements</span>
          </div>
        </div>

        <aside className="pricing-hero-form-shell" aria-label="Get a role and pricing review">
          <HiringBriefForm variant="general" sourcePath="/pricing" />
        </aside>
      </div>
    </section>

    <div className="hs-root sp-root">
      <Band>
        <SectionHead center kicker="Two ways to hire" title="Current pricing structure" lede="Choose the service model that fits how much support you want after placement."/>
        <div className="ip-plans">
          <article className="ip-plan is-featured">
            <div className="ip-plan-top"><span className="ip-plan-label">Managed Virtual Assistant service</span><span className="hs-badge hs-badge-green">Recommended</span></div>
            <h3>Ongoing managed support</h3>
            <div className="ip-plan-price">Role-based quote</div>
            <p>Your client quote covers recruiting, vetting, matching, onboarding, Client Success, placement monitoring, recovery, replacement support, and billing administration. Your exact managed-service price and terms are confirmed privately before commitment.</p>
            <CheckList tone="green" items={["Recruiting, screening, and matching", "Structured placement launch", "Ongoing Client Success and placement monitoring", "Recovery and replacement support under your agreed terms"]}/>
            <Link className="hs-btn hs-btn-primary ip-plan-cta" href="/hire">Get Your Shortlist <ArrowRight size={16}/></Link>
          </article>
          <article className="ip-plan">
            <div className="ip-plan-top"><span className="ip-plan-label">Direct hire</span></div>
            <h3>One-time placement fee</h3>
            <div className="ip-plan-price">{money(placementFee)}</div>
            <p>Prefer to manage the Virtual Assistant yourself after the hire? Pay a one-time {money(placementFee)} placement fee for role review, candidate sourcing, screening, vetting, shortlist preparation, interview coordination, and placement support. You manage the Virtual Assistant directly after placement.</p>
            <CheckList items={["Role review and candidate sourcing", "Screening, vetting, and shortlist preparation", "Interview coordination and placement support", "You manage the Virtual Assistant after placement"]}/>
            <Link className="hs-btn hs-btn-ghost ip-plan-cta" href="/hire">Start a hiring brief <ArrowRight size={16}/></Link>
          </article>
        </div>
        <p className="ip-plan-note">Managed-service client pricing is confirmed during role review based on the role, hours, schedule, and required experience. <Link className="hs-link" href="/managed-vs-direct-hire">See Managed Virtual Assistant vs. Direct Hire <ArrowRight size={14}/></Link></p>
      </Band>

      <Band tone="soft">
        <SectionHead center kicker="Cost and market data" title="Use the right page for the pricing question you are asking." lede="Service pricing, candidate compensation, market rates, and monthly cost modeling are related but different intents. Keep them separated so each guide can answer one question well."/>
        <div className="sp-tiles">
          <Link className="sp-tile" href="/how-much-virtual-assistant-philippines"><span className="sp-tile-copy"><strong>How much does a Virtual Assistant cost?</strong><small>Role scope, hours, experience, and cost factors for Filipino VA hiring.</small></span><ArrowRight className="hs-tile-arrow" size={15}/></Link>
          <Link className="sp-tile" href="/average-hourly-rate-virtual-assistants-philippines"><span className="sp-tile-copy"><strong>Average VA hourly rates</strong><small>Dedicated hourly-rate intent and rate-planning guidance.</small></span><ArrowRight className="hs-tile-arrow" size={15}/></Link>
          <Link className="sp-tile" href="/research/virtual-assistant-rates-philippines-2026"><span className="sp-tile-copy"><strong>2026 Rate and Skills Report</strong><small>First-party aggregate profile data for rates, experience, specialties, skills, and tools.</small></span><ArrowRight className="hs-tile-arrow" size={15}/></Link>
          <Link className="sp-tile" href="/tools/virtual-assistant-cost-calculator"><span className="sp-tile-copy"><strong>VA cost calculator</strong><small>Model a monthly compensation estimate from hours and hourly rate.</small></span><ArrowRight className="hs-tile-arrow" size={15}/></Link>
          <Link className="sp-tile" href="/services"><span className="sp-tile-copy"><strong>Compare Virtual Assistant services</strong><small>Match the budget to the responsibilities, tools, and experience the role requires.</small></span><ArrowRight className="hs-tile-arrow" size={15}/></Link>
          <Link className="sp-tile" href="/find-talent"><span className="sp-tile-copy"><strong>Browse approved talent</strong><small>Review public examples, then let the recruiting team confirm fit and availability.</small></span><ArrowRight className="hs-tile-arrow" size={15}/></Link>
          <Link className="sp-tile" href="/outsourcing-philippines-virtual-assistant"><span className="sp-tile-copy"><strong>Plan the outsourcing model</strong><small>Include management time, software, coverage, handoffs, and rework in the total decision.</small></span><ArrowRight className="hs-tile-arrow" size={15}/></Link>
        </div>
      </Band>

      <Band tone="soft">
        <SectionHead center kicker="Cost estimate" title="Estimate the monthly Virtual Assistant cost." lede="Use your intended hours and hourly rate to estimate VA compensation. The one-time direct-hire placement fee is shown separately; managed-service pricing is confirmed during role review."/>
        <div className="ip-calc"><VaCostCalculator placementFee={placementFee}/></div>
      </Band>

      <Band>
        <SectionHead center kicker="What you pay for" title="What the service fee supports" lede="Our fee pays for an operating service, not access to a profile directory."/>
        <div className="ip-features">
          {FEE_INCLUSIONS.map(({ icon: Icon, label }) => <div className="ip-feature" key={label}><span className="sp-card-icon" aria-hidden="true"><Icon size={18}/></span><strong>{label}</strong></div>)}
        </div>
      </Band>

      <Band tone="soft">
        <SectionHead center kicker="How pricing is confirmed" title="No mystery fee after you start interviewing." lede="Your hiring request stays private during review. The applicable service terms are confirmed before you make a hiring commitment."/>
        <Steps columns={3} items={[
          { title: "Tell us the role", copy: "Share the work, hours, schedule, and budget." },
          { title: "Review the terms", copy: "Review VA compensation, the service model, and the client terms before proceeding." },
          { title: "Choose whether to proceed", copy: "Move forward only when the role, shortlist process, and service model fit." },
        ]}/>
      </Band>

      <CtaBand
        title="Get your price confirmed for your actual role."
        body="Share the role, hours, and budget. We confirm VA compensation and the service terms before you commit to anything."
        primary={{ href: "/hire", label: "Get Your Shortlist", track: "pricing_final_cta" }}
        secondary={{ href: "/managed-vs-direct-hire", label: "Compare managed vs. direct hire" }}
      />
    </div>
  </main><SiteFooter/></>;
}
