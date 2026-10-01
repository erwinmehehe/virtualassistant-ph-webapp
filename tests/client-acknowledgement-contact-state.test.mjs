import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("automatic acknowledgement is tracked separately from recruiter first contact", async () => {
  const [migration, email] = await Promise.all([
    read("supabase/migrations/20261001210500_client_acknowledgement_state.sql"),
    read("src/lib/email.ts"),
  ]);

  assert.match(migration, /add column if not exists acknowledgement_sent_at timestamptz/);
  assert.match(migration, /lead-acknowledgement-/);
  assert.match(migration, /Does not count as recruiter first_contact_at/);
  assert.match(email, /acknowledgement_sent_at: new Date\(\)\.toISOString\(\)/);
  assert.match(email, /\.is\("acknowledgement_sent_at", null\)/);
});

test("recruiter CRM makes acknowledged-but-uncontacted leads explicit", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/recruiter/crm/page.tsx"),
    read("src/app/workspace/recruiter/crm/crm.module.css"),
  ]);

  assert.match(page, /acknowledgement_sent_at: string \| null/);
  assert.match(page, /acknowledgement_sent_at,first_contact_at/);
  assert.match(page, /Acknowledged · recruiter contact due/);
  assert.match(page, /lead\.acknowledgement_sent_at && !lead\.first_contact_at/);
  assert.match(css, /\.acknowledgedBadge/);
});

test("Recruiter Today calls first-contact work recruiter contact, not acknowledgement", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  assert.match(page, /case "first_contact": return "Recruiter contact due"/);
  assert.match(page, /automatic acknowledgement confirms receipt only/);
  assert.doesNotMatch(page, /case "first_contact": return "Make first contact"/);
});
