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

  assert.match(auth, /password: z\.string\(\)\.min\(12\)/);
  assert.match(auth, /password\.length < 12/);
  assert.match(join, /minLength=\{12\}/);
  assert.match(join, /At least 12 characters\./);
  assert.match(updatePage, /minLength=\{12\}/);
});

test("Supabase auth ops config uses branded Resend auth mail and the same password minimum", async () => {
  const script = await read("scripts/configure-supabase-smtp.mjs");

  assert.match(script, /smtp_host: "smtp\.resend\.com"/);
  assert.match(script, /password_min_length: 12/);
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
