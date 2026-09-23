import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function source(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function parseArray(file, marker) {
  const text = source(file);
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) throw new Error(`${file}: marker missing`);
  const start = text.indexOf("[", markerIndex + marker.length);
  const end = text.lastIndexOf("];");
  return JSON.parse(text.slice(start, end + 1));
}

function familyFor(post) {
  const slug = post.slug;
  if (/cost|hourly-rate/.test(slug)) return "cost";
  if (/interview/.test(slug)) return "interview";
  if (/tasks/.test(slug)) return "tasks";
  if (/how-to-hire|hire-.*virtual-assistant/.test(slug)) return "hiring";
  if (/job-description/.test(slug)) return "job-description";
  if (/how-to-train/.test(slug)) return "training";
  if (/best-tools/.test(slug)) return "tools";
  if (/what-does|what-is-a-virtual/.test(slug)) return "role-definition";
  return null;
}

const posts = [
  ...parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = "),
  ...parseArray("src/lib/blog-opportunity-posts.ts", "export const BLOG_OPPORTUNITY_POSTS: BlogPost[] = "),
  ...parseArray("src/lib/blog-hiring-guides.ts", "export const BLOG_HIRING_GUIDES: BlogPost[] = "),
  ...parseArray("src/lib/blog-demand-guides.ts", "export const BLOG_DEMAND_GUIDES: BlogPost[] = "),
  ...parseArray("src/lib/blog-keyword-support-guides.ts", "export const BLOG_KEYWORD_SUPPORT_GUIDES: BlogPost[] = ")
];
const services = parseArray("src/lib/service-pages.ts", "export const SERVICE_PAGES: ServiceSeoPage[] = ");
const software = parseArray("src/lib/software-pages.ts", "export const softwarePages: SoftwareSeoPage[] = ");
const industries = parseArray("src/lib/industries.ts", "export const INDUSTRIES: IndustryPage[] = ");
const servicePage = source("src/app/service/[slug]/page.tsx");
const industryPage = source("src/app/industries/[slug]/page.tsx");
const industrySeoContent = source("src/lib/industry-seo-content.ts");
const blogArticle = source("src/components/blog-article.tsx");

const failures = [];
const warnings = [];
const serviceSlugs = new Set(services.map((item) => item.slug));
const softwareSlugs = new Set(software.map((item) => item.slug));
const industrySlugs = new Set(industries.map((item) => item.slug));
const familyOwners = new Map();
const clusterCounts = new Map();
let explicitBlogIndustryEdges = 0;
let industryServiceEdges = 0;

for (const post of posts) {
  if (post.softwareSlug) {
    if (!softwareSlugs.has(post.softwareSlug)) failures.push(`${post.slug}: softwareSlug ${post.softwareSlug} does not resolve to a current software page`);
    const softwareHref = `/software/${post.softwareSlug}`;
    if (!(post.internalLinks || []).some((link) => link.href === softwareHref)) failures.push(`${post.slug}: missing canonical software link ${softwareHref}`);
  }

  for (const industrySlug of post.industrySlugs || []) {
    explicitBlogIndustryEdges += 1;
    if (!industrySlugs.has(industrySlug)) failures.push(`${post.slug}: unresolved industry ${industrySlug}`);
  }

  if (!post.serviceSlug) continue;
  if (!serviceSlugs.has(post.serviceSlug)) {
    failures.push(`${post.slug}: serviceSlug ${post.serviceSlug} does not resolve to a current service page`);
    continue;
  }

  clusterCounts.set(post.serviceSlug, (clusterCounts.get(post.serviceSlug) || 0) + 1);

  const serviceHref = `/service/${post.serviceSlug}`;
  if (!(post.internalLinks || []).some((link) => link.href === serviceHref)) {
    failures.push(`${post.slug}: missing canonical service link ${serviceHref}`);
  }

  const family = familyFor(post);
  if (family) {
    const key = `${post.serviceSlug}:${family}`;
    if (familyOwners.has(key)) {
      failures.push(`${key}: duplicate editorial family pages ${familyOwners.get(key)} and ${post.slug}`);
    } else {
      familyOwners.set(key, post.slug);
    }
  }
}

