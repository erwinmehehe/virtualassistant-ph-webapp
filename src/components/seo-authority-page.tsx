import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompactPageHeader } from "@/components/compact-page-header";
import { Band, CtaBand, FaqBlock, LinkTiles, SectionHead } from "@/components/hiring-page-sections";
import { canonicalPath } from "@/lib/seo-url";
import type { SeoAuthorityPage } from "@/lib/seo-authority-pages";
import "@/app/homepage-sections.css";
import "@/app/hiring-pages.css";
import "@/app/info-pages.css";

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

      <div className="hs-root sp-root">
        {page.sections.map((section, index) => <Band key={section.heading} tone={index % 2 ? "soft" : "white"}>
          <SectionHead kicker={index === 0 ? "Start here" : "Go deeper"} title={section.heading} lede={section.intro}/>
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
