import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VaCostCalculator } from "@/components/va-tools";
import { MIN_HOURLY_RATE } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { canonicalPath } from "@/lib/seo-url";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "How Virtual Assistant Pricing Works", description: "Estimate Virtual Assistant compensation and understand curated placement and managed service pricing before you make a hiring commitment.", keywords: ["virtual assistant pricing philippines", "how much does a virtual assistant cost", "virtual assistant rates"] , alternates: { canonical: canonicalPath("/pricing") }};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default async function PricingPage(){
  let placementFee = 0;
  let managedMarkup = 0;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      const { data } = await admin.from("admin_settings").select("default_placement_fee,default_managed_markup_percent").eq("id",1).maybeSingle();
      placementFee = Number(data?.default_placement_fee || 0);
      managedMarkup = Number(data?.default_managed_markup_percent || 0);
    } catch {
      // Public pricing still renders when admin settings are unavailable.
    }
  }

  return <><SiteHeader/><main id="main-content">
    <section className="section public-hero-small"><div className="container"><div className="public-page-head"><h1 className="public-page-title">See the Virtual Assistant cost first. Know how the service fee is added.</h1><p className="public-lede">Clients pay the Virtual Assistant's agreed compensation plus the applicable VirtualAssistant.com.ph recruiting, placement, or managed-service fee. Virtual Assistants are not charged to join, apply, be placed, or receive their agreed compensation. Client fees are shown separately so you can compare the real total.</p><div className="row wrap"><Link className="btn btn-primary btn-lg" href="/hire">Hire a Virtual Assistant <ArrowRight size={16}/></Link><Link className="btn btn-lg" href="/find-talent">Browse Virtual Assistants</Link></div></div></div></section>

    <section className="section section-white"><div className="container"><div className="section-head"><h2>Current pricing structure</h2><p>Choose the service model that fits how much recruiting and post-hire support you want. Virtual Assistant compensation is agreed separately, based on experience and specialization.</p></div><div className="grid-2">
      <article className="card pricing-card"><span className="pricing-label">Managed Virtual Assistant service <span className="badge badge-success">Recommended</span></span><h3>Ongoing service margin</h3><div className="pricing-value">{managedMarkup > 0 ? `${managedMarkup}%` : "Custom quote"}</div><p className="muted">Added on top of Virtual Assistant compensation, for as long as you work together. {managedMarkup > 0 ? "This is the current standard managed-service margin; your role terms are confirmed before you make a hiring commitment." : "The managed-service margin is quoted against the actual role before you accept the engagement."}</p><ul className="check-list"><li>Recruiting, screening, and matching</li><li>Structured onboarding workroom</li><li>Ongoing placement support</li><li>30-day replacement support at no extra placement fee</li></ul><Link className="btn btn-primary" href="/hire">Hire a Virtual Assistant <ArrowRight size={16}/></Link></article>
      <article className="card pricing-card"><span className="pricing-label">Direct hire</span><h3>One-time placement fee</h3><div className="pricing-value">{placementFee > 0 ? money(placementFee) : "Custom quote"}</div><p className="muted">Prefer to manage the Virtual Assistant yourself after the hire? <strong>Your first placement is free</strong> as part of our founding-client offer. {placementFee > 0 ? `After that, this is the current standard placement fee (${money(placementFee)}); no ongoing support is included.` : "The exact placement fee after your first free one is shown during private role review before you make a hiring commitment."}</p></article>
    </div>
    <p className="pricing-note" style={{ marginTop: 20 }}>Virtual Assistant compensation starts at USD {MIN_HOURLY_RATE}/hour for straightforward, entry-level work -- an experienced specialist (bookkeeper, estimator, mortgage processor) should cost more, and the exact budget is set with you during role review. <Link href="/managed-vs-direct-hire">See a side-by-side comparison of Managed Virtual Assistant vs. Direct Hire →</Link></p>
    </div></section>

    <section className="section"><div className="container"><div className="section-head"><h2>Estimate the monthly Virtual Assistant cost.</h2><p>Use your intended hours and hourly rate. When the standard service settings are configured, the calculator also shows the managed monthly margin and one-time curated placement fee separately.</p></div><VaCostCalculator placementFee={placementFee} managedMarkup={managedMarkup}/></div></section>

    <section className="section section-white"><div className="container"><div className="section-head"><h2>What the service fee supports</h2><p>The fee maps to recruiting and operating work rather than simple access to a profile list.</p></div><div className="grid-3">{["Role review and screening criteria","Category skills testing and vetting","Recruiter scorecard and final approval","Candidate matching and client pipeline","Interview and hiring coordination","Structured onboarding support for managed placements"].map((x,index)=><div className="card row pricing-inclusion" key={`${String(x)}-${index}`}><CheckCircle2 size={18}/><strong>{x}</strong></div>)}</div></div></section>

    <section className="section"><div className="container"><div className="section-head"><h2>No surprise fee after you start interviewing.</h2><p>Your hiring request stays private during review. The applicable service fee is shown before you make a hiring commitment, and you choose whether to continue.</p></div><div className="process-grid"><div className="process-step"><div className="process-number">01</div><h3>Send the workload</h3><p className="muted">Share the role, hours, schedule, and Virtual Assistant budget.</p></div><div className="process-step"><div className="process-number">02</div><h3>Review the terms</h3><p className="muted">See the service model and fee separately from Virtual Assistant compensation.</p></div><div className="process-step"><div className="process-number">03</div><h3>Move forward only if it fits</h3><p className="muted">Review the terms and decide whether the service model makes sense for the role.</p></div></div></div></section>
  </main><SiteFooter/></>;
}
