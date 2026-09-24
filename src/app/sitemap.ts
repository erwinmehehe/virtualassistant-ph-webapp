import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { INDUSTRIES } from "@/lib/industries";
import { softwarePages } from "@/lib/software-pages";
import { BLOG_POSTS, BLOG_TOPICS, blogHref } from "@/lib/blog";
import { ARCHIVE_POSTS, archiveUpdatedIso } from "@/lib/archive";
import { PUBLIC_SEO_ROUTES } from "@/lib/public-seo-routes";
import { SEO_RESOURCE_PAGES } from "@/lib/seo-resource-pages";
import { seoResourceUpdatedAt } from "@/lib/seo-resource-dates";
import { EDITORIAL_RESOURCE_SLUGS, EXISTING_BLOG_RESOURCE_REDIRECTS } from "@/lib/editorial-seo-guides";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const blogTopicRoutes = Object.keys(BLOG_TOPICS).map((topic) => `/blog/topic/${topic}`);
  const supabase = await createClient();

  // VA profiles are deliberately noindex, so they are not listed here.
  // Public jobs must come from the sanitized public_jobs view: raw jobs are
  // intentionally unavailable to anonymous/public reads after RLS hardening.
  const jobs: Array<{ id: string; slug: string | null; published_at: string | null; expires_at: string | null }> = [];
  const JOB_PAGE_SIZE = 500;
  for (let from = 0; from < 10_000; from += JOB_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("public_jobs")
      .select("id,slug,published_at,expires_at")
      .gt("expires_at", new Date().toISOString())
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(from, from + JOB_PAGE_SIZE - 1);
    if (error || !data?.length) break;
    jobs.push(...data);
    if (data.length < JOB_PAGE_SIZE) break;
  }

  return [
    ...PUBLIC_SEO_ROUTES.map((route) => ({
      url: `${base}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      ...(route.lastModified ? { lastModified: route.lastModified } : {}),
    })),
    ...SEO_RESOURCE_PAGES.filter((page) => !EDITORIAL_RESOURCE_SLUGS.includes(page.slug as typeof EDITORIAL_RESOURCE_SLUGS[number]) && !EXISTING_BLOG_RESOURCE_REDIRECTS[page.slug]).map((page) => ({
      url: `${base}/resources/${page.slug}`,
      lastModified: seoResourceUpdatedAt(page.slug),
      changeFrequency: "monthly" as const,
      priority: page.audience === "client" ? 0.72 : 0.66,
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
    ...jobs.map((job) => ({
      url: `${base}/jobs/${job.slug || job.id}`,
      lastModified: job.published_at || undefined,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
