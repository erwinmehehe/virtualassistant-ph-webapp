import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataPath = path.join(root, 'src/lib/service-pages.ts');
const pagePath = path.join(root, 'src/app/service/[slug]/page.tsx');
const heroPath = path.join(root, 'src/components/hiring-hero.tsx');
const source = fs.readFileSync(dataPath, 'utf8');
const pageSource = fs.readFileSync(pagePath, 'utf8');
const heroSource = fs.readFileSync(heroPath, 'utf8');
const marker = 'export const SERVICE_PAGES: ServiceSeoPage[] = ';
const markerIndex = source.indexOf(marker);
if (markerIndex < 0) throw new Error('SERVICE_PAGES marker not found');
const arrayStart = source.indexOf('[', markerIndex + marker.length);
const arrayEnd = source.indexOf('];', arrayStart);
const pages = JSON.parse(source.slice(arrayStart, arrayEnd + 1));

const failures = [];
const seenSlugs = new Set();
const seenTitles = new Set();
const seenDescriptions = new Set();

function generatedTitle(page) {
  const base = page.metaTitle;
  const expanded = `${base} | Hire Vetted VAs`;
  return base.length < 40 && expanded.length <= 60 ? expanded : base;
}

function generatedDescription(page) {
  const shortRole = page.name
    .replace(/\s+Virtual Assistant for\s+/i, ' VA for ')
    .replace(/\s+Virtual Assistant\b/i, ' VA')
    .replace(/^Virtual\s+/i, '')
    .trim();
  const prefix = `Hire a vetted ${shortRole} in the Philippines for `;
  const tasks = page.tasks.slice(0, 3).map((task) => task.replace(/\s+/g, ' ').trim().replace(/[.]$/, ''));
  const suffixes = [
    '. Compare experience, tools, availability, and role fit.',
    '. Compare role experience, tools, availability, and fit.',
    '. Compare skills, tools, schedule, and role fit.'
  ];

  for (const suffix of suffixes) {
    for (let count = tasks.length; count >= 1; count -= 1) {
      const selected = tasks.slice(0, count);
      const taskText = selected.length === 1
        ? selected[0]
        : selected.length === 2
          ? `${selected[0]} and ${selected[1]}`
          : `${selected[0]}, ${selected[1]}, and ${selected[2]}`;
      const candidate = `${prefix}${taskText}${suffix}`;
      if (candidate.length <= 160) {
        if (candidate.length >= 145) return candidate;
        const expanded = `${candidate.slice(0, -1)} before you interview.`;
        return expanded.length <= 160 ? expanded : candidate;
      }
    }
  }

  const fallback = `Hire a vetted ${shortRole} in the Philippines. Compare relevant experience, tools, availability, communication, and role fit before you interview.`;
  if (fallback.length <= 160) return fallback;

  const concise = `Hire a vetted ${shortRole} in the Philippines. Compare experience, tools, availability, and role fit.`;
  if (concise.length >= 140) return concise;
  const expanded = `${concise.slice(0, -1)} before you interview.`;
  return expanded.length <= 160 ? expanded : concise;
}

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
  const metaTitle = generatedTitle(page);
  const metaDescription = generatedDescription(page);
  if (seenTitles.has(metaTitle)) failures.push(`${page.slug}: duplicate generated meta title`);
  seenTitles.add(metaTitle);
  if (seenDescriptions.has(metaDescription)) failures.push(`${page.slug}: duplicate generated meta description`);
  seenDescriptions.add(metaDescription);
  if (/^Hire /i.test(metaTitle)) failures.push(`${page.slug}: meta title should not start with "Hire"`);
  if (metaTitle.length < 30 || metaTitle.length > 60) failures.push(`${page.slug}: generated meta title length ${metaTitle.length}`);
  if (/virtualassistant\.com\.ph/i.test(metaTitle)) failures.push(`${page.slug}: brand found in meta title`);
  if (metaDescription.length < 140 || metaDescription.length > 160) failures.push(`${page.slug}: generated meta description length ${metaDescription.length}`);
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

const templateRequirements = [
  ['generated meta title', /title:\s*\{\s*absolute:\s*serviceMetaTitle\(page\)\s*\}/],
  ['generated meta description', /description:\s*serviceMetaDescription\(page\)/],
  ['canonical URL', /canonicalPath\(`\/service\/\$\{page\.slug\}`\)/],
  ['canonical metadata', /alternates:\s*\{\s*canonical\s*\}/],
  ['Open Graph URL', /openGraph:\s*\{[^}]*url:\s*canonical/],
  ['static service routes', /SERVICE_PAGES\.map\(\(page\)\s*=>\s*\(\{\s*slug:\s*page\.slug\s*\}\)\)/],
  ['hiring brief form', /<HiringBriefForm/]
];
for (const [label, pattern] of templateRequirements) {
  if (!pattern.test(pageSource)) failures.push(`shared service template: missing ${label}`);
}

const h1Count = (heroSource.match(/<h1\b/g) || []).length;
if (h1Count !== 1) failures.push(`shared hiring hero: expected exactly one H1, found ${h1Count}`);

console.log(`Service SEO pages checked: ${pages.length}`);
console.log(`Generated meta titles: ${seenTitles.size}`);
console.log(`Generated meta descriptions: ${seenDescriptions.size}`);
console.log(`Longest generated meta description: ${Math.max(...pages.map((p) => generatedDescription(p).length))} characters`);
console.log(`Required depth sections present: ${requiredDepthSections.length}/${requiredDepthSections.length}`);
console.log(`Shared hiring hero H1 count: ${h1Count}`);
console.log(`SEO template checks: ${templateRequirements.length}`);

if (failures.length) {
  console.error(`\nFAIL (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('PASS');
