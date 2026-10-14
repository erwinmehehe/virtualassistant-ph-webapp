const root = (process.env.SITE_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
const sitemapUrl = process.env.SITEMAP_URL || `${root}/sitemap.xml`;
const concurrency = Math.max(1, Math.min(20, Number(process.env.CRAWL_CONCURRENCY || 8)));

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => decodeXml(match[1].trim()));
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "VAPH-SEO-Crawler/1.0 (+https://virtualassistant.com.ph)" },
  });
  return { response, text: await response.text() };
}

async function collectSitemapUrls(url, seen = new Set()) {
  if (seen.has(url)) return [];
  seen.add(url);

  const { response, text } = await fetchText(url);
  if (!response.ok) throw new Error(`Unable to fetch sitemap ${url}: HTTP ${response.status}`);

  const entries = locs(text);
  if (/<sitemapindex[\s>]/i.test(text)) {
    const nested = [];
    for (const child of entries) nested.push(...(await collectSitemapUrls(child, seen)));
    return nested;
  }
  return entries;
}

function htmlSignal(html, pattern) {
  const match = html.match(pattern);
  return match?.[1]?.trim() || null;
}

async function inspect(url) {
  const started = Date.now();
  try {
    const { response, text } = await fetchText(url);
    const type = response.headers.get("content-type") || "";
    const html = /text\/html/i.test(type) ? text : "";
    const robots = htmlSignal(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/i)
      || htmlSignal(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["'][^>]*>/i);
    const canonical = htmlSignal(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
      || htmlSignal(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
    const title = htmlSignal(html, /<title[^>]*>([\s\S]*?)<\/title>/i);

    return {
      url,
      status: response.status,
      finalUrl: response.url,
      ms: Date.now() - started,
      title,
      robots,
      canonical,
      noindex: Boolean(robots && /(^|[,\s])noindex([,\s]|$)/i.test(robots)),
      redirected: response.url.replace(/\/$/, "") !== url.replace(/\/$/, ""),
    };
  } catch (error) {
    return { url, status: 0, ms: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
  }
}

async function pool(items, size, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length || 1) }, run));
  return results;
}

const urls = [...new Set(await collectSitemapUrls(sitemapUrl))];
console.log(`Crawling ${urls.length} sitemap URLs from ${sitemapUrl} with concurrency ${concurrency}...\n`);

const results = await pool(urls, concurrency, inspect);
const failures = results.filter((r) => !r.status || r.status >= 400);
const redirects = results.filter((r) => r.redirected);
const noindex = results.filter((r) => r.noindex);
const missingCanonical = results.filter((r) => r.status >= 200 && r.status < 300 && !r.canonical);
const canonicalMismatch = results.filter((r) => {
  if (!r.canonical || !r.finalUrl || r.status < 200 || r.status >= 300) return false;
  try {
    return new URL(r.canonical, r.finalUrl).toString().replace(/\/$/, "") !== r.finalUrl.replace(/\/$/, "");
  } catch {
    return true;
  }
});

for (const r of failures) console.log(`FAIL ${r.status || "ERR"} ${r.url}${r.error ? ` :: ${r.error}` : ""}`);
for (const r of noindex) console.log(`NOINDEX ${r.url} :: ${r.robots}`);
for (const r of redirects) console.log(`REDIRECT ${r.url} -> ${r.finalUrl}`);
for (const r of missingCanonical) console.log(`NO_CANONICAL ${r.url}`);
for (const r of canonicalMismatch) console.log(`CANONICAL_MISMATCH ${r.url} -> ${r.canonical}`);

console.log("\nCrawl summary");
console.log(JSON.stringify({
  sitemapUrl,
  urls: urls.length,
  ok: results.filter((r) => r.status >= 200 && r.status < 400).length,
  failures: failures.length,
  redirects: redirects.length,
  noindex: noindex.length,
  missingCanonical: missingCanonical.length,
  canonicalMismatch: canonicalMismatch.length,
}, null, 2));

if (failures.length || noindex.length) process.exitCode = 1;
