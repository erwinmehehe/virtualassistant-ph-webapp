import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const auth = fs.readFileSync("src/app/actions/auth.ts", "utf8");
const join = fs.readFileSync("src/components/join-account-form.tsx", "utf8");
const bootstrap = fs.readFileSync("src/lib/profile-bootstrap.ts", "utf8");
const quickAction = fs.readFileSync("src/app/actions/va-onboarding.ts", "utf8");
const quickPage = fs.readFileSync("src/app/workspace/va/onboarding/page.tsx", "utf8");
const vaLayout = fs.readFileSync("src/app/workspace/va/layout.tsx", "utf8");
const vaGate = fs.readFileSync("src/components/va-onboarding-gate.tsx", "utf8");
const social = fs.readFileSync("src/lib/social-login.ts", "utf8");
const envExample = fs.readFileSync(".env.example", "utf8");
const categories = fs.readFileSync("src/app/workspace/recruiter/categories/page.tsx", "utf8");
const constants = fs.readFileSync("src/lib/constants.ts", "utf8");
const nav = fs.readFileSync("src/components/app-nav-links.tsx", "utf8");

test("new VA signups land in quick setup instead of a 0% dashboard", () => {
  assert.match(auth, /role === "va" \? "\/workspace\/va\/onboarding"/);
  assert.match(quickPage, /Start with the details recruiters need first/);
  assert.match(nav, /"Quick setup", "\/workspace\/va\/onboarding"/);
});

test("returning zero-completion VAs are recovered into quick setup", () => {
  assert.match(vaLayout, /getVaCompletion\(va, profile\.avatar_url\)\.score === 0/);
  assert.match(vaLayout, /VaOnboardingGate needsQuickSetup=\{needsQuickSetup\}/);
  assert.match(vaGate, /pathname === "\/workspace\/va"/);
  assert.match(vaGate, /router\.replace\("\/workspace\/va\/onboarding"\)/);
});

test("Google and Microsoft signup are enabled independently", () => {
  assert.match(social, /NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED/);
  assert.match(social, /NEXT_PUBLIC_MICROSOFT_LOGIN_ENABLED/);
  assert.match(join, /googleEnabled \? <form action=\{oauthAction\}>/);
  assert.match(join, /microsoftEnabled \? <form action=\{oauthAction\}>/);
  assert.match(join, /name="role" value=\{role\}/);
  assert.match(envExample, /NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=/);
  assert.match(envExample, /NEXT_PUBLIC_MICROSOFT_LOGIN_ENABLED=/);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_SOCIAL_LOGIN_ENABLED=/);
});

test("email signup callback uses the canonical site origin", () => {
  const start = auth.indexOf("export async function joinAction");
  const joinAction = auth.slice(start);
  assert.match(joinAction, /const origin = siteOrigin\(\)/);
  assert.doesNotMatch(joinAction, /NEXT_PUBLIC_APP_URL \|\| "http:\/\/localhost:3000"/);
});

test("profile bootstrap repairs role-specific rows even when the base profile already exists", () => {
  assert.match(bootstrap, /if \(existing\) \{[\s\S]*await ensureRoleRows\(admin, user, role\)/);
  assert.match(bootstrap, /from\("va_profiles"\)\.upsert/);
  assert.match(bootstrap, /from\("va_vetting"\)\.upsert/);
});

test("quick setup records category, headline, experience, availability and rate", () => {
  assert.match(quickAction, /VA_CATEGORIES\.includes/);
  assert.match(quickAction, /primary_category: category/);
  assert.match(quickAction, /headline,/);
  assert.match(quickAction, /years_experience: yearsExperience/);
  assert.match(quickAction, /weekly_hours: weeklyHours/);
  assert.match(quickAction, /hourly_rate: hourlyRate/);
});

test("quick setup preserves existing VA identity and profile state", () => {
  assert.match(quickAction, /from\("va_profiles"\)\.update/);
  assert.match(quickAction, /select\("user_id"\)\.maybeSingle\(\)/);
  assert.doesNotMatch(quickAction, /slug:\s*`va-/);
  assert.doesNotMatch(quickAction, /availability_status:\s*"available"/);
});

test("recruiter dashboard has canonical category labels including SMM", () => {
  assert.match(constants, /"Marketing & Social Media": "SMM \/ Social Media"/);
  assert.match(categories, /VA categories & onboarding health/);
  assert.match(categories, /Verified but still 0%/);
  assert.match(nav, /"VA categories", "\/workspace\/recruiter\/categories"/);
});
