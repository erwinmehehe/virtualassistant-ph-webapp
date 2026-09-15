import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("public talent directory behaves like managed recruiting, not a marketplace", () => {
  const directory = source("src/app/find-talent/page.tsx");

  assert.doesNotMatch(directory, /TalentShortlistButton|TalentShortlistBar|Save for recruiter|Saved for recruiter/);
  assert.doesNotMatch(directory, /last_active_at|Active \{/);
  assert.doesNotMatch(directory, /hourly_rate|min_rate|max_rate|Lowest rate/);
  assert.doesNotMatch(directory, /Email verified|Identity verified/);
  assert.doesNotMatch(directory, /Get candidates like this|View profile|requestHref/);
  assert.doesNotMatch(directory, /href=\{`\/va\/\$\{va\.slug\}`\}/);
  assert.match(directory, /Get a vetted shortlist/);
  assert.match(directory, /recruiter confirms current fit and availability/i);
});

test("public talent profile route stays disabled and exposes no internal recruiting signals", () => {
  const profile = source("src/app/va/[slug]/page.tsx");

  assert.match(profile, /notFound\(\)/);
  assert.match(profile, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  assert.doesNotMatch(profile, /TalentShortlistButton|TalentShortlistBar|Save for recruiter|Saved for recruiter/);
  assert.doesNotMatch(profile, /hourly_rate|Preferred rate|last_active_at|match_score|Email verified|Identity verified/);
  assert.doesNotMatch(profile, /Recruiter reviewed|Get a vetted shortlist|confirm current availability/);
});
