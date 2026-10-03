const DEFAULT_BASE = process.env.SEO_AUDIT_BASE_URL || "https://virtualassistant.com.ph";
const PRIORITY_PATHS = [
  "/",
  "/services",
  "/hire",
  "/pricing",
  "/find-talent",
  "/jobs",
  "/post-a-job",
  "/training",
  "/for-virtual-assistants",
  "/blog",
  "/industries",
  "/software",
  "/virtual-assistant-companies-philippines",
  "/outsourcing-philippines-virtual-assistant",
  "/average-hourly-rate-virtual-assistants-philippines",
  "/blog/virtual-assistant-salary-philippines",
  "/blog/how-to-create-the-best-va-profile",
  "/blog/virtual-assistant-introduction-video",
  "/blog/virtual-assistant-proposal-sample",
  "/blog/virtual-assistant-resume-sample",
  "/blog/virtual-assistant-portfolio-examples",
  "/blog/how-to-apply-as-a-virtual-assistant"
];

const PRIVATE_PREFIXES = ["/workspace/", "/auth/", "/api/"];
const STRUCTURED_CONTENT_PREFIXES = ["/service/", "/resources/", "/software/", "/blog/", "/research/", "/industries/", "/jobs/"];

function normalizePath(value) {
  const path = new URL(value, DEFAULT_BASE).pathname.replace(/\/+$/, "");
  return path || "/";
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1]?.trim() || "";
}

function firstTag(html, tagName, predicate = () => true) {
  const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) || [];
  return tags.find(predicate) || "";
}

function textBetween(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "VirtualAssistant.com.ph SEO production audit" }
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function sitemapEntries(base) {
  const response = await fetchText(new URL("/sitemap.xml", base));
  if (!response.ok) throw new Error(`Sitemap returned ${response.status}`);
  const xml = await response.text();
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi)).map((match) => ({
    raw: match[1].trim(),
    path: normalizePath(match[1]),
  }));
}

function productionScope(entries) {
  const allPaths = entries.map((entry) => entry.path);
  const staticExpansion = allPaths.filter((path) =>
    path.startsWith("/service/") ||
    path.startsWith("/resources/") ||
    path.startsWith("/software/") ||
    path.startsWith("/blog/") ||
    path.startsWith("/research/") ||
    path.startsWith("/industries/")
  );
  const dynamicJobs = allPaths.filter((path) => path.startsWith("/jobs/")).slice(0, Number(process.env.SEO_AUDIT_JOB_LIMIT || "100"));
  const requested = process.argv.includes("--priority") ? [] : [...staticExpansion, ...dynamicJobs];
  const combined = [...PRIORITY_PATHS, ...requested].filter((path, index, all) => all.indexOf(path) === index);
  const limit = Number(process.env.SEO_AUDIT_LIMIT || "0");
  return limit > 0 ? combined.slice(0, limit) : combined;
}

function metaContent(html, key, value) {
  const tag = firstTag(html, "meta", (candidate) => attr(candidate, key).toLowerCase() === value.toLowerCase());
  return attr(tag, "content");
}

