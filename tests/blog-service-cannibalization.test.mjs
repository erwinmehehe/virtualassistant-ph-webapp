import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function parseArray(path, marker) {
  const text = source(path);
  const markerIndex = text.indexOf(marker);
  assert.ok(markerIndex >= 0, `${path} marker missing`);
  const start = text.indexOf("[", markerIndex + marker.length);
  const end = text.lastIndexOf("];");
  return JSON.parse(text.slice(start, end + 1));
}

test("structured blog titles stay distinct from service money-page titles", () => {
  const services = parseArray("src/lib/service-pages.ts", "export const SERVICE_PAGES: ServiceSeoPage[] = ");
  const posts = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  const serviceTitles = new Map(services.map((service) => [service.metaTitle.toLowerCase(), service.slug]));

  for (const post of posts) {
    const collision = serviceTitles.get(post.metaTitle.toLowerCase());
    assert.equal(collision, undefined, `${post.slug} duplicates the service-page title for ${collision}`);
  }
});

test("overlapping ecommerce hiring guides consolidate into the ecommerce money page", () => {
  const posts = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  const config = source("next.config.ts");

  assert.equal(posts.some((item) => item.slug === "hire-ecommerce-virtual-assistant-philippines"), false);
  assert.equal(posts.some((item) => item.slug === "how-to-hire-a-ecommerce"), false);
  assert.match(config, /source: "\/blog\/hire-ecommerce-virtual-assistant-philippines", destination: "\/service\/ecommerce", permanent: true/);
  assert.match(config, /source: "\/blog\/how-to-hire-a-ecommerce", destination: "\/service\/ecommerce", permanent: true/);
});


test("legacy broad SEO guide consolidates into the SEO service money page", () => {
  const config = source("next.config.ts");
  assert.match(
    config,
    /source: "\/blog\/seo-virtual-assistant-philippines-guide", destination: "\/service\/seo", permanent: true/
  );
  assert.match(
    config,
    /source: "\/blog\/seo-virtual-assistant-philippines-guide\/", destination: "\/service\/seo", permanent: true/
  );
});


test("role screening guides stay informational and distinct from service money pages", () => {
  const posts = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  const slugs = [
    "how-to-hire-a-appointment-setter-virtual-assistant",
    "how-to-hire-a-cold-calling-virtual-assistant",
    "how-to-hire-a-content-marketing-virtual-assistant",
    "how-to-hire-a-credit-repair-virtual-assistant",
    "how-to-hire-a-dental-billing-virtual-assistant",
    "how-to-hire-a-financial-advisor-virtual-assistant",
    "how-to-hire-a-google-ads-virtual-assistant",
    "how-to-hire-a-law-firm-virtual-assistant",
    "how-to-hire-a-lead-generation",
    "how-to-hire-a-medical-billing-virtual-assistant",
    "how-to-hire-a-medical-scribe-virtual-assistant",
    "how-to-hire-a-mental-health-virtual-assistant",
    "how-to-hire-a-real-estate",
    "how-to-hire-a-short-term-rental-virtual-assistant",
    "how-to-hire-a-web-developer-virtual-assistant"
  ];

  for (const slug of slugs) {
    const post = posts.find((item) => item.slug === slug);
    assert.ok(post, `${slug}: screening guide missing`);
    assert.equal(post.intent, "informational", `${slug}: should not compete as a commercial money page`);
    assert.equal(post.updatedAt, "2026-09-20", `${slug}: should expose the September 20 intent-change date`);
    assert.match(post.metaTitle, /Screening & Interview Guide/);
    assert.doesNotMatch(post.metaTitle, /Hiring Guide/);
    assert.match(post.description, /screen/i);
    assert.ok((post.internalLinks || []).some((link) => link.href === `/service/${post.serviceSlug}`), `${slug}: must point to its service money page`);
  }
});

test("medical VA comparison explicitly bridges both compared service pages", () => {
  const posts = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  const post = posts.find((item) => item.slug === "medical-billing-va-vs-medical-va");
  assert.ok(post, "medical comparison guide missing");
  const hrefs = new Set((post.internalLinks || []).map((link) => link.href));
  assert.ok(hrefs.has("/service/medical-virtual-assistant"));
  assert.ok(hrefs.has("/service/medical-billing-virtual-assistant"));
  assert.equal(post.intent, "comparison");
});


test("duplicate law-firm tools guide stays consolidated", () => {
  const posts = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  const slugs = new Set(posts.map((post) => post.slug));
  const oldHref = "/blog/best-legal-practice-management-tools-for-vas";
  const canonicalHref = "/blog/best-tools-for-law-firm-virtual-assistant";

  assert.equal(slugs.has("best-legal-practice-management-tools-for-vas"), false);
  assert.equal(slugs.has("best-tools-for-law-firm-virtual-assistant"), true);

  for (const post of posts) {
    assert.equal(
      (post.internalLinks || []).some((link) => link.href === oldHref),
      false,
      `${post.slug}: stale link to consolidated law-firm tool guide`
    );
  }

  const nextConfig = source("next.config.ts");
  assert.match(nextConfig, /best-legal-practice-management-tools-for-vas/);
  assert.match(nextConfig, /best-tools-for-law-firm-virtual-assistant/);

  const lawPosts = posts.filter((post) => post.serviceSlug === "law-firm-virtual-assistant");
  assert.equal(lawPosts.length, 10);
});
