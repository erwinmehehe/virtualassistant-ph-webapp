import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles, UserRoundCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "For Virtual Assistants | Remote Jobs Philippines",
  description: "Create a Virtual Assistant profile, complete vetting, browse reviewed remote jobs, and apply to client opportunities through VirtualAssistant.com.ph.",
  keywords: ["virtual assistant jobs philippines", "apply as virtual assistant philippines", "remote virtual assistant work"],
  alternates: { canonical: canonicalPath("/for-virtual-assistants") }
};

const steps = [
  ["01", "Create one strong profile", "Add your experience, specialty, skills, tools, availability, and work background once instead of starting from scratch for every role."],
  ["02", "Complete the vetting steps", "Finish the required profile checks, specialty skills test, video introduction, and recruiter review used before public approval."],
  ["03", "Browse reviewed opportunities", "See open Virtual Assistant roles with clear scope, hours, pay information, and client requirements."],
  ["04", "Apply and manage next steps", "Use your approved profile to apply, then keep application updates, messages, and hiring stages in your private workspace."]
] as const;

export default function ForVirtualAssistantsPage() {
  return <><SiteHeader/><main id="main-content" className="va-career-page">
    <section className="section public-hero-small va-career-hero">
      <div className="container public-content-grid">
        <div>
          <div className="kicker">For Virtual Assistants in the Philippines</div>
          <h1 className="public-page-title">Build a stronger Virtual Assistant profile, then use it to pursue real client roles.</h1>
          <p className="public-lede">VirtualAssistant.com.ph gives Virtual Assistants one place to create a professional profile, complete vetting, browse reviewed opportunities, and apply to roles that match their experience.</p>
          <div className="row wrap" style={{marginTop:24}}>
            <Link className="btn btn-primary btn-lg" href="/auth/join/va">Create your Virtual Assistant profile <ArrowRight size={16}/></Link>
            <Link className="btn btn-lg" href="/jobs">Browse open jobs</Link>
          </div>
          <div className="trust-list">
            <div className="trust-item"><CheckCircle2 size={18}/><span>Free to create a profile and apply to roles.</span></div>
            <div className="trust-item"><ShieldCheck size={18}/><span>Private contact details, resumes, test answers, and recruiter notes are not public.</span></div>
          </div>
        </div>

        <aside className="card va-career-summary">
          <div className="kicker">Your path</div>
          <h2>Profile first. Jobs second.</h2>
          <p className="muted">The job directory is only one part of the Virtual Assistant journey. Start with a profile that gives recruiters and clients enough evidence to understand where you fit.</p>
          <div className="stack va-career-summary-list">
            <div><UserRoundCheck size={18}/><span><strong>Structured profile</strong><small>Experience, specialty, skills, tools, industries, availability.</small></span></div>
            <div><Sparkles size={18}/><span><strong>Vetting milestones</strong><small>Skills testing, video introduction, recruiter review, approval.</small></span></div>
            <div><BriefcaseBusiness size={18}/><span><strong>Reviewed jobs</strong><small>Clear role scope, pay, schedule, and requirements before you apply.</small></span></div>
          </div>
        </aside>
      </div>
    </section>

    <section className="section section-white">
      <div className="container">
        <div className="section-head">
          <div className="kicker">How it works</div>
          <h2>From profile to client opportunity.</h2>
          <p>Complete the parts that help recruiters understand your strengths before spending time on applications.</p>
        </div>
        <div className="process-grid four-step-process">
          {steps.map(([number,title,copy]) => <div className="process-step" key={number}>
            <div className="process-number">{number}</div>
            <h3>{title}</h3>
            <p className="muted">{copy}</p>
          </div>)}
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container grid-2">
        <div className="card">
          <LockKeyhole size={22}/>
          <h2>What stays private</h2>
          <p className="muted">Your personal contact details, uploaded resume file, raw test answers, private video link, recruiter notes, and internal review evidence are not published on the public directory.</p>
        </div>
        <div className="card">
          <CheckCircle2 size={22}/>
          <h2>What helps clients evaluate fit</h2>
          <p className="muted">Approved public profiles can show your specialty, experience, skills, tools, industries, languages, availability, schedule preferences, and approved vetting milestones.</p>
        </div>
      </div>
    </section>

    <section className="section section-white">
      <div className="container public-content-grid">
        <div>
          <div className="kicker">Ready to start?</div>
          <h2>Create the profile before chasing every job listing.</h2>
          <p className="muted">A complete profile gives recruiters more context when matching you to opportunities and makes your applications easier for clients to evaluate.</p>
        </div>
        <div className="card stack">
          <Link className="btn btn-primary btn-lg" href="/auth/join/va">Apply as a Virtual Assistant <ArrowRight size={16}/></Link>
          <Link className="btn btn-lg" href="/jobs">Browse Virtual Assistant jobs</Link>
          <Link className="small text-link" href="/auth/login">Already have an account? Log in</Link>
        </div>
      </div>
    </section>
  </main><SiteFooter/></>;
}
