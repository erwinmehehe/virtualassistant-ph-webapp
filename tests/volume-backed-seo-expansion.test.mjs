import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function roleClusterBlock() {
  const text = source("src/lib/seo-resource-pages.ts");
  const start = text.indexOf("const ROLE_CLUSTERS: RoleCluster[] = [");
  const end = text.indexOf("];\n\nfunction titleCase", start);
  assert.ok(start >= 0 && end > start, "role cluster block must remain parseable");
  return text.slice(start, end);
}

function parseArray(path, marker) {
  const text = source(path);
  const markerIndex = text.indexOf(marker);
  assert.ok(markerIndex >= 0, `${path} marker missing`);
  const start = text.indexOf("[", markerIndex + marker.length);
  const end = text.indexOf("];", start);
  return JSON.parse(text.slice(start, end + 1));
}

test("September 22 role expansion keeps 25 canonical service clusters", () => {
  const clusters = [...roleClusterBlock().matchAll(/serviceSlug:\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.equal(clusters.length, 25);
  assert.equal(new Set(clusters).size, 25);
  for (const slug of [
    "general-virtual-assistant",
    "small-business-virtual-assistant",
    "payroll-virtual-assistant",
    "operations",
    "calendar",
    "airbnb-virtual-assistant",
    "pinterest-virtual-assistant",
    "content-writing",
  ]) {
    assert.ok(clusters.includes(slug), `missing September 22 role cluster ${slug}`);
  }
});

test("SEO expansion release checker accepts the current canonical map", () => {
  assert.doesNotThrow(() => execFileSync(process.execPath, ["scripts/check-seo-expansion.mjs"], { cwd: new URL("..", import.meta.url), stdio: "pipe" }));
});

test("SEO expansion checker validates all eight September 22 resource families", () => {
  const output = execFileSync(process.execPath, ["scripts/check-seo-expansion.mjs"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });
  const result = JSON.parse(output);
  assert.equal(result.september22Clusters, 8);
  assert.equal(result.september22Resources, 48);
  assert.equal(result.invalidSeptember22ServiceMappings, 0);
});

test("generated resource meta descriptions are complete 120-160 character sentences", () => {
  const resources = source("src/lib/seo-resource-pages.ts");
  assert.match(resources, /function fitMetaDescription\(value: string\)/);
  assert.match(resources, /normalized\.length < 120 \|\| normalized\.length > 160/);
  assert.match(resources, /throw new Error\("Generated meta description must be 120-160 characters:/);
  assert.doesNotMatch(resources, /lastIndexOf\(" "\)/);
  assert.doesNotMatch(resources, /\.slice\(0,\s*160\)/);

  const generatedMetaCalls = [...resources.matchAll(/metaDescription:\s*fitMetaDescription\(/g)];
  assert.equal(generatedMetaCalls.length, 6);
});

test("generated resource URLs use correct a/an grammar and preserve legacy slugs", () => {
  const resources = source("src/lib/seo-resource-pages.ts");
  const redirects = source("next.config.ts");

  assert.match(resources, /function articleWord\(value: string\)/);
  assert.match(resources, /\^\[A-Z\]\{2,\}\$/);
  assert.ok(resources.includes('definition: "what-does-" + article + "-" + cluster.slugBase + "-do"'));
  assert.ok(resources.includes('hiring: "how-to-hire-" + article + "-" + cluster.slugBase'));

  for (const slugBase of [
    "administrative-virtual-assistant",
    "accounting-virtual-assistant",
    "it-virtual-assistant",
    "email-marketing-virtual-assistant",
    "operations-virtual-assistant",
    "airbnb-virtual-assistant",
  ]) {
    for (const [legacy, canonical] of [
      [`what-does-a-${slugBase}-do`, `what-does-an-${slugBase}-do`],
      [`how-to-hire-a-${slugBase}`, `how-to-hire-an-${slugBase}`],
    ]) {
      assert.ok(
        redirects.includes(`source: "/resources/${legacy}", destination: "/resources/${canonical}", permanent: true`),
        `missing redirect for ${legacy}`,
      );
    }
  }
});

test("public resource copy avoids internal SEO jargon", () => {
  const hub = source("src/app/resources/page.tsx");
  const detail = source("src/app/resources/[slug]/page.tsx");
  const publicCopy = hub + "\n" + detail;

  for (const phrase of [
    "underdeveloped commercial role clusters",
    "organized by search intent",
    "Canonical role guide",
    "duplicate intent",
    "duplicate commercial money pages",
    "candidate funnel",
  ]) {
    assert.ok(!publicCopy.includes(phrase), `public resource copy leaks internal SEO jargon: ${phrase}`);
  }

  assert.ok(hub.includes("Virtual Assistant hiring and career resources."));
  assert.ok(hub.includes("Virtual Assistant hiring guides"));
  assert.ok(hub.includes("Virtual Assistant career guides"));
  assert.ok(detail.includes("Keep planning your next step."));
});

test("resource hub keeps a shallow crawl path without rendering every client guide", () => {
  const hub = source("src/app/resources/page.tsx");
  const detail = source("src/app/resources/[slug]/page.tsx");

  assert.ok(hub.includes('page.audience === "client" && page.intent === "definition"'));
  assert.ok(hub.includes("SEO_RESOURCE_ROLE_COUNT"));
  assert.ok(detail.includes("page.internalLinks.map"));
  assert.ok(detail.includes('href={link.href}'));
});

test("volume-backed expansion leaves the homepage source untouched", () => {
  const baseRef = process.env.SEO_HOMEPAGE_BASE_REF || "origin/main";
  try {
    const changed = execFileSync("git", ["diff", "--name-only", `${baseRef}...HEAD`, "--", "src/app/page.tsx"], {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    assert.equal(changed, "");
  } catch (error) {
    if (error instanceof assert.AssertionError) throw error;
    const digest = createHash("sha256").update(source("src/app/page.tsx")).digest("hex");
    assert.equal(digest, "709fc8cbc738b228ae4c9ee928549e1d781d185ab1565487731e70713ec961b3");
  }
});

test("distinct email management and event planning demand has canonical service owners", () => {
  const services = parseArray("src/lib/service-pages.ts", "export const SERVICE_PAGES: ServiceSeoPage[] = ");
  const serviceHub = source("src/app/services/page.tsx");
  const keywords = new Map(services.map((page) => [page.primaryKeyword.toLowerCase(), page.slug]));

  for (const expected of [
    { slug: "email-management-virtual-assistant", keyword: "email management virtual assistant" },
    { slug: "event-planning-virtual-assistant", keyword: "event planning virtual assistant" },
  ]) {
    const page = services.find((item) => item.slug === expected.slug);
    assert.ok(page, `missing canonical service page ${expected.slug}`);
    assert.equal(page.primaryKeyword, expected.keyword);
    assert.equal(keywords.get(expected.keyword), expected.slug);
    assert.ok(page.metaTitle.length <= 60);
    assert.ok(page.metaDescription.length >= 90 && page.metaDescription.length <= 160);
    assert.ok(page.relatedSlugs.length >= 3);
    for (const related of page.relatedSlugs) {
      assert.ok(services.some((item) => item.slug === related), `${expected.slug} links to missing service ${related}`);
    }
  }

  assert.match(serviceHub, /SERVICE_PAGES/);
  assert.match(serviceHub, /href=\{`\/service\/\$\{page\.slug\}`\}/);
});

test("new service pages have a hub link and a contextual inbound service link", () => {
  const services = parseArray("src/lib/service-pages.ts", "export const SERVICE_PAGES: ServiceSeoPage[] = ");
  const inboundOwners = new Map([
    ["email-management-virtual-assistant", "admin-inbox"],
    ["event-planning-virtual-assistant", "project-coordination"],
  ]);

  for (const [targetSlug, ownerSlug] of inboundOwners) {
    const owner = services.find((page) => page.slug === ownerSlug);
    assert.ok(owner, `missing inbound owner ${ownerSlug}`);
    assert.ok(owner.relatedSlugs.includes(targetSlug), `${ownerSlug} does not link ${targetSlug}`);
  }

  const serviceHub = source("src/app/services/page.tsx");
  assert.match(serviceHub, /SERVICE_PAGES/);
  assert.match(serviceHub, /href=\{`\/service\/\$\{page\.slug\}`\}/);
});

test("new services inherit indexable static routes, sitemap entries, canonicals, metadata, and one H1", () => {
  const route = source("src/app/service/[slug]/page.tsx");
  const sitemap = source("src/app/sitemap.ts");
  const hero = source("src/components/hiring-hero.tsx");

  assert.match(route, /generateStaticParams\(\)/);
  assert.match(route, /SERVICE_PAGES\.map\(\(page\) => \(\{ slug: page\.slug \}\)\)/);
  assert.match(route, /canonicalPath\(`\/service\/\$\{page\.slug\}`\)/);
  assert.match(route, /alternates: \{ canonical \}/);
  assert.match(route, /description: serviceMetaDescription\(page\)/);
  assert.doesNotMatch(route, /noindex|index:\s*false/);
  assert.match(sitemap, /SERVICE_PAGES\.map\(\(page\)/);
  assert.match(sitemap, /url: `\$\{base\}\/service\/\$\{page\.slug\}`/);
  assert.equal((hero.match(/<h1\b/g) || []).length, 1);
});

test("commercial hubs bridge broad demand to one canonical owner", () => {
  const requiredLinks = new Map([
    ["src/app/services/page.tsx", ["/outsourcing-philippines-virtual-assistant", "/pricing"]],
    ["src/app/hire/page.tsx", ["/services", "/pricing", "/virtual-assistant-companies-philippines", "/outsourcing-philippines-virtual-assistant"]],
    ["src/app/pricing/page.tsx", ["/services", "/find-talent", "/outsourcing-philippines-virtual-assistant"]],
    ["src/app/find-talent/page.tsx", ["/services", "/pricing", "/virtual-assistant-companies-philippines"]],
  ]);

  for (const [path, links] of requiredLinks) {
    const text = source(path);
    for (const href of links) assert.ok(text.includes(`href="${href}"`), `${path} is missing ${href}`);
  }

  const talent = source("src/app/find-talent/page.tsx");
  assert.match(talent, /How to use the Virtual Assistant directory/);
  assert.match(talent, /Profiles are examples, not an unreviewed marketplace/);
});

test("outsourcing modifiers stay on the existing authority guide", () => {
  const blogs = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
  const page = blogs.find((post) => post.slug === "outsourcing-philippines-virtual-assistant");
  assert.ok(page, "outsourcing authority guide missing");
  const copy = JSON.stringify(page).toLowerCase();
  for (const phrase of ["offshore virtual assistant", "bpo", "24/7 coverage", "provider model"]) {
    assert.ok(copy.includes(phrase), `outsourcing guide is missing ${phrase}`);
  }
  assert.equal(page.legacyPath, "/outsourcing-philippines-virtual-assistant/");
});

test("secondary service demand deepens existing canonical pages", () => {
  const services = parseArray("src/lib/service-pages.ts", "export const SERVICE_PAGES: ServiceSeoPage[] = ");
  const checks = [
    ["admin-inbox", "email-management-virtual-assistant"],
    ["recruitment-hr", "human resources virtual assistant"],
    ["project-coordination", "project management virtual assistant"],
  ];
  for (const [slug, phrase] of checks) {
    const page = services.find((item) => item.slug === slug);
    assert.ok(page, `missing service ${slug}`);
    assert.ok(JSON.stringify(page).toLowerCase().includes(phrase), `${slug} does not cover ${phrase}`);
  }
});
