import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataPath = path.join(root, 'src/lib/service-pages.ts');
const pagePath = path.join(root, 'src/app/service/[slug]/page.tsx');
const source = fs.readFileSync(dataPath, 'utf8');
const pageSource = fs.readFileSync(pagePath, 'utf8');
const marker = 'export const SERVICE_PAGES: ServiceSeoPage[] = ';
const markerIndex = source.indexOf(marker);
if (markerIndex < 0) throw new Error('SERVICE_PAGES marker not found');
const arrayStart = source.indexOf('[', markerIndex + marker.length);
const arrayEnd = source.indexOf('];', arrayStart);
const pages = JSON.parse(source.slice(arrayStart, arrayEnd + 1));

const failures = [];
const seenSlugs = new Set();
const seenTitles = new Set();
const slopTerms = [
  /\bseamless(?:ly)?\b/i,
  /\bstreamlin(?:e|ed|ing)\b/i,
  /\bunlock(?:ing|ed)?\b/i,
  /\belevat(?:e|ed|ing)\b/i,
  /\bgame[- ]changer\b/i,
  /\bin today['’]s fast[- ]paced\b/i,
  /\brevolutioni[sz](?:e|ed|ing)\b/i,
  /\beffortless(?:ly)?\b/i,
  /\bsupercharge(?:d|s|ing)?\b/i
];

for (const page of pages) {
  if (seenSlugs.has(page.slug)) failures.push(`${page.slug}: duplicate slug`);
  seenSlugs.add(page.slug);
  if (seenTitles.has(page.metaTitle)) failures.push(`${page.slug}: duplicate meta title`);
  seenTitles.add(page.metaTitle);
  if (/^Hire /i.test(page.metaTitle)) failures.push(`${page.slug}: meta title should not start with "Hire"`);
  if (!page.metaTitle.endsWith(' Philippines')) failures.push(`${page.slug}: title must end with " Philippines"`);
  if (/virtualassistant\.com\.ph/i.test(page.metaTitle)) failures.push(`${page.slug}: brand found in meta title`);
  if (/\bVA\b/.test(page.metaTitle)) failures.push(`${page.slug}: standalone VA abbreviation found in meta title`);
  if (page.metaDescription.length < 90 || page.metaDescription.length > 160) failures.push(`${page.slug}: meta description length ${page.metaDescription.length}`);
  if (page.tasks.length < 6) failures.push(`${page.slug}: needs at least 6 role-specific tasks`);
  if (page.tools.length < 5) failures.push(`${page.slug}: needs at least 5 tools`);
  if (page.skills.length < 4) failures.push(`${page.slug}: needs at least 4 skills`);
  if (page.bestFor.length < 3) failures.push(`${page.slug}: needs at least 3 best-fit use cases`);
  const copy = [page.metaTitle, page.metaDescription, page.intro, page.focus, ...page.tasks, ...page.skills, ...page.bestFor].join(' ');
  for (const term of slopTerms) if (term.test(copy)) failures.push(`${page.slug}: cliche/AI-slop phrase matched ${term}`);
}

for (const term of slopTerms) if (term.test(pageSource)) failures.push(`shared service template: cliche/AI-slop phrase matched ${term}`);

const requiredDepthSections = ['How the role works', 'First 30 days', 'Common hiring mistakes', 'Managing the role', 'Interview guide', 'Frequently asked questions'];
for (const section of requiredDepthSections) if (!pageSource.includes(section)) failures.push(`shared service template: missing section ${section}`);

console.log(`Service SEO pages checked: ${pages.length}`);
console.log(`Brand names in meta titles: ${pages.filter((p) => /virtualassistant\.com\.ph/i.test(p.metaTitle)).length}`);
console.log(`Standalone VA abbreviations in meta titles: ${pages.filter((p) => /\bVA\b/.test(p.metaTitle)).length}`);
console.log(`Longest meta description: ${Math.max(...pages.map((p) => p.metaDescription.length))} characters`);
console.log(`Required depth sections present: ${requiredDepthSections.length}/${requiredDepthSections.length}`);

if (failures.length) {
  console.error(`\nFAIL (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('PASS');