async function auditPath(base, path) {
  const url = new URL(path, base);
  const result = { path, failures: [], warnings: [] };
  let response;
  try {
    response = await fetchText(url);
  } catch (error) {
    result.failures.push(`request failed: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }

  result.status = response.status;
  result.finalPath = normalizePath(response.url);
  if (response.status !== 200) result.failures.push(`HTTP ${response.status}`);
  if (result.finalPath !== normalizePath(path)) result.failures.push(`unexpected redirect to ${result.finalPath}`);

  const html = await response.text();
  const canonicalTag = firstTag(html, "link", (tag) => attr(tag, "rel").toLowerCase().split(/\s+/).includes("canonical"));
  const canonicalHref = canonicalTag ? attr(canonicalTag, "href") : "";
  if (!canonicalHref) {
    result.failures.push("missing canonical");
  } else {
    result.canonical = normalizePath(canonicalHref);
    if (result.canonical !== normalizePath(path)) result.failures.push(`canonical points to ${result.canonical}`);
  }

  const robots = metaContent(html, "name", "robots").toLowerCase();
  if (robots.includes("noindex")) result.failures.push("robots meta contains noindex");

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) result.failures.push(`expected exactly one H1, found ${h1Count}`);

  const title = textBetween(html, "title");
  if (!title) result.failures.push("missing title");
  else if (title.length < 30 || title.length > 65) result.warnings.push(`title length ${title.length}`);

  const description = metaContent(html, "name", "description");
  if (!description) result.failures.push("missing meta description");
  else if (description.length < 120 || description.length > 165) result.warnings.push(`meta description length ${description.length}`);

  const viewportTag = firstTag(html, "meta", (tag) => attr(tag, "name").toLowerCase() === "viewport");
  if (!viewportTag) result.failures.push("missing viewport meta");

  const ogTitle = metaContent(html, "property", "og:title");
  const ogDescription = metaContent(html, "property", "og:description");
  const ogImage = metaContent(html, "property", "og:image");
  const ogUrl = metaContent(html, "property", "og:url");
  const twitterCard = metaContent(html, "name", "twitter:card");
  if (!ogTitle) result.warnings.push("missing og:title");
  if (!ogDescription) result.warnings.push("missing og:description");
  if (!ogImage) result.warnings.push("missing og:image");
  if (ogUrl && normalizePath(ogUrl) !== normalizePath(path)) result.warnings.push(`og:url points to ${normalizePath(ogUrl)}`);
  if (!twitterCard) result.warnings.push("missing twitter:card");

  if (STRUCTURED_CONTENT_PREFIXES.some((prefix) => path.startsWith(prefix)) && !html.includes('application/ld+json')) {
    result.warnings.push("no JSON-LD block found");
  }

  if (path.startsWith("/blog/") && path.split("/").filter(Boolean).length === 2) {
    if (!html.includes('"@type":"Article"')) result.failures.push("blog article missing Article schema");
    if (!html.includes('"@type":"BreadcrumbList"')) result.failures.push("blog article missing BreadcrumbList schema");
  }

  if (path.startsWith("/jobs/") && path !== "/jobs") {
    if (!html.includes('"@type":"JobPosting"')) result.failures.push("job detail missing JobPosting schema");
  }

  return result;
}

async function auditGlobalFiles(base) {
  const failures = [];
  const warnings = [];

  const robotsResponse = await fetchText(new URL("/robots.txt", base));
  if (!robotsResponse.ok) failures.push(`robots.txt returned ${robotsResponse.status}`);
  else {
    const robots = await robotsResponse.text();
    if (!robots.includes(`Sitemap: ${base.origin}/sitemap.xml`)) failures.push("robots.txt does not reference the canonical sitemap");
    for (const prefix of ["/workspace/", "/auth/", "/api/"]) {
      if (!robots.includes(`Disallow: ${prefix}`)) failures.push(`robots.txt does not disallow ${prefix}`);
    }
  }

  const llmsResponse = await fetchText(new URL("/llms.txt", base));
  if (!llmsResponse.ok) failures.push(`llms.txt returned ${llmsResponse.status}`);
  else {
    const llms = await llmsResponse.text();
    if (!llms.includes(`${base.origin}/sitemap.xml`)) failures.push("llms.txt does not link the canonical sitemap");
    if (/\/workspace\/|\/auth\/|\/api\//.test(llms)) failures.push("llms.txt exposes a private route");
    if (!llms.includes("/blog/how-to-create-the-best-va-profile")) warnings.push("llms.txt does not surface the candidate application guide cluster");
  }

  return { failures, warnings };
}

async function main() {
  const base = new URL(DEFAULT_BASE);
  const entries = await sitemapEntries(base);
  const paths = entries.map((entry) => entry.path);
  const sitemapSet = new Set(paths);
  const missingPriority = PRIORITY_PATHS.filter((path) => !sitemapSet.has(normalizePath(path)));
  const duplicates = paths.filter((path, index, all) => all.indexOf(path) !== index);
  const wrongOrigin = entries.filter((entry) => new URL(entry.raw).origin !== base.origin).map((entry) => entry.raw);
  const privateEntries = paths.filter((path) => PRIVATE_PREFIXES.some((prefix) => path.startsWith(prefix)));
  const queryOrFragmentEntries = entries.filter((entry) => {
    const url = new URL(entry.raw);
    return Boolean(url.search || url.hash);
  }).map((entry) => entry.raw);

  const sitemapFailures = [];
  if (missingPriority.length) sitemapFailures.push(`priority URLs missing from sitemap: ${missingPriority.join(", ")}`);
  if (duplicates.length) sitemapFailures.push(`duplicate sitemap paths: ${[...new Set(duplicates)].join(", ")}`);
  if (wrongOrigin.length) sitemapFailures.push(`non-canonical sitemap origins: ${wrongOrigin.slice(0, 10).join(", ")}`);
  if (privateEntries.length) sitemapFailures.push(`private routes found in sitemap: ${privateEntries.slice(0, 10).join(", ")}`);
  if (queryOrFragmentEntries.length) sitemapFailures.push(`query or fragment URLs found in sitemap: ${queryOrFragmentEntries.slice(0, 10).join(", ")}`);

  const global = await auditGlobalFiles(base);
  const scope = productionScope(entries);
  const results = [];
  const queue = [...scope];
  const concurrency = Math.max(1, Math.min(10, Number(process.env.SEO_AUDIT_CONCURRENCY || "6")));

  async function worker() {
    while (queue.length) {
      const path = queue.shift();
      if (!path) return;
      const result = await auditPath(base, path);
      results.push(result);
      const mark = result.failures.length ? "FAIL" : result.warnings.length ? "WARN" : "PASS";
      console.log(`[${mark}] ${path}${result.failures.length ? ` :: ${result.failures.join("; ")}` : ""}`);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  results.sort((a, b) => a.path.localeCompare(b.path));

  const failures = results.filter((item) => item.failures.length);
  const warnings = results.filter((item) => item.warnings.length);
  const summary = {
    base: base.origin,
    sitemapUrls: entries.length,
    audited: results.length,
    failures: failures.length + sitemapFailures.length + global.failures.length,
    warnings: warnings.length + global.warnings.length,
    sitemapFailures,
    global,
    results
  };

  if (process.env.SEO_AUDIT_REPORT) {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(process.env.SEO_AUDIT_REPORT, JSON.stringify(summary, null, 2) + "\n");
  }

  console.log(`SEO production audit: ${summary.audited} URLs, ${summary.failures} failures, ${summary.warnings} warnings`);
  if (summary.failures) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
