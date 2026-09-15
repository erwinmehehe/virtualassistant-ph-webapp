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
  assert.match(directory, /Get a vetted shortlist/);
  assert.match(directory, /Get candidates like this/);
  assert.match(directory, /recruiter confirms current fit and availability/i);
});

test("public talent profile keeps internal recruiting signals private", () => {
  const profile = source("src/app/va/[slug]/page.tsx");

  assert.doesNotMatch(profile, /TalentShortlistButton|TalentShortlistBar|Save for recruiter|Saved for recruiter/);
  assert.doesNotMatch(profile, /hourly_rate|Preferred rate/);
  assert.doesNotMatch(profile, /Email verified|Identity verified/);
  assert.match(profile, /Recruiter reviewed/);
  assert.match(profile, /Get a vetted shortlist/);
  assert.match(profile, /confirm current availability and recommend the strongest fits/i);
});
