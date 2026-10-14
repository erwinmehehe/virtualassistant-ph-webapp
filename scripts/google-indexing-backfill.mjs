import { createSign } from "node:crypto";

const site = (process.env.SITE_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
const sitemapUrl = process.env.SITEMAP_URL || `${site}/sitemap.xml`;
const maxUrls = Math.max(1, Math.min(200, Number(process.env.GOOGLE_INDEXING_MAX_URLS || 180)));
const email = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_EMAIL?.trim();
const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

if (!email || !privateKey) {
  throw new Error("Missing GOOGLE_INDEXING_SERVICE_ACCOUNT_EMAIL or GOOGLE_INDEXING_PRIVATE_KEY.");
}

function b64(value) {
  return Buffer.from(value).toString("base64url");
}

async function accessToken() {
  const tokenEndpoint = "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const header = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64(JSON.stringify({
    iss: email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: tokenEndpoint,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${signer.sign(privateKey).toString("base64url")}`;

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) {
    throw new Error(`Google OAuth failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

function decodeXml(value) {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => decodeXml(match[1].trim()));
}

async function collectSitemapUrls(url, seen = new Set()) {
  if (seen.has(url)) return [];
  seen.add(url);
  const response = await fetch(url, { redirect: "follow" });
  const text = await response.text();
  if (!response.ok) throw new Error(`Unable to fetch sitemap ${url}: HTTP ${response.status}`);
  const entries = locs(text);
  if (/<sitemapindex[\s>]/i.test(text)) {
    const nested = [];
    for (const child of entries) nested.push(...(await collectSitemapUrls(child, seen)));
    return nested;
  }
  return entries;
}

async function eligibleJob(url) {
  const parsed = new URL(url);
  if (parsed.origin !== new URL(site).origin || !/^\/jobs\/[^/]+\/?$/.test(parsed.pathname)) return false;

  const response = await fetch(url, { redirect: "follow" });
  const html = await response.text();
  if (response.status !== 200) {
    console.log(`SKIP ${response.status} ${url}`);
    return false;
  }
  if (!/"@type"\s*:\s*"JobPosting"/i.test(html)) {
    console.log(`SKIP no JobPosting schema ${url}`);
    return false;
  }
  if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) {
    console.log(`SKIP noindex ${url}`);
    return false;
  }
  return true;
}

async function publish(token, url) {
  const response = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ url, type: "URL_UPDATED" }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${body.slice(0, 500)}`);
}

const allUrls = [...new Set(await collectSitemapUrls(sitemapUrl))];
const jobUrls = allUrls.filter((url) => {
  try {
    const parsed = new URL(url);
    return parsed.origin === new URL(site).origin && /^\/jobs\/[^/]+\/?$/.test(parsed.pathname);
  } catch {
    return false;
  }
});

console.log(`Found ${jobUrls.length} individual job URLs in ${sitemapUrl}.`);
const eligible = [];
for (const url of jobUrls) {
  if (await eligibleJob(url)) eligible.push(url);
}

const selected = eligible.slice(0, maxUrls);
if (eligible.length > selected.length) {
  console.log(`Quota guard: submitting ${selected.length} of ${eligible.length} eligible jobs. Increase GOOGLE_INDEXING_MAX_URLS only after Google approves sufficient quota.`);
}

const token = await accessToken();
let submitted = 0;
let failed = 0;
for (const url of selected) {
  try {
    await publish(token, url);
    submitted += 1;
    console.log(`SUBMITTED ${url}`);
  } catch (error) {
    failed += 1;
    console.error(`FAILED ${url} :: ${error instanceof Error ? error.message : error}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 350));
}

console.log(JSON.stringify({ discoveredJobs: jobUrls.length, eligibleJobs: eligible.length, submitted, failed, maxUrls }, null, 2));
if (failed) process.exitCode = 1;
