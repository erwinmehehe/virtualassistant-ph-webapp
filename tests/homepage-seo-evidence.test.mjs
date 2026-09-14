import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("homepage uses first-party approved talent data instead of static marketing counts", () => {
  const home = source("src/app/page.tsx");
  assert.match(home, /Live approved talent data/);
  assert.match(home, /years_experience,weekly_hours,primary_category/);
  assert.match(home, /const approvedProfileCount = talentRows\.length/);
  assert.match(home, /const medianExperience = getMedian/);
  assert.match(home, /const tenPlusYears/);
  assert.match(home, /const fullTimeShare/);
  assert.match(home, /not hand-written marketing estimates/);
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
  assert.match(home, /Human recruiting and operations, not an anonymous marketplace/);
  assert.match(home, /<strong>Jervis<\/strong>/);
  assert.match(home, /<strong>Bryan Batarina<\/strong>/);
  assert.match(home, /Operations team/);
  assert.doesNotMatch(home, /Jervis[^\n]*Recruiter/);
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
