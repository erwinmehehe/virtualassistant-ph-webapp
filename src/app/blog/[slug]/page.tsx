import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BlogArticle } from "@/components/blog-article";
import { BLOG_POSTS, blogHref, blogPostBySlug } from "@/lib/blog";
import { canonicalPath } from "@/lib/seo-url";
import { ARCHIVE_POSTS, archivePostBySlug, archivePublishedIso, archiveUpdatedIso } from "@/lib/archive";
import { ArchiveArticle } from "@/components/archive-article";
import { organizationRef } from "@/lib/organization";

export function generateStaticParams() {
  return [
    ...BLOG_POSTS.filter((post) => !post.legacyPath).map((post) => ({ slug: post.slug })),
    ...ARCHIVE_POSTS.filter((post) => !post.legacyPath).map((post) => ({ slug: post.slug }))
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPostBySlug(slug);
  if (!post || post.legacyPath) {
    const archived = archivePostBySlug(slug);
    if (!archived || archived.legacyPath) return {};
    const archiveUpdated = archiveUpdatedIso(archived);
    return {
      title: { absolute: archived.metaTitle || archived.title },
      description: archived.metaDescription || archived.excerpt.slice(0, 160),
      alternates: { canonical: canonicalPath(`/blog/${archived.slug}`) },
      openGraph: {
        type: "article",
        title: archived.metaTitle || archived.title,
        description: archived.metaDescription || archived.excerpt.slice(0, 160),
        publishedTime: archivePublishedIso(archived),
        ...(archiveUpdated ? { modifiedTime: archiveUpdated } : {})
      }
    };
  }
  const hasMeaningfulUpdate = post.updatedAt !== post.publishedAt;
  return {
    title: { absolute: post.metaTitle },
    description: post.description,
    alternates: { canonical: canonicalPath(blogHref(post)) },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      ...(hasMeaningfulUpdate ? { modifiedTime: post.updatedAt } : {})
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPostBySlug(slug);
  if (!post || post.legacyPath) {
    const archived = archivePostBySlug(slug);
    if (!archived || archived.legacyPath) notFound();
    const base = process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph";
    const archiveUrl = `${base}/blog/${archived.slug}`;
    const archiveSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${archiveUrl}#article`,
          headline: archived.title,
          description: archived.excerpt,
          datePublished: archivePublishedIso(archived),
          ...(archiveUpdatedIso(archived) ? { dateModified: archiveUpdatedIso(archived) } : {}),
          mainEntityOfPage: archiveUrl,
          articleSection: archived.tag,
          author: { "@type": "Organization", name: "VirtualAssistant.com.ph Editorial Team", url: `${base}/authors/editorial-team` },
          publisher: organizationRef(base)
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${archiveUrl}#breadcrumb`,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: base },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${base}/blog` },
            { "@type": "ListItem", position: 3, name: archived.title, item: archiveUrl }
          ]
        }
      ]
    };
    return <><SiteHeader/><main id="main-content"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(archiveSchema).replace(/</g,"\\u003c") }}/><ArchiveArticle post={archived}/></main><SiteFooter/></>;
  }
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph";
  const url = `${base}${blogHref(post)}`;
  const articleKeywords = [post.title, post.clusterLabel, `${post.clusterLabel} Philippines`, "Virtual Assistant Philippines", ...(post.industrySlugs || [])].join(", ");
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${base}${blogHref(post)}#article`,
        headline: post.title,
        description: post.description,
        keywords: articleKeywords,
        datePublished: post.publishedAt,
        ...(post.updatedAt !== post.publishedAt ? { dateModified: post.updatedAt } : {}),
        mainEntityOfPage: url,
        articleSection: post.clusterLabel,
        author: {
          "@type": post.author.includes("Editorial") ? "Organization" : "Person",
          name: post.author,
          url: `${base}${post.author === "Christ Hemsworthy" ? "/authors/christ-hemsworthy" : "/authors/editorial-team"}`
        },
        ...(post.reviewedBy ? { reviewedBy: { "@type": "Organization", name: post.reviewedBy, url: `${base}/authors/editorial-team` } } : {}),
        publisher: organizationRef(base)
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
          { "@type": "ListItem", position: 2, name: "Blog", item: `${base}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: `${base}${blogHref(post)}` }
        ]
      }
    ]
  };
  return <><SiteHeader/><main id="main-content"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g,"\\u003c") }}/><BlogArticle post={post}/></main><SiteFooter/></>;
}
