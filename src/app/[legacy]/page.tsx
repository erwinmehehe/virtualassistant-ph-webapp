import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BlogArticle } from "@/components/blog-article";
import { BLOG_POSTS, blogHref, blogPostByLegacyPath } from "@/lib/blog";
import { canonicalPath } from "@/lib/seo-url";
import { ARCHIVE_POSTS, archivePostByLegacyPath, archivePublishedIso } from "@/lib/archive";
import { ArchiveArticle } from "@/components/archive-article";

export function generateStaticParams() {
  return [
    ...BLOG_POSTS.filter((post) => post.legacyPath),
    ...ARCHIVE_POSTS.filter((post) => post.legacyPath)
  ].map((post) => ({ legacy: post.legacyPath!.replace(/^\//, "").replace(/\/$/, "") }));
}

export async function generateMetadata({ params }: { params: Promise<{ legacy: string }> }): Promise<Metadata> {
  const { legacy } = await params;
  const post = blogPostByLegacyPath(`/${legacy}/`);
  if (!post) {
    // Recovered posts the old site served at the site root.
    const archived = archivePostByLegacyPath(`/${legacy}/`);
    if (!archived) return {};
    return {
      title: { absolute: archived.title },
      description: archived.excerpt.slice(0, 160),
      alternates: { canonical: canonicalPath(`/${legacy}`) },
      openGraph: { type: "article", title: archived.title, description: archived.excerpt.slice(0, 160), publishedTime: archivePublishedIso(archived) }
    };
  }
  return {
    title: { absolute: post.metaTitle },
    description: post.description,
    alternates: { canonical: canonicalPath(blogHref(post)) },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.publishedAt, modifiedTime: post.updatedAt }
  };
}

export default async function LegacyArticlePage({ params }: { params: Promise<{ legacy: string }> }) {
  const { legacy } = await params;
  const post = blogPostByLegacyPath(`/${legacy}/`);
  if (!post) {
    const archived = archivePostByLegacyPath(`/${legacy}/`);
    if (!archived) notFound();
    return <><SiteHeader/><main id="main-content"><ArchiveArticle post={archived}/></main><SiteFooter/></>;
  }
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph";
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${base}${blogHref(post)}#article`,
        headline: post.title,
        description: post.description,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        mainEntityOfPage: `${base}${blogHref(post)}`,
        articleSection: post.clusterLabel,
        author: {
          "@type": post.author.includes("Editorial") ? "Organization" : "Person",
          name: post.author,
          url: `${base}${post.author === "Christ Hemsworthy" ? "/authors/christ-hemsworthy" : "/authors/editorial-team"}`
        },
        ...(post.reviewedBy ? { reviewedBy: { "@type": "Organization", name: post.reviewedBy, url: `${base}/authors/editorial-team` } } : {}),
        publisher: { "@type": "Organization", name: "VirtualAssistant.com.ph", url: base }
      },
      {
        "@type": "FAQPage",
        "@id": `${base}${blogHref(post)}#faq`,
        mainEntity: post.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer }
        }))
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${base}${blogHref(post)}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: base },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${base}/blog/` },
          { "@type": "ListItem", position: 3, name: post.title, item: `${base}${blogHref(post)}` }
        ]
      }
    ]
  };
  return <><SiteHeader/><main id="main-content"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g,"\\u003c") }}/><BlogArticle post={post}/></main><SiteFooter/></>;
}
