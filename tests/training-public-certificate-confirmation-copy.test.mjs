import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public training page explains confirmed recipient name and preserved completion", async () => {
  const page = await readFile("src/app/training/page.tsx", "utf8");
  assert.match(page, /confirm the full name you want printed in Training account settings/i);
  assert.match(page, /Confirm your certificate name/);
  assert.match(page, /Your course completion is saved after passing/);
  assert.match(page, /Anyone with the verification link can see that name/);
  assert.match(page, /do not need to retake the course/);
  assert.doesNotMatch(page, /Certificate issued automatically/);
  assert.doesNotMatch(page, /Passing courses issue a verified certificate automatically/);
});
