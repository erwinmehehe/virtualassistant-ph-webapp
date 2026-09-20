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

const blogs = parseArray("src/lib/blog-content.ts", "export const BLOG_POSTS: BlogPost[] = ");
const services = parseArray("src/lib/service-pages.ts", "export const SERVICE_PAGES: ServiceSeoPage[] = ");
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
    const distinctFamily = ["cost","interview","tasks","job-description","training","tools","role-definition"].includes(family);

    let reason = null;
    if (!sameCluster) reason = "high lexical overlap outside declared service cluster";
    else if (family === "hiring" && post.intent === "commercial") reason = "commercial hiring guide overlaps its service money page";
    else if (!distinctFamily && sim.score >= 0.88) reason = "same-cluster article has no strong editorial-family separator";

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
        reason
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
        reason: "high overlap without an explicit blog↔industry relationship"
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
        reason: "retained archive guide is lexically close to a service money page"
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
    industries: industries.length,
    archive: archive.length
  },
  candidateCount: candidates.length,
  highSimilarityCount: high.length,
  candidates: candidates.slice(0, 120)
}, null, 2));

// This first pass is intentionally report-only. Human review decides which
// overlaps are legitimate hub/spoke relationships before any pair is gated.
