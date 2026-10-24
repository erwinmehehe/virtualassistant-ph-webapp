import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

test("payment article H1 matches its concise existing SEO title without changing the slug", () => {
  const archive = source("src/lib/archive-posts.ts");
  const entry = archive.match(/"slug": "get-paid-virtual-assistant-philippines",[\s\S]{0,850}/);
  assert.ok(entry, "payment article must remain published at its current URL");
  assert.match(entry[0], /"title": "How to Get Paid as a Virtual Assistant in the Philippines"/);
  assert.match(entry[0], /"metaTitle": "How to Get Paid as a Virtual Assistant in the Philippines"/);
  assert.doesNotMatch(entry[0], /"title": "[^"]*by International Clients"/);
  assert.match(entry[0], /"metaDescription": "Learn how Filipino Virtual Assistants get paid by international clients/);
});

test("merged payment article keeps named provider guidance and safe bank-instruction verification", () => {
  const archive = source("src/lib/archive-posts.ts");
  const marker = "export const ARCHIVE_POSTS: ArchivePost[] = ";
  const start = archive.indexOf("[", archive.indexOf(marker) + marker.length);
  const end = archive.indexOf("];", start);
  const posts = JSON.parse(archive.slice(start, end + 1));
  const paid = posts.find((post) => post.slug === "get-paid-virtual-assistant-philippines");
  assert.ok(paid);
  assert.equal(paid.updatedDate, "October 24, 2026");
  assert.match(paid.html, /Wise, Payoneer, PayPal, or bank transfer: which payment method fits\?/);
  assert.match(paid.html, /How do you verify payment instructions without exposing your accounts\?/);
  assert.match(paid.html, /USD 500/);
  assert.match(paid.html, /https:\/\/wise\.com\/help/);
  assert.match(paid.html, /https:\/\/www\.payoneer\.com\//);
  const blog = source("src/lib/blog.ts");
  for (const symbol of ["BLOG_AEO_GUIDES", "BLOG_AEO_FOLLOWUP_GUIDES", "CLICK_GROWTH_POST_OVERRIDES", "applyGscEditorialPatch"]) {
    assert.ok(blog.includes(symbol), symbol + " must remain wired into blog registration");
  }
});

test("new and archived article templates use one semantic H1 and a long-title class", () => {
  for (const path of ["src/components/blog-article.tsx", "src/components/archive-article.tsx"]) {
    const template = source(path);
    assert.equal((template.match(/<h1\b/g) || []).length, 1, path + ": must render only one H1");
    assert.match(template, /<h1 className=\{post\.title\.length > 68 \? "blog-long-title" : undefined\}>\{post\.title\}<\/h1>/);
  }
  assert.doesNotMatch(source("src/lib/archive-posts.ts"), /<h1\b/i, "archived HTML must not introduce nested H1s");
});

test("shared blog hero prevents oversized, squeezed headings on desktop and mobile", () => {
  const editorial = source("src/app/blog-editorial.css");
  const artwork = source("src/app/blog-featured-visual.css");
  assert.match(editorial, /\.archive-editorial-hero \.blog-editorial-hero-inner \{\s*max-width: 1180px;/);
  assert.match(editorial, /\.blog-editorial-hero h1 \{[\s\S]*?overflow-wrap: break-word;/);
  assert.match(artwork, /\.blog-editorial-hero h1\.blog-long-title \{[\s\S]*?overflow-wrap: anywhere;/);
  assert.match(artwork, /@media \(max-width: 640px\) \{[\s\S]*?\.blog-editorial-hero h1\.blog-long-title \{/);
  assert.match(artwork, /@media \(max-width: 980px\) \{[\s\S]*?grid-template-columns: 1fr;/);
});
