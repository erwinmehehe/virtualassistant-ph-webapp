import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("blog rendering only emits update signals after a real date change", () => {
  const article = source("src/components/blog-article.tsx");
  const page = source("src/app/blog/[slug]/page.tsx");

  assert.match(article, /const hasMeaningfulUpdate = post\.updatedAt !== post\.publishedAt/);
  assert.match(article, /const articleDateLabel = hasMeaningfulUpdate \? "Updated" : "Published"/);
  assert.match(page, /\.\.\.\(hasMeaningfulUpdate \? \{ modifiedTime: post\.updatedAt \} : \{\}\)/);
  assert.match(page, /\.\.\.\(post\.updatedAt !== post\.publishedAt \? \{ dateModified: post\.updatedAt \} : \{\}\)/);
});

test("blog content no longer depends on a runtime $5 pricing sanitizer", () => {
  const blog = source("src/lib/blog.ts");
  assert.match(blog, /export const BLOG_POSTS: BlogPost\[\] = \[\.\.\.RAW_BLOG_POSTS, \.\.\.EDITORIAL_SEO_POSTS\];/);
  assert.doesNotMatch(blog, /containsStaleFiveDollarFloor/);
  assert.doesNotMatch(blog, /CURRENT_PRICING_FAQ/);
});

test("archive stays clean and canonical HIPAA guidance keeps authoritative sources", () => {
  const archive = source("src/lib/archive-posts.ts");
  assert.doesNotMatch(archive, /\[[0-9]+(?:\.[0-9]+)+\]/);
  assert.doesNotMatch(archive, /2026 HIPAA updates/i);
  assert.doesNotMatch(archive, /100% HIPAA compliant/i);
  assert.doesNotMatch(archive, /revoke[^<]{0,80}within one hour/i);

  const hipaa = parseBlogPosts().find((post) => post.slug === "hipaa-and-remote-virtual-assistants");
  assert.ok(hipaa, "canonical HIPAA guide missing");
  assert.ok(
    (hipaa.sources || []).some((item) => item.label === "HHS: HIPAA Security Rule" && item.href.startsWith("https://www.hhs.gov/")),
    "canonical HIPAA guide must keep the HHS Security Rule source"
  );
});


function parseBlogPosts() {
  const text = source("src/lib/blog-content.ts");
  const marker = "export const BLOG_POSTS: BlogPost[] = ";
  const markerIndex = text.indexOf(marker);
  assert.ok(markerIndex >= 0, "blog content marker missing");
  const start = text.indexOf("[", markerIndex + marker.length);
  const end = text.lastIndexOf("];");
  return JSON.parse(text.slice(start, end + 1));
}

