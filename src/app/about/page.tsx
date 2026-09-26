import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, Linkedin, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHero } from "@/components/marketing-hero";
import { DiscoveryCallCard } from "@/components/hiring-brief-form";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "About VirtualAssistant.com.ph",
  description: "Learn how VirtualAssistant.com.ph recruits, screens, matches, and supports Filipino Virtual Assistant placements.",
  keywords: ["about virtualassistant.com.ph", "filipino virtual assistant agency", "virtual assistant vetting process"],
  alternates: { canonical: canonicalPath("/about") }
};

export default function AboutPage() {
  return <><SiteHeader/><main id="main-content">
    <MarketingHero
      eyebrow="Philippines-focused Virtual Assistant hiring"
      title={<h1 className="public-page-title">A recruiting team for businesses hiring Filipino Virtual Assistants.</h1>}
      intro={<p className="public-lede">VirtualAssistant.com.ph helps businesses define the role, screen credible candidates, build a focused shortlist, coordinate the hiring process, and support the placement after the right person starts.</p>}
      actions={<><Link className="btn btn-primary btn-lg" href="/hire">Start a Hiring Request <ArrowRight size={16}/></Link><Link className="btn btn-lg" href="/how-vetting-works">See how we screen</Link></>}
      trust={<><span><CheckCircle2 size={15}/>Role-first recruiting</span><span><CheckCircle2 size={15}/>Human recruiter review</span><span><CheckCircle2 size={15}/>Placement support</span></>}
      form={<DiscoveryCallCard />}
    />

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

    <section className="section">
      <div className="container">
        <div className="section-head">
          <div className="kicker">Founder &amp; site leadership</div>
          <h2>Building VirtualAssistant.com.ph around better hiring, useful training, and sustainable organic growth.</h2>
        </div>
        <article className="card" style={{maxWidth:720}}>
          <h3 style={{marginBottom:6}}>Erwin Valles</h3>
          <p style={{margin:"0 0 10px",fontWeight:700}}>Founder &amp; Head of SEO, Web Design &amp; Development</p>
          <p className="muted" style={{margin:"0 0 16px"}}>Leads organic search strategy, website experience, design direction, technical development, and ongoing product growth across VirtualAssistant.com.ph.</p>
          <a className="btn btn-sm" href="https://www.linkedin.com/in/seo-expert-ph/" target="_blank" rel="noopener noreferrer"><Linkedin size={15}/> View LinkedIn</a>
        </article>
      </div>
    </section>

    <section className="section section-white"><div className="container"><div className="section-head"><div className="kicker">Trust by design</div><h2>Clear boundaries around profiles, documents, and hiring claims.</h2><p>We would rather show less information than publish a number, badge, or success claim that cannot be supported by the platform’s records.</p></div><div className="grid-3">
      <article className="card"><LockKeyhole size={22}/><h3>Private hiring information</h3><p className="muted">Role briefs, uploaded documents, recruiter notes, test answers, resumes, and direct contact details remain outside the public directory.</p></article>
      <article className="card"><Eye size={22}/><h3>Controlled public profiles</h3><p className="muted">Only approved, available Virtual Assistants who meet the public-profile requirements can appear. Public pages expose a deliberately limited set of work-relevant fields.</p></article>
      <article className="card"><Scale size={22}/><h3>Client-controlled decisions</h3><p className="muted">Clients retain final hiring, access, supervision, compliance, compensation, and approval decisions. Regulated or licensed work stays with appropriately qualified professionals.</p></article>
    </div><div className="card" style={{marginTop:16}}><h3><ShieldCheck size={18}/> What we do not fabricate</h3><p className="muted">We do not display invented testimonials, fake client logos, unsupported placement totals, or artificial availability counts. When the site displays available talent, it comes from approved profiles currently marked available.</p></div></div></section>
  </main><SiteFooter/></>;
}
