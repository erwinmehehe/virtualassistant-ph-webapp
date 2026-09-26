import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("new account confirmation uses Supabase generateLink plus branded Resend", async () => {
  const auth = await read("src/app/actions/auth.ts");
  const email = await read("src/lib/email.ts");

  assert.match(auth, /admin\.auth\.admin\.generateLink\(\{[\s\S]*type: "signup"/);
  assert.match(auth, /sendAccountConfirmationEmail\(\{[\s\S]*to: parsed\.data\.email,[\s\S]*actionUrl: confirmationUrl,[\s\S]*idempotencyKey: `account-confirmation-\$\{data\.user\.id\}`/);
  assert.match(auth, /tokenFromGeneratedActionLink\(data\.properties\?\.action_link\)/);
  assert.match(auth, /auth\/confirm\?\$\{params\.toString\(\)\}/);
  assert.doesNotMatch(auth, /supabase\.auth\.signUp\(/);
  assert.doesNotMatch(auth, /\.auth\.resend\(/);
  assert.match(auth, /confirmation_send_failed/);

  assert.match(email, /export async function sendAccountConfirmationEmail/);
  assert.match(email, /"account_confirmation", \{ archive: false, priority: "critical", idempotencyKey: args\.idempotencyKey \}/);
  assert.match(email, /Confirm your VirtualAssistant\.com\.ph account/);
});

test("password recovery uses branded Resend and keeps a Supabase fallback", async () => {
  const auth = await read("src/app/actions/auth.ts");
  const email = await read("src/lib/email.ts");

  assert.match(auth, /admin\.auth\.admin\.generateLink\(\{[\s\S]*type: "recovery"/);
  assert.match(auth, /sendPasswordRecoveryEmail\(\{[\s\S]*to: email,[\s\S]*actionUrl: recoveryUrl,[\s\S]*idempotencyKey: `password-recovery-\$\{recoverySubject\}-\$\{recoveryWindow\}`/);
  assert.match(auth, /fallbackSupabase\.auth\.resetPasswordForEmail/);

  assert.match(email, /export async function sendPasswordRecoveryEmail/);
  assert.match(email, /"password_recovery", \{ archive: false, priority: "critical", idempotencyKey: args\.idempotencyKey \}/);
  assert.match(email, /Reset your VirtualAssistant\.com\.ph password/);
});

test("app-domain auth confirm route verifies one-time Supabase token hashes", async () => {
  const route = await read("src/app/auth/confirm/route.ts");

  assert.match(route, /ALLOWED_TYPES = new Set<EmailOtpType>\(\["signup", "recovery", "magiclink"\]\)/);
  assert.match(route, /supabase\.auth\.verifyOtp\(\{ token_hash: tokenHash, type \}\)/);
  assert.match(route, /type === "recovery"/);
  assert.match(route, /getOrBootstrapProfile\(user\)/);
  assert.match(route, /email_verified: true/);
  assert.match(route, /claimClientHiringRequests/);
});

test("custom auth email shell does not send team or archive copies", async () => {
  const email = await read("src/lib/email.ts");
  const confirmationStart = email.indexOf("export async function sendAccountConfirmationEmail");
  const recoveryEnd = email.indexOf("export async function sendSystemTestEmail", confirmationStart);
  const authEmailSection = email.slice(confirmationStart, recoveryEnd);

  assert.match(authEmailSection, /archive: false, priority: "critical"/);
  assert.doesNotMatch(authEmailSection, /bcc:/);
  assert.doesNotMatch(authEmailSection, /replyTo:/);
});

test("confirmation resend uses branded magic link only for an existing unconfirmed user", async () => {
  const action = await read("src/app/actions/resend-confirmation.ts");

  assert.match(action, /admin\.auth\.admin\.listUsers\(\{ page, perPage \}\)/);
  assert.match(action, /return user\.email_confirmed_at \? null : user/);
  assert.match(action, /type: "magiclink"/);
  assert.match(action, /sendAccountConfirmationEmail\(\{ to: email, actionUrl \}\)/);
  assert.match(action, /type: "magiclink"/);
  assert.match(action, /unconfirmedUser && !brandedSent/);
  assert.doesNotMatch(action, /createClient/);
  assert.doesNotMatch(action, /\.auth\.resend\(/);
  assert.doesNotMatch(action, /shouldCreateUser/);
});

