"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileText,
  HeartHandshake,
  PiggyBank,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Video,
} from "lucide-react";

const benefits = [
  [SearchCheck, "Skip the resume pile", "Start with screened candidates worth interviewing instead of spending hours sorting a large applicant pool."],
  [BadgeCheck, "Skills and communication checked", "Practical screening plus human recruiter review covers experience, skills, communication, availability, and role fit."],
  [UsersRound, "You choose who you hire", "Compare profiles, interview the strongest fits, and make the final hiring decision yourself."],
  [HeartHandshake, "Support after placement", "Managed hiring stays involved after your Virtual Assistant starts, not just at introduction."],
  [ShieldCheck, "Vetting you can verify", "Profiles are reviewed through category skills, video communication, recruiter scoring, and final approval before going public."],
  [PiggyBank, "Transparent by default", "Virtual Assistant compensation and our service fee are shown separately before you make a hiring commitment."],
] as const;

const steps = [
  [FileText, "Send the workload", "Tell us the tasks, hours, timezone, tools, budget, and what success should look like.", "No account required"],
  [SearchCheck, "We recruit and screen", "We look for evidence that matches the actual role, not just a job title.", "Screened before interview"],
  [Video, "Interview the strongest fits", "You decide who to hire after reviewing and meeting the people we recommend.", "Your final decision"],
  [HeartHandshake, "Hire with ongoing support", "Managed hiring stays involved after your Virtual Assistant starts.", "Placement support included"],
] as const;

export function HomepageShowcase() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <div className="home-showcase">
      <section className="home-showcase-section home-showcase-why" aria-labelledby="home-showcase-why-title">
        <div className="container">
          <div className="home-showcase-heading">
            <span className="home-showcase-pill"><Sparkles size={13}/> Why VirtualAssistant.com.ph</span>
            <h2 id="home-showcase-why-title">A recruiting service built <span>around the work you need done.</span></h2>
            <p>You do not need to learn a marketplace or manage a complicated hiring app. Tell us the role, then our team helps recruit, screen, shortlist, and support the placement.</p>
          </div>
          <div className="home-showcase-benefits">
            {benefits.map(([Icon, title, copy], index) => (
              <article key={title}>
                <span className={`home-showcase-icon home-showcase-icon-${index + 1}`}><Icon size={21}/></span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-showcase-how" aria-labelledby="home-showcase-how-title">
        <div className="home-showcase-grid" aria-hidden="true"/>
        <div className="container">
          <div className="home-showcase-heading home-showcase-heading-dark">
            <span className="home-showcase-pill home-showcase-pill-dark"><CheckCircle2 size={13}/> How it works</span>
            <h2 id="home-showcase-how-title">Tell us what you need. <span>We will handle the rest.</span></h2>
            <p>Share the responsibilities, hours, timezone, budget, and systems your new Virtual Assistant will use. A short private brief is enough to start.</p>
          </div>
          <div className="home-showcase-steps">
            {steps.map(([Icon, title, copy, proof], index) => (
              <article key={title}>
                <b>0{index + 1}</b>
                <span className="home-showcase-step-icon"><Icon size={21}/></span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <small><CheckCircle2 size={13}/>{proof}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-showcase-section home-showcase-compare" aria-labelledby="home-showcase-compare-title">
        <div className="container">
          <div className="home-showcase-heading">
            <span className="home-showcase-pill home-showcase-pill-green"><HeartHandshake size={13}/> The honest comparison</span>
            <h2 id="home-showcase-compare-title">Hire a Filipino Virtual Assistant <span>without sorting the whole applicant pile yourself.</span></h2>
            <p>Most hiring options put most of the screening on you, or hide the process. Our model keeps recruiter screening while you stay in control of the final choice.</p>
          </div>
          <div className="home-showcase-comparison">
            <article><h3>Job marketplaces</h3><p>You post a role and handle the applicant volume yourself. Screening, practical checks, communication review, and shortlist quality depend on your own process.</p></article>
            <article><h3>Traditional agencies</h3><p>Some agencies present a narrow set of candidates and bundle pricing into one number, which can make comparison and compensation visibility harder.</p></article>
            <article className="featured"><h3>VirtualAssistant.com.ph</h3><p>We recruit and screen against the actual workload, then you interview the strongest fits. Virtual Assistant compensation and our service fee are shown separately before commitment.</p></article>
          </div>
        </div>
      </section>

      <section className="home-showcase-section home-showcase-split" aria-label="Client and Virtual Assistant paths">
        <div className="container home-showcase-split-grid">
          <article className="home-showcase-audience-card client-card">
            <span className="home-showcase-audience-badge"><Building2 size={13}/> For clients</span>
            <h2>Describe the work. We shortlist against it.</h2>
            <p>Give us the specialty, hours, overlap, and budget. We recruit and screen against that brief, then send you candidates worth interviewing.</p>
            <ul>
              <li><CheckCircle2 size={17}/> Skills, communication, and recruiter review before shortlist</li>
              <li><CheckCircle2 size={17}/> Compensation and service fees shown separately</li>
              <li><CheckCircle2 size={17}/> Browse approved Virtual Assistants before sending a brief</li>
            </ul>
            <Link href="/hire">Send your brief <ArrowRight size={16}/></Link>
          </article>
          <article className="home-showcase-audience-card va-card">
            <span className="home-showcase-audience-badge"><Sparkles size={13}/> For Filipino VAs</span>
            <h2>Looking for Virtual Assistant work?</h2>
            <p>Build one structured profile, complete the required review steps, and use the same approved profile when applying to relevant roles.</p>
            <ul>
              <li><CheckCircle2 size={17}/> Reviewed jobs with visible role scope</li>
              <li><CheckCircle2 size={17}/> Category skills test plus video and recruiter review</li>
              <li><CheckCircle2 size={17}/> Clear minimum-pay policy for ongoing hourly roles</li>
            </ul>
            <Link href="/auth/join/va">Apply as a VA <ArrowRight size={16}/></Link>
          </article>
        </div>
      </section>
    </div>
  );
}
