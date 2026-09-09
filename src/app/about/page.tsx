import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "About VirtualAssistant.com.ph",
  description: "Learn how VirtualAssistant.com.ph recruits, screens, matches, and supports Filipino Virtual Assistant placements.",
  keywords: ["about virtualassistant.com.ph", "filipino virtual assistant agency", "virtual assistant vetting process"],
  alternates: { canonical: canonicalPath("/about") }
};

export default function AboutPage() {
  return <><SiteHeader/><main id="main-content">
    <section className="section public-hero-small">
      <div className="container public-page-head">
        <div className="kicker">Philippines-focused Virtual Assistant hiring</div>
        <h1 className="public-page-title">A recruiting team for businesses hiring Filipino Virtual Assistants.</h1>
        <p className="public-lede">VirtualAssistant.com.ph helps businesses define the role, screen credible candidates, build a focused shortlist, coordinate the hiring process, and support the placement after the right person starts.</p>
        <div className="row wrap" style={{marginTop:24}}>
          <Link className="btn btn-primary btn-lg" href="/hire">Start a Hiring Request <ArrowRight size={16}/></Link>
          <Link className="btn btn-lg" href="/how-vetting-works">See how we screen</Link>
        </div>
      </div>
    </section>

    <section className="section section-white">
      <div className="container">
        <div className="section-head">
          <h2>We do more than give you access to a profile list.</h2>
          <p>The goal is a better hire, not more profiles to sort through. Our process starts with the work your business needs done and uses that context throughout recruiting and matching.</p>
        </div>
        <div className="grid-3">
          <div className="card"><h3>Role first</h3><p className="muted">We start with responsibilities, hours, schedule, budget, tools, and the outcomes the Virtual Assistant should own.</p></div>
          <div className="card"><h3>Evidence before introduction</h3><p className="muted">Candidates complete structured profile requirements, skills testing, a video introduction, recruiter review, and approval before public visibility.</p></div>
          <div className="card"><h3>Support through the hire</h3><p className="muted">We help move the process from shortlist to interview, final terms, onboarding, and ongoing placement support when you choose the managed service.</p></div>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container grid-2">
        <div>
          <div className="kicker">How we work</div>
          <h2>Human recruiting around a structured hiring process.</h2>
          <p className="muted">The Client Portal supports private candidate details, messages, hiring stages, and onboarding when those tools become useful. It is not the first thing a prospective client needs to learn.</p>
        </div>
        <div className="card">
          <ul className="check-list">
            <li><CheckCircle2 size={16}/>Tell us the role without creating an account</li>
            <li><CheckCircle2 size={16}/>Recruiter review before you spend time interviewing</li>
            <li><CheckCircle2 size={16}/>Role-specific candidate matching</li>
            <li><CheckCircle2 size={16}/>You make the final hiring decision</li>
            <li><CheckCircle2 size={16}/>Ongoing support available after placement</li>
          </ul>
        </div>
      </div>
    </section>
  </main><SiteFooter/></>;
}
