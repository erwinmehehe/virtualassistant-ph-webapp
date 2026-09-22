import fs from "node:fs";

const files = {
  resources: fs.readFileSync("src/lib/seo-resource-pages.ts", "utf8"),
  authority: fs.readFileSync("src/lib/seo-authority-pages.ts", "utf8"),
  resourceRoute: fs.readFileSync("src/app/resources/[slug]/page.tsx", "utf8"),
  serviceRoute: fs.readFileSync("src/app/service/[slug]/page.tsx", "utf8"),
  sitemap: fs.readFileSync("src/app/sitemap.ts", "utf8"),
  services: fs.readFileSync("src/app/services/page.tsx", "utf8"),
  publicRoutes: fs.readFileSync("src/lib/public-seo-routes.ts", "utf8"),
  software: fs.readFileSync("src/lib/software-pages.ts", "utf8"),
};

const failures = [];
const warnings = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function between(source, start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  if (a < 0 || b < 0) return "";
  return source.slice(a + start.length, b);
}

function matches(source, regex) {
  return [...source.matchAll(regex)].map((match) => match[1]);
}

const roleBlock = between(files.resources, "const ROLE_CLUSTERS: RoleCluster[] = [", "];\n\nfunction titleCase");
const candidateBlock = between(files.resources, "const CANDIDATE_RESOURCE_PAGES: SeoResourcePage[] = [", "];\n\nexport const SEO_RESOURCE_PAGES");

const roleServiceSlugs = matches(roleBlock, /serviceSlug:\s*"([^"]+)"/g);
const roleSlugBases = matches(roleBlock, /slugBase:\s*"([^"]+)"/g);
const candidateSlugs = matches(candidateBlock, /slug:\s*"([^"]+)"/g);

assert(roleServiceSlugs.length === 17, `expected 17 role clusters, found ${roleServiceSlugs.length}`);
assert(new Set(roleServiceSlugs).size === roleServiceSlugs.length, "duplicate serviceSlug in SEO role clusters");
assert(new Set(roleSlugBases).size === roleSlugBases.length, "duplicate slugBase in SEO role clusters");
assert(files.resources.includes("function withArticle(value: string)"), "generated role pages must use a/an grammar helper");
assert(files.resources.includes("function fitMetaTitle(primary: string, fallback: string)"), "generated role pages must enforce meta-title length");
for (const unsafe of [
  '"Hire a " + cluster.role',
  '"What Does a " + cluster.role',
  '"Learn what a " + cluster.role',
  '"For a " + cluster.role',
  '"How much does a " + cluster.role',
  '"What tasks can I delegate to a " + cluster.role',
]) {
  assert(!files.resources.includes(unsafe), `unsafe generated article grammar remains: ${unsafe}`);
}
assert(candidateSlugs.length === 17, `expected 17 manually defined resource pages, found ${candidateSlugs.length}`);
assert(new Set(candidateSlugs).size === candidateSlugs.length, "duplicate candidate resource slug");
assert(files.resources.includes("ROLE_CLUSTERS.flatMap"), "role resources must be generated from the role cluster map");
for (const fn of ["definitionPage", "tasksPage", "hiringPage", "interviewPage", "costPage", "toolsPage"]) {
  assert(files.resources.includes(fn + "(cluster)"), `missing generated resource family: ${fn}`);
}

const expectedAuthorityPaths = [
  "/virtual-assistant-companies-philippines",
  "/virtual-assistant-australia",
  "/what-is-a-virtual-assistant",
  "/types-of-virtual-assistants",
  "/industries/nonprofits",
];
for (const path of expectedAuthorityPaths) {
  assert(files.authority.includes(`path: "${path}"`), `missing authority page data for ${path}`);
  assert(files.publicRoutes.includes(`path: "${path}"`), `missing public route entry for ${path}`);
}

for (const required of [
  'SEO_RESOURCE_PAGES.map((page)',
  'url: `${base}/resources/${page.slug}`',
]) {
  assert(files.sitemap.includes(required), `sitemap missing resource integration: ${required}`);
}
assert(files.serviceRoute.includes('serviceSeoResources(s.slug)'), "service pages do not pull expanded SEO resources");
assert(files.serviceRoute.includes('href={"/resources/" + resource.slug}'), "service pages do not link expanded resources");
assert(files.resourceRoute.includes('generateStaticParams()'), "resource route must statically enumerate pages");
assert(files.resourceRoute.includes('canonicalPath("/resources/" + page.slug)'), "resource route missing canonical metadata");
assert(files.services.includes('href="/virtual-assistant-companies-philippines"'), "services hub missing companies guide link");
assert(files.services.includes('href="/virtual-assistant-australia"'), "services hub missing Australia guide link");
assert(files.services.includes('href="/what-is-a-virtual-assistant"'), "services hub missing definition guide link");
assert(files.services.includes('href="/types-of-virtual-assistants"'), "services hub missing types guide link");

for (const serviceSlug of ["creative-virtual-assistant", "logistics-virtual-assistant"]) {
  const serviceSource = fs.readFileSync("src/lib/service-pages.ts", "utf8");
  assert(serviceSource.includes(`"slug": "${serviceSlug}"`), `missing new service page: ${serviceSlug}`);
}

for (const softwareSlug of ["canva-virtual-assistant", "gohighlevel-virtual-assistant", "salesforce-virtual-assistant", "hubspot-virtual-assistant", "xero-virtual-assistant", "klaviyo-virtual-assistant", "quickbooks-virtual-assistant"]) {
  assert(files.software.includes(`slug: "${softwareSlug}"`), `missing software expansion page: ${softwareSlug}`);
}

for (const [name, source] of Object.entries(files)) {
  if (source.includes("—") || source.includes("–")) failures.push(`${name}: em dash or en dash found`);
}

const titleValues = [
  ...matches(files.authority, /metaTitle:\s*"([^"]+)"/g),
  ...matches(candidateBlock, /metaTitle:\s*"([^"]+)"/g),
];
for (const title of titleValues) {
  if (title.length > 60) warnings.push(`meta title over 60 chars: ${title.length} - ${title}`);
}
const descValues = [
  ...matches(files.authority, /metaDescription:\s*"([^"]+)"/g),
  ...matches(candidateBlock, /metaDescription:\s*"([^"]+)"/g),
];
for (const desc of descValues) {
  if (desc.length > 160) failures.push(`meta description over 160 chars: ${desc.length} - ${desc}`);
  if (desc.length < 120) warnings.push(`meta description under 120 chars: ${desc.length} - ${desc}`);
}

console.log(JSON.stringify({
  roleClusters: roleServiceSlugs.length,
  generatedClientResources: roleServiceSlugs.length * 6,
  manualResources: candidateSlugs.length,
  totalResources: roleServiceSlugs.length * 6 + candidateSlugs.length,
  authorityPages: expectedAuthorityPaths.length,
  softwarePagesAdded: 7,
  failures: failures.length,
  warnings: warnings.length
}, null, 2));

if (warnings.length) console.error("\nWarnings:\n" + warnings.join("\n"));
if (failures.length) {
  console.error("\nFailures:\n" + failures.join("\n"));
  process.exit(1);
}
