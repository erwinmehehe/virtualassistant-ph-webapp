import fs from "node:fs";

const files = {
  resources: fs.readFileSync("src/lib/seo-resource-pages.ts", "utf8"),
  authority: fs.readFileSync("src/lib/seo-authority-pages.ts", "utf8"),
  resourceRoute: fs.readFileSync("src/app/resources/[slug]/page.tsx", "utf8"),
  serviceRoute: fs.readFileSync("src/app/service/[slug]/page.tsx", "utf8"),
  sitemap: fs.readFileSync("src/app/sitemap.ts", "utf8"),
  services: fs.readFileSync("src/app/services/page.tsx", "utf8"),
  pricing: fs.readFileSync("src/app/pricing/page.tsx", "utf8"),
  managed: fs.readFileSync("src/app/managed-vs-direct-hire/page.tsx", "utf8"),
  publicRoutes: fs.readFileSync("src/lib/public-seo-routes.ts", "utf8"),
  software: fs.readFileSync("src/lib/software-pages.ts", "utf8"),
  blog: fs.readFileSync("src/lib/blog-content.ts", "utf8"),
  redirects: fs.readFileSync("next.config.ts", "utf8"),
  priorityLinks: fs.readFileSync("src/lib/seo-priority-links.ts", "utf8"),
  archive: fs.readFileSync("src/lib/archive-posts.ts", "utf8"),
  servicePages: fs.readFileSync("src/lib/service-pages.ts", "utf8"),
  hiringCss: fs.readFileSync("src/app/hiring-pages.css", "utf8"),
  editorial: fs.readFileSync("src/lib/editorial-seo-guides.ts", "utf8"),
  blogRoute: fs.readFileSync("src/app/blog/[slug]/page.tsx", "utf8"),
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
const vowelSoundSlugBases = new Set(["operations-virtual-assistant", "airbnb-virtual-assistant"]);
const slugArticle = (slugBase) => vowelSoundSlugBases.has(slugBase) ? "an" : "a";
const september22ResourceSlugs = september22Clusters.flatMap(([, slugBase]) => {
  const article = slugArticle(slugBase);
  return [
    `what-does-${article}-${slugBase}-do`,
    `${slugBase}-tasks`,
    `how-to-hire-${article}-${slugBase}`,
    `${slugBase}-interview-questions`,
    `${slugBase}-cost-philippines`,
    `best-tools-for-${slugBase}`
  ];
});

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
assert(files.resources.includes("function articleWord(value: string)"), "generated role pages must choose the article from the role phrase");
assert(files.resources.includes('definition: "what-does-" + article + "-" + cluster.slugBase + "-do"'), "definition slugs must use the role article");
assert(files.resources.includes('hiring: "how-to-hire-" + article + "-" + cluster.slugBase'), "hiring slugs must use the role article");
assert(files.resources.includes("function withArticle(value: string)"), "generated role pages must use a/an grammar helper");
assert(files.resources.includes("function fitMetaTitle(primary: string, fallback: string)"), "generated role pages must enforce meta-title length");
assert(files.resources.includes("function fitMetaDescription(value: string)"), "generated role pages must validate meta descriptions");
assert(files.resources.includes('normalized.length < 120 || normalized.length > 160'), "generated meta descriptions must enforce the 120-160 character range");
assert(files.resources.includes('throw new Error("Generated meta description must be 120-160 characters:'), "generated meta descriptions must fail instead of truncating");
assert(!files.resources.includes(".slice(0, 160)"), "generated meta descriptions must not hard-cut words at 160 characters");
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
assert(candidateSlugs.length === 20, `expected 20 manually defined resource pages, found ${candidateSlugs.length}`);
assert(new Set(candidateSlugs).size === candidateSlugs.length, "duplicate candidate resource slug");
const vowelSoundResourceBases = [
  "administrative-virtual-assistant",
  "accounting-virtual-assistant",
  "it-virtual-assistant",
  "email-marketing-virtual-assistant",
  "operations-virtual-assistant",
  "airbnb-virtual-assistant"
];
for (const slugBase of vowelSoundResourceBases) {
  for (const [legacy, canonical] of [
    [`what-does-a-${slugBase}-do`, `what-does-an-${slugBase}-do`],
    [`how-to-hire-a-${slugBase}`, `how-to-hire-an-${slugBase}`]
  ]) {
    assert(
      files.redirects.includes(`source: "/resources/${legacy}", destination: "/resources/${canonical}", permanent: true`),
      `missing permanent resource grammar redirect: ${legacy}`
    );
  }
}

assert(files.resources.includes("ROLE_CLUSTERS.flatMap"), "role resources must be generated from the role cluster map");
for (const fn of ["definitionPage", "tasksPage", "hiringPage", "interviewPage", "costPage", "toolsPage"]) {
  assert(files.resources.includes(fn + "(cluster)"), `missing generated resource family: ${fn}`);
}

const expectedAuthorityPaths = [
  "/blog/virtual-assistant-companies-philippines",
  "/virtual-assistant-websites",
  "/virtual-assistant-usa",
  "/virtual-assistant-australia",
  "/what-is-a-virtual-assistant",
  "/types-of-virtual-assistants",
  "/industries/nonprofits",
];
for (const path of expectedAuthorityPaths) {
  assert(files.authority.includes(`path: "${path}"`), `missing authority content data for ${path}`);
}
for (const path of ["/virtual-assistant-usa", "/virtual-assistant-australia", "/types-of-virtual-assistants"]) {
  assert(files.publicRoutes.includes(`path: "${path}"`), `missing public route entry for retained landing page ${path}`);
}
for (const path of ["/blog/virtual-assistant-companies-philippines", "/virtual-assistant-websites", "/what-is-a-virtual-assistant", "/industries/nonprofits"]) {
  assert(!files.publicRoutes.includes(`path: "${path}"`), `redirected editorial route still exposed as a public landing page: ${path}`);
}

for (const required of [
  'SEO_RESOURCE_PAGES.filter((page)',
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
assert(files.services.includes('href="/blog/virtual-assistant-companies-philippines"'), "services hub missing companies blog link");
assert(files.services.includes('href="/virtual-assistant-australia"'), "services hub missing Australia guide link");
assert(files.services.includes('href="/blog/virtual-assistant-websites"'), "services hub missing Virtual Assistant websites blog link");
assert(files.services.includes('href="/virtual-assistant-usa"'), "services hub missing USA guide link");
assert(files.pricing.includes("affordable virtual assistant"), "pricing page missing affordable Virtual Assistant ownership");
assert(files.pricing.includes("cheap virtual assistant"), "pricing page missing cheap Virtual Assistant ownership");
assert(files.managed.includes("employee virtual assistant"), "managed/direct page missing employee Virtual Assistant ownership");
assert(files.managed.includes("bpo virtual assistant"), "managed/direct page missing BPO Virtual Assistant ownership");
for (const slug of ["virtual-assistant-cover-letter", "best-laptop-for-virtual-assistant", "freelance-platforms-for-virtual-assistants", "how-to-start-a-virtual-assistant-business"]) {
  assert(files.resources.includes(`slug: "${slug}"`), `missing remaining volume-backed candidate resource: ${slug}`);
}
assert(files.redirects.includes('source: "/resources/virtual-assistant-side-hustle-business-guide", destination: "/blog/how-to-start-a-virtual-assistant-business", permanent: true'), "old VA side-hustle resource must redirect to the editorial business canonical");
assert(files.services.includes('href="/blog/what-is-a-virtual-assistant"'), "services hub missing definition blog link");
assert(files.services.includes('href="/types-of-virtual-assistants"'), "services hub missing types guide link");


// Post-expansion internal-link targets: verify the editorial corpus can pass authority
// into the core commercial hubs before expanding with more weak URLs.
for (const path of ["/services", "/hire", "/pricing", "/blog/virtual-assistant-companies-philippines", "/outsourcing-philippines-virtual-assistant"]) {
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
for (const path of ["/services", "/hire", "/pricing", "/blog/virtual-assistant-companies-philippines", "/outsourcing-philippines-virtual-assistant"]) {
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


const editorialRedirects = [
  ["/virtual-assistant-companies-philippines", "/blog/virtual-assistant-companies-philippines"],
  ["/virtual-assistant-websites", "/blog/virtual-assistant-websites"],
  ["/what-is-a-virtual-assistant", "/blog/what-is-a-virtual-assistant"],
  ["/industries/nonprofits", "/blog/virtual-assistant-for-nonprofits"],
  ["/resources/virtual-assistant-no-experience", "/blog/become-virtual-assistant-no-experience"],
  ["/resources/virtual-assistant-cover-letter", "/blog/virtual-assistant-cover-letter"],
  ["/resources/best-laptop-for-virtual-assistant", "/blog/best-laptop-for-virtual-assistant"],
  ["/resources/freelance-platforms-for-virtual-assistants", "/blog/freelance-platforms-for-virtual-assistants"],
  ["/resources/how-to-start-a-virtual-assistant-business", "/blog/how-to-start-a-virtual-assistant-business"],
];
for (const [source, destination] of editorialRedirects) {
  assert(files.redirects.includes(`source: "${source}", destination: "${destination}", permanent: true`), `missing editorial consolidation redirect: ${source}`);
}
assert(files.editorial.includes("EDITORIAL_SEO_POSTS"), "editorial SEO guides are not registered with the blog");
assert(files.blogRoute.includes("blogPostBySlug(slug)"), "blog route must serve consolidated editorial guides through the unified blog library");
