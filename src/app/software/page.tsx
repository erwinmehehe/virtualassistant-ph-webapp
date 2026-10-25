import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SoftwareDirectory } from "@/components/software-directory";
import { softwarePages } from "@/lib/software-pages";
import { isPrunedRedirectSource } from "@/lib/seo-prune";
import { canonicalPath } from "@/lib/seo-url";
import { socialMetadata } from "@/lib/og";
import "../software-directory.css";

export const metadata: Metadata = {
  title: { absolute: "Virtual Assistant Software Philippines" },
  description:
    "Browse Philippines-based Virtual Assistants by software experience across CRM, property, accounting, healthcare, trades, recruitment, design, and more.",
  keywords: [
    "virtual assistant software",
    "virtual assistant tools",
    "virtual assistant by software",
    "software-specific virtual assistant philippines",
    "hire virtual assistant for my platform",
  ],
  alternates: { canonical: canonicalPath("/software") },
  ...socialMetadata({
    title: "Virtual Assistant Software Philippines",
    description:
      "Browse Philippines-based Virtual Assistants by software experience across CRM, property, accounting, healthcare, trades, recruitment, design, and more.",
    path: canonicalPath("/software"),
    category: "software",
    eyebrow: "Software-specific VA Hiring",
  }),
};

const directorySoftwarePages = softwarePages.filter((page) => !isPrunedRedirectSource(`/software/${page.slug}`));
const guidePreviews = directorySoftwarePages.map(({ slug, software, category, focus, tasks }) => ({
  slug,
  software,
  category,
  focus,
  tasks,
}));

const categoryCount = new Set(directorySoftwarePages.map((guide) => guide.category)).size;

export default function SoftwareIndexPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="sw-page">
        <section className="sw-hero" aria-labelledby="sw-page-heading">
          <div className="container sw-hero-grid">
            <div className="sw-hero-copy">
              <span className="sw-eyebrow">
                <span className="sw-eyebrow-dot" aria-hidden="true" />
                Software-specific VA hiring
              </span>
              <h1 id="sw-page-heading">
                Hire a virtual assistant who knows your software.
              </h1>
              <p className="sw-hero-lede">
                Find practical guides to the platforms your business already uses.
                See what a Philippines-based virtual assistant can take on, and
                which approvals should stay with your team.
              </p>
              <div className="sw-hero-actions">
                <a className="sw-button sw-button-primary" href="#software-directory">
                  Explore software guides <ArrowRight size={17} aria-hidden="true" />
                </a>
                <Link className="sw-button sw-button-secondary" href="/hire">
                  Start a hiring brief
                </Link>
              </div>
              <div className="sw-hero-proof" aria-label="Software guide features">
                <span><CheckCircle2 size={16} aria-hidden="true" /> {directorySoftwarePages.length} platform guides</span>
                <span><CheckCircle2 size={16} aria-hidden="true" /> {categoryCount} industry categories</span>
                <span><CheckCircle2 size={16} aria-hidden="true" /> Workflow-first hiring</span>
              </div>
            </div>

            <aside className="sw-quickstart" aria-labelledby="sw-quickstart-title">
              <div className="sw-quickstart-top">
                <span>From software to shortlist</span>
                <span className="sw-quickstart-counter">01 — 03</span>
              </div>
              <h2 id="sw-quickstart-title">Start with the tools, not the job title.</h2>
              <ol className="sw-quickstart-steps">
                <li>
                  <span className="sw-step-number">01</span>
                  <div>
                    <strong>Choose your platform</strong>
                    <p>Find the system your team works in every day.</p>
                  </div>
                </li>
                <li>
                  <span className="sw-step-number">02</span>
                  <div>
                    <strong>Review the workflows</strong>
                    <p>See the tasks, handoffs, and decisions to keep in-house.</p>
                  </div>
                </li>
                <li>
                  <span className="sw-step-number">03</span>
                  <div>
                    <strong>Share your hiring brief</strong>
                    <p>Tell us which software skills and working hours you need.</p>
                  </div>
                </li>
              </ol>
            </aside>
          </div>
        </section>

        <SoftwareDirectory guides={guidePreviews} />

        <section className="sw-bottom-section" aria-labelledby="sw-bottom-title">
          <div className="container">
            <div className="sw-bottom-cta">
              <div className="sw-bottom-copy">
                <span className="sw-bottom-eyebrow">Not seeing your platform?</span>
                <h2 id="sw-bottom-title">Tell us what your team works with.</h2>
                <p>
                  You do not need a matching guide to start. Share your software,
                  recurring tasks, and hours. Our recruiters can use that brief to
                  screen for relevant workflow experience.
                </p>
              </div>
              <div className="sw-bottom-actions">
                <Link className="sw-button sw-button-light" href="/hire">
                  Start a hiring brief <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link className="sw-bottom-link" href="/services">
                  Browse VA services <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
