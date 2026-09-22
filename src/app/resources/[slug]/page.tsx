import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompactPageHeader } from "@/components/compact-page-header";
import { Band, CtaBand, FaqBlock, LinkTiles, SectionHead } from "@/components/hiring-page-sections";
import { SEO_RESOURCE_PAGES, seoResourceBySlug } from "@/lib/seo-resource-pages";
import { canonicalPath } from "@/lib/seo-url";
import "@/app/homepage-sections.css";
import "@/app/hiring-pages.css";
import "@/app/info-pages.css";

export function generateStaticParams() {
  return SEO_RESOURCE_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = seoResourceBySlug(slug);
  if (!page) return {};
  const canonical = canonicalPath("/resources/" + page.slug);
  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: { canonical },
    openGraph: { type: "article", url: canonical, title: page.metaTitle, description: page.metaDescription },
    twitter: { card: "summary_large_image", title: page.metaTitle, description: page.metaDescription }
  };
}

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = seoResourceBySlug(slug);
  if (!page) notFound();

  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const url = base + "/resources/" + page.slug;
  const parentHref = page.audience === "candidate" ? "/for-virtual-assistants" : page.serviceSlug ? "/service/" + page.serviceSlug : "/services";
  const primary = page.audience === "candidate"
    ? { href: "/jobs", label: "Browse VA jobs" }
    : { href: page.serviceSlug ? "/service/" + page.serviceSlug : "/services", label: page.role ? "Explore " + page.role : "Browse VA services" };
  const secondary = page.audience === "candidate"
    ? { href: "/auth/join/va", label: "Create your profile" }
    : { href: "/hire", label: "Send a hiring brief" };

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": url + "#article",
      headline: page.title,
      description: page.metaDescription,
      mainEntityOfPage: url,
      datePublished: "2026-09-22",
      dateModified: "2026-09-22",
      author: { "@type": "Organization", name: "VirtualAssistant.com.ph Editorial Team", url: base + "/authors/editorial-team" },
      publisher: { "@type": "Organization", name: "VirtualAssistant.com.ph", url: base }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": url + "#faq",
      mainEntity: page.faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } }))
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": url + "#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Resources", item: base + "/resources" },
        { "@type": "ListItem", position: 3, name: page.title, item: url }
      ]
    }
  ];

  return <>
    <SiteHeader />
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schema) }} />
      <CompactPageHeader
        eyebrow={page.audience === "candidate" ? "For Virtual Assistants" : page.clusterLabel}
        title={<h1>{page.title}</h1>}
        description={<p>{page.lede}</p>}
        meta={<Link className="text-link" href={parentHref}>{page.audience === "candidate" ? "Virtual Assistant candidate hub" : "Canonical role guide"} <ArrowRight size={13}/></Link>}
        actions={<><Link className="btn btn-primary" href={primary.href}>{primary.label} <ArrowRight size={16}/></Link><Link className="btn" href={secondary.href}>{secondary.label}</Link></>}
      />

      <div className="hs-root sp-root">
        {page.sections.map((section, index) => <Band key={section.heading} tone={index % 2 ? "soft" : "white"}>
          <SectionHead kicker={index === 0 ? "Practical guide" : "Next step"} title={section.heading} lede={section.paragraphs[0]}/>
          {section.paragraphs.slice(1).map((paragraph) => <p className="hs-lede" key={paragraph}>{paragraph}</p>)}
          {section.bullets?.length ? <div className="sp-cards-4">
            {section.bullets.map((bullet) => <article className="sp-card" key={bullet}>
              <span className="sp-card-icon" aria-hidden="true"><CheckCircle2 size={18}/></span>
              <p>{bullet}</p>
            </article>)}
          </div> : null}
        </Band>)}

        <Band tone={page.sections.length % 2 ? "white" : "soft"}>
          <SectionHead kicker="Related guidance" title="Continue the topic without creating duplicate intent." lede="Use the canonical role, candidate hub, and supporting resources below to move to the next question."/>
          <LinkTiles items={page.internalLinks.map((link) => ({ href: link.href, label: link.label, sub: link.description }))}/>
        </Band>

        <Band tone={page.sections.length % 2 ? "soft" : "white"}>
          <FaqBlock title={"Questions about " + page.title.toLowerCase()} lede="These answers cover the common decision points around this topic." faqs={page.faqs}/>
        </Band>

        <CtaBand
          title={page.audience === "candidate" ? "Turn the guide into a stronger VA profile and application." : "Turn the guide into a clearer hiring brief."}
          body={page.audience === "candidate" ? "Keep your profile accurate, show relevant evidence, and apply to roles that fit your skills, schedule, and experience." : "Define the responsibilities, systems, weekly hours, schedule, and evidence that matter before comparing candidates."}
          primary={{ href: primary.href, label: primary.label, track: "seo_resource_cta" }}
          secondary={secondary}
        />
      </div>
    </main>
    <SiteFooter />
  </>;
}
