import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("normal login does not always render confirmation recovery",async()=>{
  const page=await read("src/app/auth/login/page.tsx");
  assert.match(page,/showConfirmationRecovery = params\.confirm === "1"/);
  assert.match(page,/showConfirmationRecovery \? \([\s\S]*auth-confirmation-help/);
  assert.doesNotMatch(page,/<details className="auth-recovery">/);
  assert.doesNotMatch(page,/Didn&apos;t receive your confirmation email\?/);
});

test("unconfirmed login explicitly enables confirmation recovery",async()=>{
  const auth=await read("src/app/actions/auth.ts");
  assert.match(auth,/email_not_confirmed/);
  assert.match(auth,/Confirm your email before logging in\./);
  assert.match(auth,/params\.set\("confirm", "1"\)/);
  assert.match(auth,/message: "Check your email to confirm your account"/);
  assert.match(auth,/confirm: "1"/);
});

test("resend confirmation preserves intended destination instead of forcing VA onboarding",async()=>{
  const action=await read("src/app/actions/resend-confirmation.ts");
  assert.match(action,/if \(args\.next\) params\.set\("next", args\.next\)/);
  assert.match(action,/if \(args\.lead\) params\.set\("lead", args\.lead\)/);
  assert.match(action,/brandedConfirmationUrl\(\{ tokenHash, next, lead \}\)/);
  assert.doesNotMatch(action,/\.auth\.resend\(/);
  assert.doesNotMatch(action,/workspace\/va\/onboarding/);
  assert.match(action,/new URLSearchParams\(\{ confirm: "1" \}\)/);
});
