import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RoleBriefForm } from "@/components/role-brief-form";
import { VaCostCalculator } from "@/components/va-tools";
import { getBusinessSettings } from "@/lib/business-settings";
import { canonicalPath } from "@/lib/seo-url";
import "./pricing-page.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "How Virtual Assistant Pricing Works", description: "Estimate Virtual Assistant compensation and understand curated placement and managed service pricing before you make a hiring commitment.", keywords: ["virtual assistant pricing philippines", "how much does a virtual assistant cost", "virtual assistant rates"] , alternates: { canonical: canonicalPath("/pricing") }};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default async function PricingPage(){
  const settings=await getBusinessSettings();
  const placementFee=settings.placementFee;
  const managedMarkup=settings.managedMarkupPercent;
  const minHourlyRate=settings.minHourlyRate;

  return <><SiteHeader/><main id="main-content" className="pricing-page">
    <section className="pricing-hero">
      <div className="container pricing-hero-grid">
        <div className="pricing-hero-copy">
          <div className="pricing-kicker">Transparent client pricing</div>
          <h1>Virtual Assistant pricing, without hidden fees.</h1>
          <p className="pricing-hero-lede">See the Virtual Assistant&apos;s compensation and our service fee separately before you commit.</p>
          <p className="pricing-hero-support">Choose managed support or direct hire. We review the role, hours, budget, and schedule first so you can see the real hiring cost before moving forward.</p>
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
          <div className="pricing-hero-form-badge"><ShieldCheck size={14}/> Private hiring request</div>
          <RoleBriefForm sourcePath="/pricing" heading="Get a role and pricing review" subheading="Share the role in about 60 seconds. We will review the fit and pricing before you make a hiring commitment." />
        </aside>
      </div>
    </section>

    <section className="section section-white"><div className="container"><div className="section-head"><h2>Current pricing structure</h2><p>Virtual Assistant compensation and our service fee are separate. You see both before you commit.</p></div><div className="grid-2">
      <article className="card pricing-card"><span className="pricing-label">Managed Virtual Assistant service <span className="badge badge-success">Recommended</span></span><h3>Ongoing service margin</h3><div className="pricing-value">{managedMarkup > 0 ? `${managedMarkup}%` : "Custom quote"}</div><p className="muted">Added on top of Virtual Assistant compensation for recruiting, vetting, matching, onboarding, Client Success, placement monitoring, recovery, replacement support, and billing administration. {managedMarkup > 0 ? "Your exact role terms are confirmed before you make a hiring commitment." : "The managed-service margin is quoted against the actual role before you accept the engagement."}</p><ul className="check-list"><li>Recruiting, screening, and matching</li><li>Structured placement launch</li><li>Ongoing Client Success and placement monitoring</li><li>Recovery and replacement support under your agreed terms</li></ul><Link className="btn btn-primary" href="/hire">Get Your Shortlist <ArrowRight size={16}/></Link></article>
      <article className="card pricing-card"><span className="pricing-label">Direct hire</span><h3>One-time placement fee</h3><div className="pricing-value">{placementFee > 0 ? money(placementFee) : "Custom quote"}</div><p className="muted">Prefer to manage the Virtual Assistant yourself after the hire? {placementFee > 0 ? `The current standard placement fee is ${money(placementFee)}. Direct-hire terms are confirmed before commitment.` : "The exact placement fee is shown during private role review before you make a hiring commitment."}</p></article>
    </div>
    <p className="pricing-note" style={{ marginTop: 20 }}>Standard managed placements currently start at USD {minHourlyRate}/hour in Virtual Assistant compensation. Experienced specialists should cost more, and the exact budget is set during role review. <Link href="/managed-vs-direct-hire">See Managed Virtual Assistant vs. Direct Hire →</Link></p>
    </div></section>

    <section className="section"><div className="container"><div className="section-head"><h2>Estimate the monthly Virtual Assistant cost.</h2><p>Use your intended hours and hourly rate. The calculator shows the managed service margin and one-time placement fee separately when they apply.</p></div><VaCostCalculator placementFee={placementFee} managedMarkup={managedMarkup}/></div></section>

    <section className="section section-white"><div className="container"><div className="section-head"><h2>What the service fee supports</h2><p>Our fee pays for an operating service, not access to a profile directory.</p></div><div className="grid-3">{["Role review and hiring brief","Recruiting and evidence-based vetting","Curated 2 to 4 person shortlist","Interview and offer coordination","Placement launch and Client Success","Monitoring, recovery, and replacement support"].map((x,index)=><div className="card row pricing-inclusion" key={`${String(x)}-${index}`}><CheckCircle2 size={18}/><strong>{x}</strong></div>)}</div></div></section>

    <section className="section"><div className="container"><div className="section-head"><h2>No mystery fee after you start interviewing.</h2><p>Your hiring request stays private during review. The applicable service fee is shown before you make a hiring commitment.</p></div><div className="process-grid"><div className="process-step"><div className="process-number">01</div><h3>Tell us the role</h3><p className="muted">Share the work, hours, schedule, and budget.</p></div><div className="process-step"><div className="process-number">02</div><h3>Review the terms</h3><p className="muted">See VA compensation and the agency service fee separately.</p></div><div className="process-step"><div className="process-number">03</div><h3>Choose whether to proceed</h3><p className="muted">Move forward only when the role, shortlist process, and service model fit.</p></div></div></div></section>
  </main><SiteFooter/></>;
}