for (const industry of industries) {
  for (const serviceSlug of industry.serviceSlugs || []) {
    industryServiceEdges += 1;
    if (!serviceSlugs.has(serviceSlug)) failures.push(`${industry.slug}: unresolved service ${serviceSlug}`);
  }
}

const customHeroSlugs = new Set([...industrySeoContent.matchAll(/^  "([^"]+)": \{/gm)].map((match) => match[1]));
for (const industry of industries) {
  if (!customHeroSlugs.has(industry.slug)) failures.push(`${industry.slug}: missing industry-specific hero introduction`);
  if (industry.metaTitle.length < 40 || industry.metaTitle.length > 60) failures.push(`${industry.slug}: meta title length ${industry.metaTitle.length}`);
  if (industry.metaDescription.length < 145 || industry.metaDescription.length > 160) failures.push(`${industry.slug}: meta description length ${industry.metaDescription.length}`);
}

if (!/titleCaseWithAcronyms/.test(industryPage)) failures.push("industry template must preserve acronyms in generated labels");
if (!/twitter:\s*\{\s*card:\s*"summary_large_image",\s*title,\s*description\s*\}/.test(industryPage)) failures.push("industry metadata must expose the same Twitter card fields as service pages");

for (const [serviceSlug, count] of clusterCounts) {
  // Cluster size alone is not cannibalization; the dedicated intent-overlap audit checks page-pair risk.\n  if (count > 12) warnings.push(`${serviceSlug}: ${count} blog posts in one service cluster; review whether the cluster is becoming unnecessarily broad`);
}

if (!/serviceBlogPosts\(s\.slug/.test(servicePage)) {
  failures.push("service template must pull role-specific blog guides with serviceBlogPosts(s.slug)");
}
if (!/INDUSTRIES\.filter\(\(industry\) => industry\.serviceSlugs\.includes\(s\.slug\)\)/.test(servicePage)) {
  failures.push("service template must derive relevant industry guides from industry.serviceSlugs");
}
if (!servicePage.includes('relatedIndustries.map((industry) => ({ href: `/industries/${industry.slug}`')) {
  failures.push("service template must link each related industry to its canonical /industries/:slug URL");
}
if (!/page\.serviceSlugs\.map\(servicePageBySlug\)/.test(industryPage)) {
  failures.push("industry template must resolve its mapped service pages");
}
if (!industryPage.includes('services.filter(Boolean).map((service) => ({ href: `/service/${service!.slug}`')) {
  failures.push("industry template must link mapped services to canonical /service/:slug URLs");
}
if (!/serviceBlogPosts\(serviceSlug, 2\)/.test(industryPage) || !/href: blogHref\(post\)/.test(industryPage)) {
  failures.push("industry template must link relevant role-specific blog guides from its mapped services");
}
if (!/INDUSTRIES\.filter/.test(blogArticle) || !/industry\.serviceSlugs\.includes\(post\.serviceSlug/.test(blogArticle)) {
  failures.push("blog article must derive relevant industry guides from the service-industry map");
}
if (!/servicePageBySlug\(post\.serviceSlug\)/.test(blogArticle)) {
  failures.push("blog article must resolve its canonical service page");
}

const stats = {
  posts: posts.length,
  serviceClusters: clusterCounts.size,
  editorialFamilies: familyOwners.size,
  industryPages: industries.length,
  industryServiceEdges,
  explicitBlogIndustryEdges,
  failures: failures.length,
  warnings: warnings.length
};

console.log(JSON.stringify(stats, null, 2));
if (warnings.length) console.error("\nWarnings:\n" + warnings.join("\n"));
if (failures.length) {
  console.error("\nFailures:\n" + failures.join("\n"));
  process.exit(1);
}
