import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function homepageSource() {
  return `${source("src/app/page.tsx")}\n${source("src/components/homepage-sections.tsx")}`;
}

test("homepage does not render the removed live talent statistics block or its extra query", () => {
  const home = source("src/app/page.tsx");
  assert.doesNotMatch(home, /Live approved talent data/);
  assert.doesNotMatch(home, /approvedProfileCount/);
  assert.doesNotMatch(home, /medianExperience/);
  assert.doesNotMatch(home, /tenPlusYears/);
  assert.doesNotMatch(home, /fullTimeShare/);
  assert.doesNotMatch(home, /insightRows/);
  assert.doesNotMatch(home, /select\("years_experience,weekly_hours,primary_category"\)/);
});

test("homepage explains Philippines hiring intent and links to core commercial journeys", () => {
  const home = homepageSource();
  assert.match(home, /Why Hire a Virtual Assistant/);
  assert.match(home, /global hub for experienced virtual assistants/);
  for (const href of [
    "/hire",
    "/find-talent",
    "/services",
    "/pricing",
    "/how-vetting-works",
    "/industries",
  ]) {
    assert.ok(home.includes(`href=\"${href}\"`) || home.includes(`href={BOOKING_URL}`), `missing homepage internal link ${href}`);
  }
});

test("homepage exposes named operations accountability without inventing recruiter titles", () => {
  const home = homepageSource();
  assert.match(home, /<strong>Jervis Accad<\/strong>/);
  assert.match(home, /<strong>Bryan Batarina<\/strong>/);
  assert.match(home, /Client Success Manager/);
  assert.match(home, /Operations team/);
  assert.match(home, /Human review before client presentation/);
  assert.doesNotMatch(home, /Jervis Accad[^\n]*Recruiter/);
  assert.doesNotMatch(home, /Bryan Batarina[^\n]*Recruiter/);
});

test("homepage service section uses explicit Virtual Assistant service entities", () => {
  const home = homepageSource();
  assert.match(home, /Virtual Assistant Services in the Philippines/);
  assert.match(home, /Executive Assistance/);
  assert.match(home, /Customer Support/);
  assert.match(home, /Bookkeeping & Accounting/);
  assert.match(home, /Lead Generation/);
  assert.match(home, /Social Media Management/);
});

test("homepage visible FAQ covers commercial hiring questions and emits matching FAQ schema", () => {
  const home = source("src/app/page.tsx");
  assert.match(home, /What does it cost to get started\?/);
  assert.match(home, /How fast can my virtual assistant start\?/);
  assert.match(home, /What if my virtual assistant is not the right fit\?/);
  assert.match(home, /What hours do Filipino virtual assistants work\?/);
  assert.match(home, /How do you screen and vet candidates\?/);
  assert.match(home, /\"@type\": \"FAQPage\"/);
  assert.match(home, /mainEntity: faqs\.map/);
});

test("homepage Organization schema carries useful entity context and removes obsolete search action markup", () => {
  const home = source("src/app/page.tsx");
  assert.match(home, /\"@type\": \"Organization\"/);
  assert.match(home, /areaServed/);
  assert.match(home, /knowsAbout/);
  assert.match(home, /contactPoint/);
  assert.match(home, /availableLanguage/);
  assert.match(home, /member:/);
  assert.doesNotMatch(home, /SearchAction/);
});

test("homepage comparison presents marketplace, direct hire, and recruiter-supported options", () => {
  const home = homepageSource();
  const css = source("src/app/homepage-sections.css");
  assert.match(home, /Hiring a .*Filipino.* Virtual Assistant: Agency vs Marketplace vs Direct Hire/s);
  assert.match(home, /Marketplace/);
  assert.match(home, /Direct hire/);
  assert.match(home, /Managed \/ Recruiter-Supported/);
  assert.match(home, /We make hiring simpler and safer\./);
  assert.match(css, /\.hs-models/);
  assert.match(css, /\.hs-managed/);
});