"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, BadgeCheck, CheckCircle2, Headphones, ShieldCheck } from "lucide-react";

const BOOKING_URL = "/book-client-call";

export function HomepageWhyChoose() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <section className="why-choose-va" aria-labelledby="why-choose-va-heading">
      <div className="container why-choose-va-inner">
        <div className="why-choose-va-copy">
          <span className="why-choose-va-kicker">Why choose VirtualAssistant.com.ph</span>
          <h2 id="why-choose-va-heading">Recruiter-supported hiring, without giving up control.</h2>
          <p>
            For businesses hiring a Virtual Assistant in the Philippines, our model combines a public talent directory with human recruiting, practical screening, and support after placement.
          </p>
          <div className="why-choose-va-actions">
            <Link className="why-choose-va-primary" href="/hire">Start hiring <ArrowRight size={17} /></Link>
            <Link className="why-choose-va-secondary" href={BOOKING_URL}>Book a client call <ArrowRight size={16} /></Link>
          </div>
        </div>

        <div className="why-choose-va-grid">
          <article className="why-choose-va-card why-choose-va-card-featured">
            <span className="why-choose-va-icon"><ShieldCheck size={20} /></span>
            <div><h3>Screened before public visibility</h3><p>Profiles only appear publicly after the required screening and recruiter approval steps are complete.</p></div>
          </article>
          <article className="why-choose-va-card">
            <span className="why-choose-va-icon"><BadgeCheck size={20} /></span>
            <div><h3>Shortlists built around the role</h3><p>Recruiters narrow the field around responsibilities, experience, tools, schedule, and communication fit.</p></div>
          </article>
          <article className="why-choose-va-card">
            <span className="why-choose-va-icon"><CheckCircle2 size={20} /></span>
            <div><h3>You make the final hiring decision</h3><p>Interview the strongest matches, compare candidates, and choose who joins your team.</p></div>
          </article>
          <article className="why-choose-va-card">
            <span className="why-choose-va-icon"><Headphones size={20} /></span>
            <div><h3>Support continues after placement</h3><p>Managed placements keep the hiring team involved after your Virtual Assistant starts.</p></div>
          </article>
        </div>
      </div>
    </section>
  );
}
