import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("email/password auth requires at least 12 characters", async () => {
  const [auth, join, updatePage] = await Promise.all([
    read("src/app/actions/auth.ts"),
    read("src/components/join-account-form.tsx"),
    read("src/app/auth/update-password/page.tsx"),
  ]);

  assert.match(auth, /const loginSchema = z\.object\(\{[\s\S]*password: z\.string\(\)\.min\(8\)/);
  assert.match(auth, /const newPasswordSchema = z\.string\(\)[\s\S]*\.min\(12\)[\s\S]*\.regex\(\/\[a-z\]\/[\s\S]*\.regex\(\/\[A-Z\]\/[\s\S]*\.regex\(\/\[0-9\]\/[\s\S]*\.regex\(\/\[\^A-Za-z0-9\]\//);
  assert.match(auth, /COMMON_PASSWORD_PARTS/);
  assert.match(auth, /password: newPasswordSchema/);
  assert.match(auth, /!newPasswordSchema\.safeParse\(password\)\.success/);
  assert.match(join, /minLength=\{12\}/);
  assert.match(join, /uppercase, lowercase, a number, and a symbol/);
  assert.match(updatePage, /minLength=\{12\}/);
  assert.match(updatePage, /uppercase, lowercase, a number, and a symbol/);
});

test("Supabase auth ops config uses branded Resend auth mail without changing existing login password policy", async () => {
  const script = await read("scripts/configure-supabase-smtp.mjs");

  assert.match(script, /smtp_host: "smtp\.resend\.com"/);
  assert.match(script, /mailer_otp_exp: 3600/);
  assert.match(script, /mailer_subjects_confirmation: "Confirm your VirtualAssistant\.com\.ph account"/);
  assert.match(script, /mailer_subjects_recovery: "Reset your VirtualAssistant\.com\.ph password"/);
  assert.match(script, /mailer_templates_confirmation_content: confirmationTemplate/);
  assert.match(script, /mailer_templates_recovery_content: recoveryTemplate/);
  assert.match(script, /href="{{ \.ConfirmationURL }}"/);
});

test("role changes away from active recruiter reassign open client leads", async () => {
  const migration = await read("supabase/migrations/20260919084500_reassign_leads_when_recruiter_role_changes.sql");

  assert.match(migration, /after update of role, account_status on public\.profiles/);
  assert.match(migration, /new\.role is distinct from 'recruiter'/);
  assert.match(migration, /new\.account_status is distinct from 'active'/);
  assert.match(migration, /lead_type = 'client_hiring'/);
  assert.match(migration, /public\.default_recruiter_id\(\)/);
});


test("VA signup gives browser-level strong-password validation and disables duplicate submits", async () => {
  const [auth, join, submit] = await Promise.all([
    read("src/app/actions/auth.ts"),
    read("src/components/join-account-form.tsx"),
    read("src/components/join-submit-button.tsx"),
  ]);

  assert.match(join, /pattern=/);
  assert.match(join, /title="Use 12\+ characters with uppercase, lowercase, a number, and a symbol\."/);
  assert.match(join, /JoinSubmitButton/);
  assert.match(submit, /useFormStatus/);
  assert.match(submit, /disabled=\{pending\}/);
  assert.match(submit, /Creating account/);
  assert.match(auth, /password.*12\+ characters with uppercase, lowercase, a number, and a symbol/i);
  assert.match(auth, /\[auth_join\] validation_failed/);
  assert.match(auth, /\[auth_join\] generate_link_failed/);
});


test("Google OAuth supports login and role-aware first-time signup", async () => {
  const [login, join, callback, auth, chooseRole] = await Promise.all([
    read("src/app/auth/login/page.tsx"),
    read("src/components/join-account-form.tsx"),
    read("src/app/auth/callback/route.ts"),
    read("src/app/actions/auth.ts"),
    read("src/app/auth/choose-role/page.tsx"),
  ]);

  assert.match(login, /Continue with Google/);
  assert.doesNotMatch(login, /Continue with Google as Client/);
  assert.match(join, /name="role" value=\{role\}/);
  assert.match(join, /Continue with Google/);
  assert.match(callback, /\/auth\/choose-role/);
  assert.match(auth, /chooseOAuthRoleAction/);
  assert.match(auth, /socialProviderEnabled\(parsed\.data\.provider\)/);
  assert.match(chooseRole, /I&apos;m hiring a VA/);
  assert.match(chooseRole, /I&apos;m a Virtual Assistant/);
});
