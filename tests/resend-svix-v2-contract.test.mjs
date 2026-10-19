import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("Resend webhook preserves the Svix 2.x verify-before-parse security boundary", async () => {
  const route = await readFile(new URL("../src/app/api/webhooks/resend/route.ts", import.meta.url), "utf8");
  const verifyAt = route.indexOf("new Webhook(secret).verify(payload");
  const parseAt = route.indexOf("JSON.parse(payload)");
  assert.ok(verifyAt > 0 && parseAt > verifyAt, "Verify the raw signed body before parsing");
  assert.match(route, /const parsed: unknown = JSON\.parse\(payload\)/);
  assert.match(route, /if \(!parsed \|\| typeof parsed !== "object" \|\| Array\.isArray\(parsed\)\)/);
  assert.match(route, /typeof data\.email_id !== "string"/);
  assert.match(route, /Invalid signature/);
  assert.match(route, /Invalid webhook payload/);
  assert.doesNotMatch(route, /verify\(payload,[\s\S]*?\}\) as ResendEvent/);
});
