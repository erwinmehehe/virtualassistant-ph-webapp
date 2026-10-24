import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("public jobs page never needs per-visitor Supabase auth or live business setting reads", async () => {
  const [page, directory] = await Promise.all([
    read("src/app/jobs/page.tsx"),
    read("src/lib/public-job-directory.ts"),
  ]);
  assert.match(page, /getPublicJobResults\(filters\)/);
  assert.match(page, /getPublicJobFilterFloor\(\)/);
  assert.match(page, /parsePublicJobFilters\(params\)/);
  assert.doesNotMatch(page, /from "@\/lib\/supabase\/server"|await createClient\(|getBusinessSettings\(/);

  assert.match(directory, /createPublicClient\(\)/);
  assert.doesNotMatch(directory, /from "@\/lib\/supabase\/server"/);
  assert.match(directory, /\.from\("public_jobs"\)/);
  assert.match(directory, /\.gte\("min_hourly_rate", MIN_HOURLY_RATE\)/);
  assert.match(directory, /const getCachedDefaultJobResults = unstable_cache\(/);
  assert.match(directory, /\{ revalidate: 60, tags: \["public-jobs"\] \}/);
  assert.match(directory, /\{ revalidate: 300 \}/);
  assert.match(directory, /return isDefault \? getCachedDefaultJobResults\(\) : queryPublicJobResults\(filters\)/);
});

test("job search still offers bounded keywords, categories, hours, rates, sorting and pagination", async () => {
  const [page, directory] = await Promise.all([
    read("src/app/jobs/page.tsx"),
    read("src/lib/public-job-directory.ts"),
  ]);
  assert.match(directory, /\.slice\(0, 80\)/);
  assert.match(directory, /VA_CATEGORIES\.some\(/);
  assert.match(directory, /Number\.isFinite\(numericRate\)/);
  assert.match(directory, /Math\.min\(1000, Math\.max\(1, Math\.floor\(numericPage\)\)\)/);
  for (const expected of [
    '.or(`title.ilike.%',
    '.contains("categories"',
    '.gte("hours_per_week", 35)',
    '.lt("hours_per_week", 35)',
    '.order("min_hourly_rate"',
    '.order("hours_per_week"',
    '.order("published_at"',
    '.range(from, from + PUBLIC_JOBS_PAGE_SIZE - 1)',
  ]) assert.ok(directory.includes(expected), "Missing job browse feature: " + expected);
  assert.match(page, /<form className="jobs-filterbar" method="get">/);
  assert.match(page, /<JobCard/);
  assert.match(page, /pageHref\(params, /);
});

test("jobs landing and existing comparison article link each other with distinct intents", async () => {
  const [page, blog, index] = await Promise.all([
    read("src/app/jobs/page.tsx"),
    read("src/lib/blog-job-search-guides.ts"),
    read("src/lib/blog.ts"),
  ]);
  assert.match(page, /Virtual Assistant Jobs Philippines \| Free VA Jobs/);
  assert.match(page, /<h1 id="jobs-market-title">Virtual Assistant Jobs Philippines<\/h1>/);
  assert.match(page, /<Link className="text-link" href="\/blog\/free-virtual-assistant-job-websites-philippines">Read our guide to free VA job websites<\/Link>/);
  assert.match(page, /canonicalPath\("\/jobs"\)/);
  assert.match(page, /"@type": "CollectionPage"/);
  assert.match(blog, /"slug": "free-virtual-assistant-job-websites-philippines"/);
  assert.equal((blog.match(/"slug": "free-virtual-assistant-job-websites-philippines"/g) || []).length, 1);
  assert.match(blog, /"updatedAt": "2026-10-24"/);
  assert.match(blog, /"heading": "How to use a live VA jobs directory before applying"/);
  assert.match(blog, /"label": "Browse free Virtual Assistant jobs in the Philippines",\s*"href": "\/jobs"/);
  assert.match(index, /BLOG_JOB_SEARCH_GUIDES/);
});

test("public listing job cards do not prefetch every dynamic detail route", async () => {
  const [page, jobCard] = await Promise.all([
    read("src/app/jobs/page.tsx"),
    read("src/components/job-card.tsx"),
  ]);
  assert.match(page, /<JobCard[\s\S]*?prefetch=\{false\}/);
  assert.match(jobCard, /prefetch = true/);
  assert.match(jobCard, /<Link href=\{href\} prefetch=\{prefetch\}>/);
  assert.match(jobCard, /<Link className="btn btn-primary" href=\{href\} prefetch=\{prefetch\}>/);
});
