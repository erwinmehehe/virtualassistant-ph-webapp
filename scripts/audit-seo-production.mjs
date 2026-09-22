const DEFAULT_BASE = process.env.SEO_AUDIT_BASE_URL || "https://virtualassistant.com.ph";
const PRIORITY_PATHS = [
  "/services",
  "/hire",
  "/pricing",
  "/find-talent",
  "/virtual-assistant-companies-philippines",
  "/outsourcing-philippines-virtual-assistant",
  "/average-hourly-rate-virtual-assistants-philippines",
  "/blog/virtual-assistant-salary-philippines",
  "/blog/do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va",
  "/blog/get-paid-virtual-assistant-philippines",
  "/blog/general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines",
  "/blog/hourly-rates-for-filipino-virtual-project-manager",
  "/blog/how-to-pay-a-filipino-virtual-assistant-directly"
];

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

async function sitemapPaths(base) {
  const response = await fetchText(new URL("/sitemap.xml", base));
  if (!response.ok) throw new Error(`Sitemap returned ${response.status}`);
  const xml = await response.text();
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi))
    .map((match) => normalizePath(match[1]))
    .filter((path, index, all) => all.indexOf(path) === index);
}

function productionScope(paths) {
  const expansion = paths.filter((path) =>
    path.startsWith("/service/") ||
    path.startsWith("/resources/") ||
    path.startsWith("/software/")
  );
  const requested = process.argv.includes("--priority") ? [] : expansion;
  const combined = [...PRIORITY_PATHS, ...requested].filter((path, index, all) => all.indexOf(path) === index);
  const limit = Number(process.env.SEO_AUDIT_LIMIT || "0");
  return limit > 0 ? combined.slice(0, limit) : combined;
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

  const robotsTag = firstTag(html, "meta", (tag) => attr(tag, "name").toLowerCase() === "robots");
  const robots = attr(robotsTag, "content").toLowerCase();
  if (robots.includes("noindex")) result.failures.push("robots meta contains noindex");

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) result.failures.push(`expected exactly one H1, found ${h1Count}`);

  const title = textBetween(html, "title");
  if (!title) result.failures.push("missing title");
  else if (title.length < 30 || title.length > 65) result.warnings.push(`title length ${title.length}`);

  const descriptionTag = firstTag(html, "meta", (tag) => attr(tag, "name").toLowerCase() === "description");
  const description = attr(descriptionTag, "content");
  if (!description) result.failures.push("missing meta description");
  else if (description.length < 120 || description.length > 165) result.warnings.push(`meta description length ${description.length}`);

  const viewportTag = firstTag(html, "meta", (tag) => attr(tag, "name").toLowerCase() === "viewport");
  if (!viewportTag) result.failures.push("missing viewport meta");

  if (/^\/(service|resources|software|blog|research)\//.test(path) && !html.includes('application/ld+json')) {
    result.warnings.push("no JSON-LD block found");
  }

  return result;
}

async function main() {
  const base = new URL(DEFAULT_BASE);
  const sitemap = await sitemapPaths(base);
  const sitemapSet = new Set(sitemap);
  const missingPriority = PRIORITY_PATHS.filter((path) => !sitemapSet.has(normalizePath(path)));
  if (missingPriority.length) {
    console.error("Priority URLs missing from sitemap:");
    for (const path of missingPriority) console.error(`- ${path}`);
  }

  const scope = productionScope(sitemap);
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
    audited: results.length,
    failures: failures.length,
    warnings: warnings.length,
    missingPriorityFromSitemap: missingPriority,
    results
  };

  if (process.env.SEO_AUDIT_REPORT) {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(process.env.SEO_AUDIT_REPORT, JSON.stringify(summary, null, 2) + "\n");
  }

  console.log(`SEO production audit: ${summary.audited} URLs, ${summary.failures} failures, ${summary.warnings} warnings`);
  if (missingPriority.length || failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
