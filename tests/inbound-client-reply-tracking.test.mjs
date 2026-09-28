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

  assert.match(route, /\n\s+subject,/);
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


test("client emails use lead/job-specific Resend reply addresses when context is available", async () => {
  const [email, recruiter] = await Promise.all([
    read("src/lib/email.ts"),
    read("src/app/actions/recruiter.ts"),
  ]);

  assert.match(email, /function configuredReplyToFor/);
  assert.match(email, /lead-\$\{leadId\}@\$\{domain\}/);
  assert.match(email, /job-\$\{jobId\}@\$\{domain\}/);
  assert.match(email, /configuredReplyToFor\(\{ leadId: args\.leadId \}\)/);
  assert.match(email, /configuredReplyToFor\(\{ jobId: args\.jobId \}\)/);
  assert.match(recruiter, /leadId: activityType === "lead" \? activityId : null/);
  assert.match(recruiter, /jobId: linkedJobId \|\| jobId \|\| null/);
});

test("tagged inbound replies are attributed exactly and never fall back on a mismatched sender", async () => {
  const route = await read("src/app/api/webhooks/resend/route.ts");

  assert.match(route, /replyTargetFromRecipients/);
  assert.match(route, /\^\(lead\|job\)-/);
  assert.match(route, /\.eq\("id", target\.id\)/);
  assert.match(route, /\.eq\("job_id", target\.id\)/);
  assert.match(route, /bareEmailAddress\(lead\.email\) !== sender/);
  assert.match(route, /if \(target && !attribution\) return/);
  assert.match(route, /mode: "reply_address"/);
  assert.match(route, /mode: "sender_fallback"/);
  assert.match(route, /reply_target_id/);
});
