import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, UserRoundSearch } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath } from "@/lib/seo-url";

const BOOKING_URL = "https://calendar.app.google/FxedmioyeJhKras87";

export const metadata: Metadata = {
  title: "Book a Client Discovery Call",
  description: "Book a short discovery call about hiring a vetted Filipino Virtual Assistant for your business.",
  alternates: { canonical: canonicalPath("/book-client-call") },
  robots: { index: false, follow: true },
};

export default function BookClientCallPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="public-hero-small">
          <div className="container public-page-head">
            <span className="kicker">For prospective clients</span>
            <h1 className="public-page-title">Book a client discovery call</h1>
            <p className="public-lede">This call is for businesses that want to hire a Virtual Assistant. We will discuss the role, schedule, budget, and the best next step.</p>
          </div>
        </section>

        <section className="section section-white">
          <div className="container booking-gate-grid">
            <article className="card booking-gate-card booking-gate-client">
              <span className="booking-gate-icon"><BriefcaseBusiness size={24} /></span>
              <span className="kicker">I am hiring</span>
              <h2>Continue to the client calendar</h2>
              <p>Choose this if you represent a business and want help recruiting or managing a Filipino Virtual Assistant.</p>
              <ul className="booking-gate-list">
                <li><CheckCircle2 size={16} /> Discuss your role and workload</li>
                <li><CheckCircle2 size={16} /> Review managed and direct-hire options</li>
                <li><CheckCircle2 size={16} /> Confirm the right next step</li>
              </ul>
              <a className="btn btn-primary btn-lg" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Open client booking calendar <ArrowRight size={17} />
              </a>
              <p className="small muted">Please use your business name and work email when booking.</p>
            </article>

            <article className="card booking-gate-card">
              <span className="booking-gate-icon booking-gate-icon-va"><UserRoundSearch size={24} /></span>
              <span className="kicker">I am a Virtual Assistant</span>
              <h2>Use the VA application and interview process</h2>
              <p>Client discovery calls are not used for VA applications or candidate interviews. Your dashboard will show recruiter requests and interview updates.</p>
              <div className="booking-gate-actions">
                <Link className="btn" href="/auth/join/va">Apply as a Virtual Assistant</Link>
                <Link className="text-link" href="/auth/login?next=%2Fworkspace%2Fva">Open your VA workspace</Link>
                <Link className="text-link" href="/jobs">Browse Virtual Assistant jobs</Link>
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
