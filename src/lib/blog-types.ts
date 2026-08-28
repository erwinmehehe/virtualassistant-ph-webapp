export type BlogTopic =
  | "hiring"
  | "pricing"
  | "managing"
  | "philippines"
  | "seo-marketing"
  | "ecommerce"
  | "real-estate"
  | "healthcare"
  | "legal"
  | "finance-bookkeeping";

export type BlogSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  numbered?: string[];
  table?: { headers: string[]; rows: string[][] };
};

export type BlogFaq = { question: string; answer: string };
export type BlogInternalLink = { label: string; href: string; description: string };

export type BlogPost = {
  slug: string;
  legacyPath?: string;
  title: string;
  metaTitle: string;
  description: string;
  excerpt: string;
  topic: BlogTopic;
  clusterLabel: string;
  serviceSlug?: string;
  industrySlugs?: string[];
  intent: "informational" | "commercial" | "comparison" | "compliance";
  publishedAt: string;
  updatedAt: string;
  author: "Christ Hemsworthy" | "VirtualAssistant.com.ph Editorial Team";
  reviewedBy?: string;
  reviewNote?: string;
  sources?: { label: string; href: string }[];
  keyTakeaways: string[];
  sections: BlogSection[];
  faqs: BlogFaq[];
  internalLinks: BlogInternalLink[];
};
