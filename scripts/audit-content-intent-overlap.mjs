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

const blogs = [
  ...parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = "),
  ...parseArray("src/lib/blog-opportunity-posts.ts", "export const BLOG_OPPORTUNITY_POSTS: BlogPost[] = "),
  ...parseArray("src/lib/blog-hiring-guides.ts", "export const BLOG_HIRING_GUIDES: BlogPost[] = "),
  ...parseArray("src/lib/blog-demand-guides.ts", "export const BLOG_DEMAND_GUIDES: BlogPost[] = "),
  ...parseArray("src/lib/blog-keyword-support-guides.ts", "export const BLOG_KEYWORD_SUPPORT_GUIDES: BlogPost[] = "),
  ...parseArray("src/lib/blog-candidate-gap-guides.ts", "export const BLOG_CANDIDATE_GAP_GUIDES: BlogPost[] = ")
];
const services = parseArray("src/lib/service-pages.ts", "export const SERVICE_PAGES: ServiceSeoPage[] = ");
const softwareSource = source("src/lib/software-pages.ts");
const software = [...softwareSource.matchAll(/slug:\s*"([^"]+)"[\s\S]{0,1200}?primaryKeyword:\s*"([^"]+)"[\s\S]{0,600}?metaTitle:\s*"([^"]+)"/g)]
  .map((match) => ({ slug: match[1], primaryKeyword: match[2], metaTitle: match[3] }));
const industries = parseArray("src/lib/industries.ts", "export const INDUSTRIES: IndustryPage[] = ");
const archive = parseArray("src/lib/archive-posts.ts", "export const ARCHIVE_POSTS: ArchivePost[] = ");

const GENERIC = new Set([
  "a","an","and","or","the","for","to","in","of","with","your","you","our","we","how","what","does","is",
  "hire","hiring","hired","virtual","assistant","assistants","va","vas","services","service","filipino","philippines",
  "remote","online","guide","complete","best","top","2026","cost","costs","price","pricing","rate","rates","salary",
  "hourly","monthly","role","roles","support"
]);

function tokenSet(value) {
  return new Set(String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !GENERIC.has(word)));
}

function similarity(left, right) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size || !b.size) return { score: 0, coverage: 0, jaccard: 0, shared: [] };
  const shared = [...a].filter((word) => b.has(word));
  const union = new Set([...a, ...b]);
  const coverage = shared.length / Math.min(a.size, b.size);
  const jaccard = shared.length / union.size;
  return {
    score: coverage * 0.7 + jaccard * 0.3,
    coverage,
    jaccard,
    shared
  };
}

function blogFamily(post) {
  const slug = post.slug || "";
  if (/cost|hourly-rate/.test(slug)) return "cost";
  if (/interview/.test(slug)) return "interview";
  if (/tasks/.test(slug)) return "tasks";
  if (/job-description/.test(slug)) return "job-description";
  if (/how-to-train/.test(slug)) return "training";
  if (/best-tools/.test(slug)) return "tools";
  if (/what-does|what-is-a-virtual/.test(slug)) return "role-definition";
  if (/how-to-hire|hire-.*virtual-assistant/.test(slug)) return "hiring";
  return "other";
}

function compactBlogDiagnostics(post) {
  return {
    description: post.description,
    headings: (post.sections || []).slice(0, 7).map((section) => section.heading),
    internalLinks: (post.internalLinks || []).map((link) => link.href).slice(0, 10)
  };
}

function compactServiceDiagnostics(service) {
  return {
    focus: service.focus,
    intro: service.intro,
    sampleTasks: (service.tasks || []).slice(0, 6)
  };
}

function bodyShingles(post, size = 5) {
  const words = (post.sections || [])
    .flatMap((section) => [
      section.heading,
      ...(section.paragraphs || []),
      ...(section.bullets || []),
      ...(section.numbered || [])
    ])
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const values = new Set();
  for (let index = 0; index <= words.length - size; index += 1) {
    values.add(words.slice(index, index + size).join(" "));
  }
  return values;
}

function bodySimilarity(left, right) {
  const a = bodyShingles(left);
  const b = bodyShingles(right);
  if (Math.min(a.size, b.size) < 80) return 0;
  const shared = [...a].filter((value) => b.has(value)).length;
  return shared / new Set([...a, ...b]).size;
}

const bodySimilarityCandidates = [];
for (let left = 0; left < blogs.length; left += 1) {
  for (let right = left + 1; right < blogs.length; right += 1) {
    const a = blogs[left];
    const b = blogs[right];
    if (!a.serviceSlug || a.serviceSlug !== b.serviceSlug) continue;
    const score = bodySimilarity(a, b);
    if (score >= 0.35) {
      bodySimilarityCandidates.push({
        service: a.serviceSlug,
        score: Number(score.toFixed(3)),
        left: `/blog/${a.slug}`,
        right: `/blog/${b.slug}`,
        reason: "same-service articles share too much five-word body structure"
      });
    }
  }
}

const candidates = [];

