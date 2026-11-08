import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("all resume server-action paths use a conservative payload budget", async () => {
  const [limits,profile,autofill,component] = await Promise.all([
    readFile("src/lib/upload-limits.ts", "utf8"),
    readFile("src/app/actions/profile.ts", "utf8"),
    readFile("src/app/actions/resume-autofill.ts", "utf8"),
    readFile("src/components/resume-autofill.tsx", "utf8"),
  ]);
  assert.match(limits, /MAX_SERVER_ACTION_RESUME_BYTES = 4 \* 1024 \* 1024/);
  assert.match(profile, /value\.size > MAX_SERVER_ACTION_RESUME_BYTES/);
  assert.match(autofill, /file\.size > MAX_SERVER_ACTION_RESUME_BYTES/);
  assert.match(component, /file\.size > MAX_SERVER_ACTION_RESUME_BYTES/);
  assert.match(component, /setFileSizeError/);
  assert.match(component, /event\.currentTarget\.value = ""/);
  assert.match(component, /profileResumeRef\.current\.value = ""/);
  assert.match(component, /Files must be \{SERVER_ACTION_RESUME_SIZE_LABEL\} or smaller/);
  assert.doesNotMatch(profile, /Resume must be 5 MB or smaller/);
  assert.doesNotMatch(autofill, /Resume must be 5 MB or smaller/);
  assert.match(autofill, /uploadContentsMatch\(file, "resume-autofill"\)/);
});
