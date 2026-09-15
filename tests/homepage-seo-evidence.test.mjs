import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
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

test("homepage explains Philippines hiring intent high on the page and links to commercial journeys", () => {
  const home = source("src/app/page.tsx");
  assert.match(home, /Why hire a Virtual Assistant in the Philippines\?/);
  for (const href of [
    "/hire",
    "/find-talent",
    "/services",
    "/pricing",
    "/how-vetting-works",
    "/industries",
    "/managed-vs-direct-hire",
  ]) {
    assert.ok(home.includes(`href=\"${href}\"`) || home.includes(`href={BOOKING_URL}`), `missing homepage internal link ${href}`);
  }
});

test("homepage exposes verified operations accountability without inventing recruiter titles", () => {
  const home = source("src/app/page.tsx");
  assert.match(home, /Human recruiting and Client Success, not an anonymous marketplace/);
  assert.match(home, /<strong>Jervis Accad<\/strong>/);
  assert.match(home, /<strong>Bryan Batarina<\/strong>/);
  assert.match(home, /Operations team/);
  assert.doesNotMatch(home, /Jervis Accad[^\n]*Recruiter/);
  assert.doesNotMatch(home, /Bryan Batarina[^\n]*Recruiter/);
});

test("homepage service headings use explicit Virtual Assistant entities", () => {
  const home = source("src/app/page.tsx");
  assert.match(home, /Administrative & Executive Virtual Assistants/);
  assert.match(home, /Customer Service Virtual Assistants/);
  assert.match(home, /Sales & Lead Generation Virtual Assistants/);
  assert.match(home, /Bookkeeping & Finance Virtual Assistants/);
  assert.match(home, /GROUP_DISPLAY_NAMES\[group\]/);
});

test("homepage visible FAQ covers commercial hiring questions without obsolete FAQ rich-result schema", () => {
  const home = source("src/app/page.tsx");
  assert.match(home, /How much does a Virtual Assistant in the Philippines cost\?/);
  assert.match(home, /How do you vet Filipino Virtual Assistants\?/);
  assert.match(home, /Can a Filipino Virtual Assistant work US, UK, or Australian business hours\?/);
  assert.match(home, /What tasks can a Filipino Virtual Assistant handle\?/);
  assert.match(home, /Can I interview candidates before hiring\?/);
  assert.doesNotMatch(home, /FAQPage/);
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

test("homepage comparison is a compact three-card premium choice section", () => {
  const home = source("src/app/page.tsx");
  const css = source("src/app/homepage-seo-evidence.css");
  assert.match(home, /pva-compare-section/);
  assert.match(home, /Choose the hiring model that gives you the right level of control/);
  assert.match(home, /pva-compare-card pva-compare-featured/);
  assert.match(home, /Compare hiring options/);
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0,1fr\)\)/);
  assert.match(css, /linear-gradient\(145deg,#312e81 0%,#4f46e5 58%,#5b21b6 100%\)/);
});
