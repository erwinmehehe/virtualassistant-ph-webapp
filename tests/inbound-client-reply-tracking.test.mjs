import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Resend webhook verifies signatures before tracking inbound client replies", async () => {
  const route = await read("src/app/api/webhooks/resend/route.ts");

  assert.match(route, /new Webhook\(secret\)\.verify/);
  assert.match(route, /email\.received/);
  assert.match(route, /recordInboundClientReply/);
  assert.match(route, /lead_intake/);
  assert.match(route, /client_contact_email/);
  assert.match(route, /resend_inbound/);
  assert.match(route, /provider_id/);
});

test("inbound reply tracking stores metadata only and does not process message content", async () => {
  const route = await read("src/app/api/webhooks/resend/route.ts");

  assert.match(route, /subject: subject/);
  assert.match(route, /message_id/);
  assert.doesNotMatch(route, /emails\.receiving\.get/);
  assert.doesNotMatch(route, /html:/);
  assert.doesNotMatch(route, /text:/);
  assert.doesNotMatch(route, /attachments/);
});

test("client engagement panel describes automatic reply tracking with manual fallback", async () => {
  const panel = await read("src/components/client-engagement-panel.tsx");
  assert.match(panel, /inbound client email replies are tracked automatically/);
  assert.match(panel, /log a reply manually if needed/);
});
