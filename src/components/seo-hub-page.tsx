import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export type SeoHubSection = {
  title: string;
  body?: string[];
  bullets?: string[];
  links?: { href: string; label: string; description: string }[];
};

export function SeoHubPage({
  eyebrow,
  title,
  lede,
  sections,
  primaryCta = { href: "/hire", label: "Hire a Virtual Assistant" },
  secondaryCta = { href: "/services", label: "Browse Virtual Assistant services" },
  beforeSections,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  sections: SeoHubSection[];
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  beforeSections?: ReactNode;
}) {
  return <>
    <SiteHeader />
    <main id="main-content">
      <section className="section public-hero-small">
        <div className="container public-page-head">
          <span className="kicker">{eyebrow}</span>
          <h1 className="public-page-title">{title}</h1>
          <p className="public-lede">{lede}</p>
          <div className="row wrap">
            <Link className="btn btn-primary btn-lg" href={primaryCta.href}>{primaryCta.label} <ArrowRight size={16}/></Link>
            <Link className="btn btn-lg" href={secondaryCta.href}>{secondaryCta.label}</Link>
          </div>
        </div>
      </section>

      {beforeSections}

      <section className="section section-white">
        <div className="container">
          <div className="grid-2">
            {sections.map((section) => <article className="card" key={section.title}>
              <h2>{section.title}</h2>
              {(section.body || []).map((p, i) => <p className="muted" key={i}>{p}</p>)}
              {section.bullets?.length ? <ul className="check-list">{section.bullets.map((item) => <li key={item}><CheckCircle2 size={17}/><span>{item}</span></li>)}</ul> : null}
              {section.links?.length ? <div className="stack-sm">{section.links.map((link) => <Link className="text-link" href={link.href} key={link.href}><span><strong>{link.label}</strong><small>{link.description}</small></span><ArrowRight size={14}/></Link>)}</div> : null}
            </article>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container card">
          <span className="kicker">Next step</span>
          <h2>Turn the research into a role you can actually hire for.</h2>
          <p className="muted">Share the work, hours, timezone, tools, budget, and must-have experience. We use that brief to screen relevant Filipino Virtual Assistants instead of sending an unfiltered resume pile.</p>
          <div className="row wrap">
            <Link className="btn btn-primary" href={primaryCta.href}>{primaryCta.label} <ArrowRight size={15}/></Link>
            <Link className="btn" href="/find-talent">Browse vetted talent</Link>
          </div>
        </div>
      </section>
    </main>
    <SiteFooter />
  </>;
}
