import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("login and registration share the premium auth shell",async()=>{
  const [login,join,shell,css,layout]=await Promise.all([
    read("src/app/auth/login/page.tsx"),
    read("src/components/join-account-form.tsx"),
    read("src/components/auth-experience-shell.tsx"),
    read("src/app/auth/auth-refresh.css"),
    read("src/app/auth/layout.tsx"),
  ]);

  assert.match(login,/AuthExperienceShell variant="login"/);
  assert.match(join,/AuthExperienceShell variant=\{role\}/);
  assert.match(join,/auth-role-switch/);
  assert.match(login,/auth-provider-btn/);
  assert.match(join,/auth-provider-note/);
  assert.match(shell,/One account\. The right workspace\./);
  assert.match(shell,/Build one profile recruiters can actually use\./);
  assert.match(css,/\.auth-experience \{/);
  assert.match(css,/grid-template-columns: minmax\(0, \.95fr\) minmax\(430px, \.72fr\)/);
  assert.match(css,/@media \(max-width: 600px\)/);
  assert.match(layout,/import "\.\/auth-refresh\.css"/);
});

test("failed confirmation delivery does not leave a new unconfirmed workspace behind",async()=>{
  const auth=await read("src/app/actions/auth.ts");
  const joinStart=auth.indexOf("export async function joinAction");
  const joinEnd=auth.indexOf("export async function chooseOAuthRoleAction",joinStart);
  const join=auth.slice(joinStart,joinEnd);

  assert.match(join,/sendAccountConfirmationEmail/);
  assert.match(join,/if \(!brandedConfirmationSent\)/);
  assert.match(join,/await admin\.auth\.admin\.deleteUser\(data\.user\.id\)/);
  assert.match(join,/your account was not activated\. Continue with Google or try email signup again later/);
  assert.doesNotMatch(join,/getOrBootstrapProfile\(data\.user\)/);
  assert.doesNotMatch(join,/auth\.resend/);
  assert.match(join,/recordProductEvent\("account_created"/);
});

test("Google remains the primary low-friction auth option while email stays available",async()=>{
  const [login,join]=await Promise.all([
    read("src/app/auth/login/page.tsx"),
    read("src/components/join-account-form.tsx"),
  ]);

  for(const source of [login,join]){
    const google=source.indexOf("Continue with Google");
    const emailForm=source.indexOf('name="email"');
    assert.ok(google>=0);
    assert.ok(emailForm>=0);
    assert.ok(google<emailForm);
  }
  assert.match(login,/or use email/);
  assert.match(join,/or create with email/);
});
