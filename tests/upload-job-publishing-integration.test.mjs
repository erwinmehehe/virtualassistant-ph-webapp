import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (p) => readFile(new URL("../" + p, import.meta.url), "utf8");

test("public lead upload scans before public job may be created", async () => {
  const source = await read("src/app/actions/leads.ts");
  assert.match(source, /import \{ quarantineScanAndStoreUpload, validateUpload \} from "@\/lib\/file-security"/);
  assert.match(source, /attachmentUpload = await validateUpload\(attachment, "lead-attachment"\)/);
  assert.match(source, /attachmentPath = await quarantineScanAndStoreUpload\(\{/);
  assert.match(source, /if \(attachmentUpload\) \{/);
  assert.doesNotMatch(source, /storage\.from\("lead-attachments"\)\.upload\(attachmentPath, attachment/);

  const roleAction = source.slice(source.indexOf("export async function submitRoleBriefAction("));
  const scan = roleAction.indexOf("attachmentPath = await quarantineScanAndStoreUpload(");
  const listing = roleAction.indexOf('publicListingConsent: formData.get("public_listing_consent") === "yes"');
  assert.ok(scan >= 0 && listing > scan, "Scanning must precede job creation for public role briefs");
  assert.match(roleAction, /publicListingConsent: formData\.get\("public_listing_consent"\) === "yes" && !parsed\.data\.talent && !parsed\.data\.shortlist/);
  assert.match(source, /publicListingConsent: formData\.get\("public_listing_consent"\) === "yes"/);
});

test("scanner errors fail closed, remove unsaved leads and retain private download checks", async () => {
  const source = await read("src/app/actions/leads.ts");
  assert.match(source, /We could not securely scan and attach that document/);
  assert.match(source, /await admin\.from\("lead_intake"\)\.delete\(\)\.eq\("id", lead\.id\)/);
  assert.match(source, /await admin\.storage\.from\("lead-attachments"\)\.remove\(\[attachmentPath\]\)/);
  const client = await read("src/lib/malware-scan-client.ts");
  const security = await read("src/lib/file-security.ts");
  assert.match(security, /MALWARE_SCAN_ENDPOINT/);
  assert.match(client, /result\?\.clean !== true/);
  assert.match(security, /const required = production \|\| process\.env\.MALWARE_SCAN_REQUIRED === "1"/);
});

test("local Supabase contracts jointly cover employer ownership and upload quarantine", async () => {
  const sql = await read("scripts/verify-e2e-db-contracts.sql");
  assert.match(sql, /\$client_job_access_contract\$/);
  assert.match(sql, /\$upload_quarantine_contract\$/);
  assert.match(sql, /has_table_privilege\('authenticated'/);
  assert.match(sql, /upload-quarantine/);
  assert.match(sql, /10 MB hard limit/);
});
