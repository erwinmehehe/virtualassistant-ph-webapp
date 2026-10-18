import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Turnstile explicitly mounts on client navigation and cleans up on unmount", async () => {
  const widget = await read("src/components/turnstile-widget.tsx");
  assert.match(widget, /"use client"/);
  assert.match(widget, /api\.js\?render=explicit/);
  assert.match(widget, /onReady=\{\(\) => setScriptReady\(true\)\}/);
  assert.match(widget, /api\.render\(containerRef\.current/);
  assert.match(widget, /api\.remove\(widgetId\)/);
  assert.doesNotMatch(widget, /className="cf-turnstile"/);
});

test("failed form submissions cannot reuse expired or consumed tokens", async () => {
  const widget = await read("src/components/turnstile-widget.tsx");
  assert.match(widget, /useFormStatus\(\)/);
  assert.match(widget, /submittedRef\.current = true/);
  assert.match(widget, /if \(siteKey\) resetChallenge\(\)/);
  assert.match(widget, /api\.reset\(widgetId\)/);
  assert.match(widget, /"expired-callback"/);
  assert.match(widget, /"error-callback"/);
  assert.match(widget, /"response-field": false/);
  assert.match(widget, /name="cf-turnstile-response" value=\{token\}/);
  assert.match(widget, /Retry security check/);
});

test("failed login challenge retains a safe training destination and does not bypass Siteverify", async () => {
  const [auth, turnstile] = await Promise.all([
    read("src/app/actions/auth.ts"),
    read("src/lib/turnstile.ts"),
  ]);
  const login = auth.slice(auth.indexOf("export async function loginAction"), auth.indexOf("export async function joinAction"));

  assert.match(login, /const next = safePath\(rawNext, ""\)/);
  assert.match(login, /if \(next\) params\.set\("next", next\)/);
  assert.match(login, /z\.string\(\)\.uuid\(\)\.safeParse\(rawLead\)/);
  assert.match(login, /verifyTurnstile\(formData, "login"\)/);
  assert.match(login, /redirect\(loginErrorPath\("Please complete the security check and try again\."\)\)/);

  assert.match(auth, /verifyTurnstile\(formData, "password_reset"\)/);
  assert.match(turnstile, /if \(!secret \|\| !siteKey\)/);
  assert.match(turnstile, /if \(!token \|\| token\.length > 2_048\)/);
  assert.match(turnstile, /result\.action !== expectedAction/);
  assert.match(turnstile, /hostname mismatch/);
  assert.match(turnstile, /missing_or_malformed_token/);
  assert.doesNotMatch(turnstile, /console\.log\(token\)/);
});
