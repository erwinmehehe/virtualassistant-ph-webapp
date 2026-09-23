import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const auth = fs.readFileSync("src/app/actions/auth.ts", "utf8");
const resend = fs.readFileSync("src/app/actions/resend-confirmation.ts", "utf8");
const login = fs.readFileSync("src/app/auth/login/page.tsx", "utf8");
const join = fs.readFileSync("src/components/join-account-form.tsx", "utf8");
const bootstrap = fs.readFileSync("src/lib/profile-bootstrap.ts", "utf8");
const quickAction = fs.readFileSync("src/app/actions/va-onboarding.ts", "utf8");
const quickPage = fs.readFileSync("src/app/workspace/va/onboarding/page.tsx", "utf8");
const profilePage = fs.readFileSync("src/app/workspace/va/profile/page.tsx", "utf8");
const vaLayout = fs.readFileSync("src/app/workspace/va/layout.tsx", "utf8");
const vaPage = fs.readFileSync("src/app/workspace/va/page.tsx", "utf8");
const social = fs.readFileSync("src/lib/social-login.ts", "utf8");
const envExample = fs.readFileSync(".env.example", "utf8");
const roles = fs.readFileSync("src/app/workspace/recruiter/roles/page.tsx", "utf8");
const talent = fs.readFileSync("src/app/workspace/recruiter/talent/page.tsx", "utf8");
const categories = fs.readFileSync("src/app/workspace/recruiter/categories/page.tsx", "utf8");
const constants = fs.readFileSync("src/lib/constants.ts", "utf8");
const nav = fs.readFileSync("src/components/app-nav-links.tsx", "utf8");

test("new VA signups land in a focused quick setup instead of the full profile editor", () => {
  assert.match(auth, /role === "va" \? "\/workspace\/va\/onboarding"/);
  assert.match(quickPage, /completeVaQuickSetupAction/);
  assert.match(quickPage, /Start with the details recruiters need first/);
  assert.match(quickPage, /name="primary_category"/);
  assert.match(quickPage, /name="headline"/);
  assert.match(quickPage, /name="years_experience"/);
  assert.match(quickPage, /name="weekly_hours"/);
  assert.match(quickPage, /name="hourly_rate"/);
  assert.doesNotMatch(quickPage, /redirect\("\/workspace\/va\/profile#basics"\)/);
  assert.match(profilePage, /<h1>Your profile<\/h1>/);
  assert.doesNotMatch(nav, /\["Quick setup", "\/workspace\/va\/onboarding"/);
});

test("returning zero-completion VAs are recovered into quick setup without blocking every VA route", () => {
  assert.match(vaPage, /completion\.score===0/);
  assert.match(vaPage, /redirect\("\/workspace\/va\/onboarding"\)/);
  assert.doesNotMatch(vaLayout, /getVaCompletion/);
  assert.doesNotMatch(vaLayout, /va_profiles/);
});

test("Google and Microsoft signup are enabled independently", () => {
  assert.match(social, /NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED/);
  assert.match(social, /NEXT_PUBLIC_MICROSOFT_LOGIN_ENABLED/);
  assert.match(join, /googleEnabled \? <form action=\{oauthAction\}>/);
  assert.match(join, /microsoftEnabled \? <form action=\{oauthAction\}>/);
  assert.match(login, /googleEnabled \? <form action=\{oauthAction\}>/);
  assert.match(login, /microsoftEnabled \? <form action=\{oauthAction\}>/);
  assert.match(join, /name="role" value=\{role\}/);
  assert.match(envExample, /NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=/);
  assert.match(envExample, /NEXT_PUBLIC_MICROSOFT_LOGIN_ENABLED=/);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_SOCIAL_LOGIN_ENABLED=/);
});

test("unconfirmed accounts can request another confirmation without cluttering normal login", () => {
  assert.match(login, /showConfirmationRecovery/);
  assert.match(login, /resendSignupConfirmationAction/);
  assert.match(login, /type="submit">Resend<\/button>/);
  assert.doesNotMatch(login, /Didn&apos;t receive your confirmation email\?/);
  assert.match(resend, /auth\.resend\(\{/);
  assert.match(resend, /type: "signup"/);
  assert.match(resend, /auth_resend_confirmation/);
  assert.match(resend, /callbackParams\.set\("next", next\)/);
  assert.doesNotMatch(resend, /workspace\/va\/onboarding/);
  assert.match(resend, /non-enumerating/);
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

test("recruiter Roles owns canonical category coverage including SMM", () => {
  assert.match(constants, /"Marketing & Social Media": "SMM \/ Social Media"/);
  assert.match(roles, /Talent coverage/);
  assert.match(roles, /vaCategoryLabel/);
  assert.match(categories, /redirect\("\/workspace\/recruiter\/roles#talent-coverage"\)/);
  assert.doesNotMatch(nav, /\["Categories", "\/workspace\/recruiter\/categories"/);
});


test("quick setup returns VAs to a guided dashboard rather than dropping them into the long profile form", () => {
  assert.match(quickAction, /redirect\("\/workspace\/va\?setup=complete"\)/);
  assert.match(vaPage, /searchParams/);
  assert.match(vaPage, /Quick setup saved/);
  assert.match(vaPage, /OnboardingChecklist/);
});

test("recruiter Talent onboarding rescue focuses on recent zero-completion VAs and prioritizes verified accounts", () => {
  assert.match(talent, /recentZeroProfiles/);
  assert.match(talent, /verifiedRecentZero/);
  assert.match(talent, /Number\(b\.email_verified\) - Number\(a\.email_verified\)/);
  assert.match(talent, /Recent 0% profiles · 7 days/);
});


test("quick setup uses the same live minimum hourly rate as the full VA profile", () => {
  assert.match(quickPage, /getBusinessSettings/);
  assert.match(quickPage, /settings\.minHourlyRate/);
  assert.match(quickAction, /getBusinessSettings/);
  assert.match(quickAction, /settings\.minHourlyRate/);
  assert.doesNotMatch(quickAction, /MIN_HOURLY_RATE/);
});
