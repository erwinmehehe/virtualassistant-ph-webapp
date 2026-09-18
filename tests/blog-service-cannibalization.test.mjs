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

test("the ecommerce hiring guide is explicitly informational, not a duplicate money-page title", () => {
  const posts = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  const post = posts.find((item) => item.slug === "hire-ecommerce-virtual-assistant-philippines");
  assert.ok(post, "ecommerce hiring guide missing");
  assert.match(post.metaTitle, /Hiring Guide/);
  assert.doesNotMatch(post.metaTitle, /^Hire Ecommerce Virtual Assistant Philippines/);
});
