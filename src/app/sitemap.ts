import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { INDUSTRIES } from "@/lib/industries";
import { softwarePages } from "@/lib/software-pages";
import { BLOG_POSTS, BLOG_TOPICS, blogHref } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const staticRoutes = [
    "", "/hire", "/find-talent", "/services", "/pricing", "/managed-vs-direct-hire", "/how-vetting-works", "/faq", "/about", "/privacy", "/terms", "/contact", "/jobs", "/industries", "/software",
    "/blog", "/tools", "/tools/virtual-assistant-cost-calculator", "/tools/virtual-assistant-hourly-to-monthly-calculator", "/tools/virtual-assistant-job-description-generator", "/tools/what-type-of-va-do-i-need",
    "/authors/christ-hemsworthy", "/authors/editorial-team", "/editorial-policy"
  ];
  const blogTopicRoutes = Object.keys(BLOG_TOPICS).map((topic) => `/blog/topic/${topic}`);
  const supabase = await createClient();
  // VA profiles are deliberately noindex, so they are not listed here.
  const [{ data: jobs }] = await Promise.all([
    supabase.from("jobs").select("id,slug,published_at").eq("status", "published").limit(500)
  ]);
  return [
    ...staticRoutes.map((path) => ({ url: `${base}${path}`, changeFrequency: path === "" ? "weekly" as const : "monthly" as const, priority: path === "" ? 1 : .8 })),
    ...blogTopicRoutes.map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: .72 })),
    ...BLOG_POSTS.map((post) => ({ url: `${base}${blogHref(post)}`, lastModified: post.updatedAt, changeFrequency: "monthly" as const, priority: post.serviceSlug ? .76 : .68 })),
    ...SERVICE_PAGES.map((page) => ({ url: `${base}/service/${page.slug}`, changeFrequency: "monthly" as const, priority: .78 })),
    ...INDUSTRIES.map((industry) => ({ url: `${base}/industries/${industry.slug}`, changeFrequency: "monthly" as const, priority: .74 })),
    ...softwarePages.map((page) => ({ url: `${base}/software/${page.slug}`, changeFrequency: "monthly" as const, priority: .7 })),
    ...(jobs || []).map((x: any) => ({ url: `${base}/jobs/${x.slug || x.id}`, lastModified: x.published_at || undefined, changeFrequency: "daily" as const, priority: .7 }))
  ];
}
