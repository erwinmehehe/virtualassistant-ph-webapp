import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

function publicAction(source, name) {
  const start = source.indexOf("export async function " + name + "(");
  assert.ok(start !== -1, "Missing public form action: " + name);
  const next = source.indexOf("export async function ", start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

test("public matching forms never show or load the Cloudflare Turnstile widget", async () => {
  const source = await read("src/components/hiring-brief-form.tsx");
  assert.doesNotMatch(source, /TurnstileWidget|cf-turnstile-response|challenges\.cloudflare\.com/);
  assert.match(source, /<Fields id=\{id\}/);
  assert.match(source, /name="website"/);
  assert.match(source, /Get your free virtual assistant match/);
  assert.match(source, /public_listing_consent/);
});

test("contact and discovery booking avoid the Cloudflare widget but keep honeypots", async () => {
  const [contact, booking] = await Promise.all([
    read("src/app/contact/page.tsx"),
    read("src/components/client-booking-form.tsx"),
  ]);
  for (const source of [contact, booking]) {
    assert.doesNotMatch(source, /TurnstileWidget|cf-turnstile-response|challenges\.cloudflare\.com/);
    assert.match(source, /name="website"/);
  }
  assert.match(contact, /contact-honeypot/);
  assert.match(booking, /submitDiscoveryBookingAction/);
});

test("public submissions do not require an invisible captcha token after widget removal", async () => {
  const source = await read("src/app/actions/leads.ts");
  const actions = [
    ["submitServiceMatchAction", "public_service_match"],
    ["submitIndustryMatchAction", "public_industry_match"],
    ["submitRoleBriefAction", "public_role_brief"],
    ["submitContactAction", "public_contact"],
    ["submitDiscoveryBookingAction", "public_discovery_booking"],
  ];
  for (const [name, rateKey] of actions) {
    const action = publicAction(source, name);
    assert.doesNotMatch(action, /verifyTurnstile|cf-turnstile-response/, name + " must work without a token");
    assert.ok(action.includes('enforceEmailAndIpRateLimit("' + rateKey + '"'), name + " must retain rate limiting");
    assert.match(action, /parsed\.data\.website/, name + " must retain honeypot filtering");
  }
  assert.match(publicAction(source, "submitContactAction"), /shouldSilentlyDropContactSubmission/);
});

test("login, signup, recovery and confirmation still require real server-side Turnstile", async () => {
  const [auth, resend, turnstile] = await Promise.all([
    read("src/app/actions/auth.ts"),
    read("src/app/actions/resend-confirmation.ts"),
    read("src/lib/turnstile.ts"),
  ]);
  for (const action of ["login", "join", "password_reset"]) {
    assert.ok(auth.includes('verifyTurnstile(formData, "' + action + '")'), action + " protection removed");
  }
  assert.match(resend, /verifyTurnstile\(formData, "resend_confirmation"\)/);
  assert.match(turnstile, /challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/);
  assert.match(turnstile, /result\.action !== expectedAction/);
});
