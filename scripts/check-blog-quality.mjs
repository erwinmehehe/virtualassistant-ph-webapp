import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const blogPath = path.join(root, 'src/lib/blog-content.ts');
const opportunityBlogPath = path.join(root, 'src/lib/blog-opportunity-posts.ts');
const hiringGuidesPath = path.join(root, 'src/lib/blog-hiring-guides.ts');
const demandGuidesPath = path.join(root, 'src/lib/blog-demand-guides.ts');
const keywordSupportGuidesPath = path.join(root, 'src/lib/blog-keyword-support-guides.ts');
const servicePath = path.join(root, 'src/lib/service-pages.ts');
const softwarePath = path.join(root, 'src/lib/software-pages.ts');
const industryPath = path.join(root, 'src/lib/industries.ts');
const archivePath = path.join(root, 'src/lib/archive-posts.ts');
const editorialPath = path.join(root, 'src/lib/editorial-seo-guides.ts');

function readPosts() {
  return [
    ...readPostArray(blogPath, 'export const BLOG_POSTS: BlogPost[] = '),
    ...readPostArray(opportunityBlogPath, 'export const BLOG_OPPORTUNITY_POSTS: BlogPost[] = '),
    ...readPostArray(hiringGuidesPath, 'export const BLOG_HIRING_GUIDES: BlogPost[] = '),
    ...readPostArray(demandGuidesPath, 'export const BLOG_DEMAND_GUIDES: BlogPost[] = '),
    ...readPostArray(keywordSupportGuidesPath, 'export const BLOG_KEYWORD_SUPPORT_GUIDES: BlogPost[] = '),
  ];
}
function readPostArray(file, marker) {
  const source = fs.readFileSync(file, 'utf8');
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`${path.basename(file)} marker not found`);
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
function editorialResourceSlugs() {
  const source = fs.readFileSync(editorialPath, 'utf8');
  const marker = 'export const EDITORIAL_RESOURCE_SLUGS = ';
  const start = source.indexOf('[', source.indexOf(marker) + marker.length);
  const end = source.indexOf('] as const', start);
  return new Set(JSON.parse(source.slice(start, end + 1)));
}
function routeForPost(post) {
  return (post.legacyPath || `/blog/${post.slug}`).replace(/\/$/, '');
}

function roleTokens(post) {
  return new Set(
    [post.serviceSlug || '', post.softwareSlug || '', post.clusterLabel || '', post.title || '']
      .join(' ')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(token => token.length > 2)
  );
}

function normalizedHeading(heading, post) {
  const roleWords = roleTokens(post);
  return String(heading || '')
    .toLowerCase()
    .replace(/virtual assistant/g, '')
    .split(/[^a-z0-9]+/)
    .filter(token => token.length > 2 && !roleWords.has(token))
    .join(' ');
}

function proseShingles(post, size = 8) {
  const text = (post.sections || [])
    .flatMap(section => [
      ...(section.paragraphs || []),
      ...(section.bullets || []),
      ...(section.numbered || [])
    ])
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = text.split(' ').filter(token => token.length > 2);
  const shingles = new Set();
  for (let i = 0; i <= tokens.length - size; i += 1) {
    shingles.add(tokens.slice(i, i + size).join(' '));
  }
  return shingles;
}

function jaccard(a, b) {
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  return intersection / (a.size + b.size - intersection || 1);
}

