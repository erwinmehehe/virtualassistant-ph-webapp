import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { INDUSTRIES } from "@/lib/industries";
import { softwarePages } from "@/lib/software-pages";
import { BLOG_POSTS, BLOG_TOPICS, blogHref } from "@/lib/blog";
import { ARCHIVE_POSTS, archiveUpdatedIso } from "@/lib/archive";
import { PUBLIC_SEO_ROUTES } from "@/lib/public-seo-routes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const blogTopicRoutes = Object.keys(BLOG_TOPICS).map((topic) => `/blog/topic/${topic}`);
  const supabase = await createClient();

  // VA profiles are deliberately noindex, so they are not listed here.
  const [{ data: jobs }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id,slug,published_at")
      .eq("status", "published")
      .not("client_id", "is", null)
      .limit(500),
  ]);

  return [
    ...PUBLIC_SEO_ROUTES.map((route) => ({
      url: `${base}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      ...(route.lastModified ? { lastModified: route.lastModified } : {}),
    })),
    ...blogTopicRoutes.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: "weekly" as const,
      priority: 0.72,
    })),
    ...BLOG_POSTS.map((post) => ({
      url: `${base}${blogHref(post)}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: post.serviceSlug ? 0.76 : 0.68,
    })),
    ...ARCHIVE_POSTS.map((post) => ({
      url: `${base}${post.legacyPath ? post.legacyPath.replace(/\/$/, "") : `/blog/${post.slug}`}`,
      ...(archiveUpdatedIso(post) ? { lastModified: archiveUpdatedIso(post) } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...SERVICE_PAGES.map((page) => ({
      url: `${base}/service/${page.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.78,
    })),
    ...INDUSTRIES.map((industry) => ({
      url: `${base}/industries/${industry.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.74,
    })),
    ...softwarePages.map((page) => ({
      url: `${base}/software/${page.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...(jobs || []).map((job: { id: string; slug: string | null; published_at: string | null }) => ({
      url: `${base}/jobs/${job.slug || job.id}`,
      lastModified: job.published_at || undefined,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
