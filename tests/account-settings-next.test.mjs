import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const readOrEmpty = async (path) => { try { return await read(path); } catch { return ""; } };

test("Account Center uses a verified email-change flow instead of direct editing", async () => {
  const [page, actions, confirmRoute, email] = await Promise.all([
    read("src/app/workspace/account/page.tsx"),
    read("src/app/actions/account-security.ts"),
    read("src/app/auth/change-email/confirm/route.ts"),
    read("src/lib/email.ts"),
  ]);

  assert.match(page, /Change email securely/);
  assert.match(page, /action=\{requestAccountEmailChangeAction\}/);
  assert.match(page, /name="new_email"/);
  assert.match(page, /current email stays active until you confirm/i);
  assert.match(actions, /randomBytes\(32\)/);
  assert.match(actions, /createHash\("sha256"\)/);
  assert.match(actions, /account_email_change_requests/);
  assert.match(actions, /sendEmailChangeVerificationEmail/);
  assert.doesNotMatch(actions, /auth\.updateUser\(\{\s*email/);
  assert.match(confirmRoute, /tokenHash/);
  assert.match(confirmRoute, /updateUserById\(changeRequest\.user_id/);
  assert.match(confirmRoute, /email_confirm: true/);
  assert.match(email, /Verify your new VirtualAssistant\.com\.ph email/);
});

test("notification preferences are distinct from role-specific profile data and security stays mandatory", async () => {
  const [page, actions, prefs, migration] = await Promise.all([
    read("src/app/workspace/account/page.tsx"),
    read("src/app/actions/account-security.ts"),
    read("src/lib/account-preferences.ts"),
    read("supabase/migrations/20260921105035_account_email_change_and_notification_preferences.sql"),
  ]);

  assert.match(page, /tab: "notifications"/);
  assert.match(page, /Hiring & recruiter updates/);
  assert.match(page, /Booking reminders/);
  assert.match(page, /Candidate activity/);
  assert.match(page, /Product emails/);
  assert.match(page, /Security alerts/);
  assert.match(page, /Always on/);
  assert.match(actions, /security_alerts: true/);
  assert.match(prefs, /security_alerts: true/);
  assert.match(migration, /check \(security_alerts = true\)/);
  assert.match(migration, /users update own notification preferences/);
  assert.match(migration, /with check \(\(select auth\.uid\(\)\) = user_id and security_alerts = true\)/);
  assert.doesNotMatch(page, /name="hourly_rate"|name="skills"|name="hiring_notes"/);
});

test("new sign-ins are recorded with recognition metadata without consuming email quota", async () => {
  const [security, auth, callback, email] = await Promise.all([
    read("src/lib/account-security.ts"),
    read("src/app/actions/auth.ts"),
    read("src/app/auth/callback/route.ts"),
    read("src/lib/email.ts"),
  ]);

  assert.match(security, /90 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(security, /device_key/);
  assert.match(security, /recognized/);
  assert.match(security, /baseline/);
  assert.doesNotMatch(security, /sendNewLoginSecurityEmail|shouldAlert/);
  assert.match(auth, /recordSuccessfulLoginAndMaybeAlert/);
  assert.match(callback, /recordSuccessfulLoginAndMaybeAlert/);
  assert.doesNotMatch(email, /New sign-in to your VirtualAssistant\.com\.ph account/);
});

test("optional email categories honor saved notification preferences", async () => {
  const [email, migration] = await Promise.all([
    read("src/lib/email.ts"),
    read("supabase/migrations/20260921105035_account_email_change_and_notification_preferences.sql"),
  ]);

  assert.match(email, /notificationPreferenceField/);
  assert.match(email, /discovery_reminder_/);
  assert.match(email, /candidate_activity/);
  assert.match(email, /notification_preference_disabled/);
  assert.match(email, /field !== "product_emails"/);
  assert.match(email, /get_account_notification_preferences_by_email/);
  assert.match(migration, /revoke all on function public\.get_account_notification_preferences_by_email\(text\) from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.get_account_notification_preferences_by_email\(text\) to service_role/);
});


test("account display preferences and deletion requests are owner-scoped", async () => {
  const [migration, preferences] = await Promise.all([
    readOrEmpty("supabase/migrations/20260921190000_account_display_preferences_and_deletion_requests.sql"),
    readOrEmpty("src/lib/account-display-preferences.ts"),
  ]);

  assert.match(migration, /create table if not exists public\.account_display_preferences/);
  assert.match(migration, /create table if not exists public\.account_deletion_requests/);
  assert.match(migration, /alter table public\.account_display_preferences enable row level security/);
  assert.match(migration, /alter table public\.account_deletion_requests enable row level security/);
  assert.match(migration, /\(select auth\.uid\(\)\) = user_id/);
  assert.match(preferences, /DEFAULT_ACCOUNT_DISPLAY_PREFERENCES/);
  assert.match(preferences, /getAccountDisplayPreferences/);
  assert.match(preferences, /getPendingAccountDeletionRequest/);
});


test("login security captures coarse Vercel location and richer device metadata", async () => {
  const [device, security, auth, callback, email] = await Promise.all([
    readOrEmpty("src/lib/account-device.ts"),
    read("src/lib/account-security.ts"),
    read("src/app/actions/auth.ts"),
    read("src/app/auth/callback/route.ts"),
    read("src/lib/email.ts"),
  ]);

  assert.match(device, /Windows PC/);
  assert.match(device, /Mac/);
  assert.match(device, /iPhone/);
  assert.match(device, /iPad/);
  assert.match(device, /Android device/);
  assert.match(device, /Linux device/);
  assert.match(security, /x-vercel-ip-city/);
  assert.match(security, /x-vercel-ip-country-region/);
  assert.match(security, /x-vercel-ip-country/);
  assert.doesNotMatch(security, /x-vercel-ip-latitude|x-vercel-ip-longitude/);
  assert.match(security, /device:/);
  assert.match(security, /city:/);
  assert.match(security, /region:/);
  assert.match(security, /country:/);
  assert.match(security, /sign_in_method:/);
  assert.match(security, /const shouldAlert = loginHistory\.length > 0 && !recognized/);
  assert.match(auth, /signInMethod:\s*"Email & password"/);
  assert.match(callback, /signInMethod:/);
  assert.match(email, /device\?: string \| null/);
  assert.match(email, /location\?: string \| null/);
});


test("account display preference and privacy actions stay authenticated and user-scoped", async () => {
  const [actions, exportRoute] = await Promise.all([
    read("src/app/actions/account-security.ts"),
    readOrEmpty("src/app/workspace/account/export/route.ts"),
  ]);

  assert.match(actions, /updateAccountDisplayPreferencesAction/);
  assert.match(actions, /Intl\.DateTimeFormat/);
  assert.match(actions, /date_format/);
  assert.match(actions, /time_format/);
  assert.match(actions, /user_id:\s*user\.id/);
  assert.match(actions, /requestAccountDeletionAction/);
  assert.match(actions, /DELETE MY ACCOUNT/);
  assert.doesNotMatch(actions, /deleteUser\(/);

  assert.match(exportRoute, /auth\.getUser\(\)/);
  assert.match(exportRoute, /\.eq\("id", user\.id\)/);
  assert.match(exportRoute, /\.eq\("user_id", user\.id\)/);
  assert.match(exportRoute, /Content-Disposition/);
  assert.match(exportRoute, /virtualassistant-account-data\.json/);
  assert.doesNotMatch(exportRoute, /searchParams|get\("user_id"\)|target_user/i);
});


test("Account Center uses the complete five-section settings architecture", async () => {
  const [page, css, sessions] = await Promise.all([
    read("src/app/workspace/account/page.tsx"),
    read("src/app/workspace/account-center.css"),
    read("src/components/account-security/session-list.tsx"),
  ]);

  assert.match(page, /label: "Profile"/);
  assert.match(page, /label: "Sign-in & security"/);
  assert.match(page, /label: "Notifications"/);
  assert.match(page, /label: "Preferences"/);
  assert.match(page, /label: "Privacy & account"/);
  assert.match(page, /tab: "profile"/);
  assert.match(page, /tab: "preferences"/);
  assert.match(page, /tab: "privacy"/);
  assert.match(page, /params\.tab === "account"/);
  assert.doesNotMatch(page, /account-identity-hero/);
  assert.doesNotMatch(page, /account-tabs/);
  assert.doesNotMatch(page, /account-overview-card/);
  assert.doesNotMatch(page, /account-security-promo/);
  assert.doesNotMatch(page, /account-readonly-field/);
  assert.match(page, /action=\{updateAccountDisplayPreferencesAction\}/);
  assert.match(page, /Download account data/);
  assert.ok(page.includes('href="/workspace/account/export"'));
  assert.match(page, /action=\{requestAccountDeletionAction\}/);
  assert.match(page, /DELETE MY ACCOUNT/);
  assert.doesNotMatch(page, /deleteUser\(/);
  assert.match(page, /Where you're logged in/);
  assert.match(page, /approximate/i);
  assert.match(sessions, /Location unavailable/);
  assert.match(sessions, /signInMethod/);
  assert.match(css, /account-settings-nav/);
  assert.match(css, /overflow-x:\s*auto/);
});
