import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("private document response forces download and disallows sniffing/caching/inline execution", async () => {
  const helper = await read("src/lib/private-storage-download.ts");
  for (const expected of [
    /Content-Disposition/, /attachment;/, /filename\*=UTF-8/, /application\/octet-stream/,
    /Cache-Control/, /private, no-store/, /no-referrer/, /X-Content-Type-Options/,
    /nosniff/, /Content-Security-Policy/, /sandbox/,
  ]) assert.match(helper, expected);
  assert.match(helper, /replace\(\/\[\\r\\n"\]/g/);
  assert.match(helper, /replace\(\/\[\\\\\/\]/g/);
});

test("private resume and employer documents retain auth gates without redirecting to signed URLs", async () => {
  for (const path of [
    "src/app/api/resume/[applicationId]/route.ts",
    "src/app/api/admin/va-resume/[vaId]/route.ts",
    "src/app/api/recruiter/lead-attachment/[leadId]/route.ts",
  ]) {
    const source = await read(path);
    assert.match(source, /getSessionProfile/);
    assert.match(source, /privateStorageDownloadResponse/);
    assert.doesNotMatch(source, /createSignedUrl|NextResponse\.redirect/);
    assert.ok(source.indexOf("getSessionProfile()") < source.indexOf("privateStorageDownloadResponse({"),
      `${path} must authenticate before downloading`);
  }
  const application = await read("src/app/api/resume/[applicationId]/route.ts");
  assert.match(application, /application\.va_id === user\.id/);
  assert.match(application, /profile\.role === "recruiter"/);
  assert.match(application, /profile\.role === "admin"/);
});
