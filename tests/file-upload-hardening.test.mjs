import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("uploaded bytes are content-sniffed and DOCX packages are structurally verified", async()=>{
  const [security,pkg]=await Promise.all([
    read("src/lib/file-security.ts"),
    read("package.json"),
  ]);

  assert.match(pkg,/"jszip": "3\.10\.1"/);
  assert.match(security,/0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1/);
  assert.match(security,/%PDF-/);
  assert.match(security,/0x89, 0x50, 0x4e, 0x47/);
  assert.match(security,/RIFF/);
  assert.match(security,/WEBP/);
  assert.match(security,/\[Content_Types\]\.xml/);
  assert.match(security,/_rels\/\.rels/);
  assert.match(security,/word\/document\.xml/);
  assert.match(security,/vbaProject\\\.bin/);
  assert.match(security,/activeX/);
  assert.match(security,/MAX_DOCX_UNCOMPRESSED_BYTES/);
  assert.match(security,/declaredMime !== expectedMime/);
});

test("stored uploads use randomized paths and quarantine before malware-gated release", async()=>{
  const [security,profile,leads,autofill,env]=await Promise.all([
    read("src/lib/file-security.ts"),
    read("src/app/actions/profile.ts"),
    read("src/app/actions/leads.ts"),
    read("src/app/actions/resume-autofill.ts"),
    read(".env.example"),
  ]);

  assert.match(security,/randomUUID\(\)/);
  assert.match(security,/_quarantine\//);
  assert.match(security,/process\.env\.NODE_ENV === "production"/);
  assert.match(security,/MALWARE_SCAN_ENDPOINT/);
  assert.match(security,/result\?\.clean !== true/);
  assert.ok(security.indexOf("await scanForMalware(args.upload)") < security.indexOf("from(args.targetBucket).upload"));

  for (const source of [profile,leads]) {
    assert.match(source,/quarantineScanAndStoreUpload/);
    assert.match(source,/validateUpload/);
  }
  assert.match(profile,/targetBucket: "resumes"/);
  assert.match(profile,/targetBucket: "avatars"/);
  assert.match(profile,/targetBucket: "company-logos"/);
  assert.match(leads,/targetBucket: "lead-attachments"/);
  assert.match(autofill,/validateUpload\(file, "resume"\)/);

  assert.doesNotMatch(profile,/Date\.now\(\).*safeName/);
  assert.doesNotMatch(leads,/Date\.now\(\).*safeName/);
  assert.match(env,/MALWARE_SCAN_ENDPOINT=/);
  assert.match(env,/must return JSON \{"clean": true\}/);
});

test("private documents are forced through attachment responses instead of signed URL redirects", async()=>{
  const [helper,resume,adminResume,leadAttachment]=await Promise.all([
    read("src/lib/private-storage-download.ts"),
    read("src/app/api/resume/[applicationId]/route.ts"),
    read("src/app/api/admin/va-resume/[vaId]/route.ts"),
    read("src/app/api/recruiter/lead-attachment/[leadId]/route.ts"),
  ]);

  assert.match(helper,/Content-Disposition/);
  assert.match(helper,/attachment;/);
  assert.match(helper,/application\/octet-stream/);
  assert.match(helper,/X-Content-Type-Options/);
  assert.match(helper,/nosniff/);
  assert.match(helper,/private, no-store/);
  assert.match(helper,/Content-Security-Policy/);

  for (const route of [resume,adminResume,leadAttachment]) {
    assert.match(route,/privateStorageDownloadResponse/);
    assert.doesNotMatch(route,/createSignedUrl/);
    assert.doesNotMatch(route,/NextResponse\.redirect/);
  }
});
