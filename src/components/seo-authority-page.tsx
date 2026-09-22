import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Globe2, ShieldCheck, UsersRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompactPageHeader } from "@/components/compact-page-header";
import { Band, CtaBand, FaqBlock, LinkTiles, SectionHead } from "@/components/hiring-page-sections";
import { canonicalPath } from "@/lib/seo-url";
import type { SeoAuthorityPage } from "@/lib/seo-authority-pages";
import "@/app/homepage-sections.css";
import "@/app/hiring-pages.css";
import "@/app/info-pages.css";
import "@/app/market-authority.css";

export function authorityMetadata(page: SeoAuthorityPage): Metadata {
  const canonical = canonicalPath(page.path);
  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title: page.metaTitle, description: page.metaDescription },
    twitter: { card: "summary_large_image", title: page.metaTitle, description: page.metaDescription }
  };
}

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function SeoAuthorityPageView({ page }: { page: SeoAuthorityPage }) {
  const isMarketPage = page.path === "/virtual-assistant-australia" || page.path === "/virtual-assistant-usa";
  const marketName = page.path === "/virtual-assistant-australia" ? "Australia" : "United States";
  const coverageLabel = page.path === "/virtual-assistant-australia" ? "Australian business-hour coverage" : "US time-zone coverage";
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const url = base + page.path;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": url + "#webpage",
      url,
      name: page.metaTitle,
      description: page.metaDescription,
      about: page.keywords.map((name) => ({ "@type": "Thing", name }))
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": url + "#faq",
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a }
      }))
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": url + "#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: page.title, item: url }
      ]
    }
  ];

  return <>
    <SiteHeader />
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schema) }} />
      <CompactPageHeader
        eyebrow={page.eyebrow}
        title={<h1>{page.h1}</h1>}
        description={<p>{page.lede}</p>}
        actions={<>
          <Link className="btn btn-primary" href={page.primary.href}>{page.primary.label} <ArrowRight size={16}/></Link>
          {page.secondary ? <Link className="btn" href={page.secondary.href}>{page.secondary.label}</Link> : null}
        </>}
      />

      {isMarketPage ? <section className="market-signal-strip" aria-label={marketName + " hiring overview"}><div className="container market-signal-grid">
        <div><Globe2 size={20}/><span><strong>Philippines-based talent</strong><small>Remote support for {marketName} businesses</small></span></div>
        <div><Clock3 size={20}/><span><strong>{coverageLabel}</strong><small>Define live overlap before matching</small></span></div>
        <div><UsersRound size={20}/><span><strong>Role-specific matching</strong><small>Generalists and specialist workflows</small></span></div>
        <div><ShieldCheck size={20}/><span><strong>Vetted before shortlist</strong><small>Experience, communication, tools and fit</small></span></div>
      </div></section> : null}

      <div className={"hs-root sp-root" + (isMarketPage ? " market-authority-root" : "")}>
        {page.sections.map((section, index) => <Band key={section.heading} tone={index % 2 ? "soft" : "white"}>
          <SectionHead kicker={isMarketPage ? String(index + 1).padStart(2, "0") + " / " + (index === 0 ? "Scope the role" : "Market guide") : index === 0 ? "Start here" : "Go deeper"} title={section.heading} lede={section.intro}/>
          {section.bullets?.length ? <div className="sp-cards-4">
            {section.bullets.map((bullet) => <article className="sp-card" key={bullet}>
              <span className="sp-card-icon" aria-hidden="true"><CheckCircle2 size={18}/></span>
              <p>{bullet}</p>
            </article>)}
          </div> : null}
          {section.links?.length ? <LinkTiles items={section.links.map((link) => ({ href: link.href, label: link.label, sub: link.description }))}/> : null}
        </Band>)}

        <Band tone={page.sections.length % 2 ? "white" : "soft"}>
          <FaqBlock title={"Questions about " + page.title.toLowerCase()} lede="Use these answers as a starting point, then scope the actual role around your workflows, systems, schedule, and decision boundaries." faqs={page.faqs}/>
        </Band>

        <CtaBand
          title={page.ctaTitle}
          body={page.ctaBody}
          primary={{ href: page.primary.href, label: page.primary.label, track: "seo_authority_cta" }}
          secondary={page.secondary}
        />
      </div>
    </main>
    <SiteFooter />
  </>;
}
