import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHero } from "@/components/marketing-hero";
import { DiscoveryCallCard } from "@/components/hiring-brief-form";
import { Band, CtaBand, SectionHead } from "@/components/hiring-page-sections";
import { softwarePages } from "@/lib/software-pages";
import { canonicalPath } from "@/lib/seo-url";
import "../homepage-sections.css";
import "../hiring-pages.css";
import "../info-pages.css";

export const metadata: Metadata = {
  title: "Virtual Assistant Software & Platform Experience",
  description: "Browse Virtual Assistant software and platform experience for human VAs across CRM, property, accounting, healthcare, trades, recruitment, design, and more.",
  keywords: ["virtual assistant software", "virtual assistant tools", "virtual assistant by software", "software-specific virtual assistant philippines", "hire virtual assistant for my platform"],
  alternates: { canonical: canonicalPath("/software") }
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function SoftwareIndexPage() {
  // Group guides by field, keeping the order categories first appear in the registry.
  const groups = new Map<string, typeof softwarePages>();
  for (const page of softwarePages) groups.set(page.category, [...(groups.get(page.category) || []), page]);

  return <><SiteHeader/><main id="main-content">
    <MarketingHero
      className="mh-tight"
      eyebrow="Software-specific Virtual Assistant hiring"
      title={<h1 className="public-page-title">Virtual Assistant software experience by platform.</h1>}
      intro={<p className="public-lede">Looking for a human Virtual Assistant who already knows the software your business uses? Browse platform-specific workflow guides to decide what to delegate, which decisions stay with your team, and what to test in an interview.</p>}
      actions={<><Link className="btn btn-primary btn-lg" href="/hire">Hire a Virtual Assistant <ArrowRight size={16}/></Link><Link className="btn btn-lg" href="/services">Browse Virtual Assistant services</Link></>}
      trust={<><span><CheckCircle2 size={15}/>Platform-aware matching</span><span><CheckCircle2 size={15}/>Private role brief</span><span><CheckCircle2 size={15}/>No account required</span></>}
      form={<DiscoveryCallCard />}
    />

    <div className="hs-root sp-root">
      <Band>
        <SectionHead kicker={`${softwarePages.length} platform guides`} title="Choose the platform your team runs on." lede="Each guide covers realistic workflows, related roles, and where the licensed or regulated local professional keeps final decision authority."/>
        <nav className="ip-chips" aria-label="Jump to a field">
          {[...groups.entries()].map(([category, pages]) => <a key={category} href={`#${slugify(category)}`}>{category} <span>{pages.length}</span></a>)}
        </nav>

        <div className="ip-groups">
          {[...groups.entries()].map(([category, pages]) => <section className="ip-group" id={slugify(category)} key={category} aria-labelledby={`${slugify(category)}-title`}>
            <div className="ip-group-head"><h3 id={`${slugify(category)}-title`}>{category}</h3><span>{pages.length} guide{pages.length === 1 ? "" : "s"}</span></div>
            <div className="ip-link-grid">
              {pages.map((page) => <Link className="ip-link-card" href={`/software/${page.slug}`} key={page.slug}>
                <strong>{page.software}</strong>
                <p>{page.metaDescription}</p>
                <span className="hs-link">View {page.software} guide <ArrowRight size={14}/></span>
              </Link>)}
            </div>
          </section>)}
        </div>
      </Band>

      <CtaBand
        kicker="Not listed?"
        title="Your platform isn't here? Tell us what your team uses."
        body="Recruiters screen for the systems in your brief, even when there is no dedicated guide yet."
        primary={{ href: "/hire", label: "Start a hiring brief", track: "software_index_final_cta" }}
        secondary={{ href: "/services", label: "Browse Virtual Assistant services" }}
      />
    </div>
  </main><SiteFooter/></>;
}
