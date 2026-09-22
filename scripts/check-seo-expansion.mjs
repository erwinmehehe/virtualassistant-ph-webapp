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
  blog: fs.readFileSync("src/lib/blog-content.ts", "utf8"),
  redirects: fs.readFileSync("next.config.ts", "utf8"),
  priorityLinks: fs.readFileSync("src/lib/seo-priority-links.ts", "utf8"),
  archive: fs.readFileSync("src/lib/archive-posts.ts", "utf8"),
  servicePages: fs.readFileSync("src/lib/service-pages.ts", "utf8"),
  hiringCss: fs.readFileSync("src/app/hiring-pages.css", "utf8"),
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

const september22Clusters = [
  ["general-virtual-assistant", "general-virtual-assistant"],
  ["small-business-virtual-assistant", "small-business-virtual-assistant"],
  ["payroll-virtual-assistant", "payroll-virtual-assistant"],
  ["operations", "operations-virtual-assistant"],
  ["calendar", "calendar-management-virtual-assistant"],
  ["airbnb-virtual-assistant", "airbnb-virtual-assistant"],
  ["pinterest-virtual-assistant", "pinterest-virtual-assistant"],
  ["content-writing", "content-writing-virtual-assistant"],
];
const september22Slugs = new Set(september22Clusters.map(([serviceSlug]) => serviceSlug));
let invalidSeptember22ServiceMappings = 0;
const september22ResourceSlugs = september22Clusters.flatMap(([, slugBase]) => [
  `what-does-a-${slugBase}-do`,
  `${slugBase}-tasks`,
  `how-to-hire-a-${slugBase}`,
  `${slugBase}-interview-questions`,
  `${slugBase}-cost-philippines`,
  `best-tools-for-${slugBase}`
]);

for (const [serviceSlug, slugBase] of september22Clusters) {
  const rolePattern = new RegExp(`serviceSlug:\\s*"${serviceSlug}"[\\s\\S]{0,160}slugBase:\\s*"${slugBase}"`);
  if (!rolePattern.test(roleBlock)) {
    invalidSeptember22ServiceMappings += 1;
    failures.push(`September 22 cluster mapping is invalid: ${serviceSlug} -> ${slugBase}`);
  }
  if (!files.servicePages.includes(`"slug": "${serviceSlug}"`)) {
    invalidSeptember22ServiceMappings += 1;
    failures.push(`September 22 cluster has no canonical service page: ${serviceSlug}`);
  }
}

assert(roleServiceSlugs.length === 25, `expected 25 role clusters, found ${roleServiceSlugs.length}`);
assert(new Set(roleServiceSlugs).size === roleServiceSlugs.length, "duplicate serviceSlug in SEO role clusters");
assert(new Set(roleSlugBases).size === roleSlugBases.length, "duplicate slugBase in SEO role clusters");
assert([...september22Slugs].every((slug) => roleServiceSlugs.includes(slug)), "one or more September 22 role clusters are missing");
assert(september22ResourceSlugs.length === 48, `expected 48 September 22 generated resource URLs, found ${september22ResourceSlugs.length}`);
assert(new Set(september22ResourceSlugs).size === 48, "duplicate September 22 generated resource URL");
assert(!september22ResourceSlugs.some((slug) => candidateSlugs.includes(slug)), "September 22 resource URL collides with a manual resource page");
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
assert(files.resourceRoute.includes('className="sp-cards-4"'), "resource template missing responsive card grid");
assert(files.hiringCss.includes("@media (max-width: 760px)"), "resource shared styles missing mobile breakpoint");
assert(files.hiringCss.includes(".sp-cards-4,"), "resource card grid missing responsive style coverage");
assert(files.hiringCss.includes("grid-template-columns: minmax(0, 1fr)"), "resource cards do not collapse to one column on mobile");
assert(files.services.includes('href="/virtual-assistant-companies-philippines"'), "services hub missing companies guide link");
assert(files.services.includes('href="/virtual-assistant-australia"'), "services hub missing Australia guide link");
assert(files.services.includes('href="/what-is-a-virtual-assistant"'), "services hub missing definition guide link");
assert(files.services.includes('href="/types-of-virtual-assistants"'), "services hub missing types guide link");


// Post-expansion internal-link targets: verify the editorial corpus can pass authority
// into the core commercial hubs before expanding with more weak URLs.
for (const path of ["/services", "/hire", "/pricing", "/virtual-assistant-companies-philippines", "/outsourcing-philippines-virtual-assistant"]) {
  assert(files.blog.includes(`"href": "${path}"`), `blog corpus missing contextual authority link to ${path}`);
}


// GSC query-to-canonical ownership guardrails. The September 21 export is
// page- and query-aggregated rather than query/page paired, so only clear
// intent ownership is asserted here.
for (const source of ["/virtual-assistant-salary-philippines", "/virtual-assistant-salary-philippines/"]) {
  assert(
    files.redirects.includes(`source: "${source}", destination: "/blog/virtual-assistant-salary-philippines"`),
    `salary legacy route must consolidate into the salary canonical: ${source}`
  );
}
for (const path of ["/services", "/hire", "/pricing", "/virtual-assistant-companies-philippines", "/outsourcing-philippines-virtual-assistant"]) {
  assert(files.priorityLinks.includes(`href: "${path}"`), `priority authority links missing ${path}`);
}

const gscAuthoritySources = [
  "average-hourly-rate-virtual-assistants-philippines",
  "do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va",
  "dental-virtual-assistant-interview-questions",
  "medical-virtual-assistant-interview-questions",
  "what-does-a-cold-calling-virtual-assistant-do",
  "medical-virtual-assistant-cost-philippines",
  "virtual-assistant-salary-philippines",
  "hire-virtual-assistant-philippines",
  "outsourcing-philippines-virtual-assistant",
  "philippines-vs-india-virtual-assistants",
  "virtual-assistant-vs-employee",
  "executive-virtual-assistant-cost-philippines",
  "what-does-a-real-estate-virtual-assistant-do",
  "what-is-a-virtual-medical-assistant",
  "what-does-a-shopify-virtual-assistant-do",
  "how-to-hire-a-medical-virtual-assistant",
  "virtual-assistant-agency-vs-freelancer",
  "onlinejobs-ph-vs-virtual-assistant-agency",
  "what-does-an-appointment-setter-virtual-assistant-do",
  "hourly-rates-for-filipino-virtual-project-manager",
  "general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines"
];
for (const slug of gscAuthoritySources) {
  assert(files.priorityLinks.includes(`"${slug}"`), `GSC authority source missing priority-link mapping: ${slug}`);
}

assert(files.blog.includes('"metaTitle": "Virtual Assistant Salary Philippines 2026 | Pay Guide"'), "salary CTR title contract missing");
assert(files.archive.includes('"metaTitle": "How to Get Paid as a Virtual Assistant in the Philippines"'), "get-paid CTR title contract missing");
assert(files.archive.includes('"metaTitle": "General vs Executive Virtual Assistant: Roles Compared"'), "general-vs-executive CTR title contract missing");

for (const serviceSlug of ["creative-virtual-assistant", "logistics-virtual-assistant", "email-management-virtual-assistant", "event-planning-virtual-assistant"]) {
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
  september22Clusters: september22Clusters.length,
  september22Resources: september22Clusters.length * 6,
  invalidSeptember22ServiceMappings,
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
