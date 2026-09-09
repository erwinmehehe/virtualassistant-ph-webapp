import { BLOG_POSTS } from "@/lib/blog-content";
import type { BlogPost, BlogTopic } from "@/lib/blog-types";

export type { BlogFaq, BlogInternalLink, BlogPost, BlogSection, BlogTopic } from "@/lib/blog-types";
export { BLOG_POSTS } from "@/lib/blog-content";

export const BLOG_TOPICS: Record<BlogTopic, { label: string; description: string }> = {
  hiring: { label: "Hiring", description: "Role design, screening, interviews, job descriptions, onboarding, and better hiring decisions." },
  pricing: { label: "Pricing", description: "Virtual Assistant budgets, hourly and monthly cost planning, marketplace rates, and compensation decisions." },
  managing: { label: "Managing Virtual Assistants", description: "Delegation, SOPs, communication, access controls, training, and ongoing performance management." },
  philippines: { label: "Philippines Hiring", description: "Practical guidance for businesses hiring and working with remote professionals in the Philippines." },
  "seo-marketing": { label: "SEO & Marketing", description: "SEO, content, paid media, social, email, and marketing operations support." },
  ecommerce: { label: "Ecommerce", description: "Amazon, Shopify, marketplace operations, customer support, listings, and order workflows." },
  "real-estate": { label: "Real Estate", description: "Real estate lead follow-up, CRM work, listings, transactions, and property operations." },
  healthcare: { label: "Healthcare", description: "Non-clinical medical, dental, billing, scheduling, and patient administration workflows." },
  legal: { label: "Legal", description: "Supervised law firm administration, client intake, matter support, confidentiality, and legal operations." },
  "finance-bookkeeping": { label: "Finance & Bookkeeping", description: "Bookkeeping, accounting support, payroll administration, invoicing, and finance operations." }
};

export function blogHref(post: BlogPost) {
  return (post.legacyPath || `/blog/${post.slug}`).replace(/\/$/, "");
}

export function blogPostBySlug(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function blogPostByLegacyPath(path: string) {
  const normalized = path.endsWith("/") ? path : `${path}/`;
  return BLOG_POSTS.find((post) => post.legacyPath === normalized);
}

export function relatedBlogPosts(post: BlogPost, limit = 4) {
  return BLOG_POSTS.filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => ({
      candidate,
      score:
        (post.serviceSlug && candidate.serviceSlug === post.serviceSlug ? 7 : 0) +
        (candidate.clusterLabel === post.clusterLabel ? 5 : 0) +
        (candidate.topic === post.topic ? 3 : 0) +
        (candidate.intent === post.intent ? 1 : 0)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title))
    .slice(0, limit)
    .map((item) => item.candidate);
}

export function topicPosts(topic: BlogTopic) {
  return BLOG_POSTS.filter((post) => post.topic === topic);
}

export function serviceBlogPosts(serviceSlug: string, limit = 9) {
  return BLOG_POSTS.filter((post) => post.serviceSlug === serviceSlug)
    .sort((a, b) => {
      const intentOrder: Record<BlogPost["intent"], number> = { commercial: 0, informational: 1, comparison: 2, compliance: 3 };
      return intentOrder[a.intent] - intentOrder[b.intent] || a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}

export const BLOG_CLUSTER_SERVICE_SLUGS = Array.from(new Set(BLOG_POSTS.map((post) => post.serviceSlug).filter(Boolean))) as string[];
