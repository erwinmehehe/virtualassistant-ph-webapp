import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("training auth uses the compact premium training surface", async () => {
  const [login, form, css] = await Promise.all([
    read("src/app/auth/login/page.tsx"),
    read("src/components/training-join-form.tsx"),
    read("src/app/auth/auth-refresh.css"),
  ]);

  assert.match(login, /training-auth-card/);
  assert.match(login, /Free courses/);
  assert.match(login, /Saved progress/);
  assert.match(login, /Certificates/);
  assert.match(form, /training-auth-card/);
  assert.match(css, /\.training-auth-page \.training-auth-card/);
  assert.match(css, /place-items: start center/);
  assert.match(css, /width: min\(560px, 100%\)/);
});

test("training Google OAuth keeps the learner destination", async () => {
  const [login, form, callback] = await Promise.all([
    read("src/app/auth/login/page.tsx"),
    read("src/components/training-join-form.tsx"),
    read("src/app/auth/callback/route.ts"),
  ]);

  assert.match(login, /name="provider" value="google"/);
  assert.match(login, /name="next" value=\{next\}/);
  assert.match(form, /name="provider" value="google"/);
  assert.match(form, /name="next" value=\{destination\}/);
  assert.match(callback, /trainingDestination = isTrainingPath\(requestedNext\)/);
  assert.match(callback, /account_type: "training"/);
  assert.match(callback, /if \(user && trainingDestination\)/);
});
