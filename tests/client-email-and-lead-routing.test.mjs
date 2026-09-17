import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("client follow-up email has one personalized greeting and a human booking CTA", async () => {
  const email = await read("src/lib/email.ts");

  assert.match(email, /function renderHiringEmail/);
  assert.match(email, /function normalizeClientFollowup/);
  assert.match(email, /\^\(\?:hi\|hello\|hey\)/i);
  assert.match(email, /About your .* request/);
  assert.match(email, /Choose a call time/);
  assert.doesNotMatch(email, /html: `<p>Hi,<\/p><p>\$\{escapeHtml\(message\)/);
  assert.match(email, /VirtualAssistant<span style="color:#4f46e5;">\.com\.ph<\/span>/);
});

test("service-page enquiries are forced into the recruiter hiring pipeline", async () => {
  const migration = await read("supabase/migrations/20260917090000_fix_hiring_lead_routing.sql");

  assert.match(migration, /service_match_request/);
  assert.match(migration, /industry_match_request/);
  assert.match(migration, /new\.lead_type := 'client_hiring'/);
  assert.match(migration, /public\.default_recruiter_id\(\)/);
  assert.match(migration, /l\.lead_type='client_hiring'/);
  assert.match(migration, /\/workspace\/recruiter\/leads\?view=all&q=/);
});

test("client follow-up email strips the template's own sign-off instead of doubling it", async () => {
  const email = await read("src/lib/email.ts");
  const communications = await read("src/lib/recruiter-communications.ts");

  // The fix must exist: a trailing "Best,/Regards,/..." block gets stripped from the
  // template body before renderHiringEmail() appends its own sign-off.
  const stripPattern = /\\n\{2,\}\(\?:Best\|Regards\|Thanks\|Thank you\|Cheers\|Sincerely\|Warm regards\|Kind regards\)/i;
  assert.match(email, stripPattern);

  // Extract the regex normalizeClientFollowup() actually runs, so this test breaks
  // if someone edits the pattern without checking it against the real templates.
  const stripMatch = email.match(/message\.replace\((\/\\n\{2,\}[^;]+?\/i), ""\)\.trim\(\);/);
  assert.ok(stripMatch, "expected to find the sign-off-stripping replace() call in normalizeClientFollowup");
  // eslint-disable-next-line no-eval
  const stripRegex = eval(stripMatch[1]);

  // Every real CRM template body must reduce to zero trailing sign-off after stripping,
  // so the wrapper's own "Best,\n<sender>" is the only one left in the final email.
  const bodies = [...communications.matchAll(/body:\s*"((?:[^"\\]|\\.)*)"/g)].map(([, raw]) =>
    JSON.parse(`"${raw}"`).replaceAll("{{first_name}}", "Maria")
  );
  assert.ok(bodies.length >= 6, "expected at least the 6 known recruiter communication templates");

  for (const body of bodies) {
    const greetingStripped = body.replace(/^(?:hi|hello|hey)\s+([^,\n]+),?\s*(?:\r?\n)+/i, "");
    const cleaned = greetingStripped.replace(stripRegex, "").trim();
    assert.doesNotMatch(cleaned, /(?:Best|Regards|Sincerely|Cheers)[,]?\s*$/i, `template still ends with a sign-off after stripping: ${JSON.stringify(cleaned)}`);
    assert.equal((cleaned.match(/Best,/g) || []).length, 0, `expected no leftover "Best," in: ${JSON.stringify(cleaned)}`);
  }
});
