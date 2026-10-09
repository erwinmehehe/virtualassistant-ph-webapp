import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("VA portfolio preview is authenticated and fails safely when profile data cannot load", () => {
  const page = read("src/app/workspace/va/profile/preview/page.tsx");
  assert.match(page, /requireRole\("va"\)/);
  assert.match(page, /\.eq\("user_id", user\.id\)/);
  assert.match(page, /if \(error \|\| !va\)/);
  assert.match(page, /ReloadPageButton/);
  assert.match(page, /audience="self"/);
  assert.doesNotMatch(page, /createAdminClient|\.select\("\*"\)/);
});

test("portfolio is an original bento layout driven by saved professional data", () => {
  const page = read("src/app/workspace/va/profile/preview/page.tsx");
  const component = read("src/components/va-portfolio-preview.tsx");
  const css = read("src/components/va-portfolio-preview.module.css");
  for (const field of ["headline","bio","skills","tools","industries","languages","years_experience","weekly_hours","portfolio_url"]) {
    assert.match(page, new RegExp(field));
  }
  assert.match(component, /VaPortfolioPreview/);
  assert.match(component, /TrainingCredentials/);
  assert.match(component, /safePortfolioUrl/);
  assert.match(component, /url\.protocol === "https:"/);
  assert.match(component, /rel="noopener noreferrer nofollow"/);
  assert.match(css, /\.rail/);
  assert.match(css, /\.bento/);
  assert.match(css, /@media\(max-width:790px\)/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test("portfolio preview does not remove public profile lockout or leak private recruiting information", () => {
  const publicRoute = read("src/app/va/[slug]/page.tsx");
  const component = read("src/components/va-portfolio-preview.tsx");
  const page = read("src/app/workspace/va/profile/preview/page.tsx");
  assert.match(publicRoute, /redirect\("\/find-talent"\)/);
  assert.doesNotMatch(component, /(?:\b(?:email|phone|hourly_rate|resume_path|identity_verified_at|recruiter_notes|match_score|address)\b)\s*[=:]/);
  assert.doesNotMatch(page, /\b(public_profile_consent|directory_visible|resume_path|hourly_rate)\b/);
  assert.match(component, /Private portfolio preview/);
  assert.match(component, /not live availability confirmation/);
});

test("portfolio credentials are real, not fabricated", () => {
  const page = read("src/app/workspace/va/profile/preview/page.tsx");
  const component = read("src/components/va-portfolio-preview.tsx");
  assert.match(page, /getTrainingCredentialsForUser\(user\.id\)/);
  assert.match(component, /trainingCredentials\.length/);
  assert.match(component, /supporting evidence, not proof of employment/);
  assert.doesNotMatch(component, /guaranteed|top-rated|100% placement/i);
});
