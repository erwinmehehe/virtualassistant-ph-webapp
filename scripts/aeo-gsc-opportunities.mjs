#!/usr/bin/env node
/**
 * Read a Google Search Console Performance CSV export and suggest answer-first
 * editing targets. Nothing is uploaded; files remain local to the operator.
 *
 * Usage: npm run seo:aeo-opportunities -- path/to/query-page-export.csv
 * Prefer a Search Analytics export with BOTH query and page dimensions.
 */
import { readFileSync } from "node:fs";

function csvRows(raw) {
  const rows = [];
  let row = [], value = "", quoted = false;
  const input = raw.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { value += '"'; i++; }
      else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(value); value = ""; }
    else if (char === "\n") { row.push(value.replace(/\r$/, "")); rows.push(row); row = []; value = ""; }
    else value += char;
  }
  if (value || row.length) { row.push(value.replace(/\r$/, "")); rows.push(row); }
  return rows.filter((entry) => entry.some((cell) => cell.trim()));
}

function column(row) {
  return row.trim().toLowerCase().replace(/[\s_-]+/g, "");
}
function metric(value) {
  const number = Number(String(value || "").replace(/,/g, "").replace(/%$/, ""));
  return Number.isFinite(number) ? number : 0;
}
function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
function family(url) {
  if (/\/blog(?:\/|$)/i.test(url)) return "Blog";
  if (/\/service(?:\/|$)/i.test(url)) return "Service";
  if (/\/industries(?:\/|$)/i.test(url)) return "Industry";
  if (/\/training(?:\/|$)/i.test(url)) return "Training";
  if (/\/jobs(?:\/|$)/i.test(url)) return "Jobs";
  return url ? "Other" : "Unmapped";
}
function escapeCell(value) {
  return clean(value).replace(/\|/g, "\\|").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function rowTable(rows) {
  const lines = ["| Query | Page | Impressions | Clicks | Position | Segment |", "| --- | --- | ---: | ---: | ---: | --- |"];
  for (const row of rows) lines.push(
    `| ${escapeCell(row.query)} | ${escapeCell(row.page || "(query-only export)")} | ${row.impressions} | ${row.clicks} | ${row.position.toFixed(1)} | ${family(row.page)} |`
  );
  return lines.join("\n");
}

const filename = process.argv[2];
if (!filename) {
  console.error("Usage: npm run seo:aeo-opportunities -- <gsc-query-page.csv>");
  process.exitCode = 1;
} else {
  try {
    const csv = csvRows(readFileSync(filename, "utf8"));
    const headers = (csv.shift() || []).map(column);
    function index(...aliases) { return headers.findIndex((name) => aliases.includes(name)); }
    const ix = {
      query: index("query", "topqueries", "searchquery"),
      page: index("page", "toppages", "landingpage", "url"),
      clicks: index("clicks"),
      impressions: index("impressions"),
      position: index("position", "averageposition"),
    };
    if (ix.query < 0 || ix.clicks < 0 || ix.impressions < 0 || ix.position < 0) {
      throw new Error("Expected GSC columns: query (or Top queries), Clicks, Impressions, Position. Export query + page when possible.");
    }
    const rows = csv.map((cells) => ({
      query: clean(cells[ix.query]),
      page: ix.page >= 0 ? clean(cells[ix.page]) : "",
      clicks: metric(cells[ix.clicks]),
      impressions: metric(cells[ix.impressions]),
      position: metric(cells[ix.position]),
    })).filter((entry) => entry.query && entry.impressions > 0);

    const rankedZeroClicks = rows
      .filter((entry) => entry.impressions >= 30 && entry.clicks === 0 && entry.position > 0 && entry.position <= 3)
      .sort((a, b) => b.impressions - a.impressions).slice(0, 30);
    const underperforming = rows
      .filter((entry) => entry.impressions >= 50 && entry.position > 0 && entry.position <= 10 && entry.clicks / entry.impressions < 0.01)
      .sort((a, b) => b.impressions - a.impressions).slice(0, 30);

    const byQuery = new Map();
    for (const row of rows) {
      if (!row.page || row.impressions < 20) continue;
      const urls = byQuery.get(row.query) || new Set();
      urls.add(row.page.replace(/\/$/, ""));
      byQuery.set(row.query, urls);
    }
    const overlaps = [...byQuery]
      .filter(([, urls]) => urls.size > 1)
      .map(([query, urls]) => ({ query, pages: [...urls] }))
      .slice(0, 30);

    console.log("# GSC Answer-First Opportunity Review");
    console.log("");
    console.log(`Source: ${filename} | Rows with impressions: ${rows.length}`);
    console.log("");
    console.log("These are editing candidates, not proof that AI Overviews caused lost clicks or that two pages cannibalize rankings. Check the live SERP, query intent, and GSC date range before changing a page.");
    console.log("");
    console.log("## Positions 1-3 with impressions but zero clicks");
    console.log(rankedZeroClicks.length ? rowTable(rankedZeroClicks) : "No rows meet this threshold.");
    console.log("");
    console.log("## Low-CTR query-page rows in positions 1-10");
    console.log(underperforming.length ? rowTable(underperforming) : "No rows meet this threshold.");
    console.log("");
    console.log("## Query overlap candidates (multiple URLs, not confirmed cannibalization)");
    if (ix.page < 0) console.log("Export both query and page dimensions to evaluate overlapping URLs.");
    else if (!overlaps.length) console.log("No multiple-URL candidates meet this threshold.");
    else for (const row of overlaps) console.log(`- **${escapeCell(row.query)}**: ${row.pages.map(escapeCell).join("; ")}`);
    console.log("");
    console.log("## Editorial checks");
    console.log("1. Confirm user intent and live SERP features. Zero clicks alone cannot identify an AI Overview.");
    console.log("2. Improve the first visible answer using verifiable details; do not invent facts or force every answer to exactly 60 words.");
    console.log("3. Compare section questions, FAQs, tables, and contextual links against the actual query gap.");
    console.log("4. Preserve the canonical service or industry page when a blog addresses only a distinct informational intent.");
    console.log("5. Recheck query-page clicks, CTR, impressions, and conversions at comparable dates; separately record AI citation tests.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
