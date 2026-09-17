import { BLOG_POSTS as RAW_BLOG_POSTS } from "@/lib/blog-content";
import type { BlogPost, BlogTopic } from "@/lib/blog-types";

export type { BlogFaq, BlogInternalLink, BlogPost, BlogSection, BlogTopic } from "@/lib/blog-types";

const CURRENT_PRICING_FAQ_QUESTION = "How should I budget for a Virtual Assistant role on VirtualAssistant.com.ph?";
const CURRENT_PRICING_FAQ_ANSWER =
  "For current compensation and service pricing, use the VirtualAssistant.com.ph Pricing page and the role review process. Budget guidance depends on the role, hours, schedule, required experience, and service model, so a single public hourly floor should not be treated as the default for every role.";
const CURRENT_PRICING_PARAGRAPH =
  "Before publishing a role, use the current VirtualAssistant.com.ph Pricing page and role review process for up-to-date budget guidance. Compensation depends on the role, hours, schedule, required experience, and service model, so a single public hourly floor should not be treated as the default for every job.";
const CURRENT_PRICING_SHORT = "See the current Pricing page for role-specific budget guidance.";

function containsStaleFiveDollarFloor(text: string) {
  return /(?:\$5(?:\.00)?(?:\/hr)?|5 USD)/i.test(text) &&
    /(?:VirtualAssistant\.com\.ph|platform|marketplace|ongoing hourly|minimum hourly|floor)/i.test(text);
}

function normalizeFaqQuestion(question: string) {
  return /minimum hourly rate on VirtualAssistant\.com\.ph/i.test(question)
    ? CURRENT_PRICING_FAQ_QUESTION
    : question;
}

function normalizeFaqAnswer(answer: string) {
  return containsStaleFiveDollarFloor(answer) ? CURRENT_PRICING_FAQ_ANSWER : answer;
}

function normalizeSectionText(text: string) {
  return containsStaleFiveDollarFloor(text) ? CURRENT_PRICING_PARAGRAPH : text;
}

function normalizeCompactText(text: string) {
  return containsStaleFiveDollarFloor(text) ? CURRENT_PRICING_SHORT : text;
}

function normalizeBlogPost(post: BlogPost): BlogPost {
  return {
    ...post,
    keyTakeaways: post.keyTakeaways.map(normalizeCompactText),
    sections: post.sections.map((section) => ({
      ...section,
      heading: normalizeCompactText(section.heading),
      paragraphs: section.paragraphs?.map(normalizeSectionText),
      bullets: section.bullets?.map(normalizeCompactText),
      numbered: section.numbered?.map(normalizeCompactText),
      table: section.table
        ? {
            headers: section.table.headers.map(normalizeCompactText),
            rows: section.table.rows.map((row) => row.map(normalizeCompactText))
          }
        : undefined
    })),
    faqs: post.faqs.map((faq) => ({
      question: normalizeFaqQuestion(faq.question),
      answer: normalizeFaqAnswer(faq.answer)
    })),
    internalLinks: post.internalLinks.map((link) => ({
      ...link,
      description: normalizeCompactText(link.description)
    }))
  };
}

export const BLOG_POSTS: BlogPost[] = RAW_BLOG_POSTS.map(normalizeBlogPost);

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