test("blog metadata does not emit obsolete meta-keywords", () => {
  const articlePage = source("src/app/blog/[slug]/page.tsx");
  const blogIndex = source("src/app/blog/page.tsx");

  assert.doesNotMatch(articlePage, /keywords:\s*\[/);
  assert.doesNotMatch(blogIndex, /keywords:\s*\[/);
});

test("structured blog internal links use canonical non-trailing-slash paths", () => {
  const posts = parseBlogPosts();
  for (const post of posts) {
    for (const link of post.internalLinks || []) {
      assert.ok(link.href === "/" || !link.href.endsWith("/"), `${post.slug}: trailing-slash internal link ${link.href}`);
    }
  }
});

test("SEO editorial cluster has distinct intent-led architecture", () => {
  const posts = parseBlogPosts();
  const seoPosts = posts.filter((post) => post.serviceSlug === "seo");
  assert.equal(seoPosts.length, 9);

  const bannedGenericHeadings = new Set([
    "Build a scorecard you can use on every candidate",
    "Source against the work, not the broadest possible title",
    "Screen for evidence before scheduling a long interview",
    "Why rates vary even when the job title is the same",
    "Build the monthly budget from hours and ownership",
    "What a normal week can look like"
  ]);

  for (const post of seoPosts) {
    assert.equal(post.updatedAt, "2026-09-19", `${post.slug}: substantive SEO rewrite should carry current update date`);
    for (const section of post.sections || []) {
      assert.equal(bannedGenericHeadings.has(section.heading), false, `${post.slug}: generic cluster heading survived: ${section.heading}`);
    }
    const serialized = JSON.stringify(post);
    assert.doesNotMatch(serialized, /approval\.For SEO Virtual Assistant/);
  }
});


test("structured blog metadata stays inside SERP target ranges", () => {
  const posts = parseBlogPosts();
  for (const post of posts) {
    assert.ok(post.metaTitle.length >= 40 && post.metaTitle.length <= 60, `${post.slug}: meta title length ${post.metaTitle.length}`);
    assert.ok(post.description.length >= 140 && post.description.length <= 160, `${post.slug}: meta description length ${post.description.length}`);
  }
});

test("structured blog corpus has no exact duplicate long paragraphs", () => {
  const posts = parseBlogPosts();
  const owners = new Map();

  for (const post of posts) {
    for (const section of post.sections || []) {
      for (const paragraph of section.paragraphs || []) {
        const normalized = paragraph.trim();
        if (normalized.length < 100) continue;
        const slugs = owners.get(normalized) || new Set();
        slugs.add(post.slug);
        owners.set(normalized, slugs);
      }
    }
  }

  const duplicates = [...owners.entries()]
    .filter(([, slugs]) => slugs.size > 1)
    .map(([paragraph, slugs]) => ({ paragraph: paragraph.slice(0, 120), slugs: [...slugs] }));

  assert.deepEqual(duplicates, []);
});

test("priority blog clusters do not reuse the old generic editorial skeleton", () => {
  const posts = parseBlogPosts();
  const priorityServices = new Set([
    "seo",
    "bookkeeping",
    "executive-virtual-assistant",
    "real-estate",
    "medical-virtual-assistant",
    "amazon-virtual-assistant",
    "lead-generation"
  ]);
  const banned = new Set([
    "Build a scorecard you can use on every candidate",
    "Source against the work, not the broadest possible title",
    "Screen for evidence before scheduling a long interview",
    "Why rates vary even when the job title is the same",
    "Build the monthly budget from hours and ownership",
    "Ask questions about real work, not personality labels",
    "Use the second half of the interview for judgment and handoffs",
    "Daily work to consider",
    "Weekly and recurring work",
    "What a normal week can look like"
  ]);

  for (const post of posts.filter((item) => priorityServices.has(item.serviceSlug))) {
    for (const section of post.sections || []) {
      assert.equal(banned.has(section.heading), false, `${post.slug}: generic priority-cluster heading survived: ${section.heading}`);
    }
  }
});


test("30 priority blogs carry recruiter-grade Philippine operating context", () => {
  const posts = parseBlogPosts();
  const prioritySlugs = [
    "what-does-an-seo-virtual-assistant-do",
    "how-to-hire-a-seo",
    "seo-cost-philippines",
    "what-does-a-bookkeeping-do",
    "bookkeeping-interview-questions",
    "bookkeeping-tasks",
    "what-does-an-executive-virtual-assistant-do",
    "executive-virtual-assistant-interview-questions",
    "executive-virtual-assistant-tasks",
    "what-is-a-virtual-medical-assistant",
    "medical-virtual-assistant-interview-questions",
    "medical-virtual-assistant-tasks",
    "what-does-a-real-estate-virtual-assistant-do",
    "real-estate-interview-questions",
    "real-estate-cost-philippines",
    "what-does-an-ecommerce-do",
    "ecommerce-tasks",
    "ecommerce-cost-philippines",
    "what-does-an-amazon-virtual-assistant-do",
    "amazon-virtual-assistant-interview-questions",
    "amazon-virtual-assistant-cost-philippines",
    "what-does-a-lead-generation-do",
    "lead-generation-tasks",
    "lead-generation-interview-questions",
    "what-does-a-customer-service-do",
    "customer-service-tasks",
    "customer-service-interview-questions",
    "what-does-a-legal-virtual-assistant-do",
    "best-tools-for-legal-virtual-assistant",
    "legal-virtual-assistant-interview-questions"
  ];

  assert.equal(prioritySlugs.length, 30);

  for (const slug of prioritySlugs) {
    const post = posts.find((item) => item.slug === slug);
    assert.ok(post, `${slug}: priority article missing`);
    assert.equal(post.updatedAt, "2026-09-19", `${slug}: editorial review date missing`);

    const body = JSON.stringify(post);
    assert.match(body, /Philippine Time/);
    assert.match(body, /candidate|interview|shortlist|screen/i);
    assert.match(body, /accuracy|backlog|response time|rework|rate|completion/i);
    assert.match(body, /escalat|approval|accountable/i);

    assert.doesNotMatch(body, /approval\.For/);
    assert.doesNotMatch(body, /before hiring before/i);
    assert.doesNotMatch(body, /\bA Amazon Virtual Assistant\b/);
    assert.doesNotMatch(body, /\bA Executive Virtual Assistant\b/);
    assert.doesNotMatch(body, /\bA SEO Virtual Assistant\b/);
    assert.doesNotMatch(body, /with the accountable owner/);

    assert.ok((post.keyTakeaways || []).length >= 4, `${slug}: needs practical takeaways`);
    assert.ok((post.faqs || []).some((faq) => /schedule|time-zone|time zone|Philippines-based/i.test(faq.question + " " + faq.answer)), `${slug}: needs a practical schedule FAQ`);
  }
});


test("priority blogs do not reuse templated section architecture", () => {
  const posts = parseBlogPosts();
  const prioritySlugs = new Set([
    "what-does-an-seo-virtual-assistant-do",
    "how-to-hire-a-seo",
    "seo-cost-philippines",
    "what-does-a-bookkeeping-do",
    "bookkeeping-interview-questions",
    "bookkeeping-tasks",
    "what-does-an-executive-virtual-assistant-do",
    "executive-virtual-assistant-interview-questions",
    "executive-virtual-assistant-tasks",
    "what-is-a-virtual-medical-assistant",
    "medical-virtual-assistant-interview-questions",
    "medical-virtual-assistant-tasks",
    "what-does-a-real-estate-virtual-assistant-do",
    "real-estate-interview-questions",
    "real-estate-cost-philippines",
    "what-does-an-ecommerce-do",
    "ecommerce-tasks",
    "ecommerce-cost-philippines",
    "what-does-an-amazon-virtual-assistant-do",
    "amazon-virtual-assistant-interview-questions",
    "amazon-virtual-assistant-cost-philippines",
    "what-does-a-lead-generation-do",
    "lead-generation-tasks",
    "lead-generation-interview-questions",
    "what-does-a-customer-service-do",
    "customer-service-tasks",
    "customer-service-interview-questions",
    "what-does-a-legal-virtual-assistant-do",
    "best-tools-for-legal-virtual-assistant",
    "legal-virtual-assistant-interview-questions"
  ]);

  const headings = new Map();
  for (const post of posts.filter((item) => prioritySlugs.has(item.slug))) {
    const body = JSON.stringify(post);
    assert.doesNotMatch(body, /Role scoping should/);
    assert.doesNotMatch(body, /Role scoping lens:/);
    assert.doesNotMatch(body, /For this role article,/);
    assert.doesNotMatch(body, /Make the working-hours decision part of the role scope/);
    assert.doesNotMatch(body, /Increase independence after accuracy is proven/);

    for (const section of post.sections || []) {
      const owners = headings.get(section.heading) || [];
      owners.push(post.slug);
      headings.set(section.heading, owners);
    }
  }

  const reused = [...headings.entries()]
    .filter(([, owners]) => new Set(owners).size > 1)
    .map(([heading, owners]) => ({ heading, owners: [...new Set(owners)] }));

  assert.deepEqual(reused, []);
});


test("next 20 commercial authority posts replace factory structure with recruiter evidence", () => {
  const posts = parseBlogPosts();
  const targetSlugs = [
    "appointment-setter-virtual-assistant-cost-philippines",
    "how-to-hire-a-appointment-setter-virtual-assistant",
    "cold-calling-virtual-assistant-cost-philippines",
    "how-to-hire-a-cold-calling-virtual-assistant",
    "construction-virtual-assistant-cost-philippines",
    "how-to-hire-a-construction-virtual-assistant",
    "content-marketing-virtual-assistant-cost-philippines",
    "how-to-hire-a-content-marketing-virtual-assistant",
    "dental-virtual-assistant-cost-philippines",
    "how-to-hire-a-dental-virtual-assistant",
    "financial-advisor-virtual-assistant-cost-philippines",
    "how-to-hire-a-financial-advisor-virtual-assistant",
    "google-ads-virtual-assistant-cost-philippines",
    "how-to-hire-a-google-ads-virtual-assistant",
    "insurance-virtual-assistant-cost-philippines",
    "how-to-hire-a-insurance-virtual-assistant",
    "law-firm-virtual-assistant-cost-philippines",
    "how-to-hire-a-law-firm-virtual-assistant",
    "shopify-virtual-assistant-cost-philippines",
    "how-to-hire-a-shopify-virtual-assistant"
  ];
  const bannedHeadings = new Set([
    "Why rates vary even when the job title is the same",
    "Set the budget from scope, experience, and responsibility",
    "Build the monthly budget from hours and ownership",
    "Where cheap hiring becomes expensive",
    "How to discuss budget with candidates",
    "A practical budget check before you publish",
    "Build a scorecard you can use on every candidate",
    "Source against the work, not the broadest possible title",
    "Screen for evidence before scheduling a long interview",
    "Make the first 30 days a controlled handoff",
    "Do a final role and budget sanity check"
  ]);
  const fieldNoteOwners = new Map();

  for (const slug of targetSlugs) {
    const post = posts.find((item) => item.slug === slug);
    assert.ok(post, `${slug}: authority article missing`);
    assert.equal(post.updatedAt, "2026-09-20", `${slug}: needs current substantive review date`);
    assert.ok((post.fieldNotes || []).length >= 3, `${slug}: needs recruiter field notes`);

    for (const section of post.sections || []) {
      assert.equal(bannedHeadings.has(section.heading), false, `${slug}: factory heading survived: ${section.heading}`);
    }

    const body = JSON.stringify(post);
    assert.match(body, /candidate|screen|interview|shortlist/i, `${slug}: needs hiring evidence`);
    assert.match(body, /Philippine|Philippines/i, `${slug}: needs Philippine hiring context`);
    assert.match(body, /approval|escalat|boundary|decision/i, `${slug}: needs operating boundaries`);

    for (const note of post.fieldNotes || []) {
      const owner = fieldNoteOwners.get(note);
      assert.equal(owner, undefined, `${slug}: field note duplicates ${owner}`);
      fieldNoteOwners.set(note, slug);
    }
  }
});
