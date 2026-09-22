import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CANDIDATE_SEO_PAGES, candidateSeoPageBySlug } from "@/lib/candidate-seo-pages";
import { canonicalPath } from "@/lib/seo-url";

export function generateStaticParams() {
  return CANDIDATE_SEO_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = candidateSeoPageBySlug(slug);
  if (!page) return {};
  const canonical = canonicalPath(`/for-virtual-assistants/${page.slug}`);
  return {
    title: { absolute: page.metaTitle },
    description: page.description,
    alternates: { canonical },
    openGraph: { type: "article", title: page.metaTitle, description: page.description, url: canonical }
  };
}

export default async function CandidateGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = candidateSeoPageBySlug(slug);
  if (!page) notFound();

  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const url = `${base}/for-virtual-assistants/${page.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.description,
    mainEntityOfPage: url,
    datePublished: "2026-09-22",
    dateModified: "2026-09-22",
    author: { "@type": "Organization", name: "VirtualAssistant.com.ph Editorial Team" },
    publisher: { "@type": "Organization", name: "VirtualAssistant.com.ph", url: base }
  };

  return <>
    <SiteHeader />
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <section className="section public-hero-small">
        <div className="container public-page-head">
          <nav className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/for-virtual-assistants">For Virtual Assistants</Link><span>/</span><span>{page.title}</span></nav>
          <span className="kicker">{page.eyebrow}</span>
          <h1 className="public-page-title">{page.title}</h1>
          <p className="public-lede">{page.lede}</p>
          <div className="row wrap">
            <Link className="btn btn-primary btn-lg" href="/auth/join/va">{page.ctaLabel} <ArrowRight size={16}/></Link>
            <Link className="btn btn-lg" href="/jobs">Browse VA jobs</Link>
          </div>
        </div>
      </section>
      <section className="section section-white">
        <div className="container grid-2">
          {page.sections.map((section) => <article className="card" key={section.heading}>
            <h2>{section.heading}</h2>
            {(section.paragraphs || []).map((paragraph, index) => <p className="muted" key={index}>{paragraph}</p>)}
            {section.bullets?.length ? <ul className="check-list">{section.bullets.map((item) => <li key={item}><CheckCircle2 size={17}/><span>{item}</span></li>)}</ul> : null}
          </article>)}
        </div>
      </section>
      <section className="section">
        <div className="container card">
          <h2>Ready to build your Virtual Assistant profile?</h2>
          <p className="muted">Add your real experience, skills, tools, schedule, rate preference, resume and work evidence. Completing a profile does not guarantee approval or placement, but it gives recruiters the information needed to assess fit for relevant roles.</p>
          <div className="row wrap">
            <Link className="btn btn-primary" href="/auth/join/va">Create your VA profile <ArrowRight size={15}/></Link>
            <Link className="btn" href="/jobs">See available jobs</Link>
          </div>
        </div>
      </section>
    </main>
    <SiteFooter />
  </>;
}
