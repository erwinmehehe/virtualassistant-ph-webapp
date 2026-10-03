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
  assert.match(shell, /border-radius:24px/);
  assert.match(shell, /email-team-pill/);
  assert.match(shell, /background:#eef1f6/);
  assert.match(shell, /@media only screen and \(max-width: 640px\)/);
  assert.match(shell, /Hiring, talent, and training for remote work/);
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
  assert.match(notification, /A vetted VA applied/);
  assert.match(notification, /New application/);
  assert.match(notification, /Vetted applicant/);
  assert.match(notification, /Review application/);
  assert.match(notification, /workspace\/client\/jobs/);
  assert.match(notification, /Candidate details remain protected/);
  assert.match(notification, /text:/);
});


test("transactional emails place their heading in the premium dark hero", async () => {
  const email = await read("src/lib/email.ts");
  const start = email.indexOf("export async function sendTransactionalEventEmail");
  const end = email.indexOf("export async function sendStaffDailyDigestEmail", start);
  const transactional = email.slice(start, end);

  assert.match(transactional, /headline: args\.heading/);
  assert.match(email, /linear-gradient\(135deg,#0b1020 0%,#182230 52%,#312e81 100%\)/);
});