const posts = readPosts();
const serviceSlugs = slugsFrom(servicePath);
const softwareSlugs = slugsFrom(softwarePath);
const industrySlugs = slugsFrom(industryPath);
const blogRoutes = new Set(posts.map(routeForPost));
for (const slug of slugsFrom(archivePath)) blogRoutes.add(`/blog/${slug}`);
for (const slug of slugsFrom(editorialPath)) blogRoutes.add(`/blog/${slug}`);
for (const slug of editorialResourceSlugs()) blogRoutes.add(`/blog/${slug}`);
const topicRoutes = new Set(posts.map(p => `/blog/topic/${p.topic}`));
const knownStatic = new Set([
  '/', '/blog', '/services', '/industries', '/software', '/training', '/hire', '/pricing', '/jobs', '/virtual-assistant-companies-philippines', '/managed-vs-direct-hire',
  '/tools/virtual-assistant-cost-calculator', '/tools/hourly-to-monthly-calculator',
  '/tools/virtual-assistant-job-description-generator', '/tools/what-type-of-va-do-i-need',
  '/research/virtual-assistant-rates-philippines-2026', '/resources/virtual-assistant-job-description'
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
const policySentenceAllowlist = new Set();
const malformedDescriptionEnding = /(?:\band the|\band|\bthe|includes the)\.$/i;
const stalePricingPolicy = /platform floor|marketplace floor|minimum allowed for ongoing hourly roles|minimum hourly rate on VirtualAssistant\.com\.ph|does not accept ongoing hourly roles below \$5|requires ongoing hourly (?:jobs|roles) to pay at least \$5|sets a \$5\/hour minimum|ongoing hourly jobs must be posted at \$5|exactly \$5 is accepted|treat \$5\/hour as the floor|\$5\/hour is the platform minimum|is \$5 per hour the recommended rate\?|VirtualAssistant\.com\.ph \$5\/hour/i;
const genericDecisionBoundary = /spending, refunds above a threshold, account ownership changes, legal commitments, public statements/i;
const highStakeTopics = new Set(['healthcare', 'legal', 'finance-bookkeeping', 'philippines']);
const sentenceSegmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
const editorialCutoff = '2026-09-19';
let minWords = Infinity, maxWords = 0, totalWords = 0, minFaqs = Infinity, minLinks = Infinity;

for (const post of posts) {
  const wc = articleWords(post);
  minWords = Math.min(minWords, wc); maxWords = Math.max(maxWords, wc); totalWords += wc;
  minFaqs = Math.min(minFaqs, (post.faqs || []).length);
  minLinks = Math.min(minLinks, (post.internalLinks || []).length);
  if (wc < 350) failures.push(`${post.slug}: ${wc} words, too thin to function as a standalone guide`);
  else if (wc < 700) warnings.push(`${post.slug}: ${wc} words; confirm the shorter length fully answers the intent`);
  if (wc > 3500) warnings.push(`${post.slug}: ${wc} words; confirm the length is earned by the topic`);
  if ((post.faqs || []).length > 10) warnings.push(`${post.slug}: more than 10 FAQs; keep only questions that add distinct information`);
  if ((post.internalLinks || []).length < 3) failures.push(`${post.slug}: fewer than 3 useful internal links`);
  if ((post.metaTitle || '').length > 60) warnings.push(`${post.slug}: meta title is ${post.metaTitle.length} characters`);
  if ((post.description || '').length < 120) failures.push(`${post.slug}: meta description is only ${post.description.length} characters`);
  if ((post.description || '').length > 160) failures.push(`${post.slug}: meta description is ${post.description.length} characters`);
  if (malformedDescriptionEnding.test((post.description || '').trim())) failures.push(`${post.slug}: meta description ends with a broken phrase`);
  for (const [label, value, map] of [['title', post.title, titleSeen], ['metaTitle', post.metaTitle, metaSeen]]) {
    if (map.has(value)) failures.push(`${post.slug}: duplicate ${label} with ${map.get(value)}`); else map.set(value, post.slug);
  }
  const rawPost = JSON.stringify(post);
  const searchable = rawPost.toLowerCase();
  for (const phrase of banned) if (searchable.includes(phrase)) failures.push(`${post.slug}: banned robotic phrase "${phrase}"`);
  if (searchable.includes('\u2014') || searchable.includes('\u2013')) failures.push(`${post.slug}: em dash or en dash found`);
  if (stalePricingPolicy.test(rawPost)) failures.push(`${post.slug}: stale $5 platform-floor pricing language found`);
  if (genericDecisionBoundary.test(rawPost)) failures.push(`${post.slug}: generic decision-boundary boilerplate found`);
  if (highStakeTopics.has(post.topic)) {
    if ((post.sources || []).length < 2) failures.push(`${post.slug}: high-stakes topic needs at least 2 primary/authoritative sources`);
    if (!post.reviewNote) failures.push(`${post.slug}: high-stakes topic needs an editorial scope/review note`);
    for (const source of post.sources || []) {
      if (!/^https:\/\//.test(source.href || '')) failures.push(`${post.slug}: source must use an absolute HTTPS URL`);
    }
  }

  for (const section of post.sections || []) for (const paragraph of section.paragraphs || []) {
    if (words(paragraph) < 25) continue;
    if (paragraphSeen.has(paragraph)) warnings.push(`${post.slug}: duplicate long paragraph also used by ${paragraphSeen.get(paragraph)}`); else paragraphSeen.set(paragraph, post.slug);
  }
  for (const faq of post.faqs || []) {
    if (faqAnswerSeen.has(faq.answer)) warnings.push(`${post.slug}: duplicate FAQ answer also used by ${faqAnswerSeen.get(faq.answer)}`); else faqAnswerSeen.set(faq.answer, post.slug);
  }

  // Strong internal-linking requirement: every article belongs to its topic hub, service-cluster
  // articles link to their canonical money page, and every article points to at least two other articles.
  const hrefs = (post.internalLinks || []).map(link => link.href);
  if (!hrefs.includes(`/blog/topic/${post.topic}`)) failures.push(`${post.slug}: missing topic-hub internal link`);
  if (post.serviceSlug && !hrefs.includes(`/service/${post.serviceSlug}`)) failures.push(`${post.slug}: missing canonical service-page link`);
  if (post.softwareSlug && !hrefs.includes(`/software/${post.softwareSlug}`)) failures.push(`${post.slug}: missing canonical software-page link`);
  const articleLinkCount = hrefs.filter(href => blogRoutes.has(href)).length;
  if (articleLinkCount < 1) failures.push(`${post.slug}: missing a contextual article link`);

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
    m = href.match(/^\/software\/([^/]+)\/?$/); if (m && softwareSlugs.has(m[1])) continue;
    m = href.match(/^\/industries\/([^/]+)\/?$/); if (m && industrySlugs.has(m[1])) continue;
    failures.push(`${post.slug}: unresolved internal link ${href}`);
  }
}

for (const [sentence, slugs] of longSentenceUse) {
  if (slugs.size > 14) warnings.push(`legacy boilerplate sentence reused across ${slugs.size} articles: ${sentence}`);
}

// Editorialized and future posts must not converge on the same role-substitution
// skeleton. Existing older posts remain debt to improve, but every new or
// substantively updated article is held to this stricter standard.
const editorialPosts = posts.filter(post => String(post.updatedAt || post.publishedAt || '') >= editorialCutoff);
const normalizedHeadingOwners = new Map();
for (const post of editorialPosts) {
  for (const section of post.sections || []) {
    const heading = normalizedHeading(section.heading, post);
    if (!heading) continue;
    if (!normalizedHeadingOwners.has(heading)) normalizedHeadingOwners.set(heading, new Set());
    normalizedHeadingOwners.get(heading).add(post.slug);
  }
}
for (const [heading, slugs] of normalizedHeadingOwners) {
  if (slugs.size > 6) failures.push(`template heading reused across ${slugs.size} editorial posts: ${heading}`);
  else if (slugs.size >= 4) warnings.push(`repeated editorial heading across ${slugs.size} posts: ${heading}`);
}

const headingSets = new Map(
  editorialPosts.map(post => [
    post.slug,
    new Set((post.sections || []).map(section => normalizedHeading(section.heading, post)).filter(Boolean))
  ])
);
const shingleSets = new Map(editorialPosts.map(post => [post.slug, proseShingles(post)]));
for (let i = 0; i < editorialPosts.length; i += 1) {
  for (let j = i + 1; j < editorialPosts.length; j += 1) {
    const a = editorialPosts[i];
    const b = editorialPosts[j];
    const headingSimilarity = jaccard(headingSets.get(a.slug), headingSets.get(b.slug));
    const proseSimilarity = jaccard(shingleSets.get(a.slug), shingleSets.get(b.slug));

    if (headingSimilarity >= 0.72) {
      failures.push(`${a.slug} and ${b.slug}: section architecture is too similar (${Math.round(headingSimilarity * 100)}%)`);
    } else if (headingSimilarity >= 0.5) {
      warnings.push(`${a.slug} and ${b.slug}: section architecture similarity is ${Math.round(headingSimilarity * 100)}%`);
    }

    if (proseSimilarity > 0.45) {
      failures.push(`${a.slug} and ${b.slug}: long-form phrase similarity is too high (${Math.round(proseSimilarity * 100)}%)`);
    } else if (proseSimilarity >= 0.28) {
      warnings.push(`${a.slug} and ${b.slug}: long-form phrase similarity is ${Math.round(proseSimilarity * 100)}%; review for role substitution`);
    }
  }
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
