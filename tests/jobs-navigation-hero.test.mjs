import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const nav = readFileSync("src/components/site-nav.tsx", "utf8");
const page = readFileSync("src/app/jobs/page.tsx", "utf8");
const css = readFileSync("src/app/jobs/jobs-marketplace.css", "utf8");

test("Jobs is directly discoverable in both site navs on desktop and mobile", () => {
  assert.match(nav, /<nav className="nav-links" aria-label="Primary navigation">[\s\S]*?<Link className="va-nav-jobs-link" href="\/jobs">Jobs<\/Link>/);
  assert.match(nav, /<nav className="va-mobile-panel" aria-label="Mobile navigation">[\s\S]*?<Link className="va-mobile-jobs-link" href="\/jobs">Jobs<\/Link>/);
  assert.match(nav, /<Link href="\/jobs" className="training-nav-jobs">Jobs<\/Link>/);
  assert.match(nav, /<Link href="\/jobs">Browse VA jobs<\/Link>/);
  assert.doesNotMatch(nav, /<Link href="\/jobs">Browse Virtual Assistant jobs<\/Link>/);
});

test("jobs hero prioritizes applying, with a separate employer route", () => {
  const start = page.indexOf('<section className="jobs-market-hero"');
  const end = page.indexOf('<section className="section jobs-directory"');
  assert.ok(start >= 0 && end > start);
  const hero = page.slice(start, end);
  assert.match(hero, /<h1 id="jobs-market-title">Virtual Assistant Jobs Philippines<\/h1>/);
  assert.match(hero, /Remote VA opportunities in the Philippines/);
  assert.match(hero, /<a className="btn btn-primary btn-lg" href="#open-jobs">[\s\S]*?Browse open jobs/);
  assert.match(hero, /<Link className="btn btn-lg" href=\{VA_JOIN_HREF\}>[\s\S]*?Create free VA profile/);
  assert.ok(hero.indexOf('href="#open-jobs"') < hero.indexOf('href={VA_JOIN_HREF}'), "Browse jobs must lead the candidate CTA");
  assert.match(hero, /<aside className="jobs-employer-card">[\s\S]*?href=\{EMPLOYER_POST_HREF\}/);
  assert.match(page, /<form className="jobs-filterbar" method="get">/);
  assert.match(page, /Only published roles appear here/);
});

test("hero has balanced responsive layout without hiding candidate CTAs", () => {
  assert.match(css, /\.jobs-market-hero-grid\s*\{[\s\S]*?align-items: center;/);
  assert.match(css, /\.jobs-market-actions \.btn\s*\{[\s\S]*?min-height: 48px;/);
  assert.match(css, /@media \(max-width: 920px\)/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /\.jobs-market-actions \.btn\s*\{[\s\S]*?width: 100%;/);
  assert.match(css, /\.jobs-employer-card ul\s*\{[\s\S]*?display: none;/);
});
