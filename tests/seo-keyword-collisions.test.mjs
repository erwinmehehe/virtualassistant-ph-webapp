import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * The programmatic pages (76 services, 33 industries, and the current software guides) are
 * cheap to add and easy to point at a term a sibling page already owns. These
 * checks keep one page per query and stop a page targeting a phrase made only
 * of words every page shares.
 */

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function pages(path, prefix) {
  const text = source(path);
  const out = [];
  // Slug and primaryKeyword appear in that order inside each page object.
  const pattern = /"?slug"?:\s*"([^"]+)"[\s\S]{0,600}?"?primaryKeyword"?:\s*"([^"]+)"/g;
  for (const match of text.matchAll(pattern)) out.push({ url: prefix + match[1], keyword: match[2] });
  return out;
}

const ALL = [
  ...pages("src/lib/service-pages.ts", "/service/"),
  ...pages("src/lib/industries.ts", "/industries/"),
  ...pages("src/lib/software-pages.ts", "/software/")
];

// Words that appear across the whole site and so carry no targeting on their own.
const GENERIC = new Set([
  "a", "an", "and", "or", "the", "for", "to", "in", "of", "with", "your", "you", "our", "we",
  // "support" stays out: "IT support" and "customer support" are real terms.
  "hire", "hiring", "virtual", "assistant", "assistants", "va", "vas", "services",
  "service", "filipino", "philippines", "remote", "online", "outsourcing", "outsourced", "it"
]);

test("every programmatic page targets its own primary keyword", () => {
  assert.ok(ALL.length > 120, `expected the full page set, parsed ${ALL.length}`);

  const byKeyword = new Map();
  for (const page of ALL) {
    const keyword = page.keyword.trim().toLowerCase();
    const seen = byKeyword.get(keyword);
    assert.equal(seen, undefined, `${page.url} targets the same keyword as ${seen}: "${keyword}"`);
    byKeyword.set(keyword, page.url);
  }
});

test("no page targets a phrase made only of site-wide words", () => {
  for (const page of ALL) {
    const distinctive = page.keyword
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word && !GENERIC.has(word));
    assert.ok(distinctive.length > 0, `${page.url} has no distinctive word in "${page.keyword}"`);
  }
});