for (const post of blogs) {
  for (const service of services) {
    const sims = [
      similarity(post.metaTitle, service.metaTitle),
      similarity(post.title, service.primaryKeyword),
      similarity(post.metaTitle, service.primaryKeyword)
    ].sort((a,b) => b.score - a.score);
    const sim = sims[0];
    if (sim.score < 0.76 || sim.shared.length < 2) continue;

    const sameCluster = post.serviceSlug === service.slug;
    const family = blogFamily(post);
    const distinctFamily = ["cost","interview","tasks","job-description","training","tools","role-definition","hiring"].includes(family);
    const targetHref = `/service/${service.slug}`;
    const comparisonBridge = post.intent === "comparison" && (post.internalLinks || []).some((link) => link.href === targetHref);

    let reason = null;
    if (!sameCluster && !comparisonBridge) reason = "high lexical overlap outside declared service cluster";
    else if (family === "hiring" && post.intent === "commercial") reason = "commercial hiring guide overlaps its service money page";
    else if (sameCluster && !distinctFamily && sim.score >= 0.88) reason = "same-cluster article has no strong editorial-family separator";

    if (reason) {
      candidates.push({
        type: "blog-service",
        score: Number(sim.score.toFixed(3)),
        coverage: Number(sim.coverage.toFixed(3)),
        shared: sim.shared,
        source: `/blog/${post.slug}`,
        sourceTitle: post.metaTitle,
        sourceIntent: post.intent,
        sourceFamily: family,
        declaredService: post.serviceSlug || null,
        target: `/service/${service.slug}`,
        targetTitle: service.metaTitle,
        targetKeyword: service.primaryKeyword,
        sameCluster,
        reason,
        blogDiagnostics: compactBlogDiagnostics(post),
        serviceDiagnostics: compactServiceDiagnostics(service)
      });
    }
  }

  for (const page of software) {
    const sim = [
      similarity(post.metaTitle, page.metaTitle),
      similarity(post.title, page.primaryKeyword),
      similarity(post.metaTitle, page.primaryKeyword)
    ].sort((a,b) => b.score - a.score)[0];
    if (sim.score < 0.76 || sim.shared.length < 2) continue;

    const sameSoftware = post.softwareSlug === page.slug;
    const family = blogFamily(post);
    const distinctFamily = ["cost","interview","tasks","job-description","training","tools","role-definition","hiring"].includes(family);
    const targetHref = `/software/${page.slug}`;
    const explicitBridge = (post.internalLinks || []).some((link) => link.href === targetHref);

    let reason = null;
    if (!sameSoftware && !explicitBridge) reason = "high lexical overlap outside declared software cluster";
    else if (sameSoftware && !distinctFamily && sim.score >= 0.9) reason = "same-software article has no strong editorial-family separator";

    if (reason) {
      candidates.push({
        type: "blog-software",
        score: Number(sim.score.toFixed(3)),
        coverage: Number(sim.coverage.toFixed(3)),
        shared: sim.shared,
        source: `/blog/${post.slug}`,
        sourceTitle: post.metaTitle,
        sourceIntent: post.intent,
        sourceFamily: family,
        declaredSoftware: post.softwareSlug || null,
        target: `/software/${page.slug}`,
        targetTitle: page.metaTitle,
        targetKeyword: page.primaryKeyword,
        sameSoftware,
        reason,
        blogDiagnostics: compactBlogDiagnostics(post)
      });
    }
  }

  for (const industry of industries) {
    const sim = [
      similarity(post.metaTitle, industry.metaTitle),
      similarity(post.title, industry.primaryKeyword)
    ].sort((a,b) => b.score-a.score)[0];
    if (sim.score < 0.84 || sim.shared.length < 2) continue;

    const explicit = (post.industrySlugs || []).includes(industry.slug);
    const mappedByService = post.serviceSlug && (industry.serviceSlugs || []).includes(post.serviceSlug);
    if (!explicit && !mappedByService) {
      candidates.push({
        type: "blog-industry",
        score: Number(sim.score.toFixed(3)),
        coverage: Number(sim.coverage.toFixed(3)),
        shared: sim.shared,
        source: `/blog/${post.slug}`,
        sourceTitle: post.metaTitle,
        sourceIntent: post.intent,
        target: `/industries/${industry.slug}`,
        targetTitle: industry.metaTitle,
        targetKeyword: industry.primaryKeyword,
        reason: "high overlap without an explicit blog↔industry relationship",
        blogDiagnostics: compactBlogDiagnostics(post)
      });
    }
  }
}

for (const post of archive) {
  for (const service of services) {
    const sim = similarity(post.title, service.metaTitle);
    if (sim.score >= 0.86 && sim.shared.length >= 2) {
      candidates.push({
        type: "archive-service",
        score: Number(sim.score.toFixed(3)),
        coverage: Number(sim.coverage.toFixed(3)),
        shared: sim.shared,
        source: `/blog/${post.slug}`,
        sourceTitle: post.title,
        sourceIntent: post.audience || "archive",
        target: `/service/${service.slug}`,
        targetTitle: service.metaTitle,
        targetKeyword: service.primaryKeyword,
        reason: "retained archive guide is lexically close to a service money page",
        serviceDiagnostics: compactServiceDiagnostics(service)
      });
    }
  }
}

candidates.sort((a,b) => b.score - a.score || a.source.localeCompare(b.source) || a.target.localeCompare(b.target));

const high = candidates.filter((item) => item.score >= 0.9);
console.log(JSON.stringify({
  corpus: {
    blogs: blogs.length,
    services: services.length,
    software: software.length,
    industries: industries.length,
    archive: archive.length
  },
  candidateCount: candidates.length,
  highSimilarityCount: high.length,
  bodySimilarityCount: bodySimilarityCandidates.length,
  bodySimilarityCandidates: bodySimilarityCandidates.slice(0, 40),
  candidates: candidates.slice(0, 120)
}, null, 2));

if (bodySimilarityCandidates.length) {
  console.error("\nParaphrased body-template overlap remains. Rewrite or consolidate these same-service article pairs.");
}
if (candidates.length) {
  console.error("\nUnexplained high-intent overlaps remain. Review or explicitly differentiate these page pairs.");
}
if (bodySimilarityCandidates.length || candidates.length) process.exit(1);
