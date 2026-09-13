import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("public marketing shell loads the shared CRO design system", () => {
  const layout = source("src/app/layout.tsx");
  const header = source("src/components/site-header.tsx");
  const nav = source("src/components/site-nav.tsx");
  const footer = source("src/components/site-footer.tsx");

  assert.match(layout, /import "\.\/va-design\.css"/);
  assert.match(header, /<SiteNav\s*\/>/);
  assert.match(nav, /href="\/book-client-call"/);
  assert.match(footer, /href="\/book-client-call"/);
});

test("high-value public heroes keep their H1 copy and carry a conversion form", () => {
  const checks = [
    ["src/app/services/page.tsx", "Find the Virtual Assistant role that matches", "RoleBriefForm"],
    ["src/app/industries/page.tsx", "Hire a virtual assistant who already understands your type of business.", "RoleBriefForm"],
    ["src/app/software/page.tsx", "Hire a virtual assistant who already knows your software.", "RoleBriefForm"],
    ["src/app/blog/page.tsx", "Build a better remote team, one clear workflow at a time.", "RoleBriefForm"],
    ["src/app/pricing/page.tsx", "See the Virtual Assistant cost first. Know how the service fee is added.", "RoleBriefForm"],
    ["src/app/faq/page.tsx", "Questions before you hire or apply.", "RoleBriefForm"],
    ["src/app/about/page.tsx", "A recruiting team for businesses hiring Filipino Virtual Assistants.", "RoleBriefForm"],
    ["src/app/how-vetting-works/page.tsx", "“Vetted” should mean more than a profile badge.", "RoleBriefForm"],
    ["src/app/managed-vs-direct-hire/page.tsx", "Managed Virtual Assistant vs. Direct Hire", "RoleBriefForm"],
    ["src/app/tools/page.tsx", "Plan the role before you post it.", "RoleBriefForm"],
    ["src/app/contact/page.tsx", "What can we help with?", "submitContactAction"]
  ];

  for (const [path, h1Text, formSignal] of checks) {
    const file = source(path);
    assert.ok(file.includes(h1Text), `${path} must preserve its existing H1 text`);
    assert.ok(file.includes(formSignal), `${path} must keep a working hero conversion form`);
  }
});

test("template-driven detail pages keep real forms in the hero", () => {
  const home = source("src/app/page.tsx");
  const service = source("src/app/service/[slug]/page.tsx");
  const industry = source("src/app/industries/[slug]/page.tsx");
  const software = source("src/app/software/[slug]/page.tsx");
  const article = source("src/components/blog-article.tsx");

  assert.match(home, /pva-hero-form-shell/);
  assert.match(home, /<RoleBriefForm/);
  assert.match(service, /<ServiceMatchForm/);
  assert.match(industry, /<IndustryMatchForm/);
  assert.match(software, /<ServiceMatchForm/);
  assert.match(article, /blog-hero-aside/);
  assert.match(article, /<RoleBriefForm|<ServiceMatchForm/);
});
