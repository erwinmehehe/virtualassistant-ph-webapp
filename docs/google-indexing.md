# Google Indexing API and full-site crawl

VirtualAssistant.com.ph uses Google's Indexing API only for individual public job pages that contain `JobPosting` structured data.

Google does not support sending ordinary service, blog, industry, or landing pages through the Indexing API. Those URLs remain discoverable through `/sitemap.xml`, which is advertised in `robots.txt`.

## One-time Google setup

1. Create or choose a Google Cloud project and enable the Indexing API.
2. Create a service account and JSON key.
3. In Google Search Console, add the service account email as an owner of the VirtualAssistant.com.ph property.
4. Add these server-only environment variables in Vercel:
   - `GOOGLE_INDEXING_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_INDEXING_PRIVATE_KEY`
5. Request Indexing API approval/quota from Google before production-scale submissions.

Never commit the JSON key or private key to Git.

## Commands

`npm run seo:crawl`

Crawls every URL discovered from the sitemap, follows sitemap indexes, and reports:
- HTTP failures
- redirects
- sitemap URLs that unexpectedly return noindex
- missing canonicals
- canonical mismatches

`npm run seo:index-jobs`

Discovers individual `/jobs/:slug` URLs from the sitemap, verifies that each returns HTTP 200 and contains `JobPosting` JSON-LD, then sends `URL_UPDATED` notifications to Google.

The backfill command defaults to 180 URLs per run to leave headroom under Google's initial 200 publish-requests/day test quota. Override with `GOOGLE_INDEXING_MAX_URLS` only after sufficient quota is approved.

## Runtime behavior

When credentials are present:
- a newly published job sends `URL_UPDATED`
- edits to a published job send `URL_UPDATED`
- accepting commercial terms and publishing sends `URL_UPDATED`
- closing a public job changes the old detail URL to HTTP 404 and sends `URL_DELETED`

Indexing notifications are best-effort. A Google API failure never blocks publishing or closing a job.
