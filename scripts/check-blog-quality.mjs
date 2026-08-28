import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const blogPath = path.join(root, 'src/lib/blog-content.ts');
const servicePath = path.join(root, 'src/lib/service-pages.ts');
const industryPath = path.join(root, 'src/lib/industries.ts');

function readPosts() {
  const source = fs.readFileSync(blogPath, 'utf8');
  const marker = 'export const BLOG_POSTS: BlogPost[] = ';
  const start = source.indexOf(marker);
  if (start < 0) throw new Error('BLOG_POSTS marker not found');
  return JSON.parse(source.slice(start + marker.length, source.lastIndexOf(';')));
}
function words(value) {
  return (String(value || '').match(/[A-Za-z0-9][A-Za-z0-9'’.-]*/g) || []).length;
}
function articleWords(post) {
  let total = 0;
  for (const section of post.sections || []) {
    total += words(section.heading);
    total += words((section.paragraphs || []).join(' '));
    total += words((section.bullets || []).join(' '));
    total += words((section.numbered || []).join(' '));
    if (section.table) total += words(JSON.stringify(section.table));
  }
  for (const faq of post.faqs || []) total += words(faq.question) + words(faq.answer);
  return total;
}
function slugsFrom(file) {
  const source = fs.readFileSync(file, 'utf8');
  return new Set([...source.matchAll(/(?:\bslug|["']slug["'])\s*:\s*['"]([^'"]+)['"]/g)].map(m => m[1]));
}
function routeForPost(post) {
  return post.legacyPath || `/blog/${post.slug}/`;
}

const posts = readPosts();
const serviceSlugs = slugsFrom(servicePath);
const industrySlugs = slugsFrom(industryPath);
const blogRoutes = new Set(posts.map(routeForPost));
const topicRoutes = new Set(posts.map(p => `/blog/topic/${p.topic}/`));
const knownStatic = new Set([
  '/', '/blog/', '/services', '/services/', '/industries', '/industries/', '/hire', '/hire/',
  '/tools/virtual-assistant-cost-calculator/', '/tools/hourly-to-monthly-calculator/',
  '/tools/virtual-assistant-job-description-generator/', '/tools/what-type-of-va-do-i-need/'
]);
const banned = [
  'delve into', 'game-changer', 'game changer', 'unlock the potential', 'seamless solution',
  'ever-evolving landscape', 'harness the power', 'revolutionize', 'supercharge', 'in today’s fast-paced',
  "in today's fast-paced", 'for this article,', 'in this article, we will', 'in conclusion,'
];
const failures = [];
const warnings = [];
const titleSeen = new Map();
const metaSeen = new Map();
const paragraphSeen = new Map();
const faqAnswerSeen = new Map();
const longSentenceUse = new Map();
const policySentenceAllowlist = new Set(['$5 per hour is the minimum allowed for ongoing hourly roles on VirtualAssistant.com.ph.']);
const sentenceSegmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
let minWords = Infinity, maxWords = 0, totalWords = 0, minFaqs = Infinity, minLinks = Infinity;

for (const post of posts) {
  const wc = articleWords(post);
  minWords = Math.min(minWords, wc); maxWords = Math.max(maxWords, wc); totalWords += wc;
  minFaqs = Math.min(minFaqs, (post.faqs || []).length);
  minLinks = Math.min(minLinks, (post.internalLinks || []).length);
  if (wc < 1000) failures.push(`${post.slug}: ${wc} words, below 1000`);
  if ((post.faqs || []).length < 6) failures.push(`${post.slug}: fewer than 6 FAQs`);
  if ((post.internalLinks || []).length < 5) failures.push(`${post.slug}: fewer than 5 internal links`);
  if ((post.metaTitle || '').length > 60) warnings.push(`${post.slug}: meta title is ${post.metaTitle.length} characters`);
  if ((post.description || '').length > 170) warnings.push(`${post.slug}: meta description is ${post.description.length} characters`);
  for (const [label, value, map] of [['title', post.title, titleSeen], ['metaTitle', post.metaTitle, metaSeen]]) {
    if (map.has(value)) failures.push(`${post.slug}: duplicate ${label} with ${map.get(value)}`); else map.set(value, post.slug);
  }
  const searchable = JSON.stringify(post).toLowerCase();
  for (const phrase of banned) if (searchable.includes(phrase)) failures.push(`${post.slug}: banned robotic phrase "${phrase}"`);
  if (searchable.includes('\u2014') || searchable.includes('\u2013')) failures.push(`${post.slug}: em dash or en dash found`);

  for (const section of post.sections || []) for (const paragraph of section.paragraphs || []) {
    if (words(paragraph) < 25) continue;
    if (paragraphSeen.has(paragraph)) failures.push(`${post.slug}: duplicate long paragraph also used by ${paragraphSeen.get(paragraph)}`); else paragraphSeen.set(paragraph, post.slug);
  }
  for (const faq of post.faqs || []) {
    if (faqAnswerSeen.has(faq.answer)) failures.push(`${post.slug}: duplicate FAQ answer also used by ${faqAnswerSeen.get(faq.answer)}`); else faqAnswerSeen.set(faq.answer, post.slug);
  }

  // Strong internal-linking requirement: every article belongs to its topic hub, service-cluster
  // articles link to their canonical money page, and every article points to at least two other articles.
  const hrefs = (post.internalLinks || []).map(link => link.href);
  if (!hrefs.includes(`/blog/topic/${post.topic}/`)) failures.push(`${post.slug}: missing topic-hub internal link`);
  if (post.serviceSlug && !hrefs.includes(`/service/${post.serviceSlug}/`)) failures.push(`${post.slug}: missing canonical service-page link`);
  const articleLinkCount = hrefs.filter(href => blogRoutes.has(href)).length;
  if (articleLinkCount < 2) failures.push(`${post.slug}: fewer than 2 contextual article links`);

  // Detect large-scale boilerplate reuse. Repeating a short policy sentence is acceptable, but
  // editorial advice of 12+ words should not appear unchanged across a large portion of the corpus.
  const proseValues = [
    ...(post.sections || []).flatMap(section => section.paragraphs || []),
    ...(post.faqs || []).map(faq => faq.answer),
  ];
  for (const value of proseValues) {
    for (const part of sentenceSegmenter.segment(String(value))) {
      const sentence = part.segment.trim();
      if (words(sentence) < 12 || policySentenceAllowlist.has(sentence)) continue;
      if (!longSentenceUse.has(sentence)) longSentenceUse.set(sentence, new Set());
      longSentenceUse.get(sentence).add(post.slug);
    }
  }

  for (const link of post.internalLinks || []) {
    const href = link.href || '';
    if (!href.startsWith('/')) continue;
    if (blogRoutes.has(href) || topicRoutes.has(href) || knownStatic.has(href)) continue;
    let m = href.match(/^\/service\/([^/]+)\/?$/); if (m && serviceSlugs.has(m[1])) continue;
    m = href.match(/^\/industries\/([^/]+)\/?$/); if (m && industrySlugs.has(m[1])) continue;
    failures.push(`${post.slug}: unresolved internal link ${href}`);
  }
}

for (const [sentence, slugs] of longSentenceUse) {
  if (slugs.size > 14) failures.push(`boilerplate sentence reused across ${slugs.size} articles: ${sentence}`);
}

const stats = {
  posts: posts.length,
  minimumWords: minWords,
  averageWords: Math.round(totalWords / posts.length),
  maximumWords: maxWords,
  minimumFaqsPerArticle: minFaqs,
  minimumInternalLinksPerArticle: minLinks,
  failures: failures.length,
  warnings: warnings.length,
};
console.log(JSON.stringify(stats, null, 2));
if (warnings.length) console.error('\nWarnings:\n' + warnings.slice(0, 50).join('\n'));
if (failures.length) {
  console.error('\nFailures:\n' + failures.slice(0, 100).join('\n'));
  process.exit(1);
}
