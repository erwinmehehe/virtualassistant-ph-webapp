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
