import type { BlogPost } from "@/lib/blog-types";
import { seoAuthorityPage } from "@/lib/seo-authority-pages";
import { seoResourceBySlug } from "@/lib/seo-resource-pages";

export const EDITORIAL_RESOURCE_SLUGS = [
  "how-to-apply-as-a-virtual-assistant",
  "virtual-assistant-resume-sample",
  "virtual-assistant-portfolio-examples",
  "virtual-assistant-skills",
  "virtual-assistant-requirements-philippines",
  "how-to-become-a-virtual-assistant-philippines",
  "virtual-assistant-training-guide",
  "virtual-assistant-certification-guide",
  "virtual-assistant-cover-letter",
  "best-laptop-for-virtual-assistant",
  "freelance-platforms-for-virtual-assistants",
  "how-to-start-a-virtual-assistant-business"
] as const;

export const EXISTING_BLOG_RESOURCE_REDIRECTS: Record<string, string> = {
  "virtual-assistant-no-experience": "/blog/become-virtual-assistant-no-experience"
};

const authorityGuides = [
  { key: "companies" as const, slug: "virtual-assistant-companies-philippines", topic: "hiring" as const, intent: "comparison" as const },
  { key: "websites" as const, slug: "virtual-assistant-websites", topic: "hiring" as const, intent: "comparison" as const },
  { key: "what-is" as const, slug: "what-is-a-virtual-assistant", topic: "hiring" as const, intent: "informational" as const },
  { key: "nonprofits" as const, slug: "virtual-assistant-for-nonprofits", topic: "hiring" as const, intent: "informational" as const }
];

function authorityToBlog(config: typeof authorityGuides[number]): BlogPost {
  const page = seoAuthorityPage(config.key);
  return {
    slug: config.slug,
    title: page.title,
    metaTitle: page.metaTitle,
    description: page.metaDescription,
    excerpt: page.lede,
    topic: config.topic,
    clusterLabel: page.eyebrow,
    intent: config.intent,
    publishedAt: "2026-09-22",
    updatedAt: "2026-09-22",
    author: "VirtualAssistant.com.ph Editorial Team",
    reviewedBy: "VirtualAssistant.com.ph Editorial Team",
    keyTakeaways: page.sections.slice(0, 4).map((section) => section.heading),
    sections: page.sections.map((section) => ({
      heading: section.heading,
      paragraphs: [section.intro],
      bullets: section.bullets
    })),
    faqs: page.faqs.map((faq) => ({ question: faq.q, answer: faq.a })),
    internalLinks: page.sections.flatMap((section) => section.links || []).slice(0, 8).map((link) => ({
      href: link.href,
      label: link.label,
      description: link.description
    }))
  };
}

function resourceToBlog(slug: string): BlogPost {
  const page = seoResourceBySlug(slug);
  if (!page) throw new Error("Missing editorial resource: " + slug);
  const topic = slug.includes("training") || slug.includes("certification") ? "managing" : "philippines";
  return {
    slug,
    title: page.title,
    metaTitle: page.metaTitle,
    description: page.metaDescription,
    excerpt: page.lede,
    topic,
    clusterLabel: page.clusterLabel,
    intent: "informational",
    publishedAt: "2026-09-22",
    updatedAt: "2026-09-22",
    author: "VirtualAssistant.com.ph Editorial Team",
    reviewedBy: "VirtualAssistant.com.ph Editorial Team",
    keyTakeaways: page.sections.slice(0, 4).map((section) => section.heading),
    sections: page.sections.map((section) => ({
      heading: section.heading,
      paragraphs: section.paragraphs,
      bullets: section.bullets
    })),
    faqs: page.faqs.map((faq) => ({ question: faq.q, answer: faq.a })),
    internalLinks: page.internalLinks
  };
}

export const EDITORIAL_SEO_POSTS: BlogPost[] = [
  ...authorityGuides.map(authorityToBlog),
  ...EDITORIAL_RESOURCE_SLUGS.map(resourceToBlog)
];

export function editorialSeoPostBySlug(slug: string) {
  return EDITORIAL_SEO_POSTS.find((post) => post.slug === slug);
}

export function editorialBlogHrefForResource(slug: string) {
  return EXISTING_BLOG_RESOURCE_REDIRECTS[slug] || (EDITORIAL_RESOURCE_SLUGS.includes(slug as typeof EDITORIAL_RESOURCE_SLUGS[number]) ? "/blog/" + slug : "/resources/" + slug);
}
