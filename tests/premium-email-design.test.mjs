import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared outbound email shell uses the premium responsive design system", async () => {
  const email = await read("src/lib/email.ts");
  const start = email.indexOf("function renderBrandedEmail");
  const end = email.indexOf("function renderHiringEmail", start);
  const shell = email.slice(start, end);

  assert.match(shell, /max-width:640px/);
  assert.match(shell, /border-radius:22px/);
  assert.match(shell, /email-team-pill/);
  assert.match(shell, /background:#f3f5fa/);
  assert.match(shell, /@media only screen and \(max-width: 640px\)/);
  assert.match(shell, /Filipino Virtual Assistant hiring, training, and talent/);
  assert.match(shell, /&nbsp;→/);
});

test("account security emails reuse the shared branded shell", async () => {
  const email = await read("src/lib/email.ts");
  const start = email.indexOf("function renderAuthActionEmail");
  const end = email.indexOf("export async function sendAccountConfirmationEmail", start);
  const auth = email.slice(start, end);

  assert.match(auth, /return renderBrandedEmail/);
  assert.match(auth, /teamLabel: "Account security"/);
  assert.match(auth, /showGreeting: false/);
  assert.match(auth, /one-time security link/);
});

test("client application notification uses the branded hiring email", async () => {
  const email = await read("src/lib/email.ts");
  const start = email.indexOf("export async function sendApplicationEmail");
  const end = email.indexOf("export async function sendLeadNotificationEmail", start);
  const notification = email.slice(start, end);

  assert.match(notification, /renderHiringEmail/);
  assert.match(notification, /Review application/);
  assert.match(notification, /workspace\/client/);
});
