import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CircleUserRound, LogIn, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "For Filipino Virtual Assistants",
  description: "Create your Virtual Assistant profile, complete screening, browse reviewed remote jobs, and manage applications through one private workspace.",
  alternates: { canonical: canonicalPath("/for-virtual-assistants") }
};

const steps = [
  ["01", "Create your profile", "Add your experience, skills, tools, schedule, preferred rate, resume, and work samples."],
  ["02", "Complete screening", "Finish the category assessment, video introduction, and recruiter review for your specialty."],
  ["03", "Apply to suitable roles", "Browse reviewed jobs and apply when the responsibilities, hours, schedule, and budget fit."],
  ["04", "Manage everything privately", "Track applications, messages, onboarding, workroom tasks, and payments in your workspace."]
] as const;

export default function ForVirtualAssistantsPage() {
  return <><SiteHeader/><main id="main-content">
    <section className="section public-hero-small">
      <div className="container public-page-head">
        <span className="kicker">For Filipino Virtual Assistants</span>
        <h1 className="public-page-title">Build one strong profile. Apply to roles that fit.</h1>
        <p className="public-lede">VirtualAssistant.com.ph gives Filipino professionals one place to present verified experience, complete role-specific screening, find reviewed opportunities, and manage the hiring process.</p>
        <div className="row wrap">
          <Link className="btn btn-primary btn-lg" href="/auth/join/va">Create your profile <ArrowRight size={16}/></Link>
          <Link className="btn btn-lg" href="/jobs">Browse Virtual Assistant jobs</Link>
          <Link className="btn btn-ghost btn-lg" href="/auth/login?next=%2Fworkspace%2Fva">Open your workspace</Link>
        </div>
      </div>
    </section>

    <section className="section section-white">
      <div className="container">
        <div className="section-head">
          <h2>Choose what you need today.</h2>
          <p>You do not have to start from the job board every time.</p>
        </div>
        <div className="grid-3">
          <article className="card service-card">
            <CircleUserRound size={24}/>
            <h3>New to the platform?</h3>
            <p>Create your profile first. You can save progress and return before submitting it for review.</p>
            <Link className="btn btn-primary" href="/auth/join/va">Create a Virtual Assistant profile</Link>
          </article>
          <article className="card service-card">
            <BriefcaseBusiness size={24}/>
            <h3>Ready to find work?</h3>
            <p>Browse reviewed roles with published responsibilities, hours, schedule, and compensation range.</p>
            <Link className="btn" href="/jobs">Browse available jobs</Link>
          </article>
          <article className="card service-card">
            <LogIn size={24}/>
            <h3>Already have an account?</h3>
            <p>Return to your private workspace to finish your profile, check applications, and read messages.</p>
            <Link className="btn" href="/auth/login?next=%2Fworkspace%2Fva">Log in to your workspace</Link>
          </article>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="kicker">Career resources</span>
          <h2>Prepare a stronger Virtual Assistant application.</h2>
          <p>Use these guides to improve the evidence recruiters and clients see before you apply.</p>
        </div>
        <div className="grid-3">
          <article className="card service-card"><h3>How to apply as a VA</h3><p>Prepare your profile, evidence, schedule and role-specific application.</p><Link className="text-link" href="/for-virtual-assistants/how-to-apply-as-a-virtual-assistant">Read application guide <ArrowRight size={14}/></Link></article>
          <article className="card service-card"><h3>VA resume sample</h3><p>Turn experience into clear workflow evidence, including transferable experience.</p><Link className="text-link" href="/for-virtual-assistants/virtual-assistant-resume-sample">Build a stronger resume <ArrowRight size={14}/></Link></article>
          <article className="card service-card"><h3>VA portfolio examples</h3><p>Show useful work evidence without exposing confidential client information.</p><Link className="text-link" href="/for-virtual-assistants/virtual-assistant-portfolio-examples">See portfolio examples <ArrowRight size={14}/></Link></article>
          <article className="card service-card"><h3>Virtual Assistant skills</h3><p>Focus on communication, workflow ownership, quality checks and specialist skills.</p><Link className="text-link" href="/for-virtual-assistants/virtual-assistant-skills">Review VA skills <ArrowRight size={14}/></Link></article>
          <article className="card service-card"><h3>VA requirements</h3><p>Check work setup, internet, equipment, professional readiness and role-specific requirements.</p><Link className="text-link" href="/for-virtual-assistants/virtual-assistant-requirements-philippines">See VA requirements <ArrowRight size={14}/></Link></article>
          <article className="card service-card"><h3>How to become a VA</h3><p>Choose a specialty, build role-specific proof and start applying strategically.</p><Link className="text-link" href="/for-virtual-assistants/how-to-become-a-virtual-assistant-philippines">Read career guide <ArrowRight size={14}/></Link></article>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2>How the Virtual Assistant process works.</h2>
          <p>Complete the evidence recruiters and clients need before you apply.</p>
        </div>
        <div className="process-grid">
          {steps.map(([number, title, copy]) => <div className="process-step" key={number}><div className="process-number">{number}</div><h3>{title}</h3><p className="muted">{copy}</p></div>)}
        </div>
      </div>
    </section>

    <section className="section section-white">
      <div className="container grid-2">
        <div>
          <span className="kicker">What approval means</span>
          <h2>A complete profile is reviewed before it appears publicly.</h2>
          <p className="muted">Recruiters review your professional experience, role-specific skills, communication, availability, preferred rate, and submitted evidence. Approval is not automatic, and completing a profile does not guarantee placement.</p>
        </div>
        <div className="card">
          <div className="row"><ShieldCheck size={22}/><strong>No application or placement fee for Virtual Assistants</strong></div>
          <p className="muted">You can create a profile, complete screening, apply to roles, and receive your agreed compensation without paying VirtualAssistant.com.ph a worker fee.</p>
          <Link className="text-link" href="/how-vetting-works">See how screening works</Link>
        </div>
      </div>
    </section>
  </main><SiteFooter/></>;
}
