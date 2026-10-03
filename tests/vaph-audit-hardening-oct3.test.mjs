import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("current recruiter-mediated chats feed human-reviewed anti-circumvention moderation", async () => {
  const [migration, page, action] = await Promise.all([
    read("supabase/migrations/20261003093000_current_chat_moderation_and_bans.sql"),
    read("src/app/workspace/admin/moderation/page.tsx"),
    read("src/app/actions/moderation.ts"),
  ]);

  assert.match(migration, /create table if not exists public\.communication_flags/);
  assert.match(migration, /after insert on public\.client_recruiter_messages/);
  assert.match(migration, /after insert on public\.recruiter_va_messages/);
  assert.match(migration, /sender_role not in \('client'/);
  assert.match(migration, /direct_payment/);
  assert.match(migration, /circumvention/);
  assert.match(migration, /revoke all on public\.communication_flags from public, anon, authenticated/);
  assert.match(page, /from\("communication_flags"\)/);
  assert.doesNotMatch(page, /from\("message_flags"\)/);
  assert.match(action, /from\("communication_flags"\)/);
  assert.match(action, /\["client", "va"\]/);
});

test("comped candidate review cannot expose private evidence that can enable circumvention", async () => {
  const [access, gate, detail, matching, resume] = await Promise.all([
    read("src/lib/candidate-access.ts"),
    read("src/components/candidate-access-gate.tsx"),
    read("src/app/workspace/client/candidates/[id]/page.tsx"),
    read("src/app/actions/matching.ts"),
    read("src/app/api/resume/[applicationId]/route.ts"),
  ]);

  assert.match(access, /candidatePrivateEvidencePaid/);
  assert.match(access, /return status === "paid"/);
  assert.match(detail, /candidatePrivateEvidencePaid\(access\?\.access_status\)/);
  assert.doesNotMatch(gate, /Direct candidate messaging/);
  assert.doesNotMatch(gate, /contact candidates directly/);
  assert.match(matching, /Record the payment reference before marking candidate access as paid/);
  assert.match(resume, /Clients are deliberately excluded/);
});

test("experience alone can never bulk-approve a VA", async () => {
  const [adminAction, vettingPage] = await Promise.all([
    read("src/app/actions/admin.ts"),
    read("src/app/workspace/admin/vetting/page.tsx"),
  ]);

  assert.doesNotMatch(adminAction, /bulkApproveExperiencedVAs/);
  assert.doesNotMatch(vettingPage, /Bulk-approve/);
  assert.doesNotMatch(vettingPage, /skips the remaining skills test/i);
  assert.match(vettingPage, /never bypass skills, video, recruiter review, or final evidence review/);
});

test("checkout fails closed instead of using a guessed USD PHP rate", async () => {
  const paymongo = await read("src/lib/paymongo.ts");
  assert.doesNotMatch(paymongo, /FALLBACK_USD_PHP_RATE/);
  assert.match(paymongo, /A current USD\/PHP exchange rate is unavailable/);
  assert.match(paymongo, /fresh USD\/PHP quote unavailable/);
});

test("live interviews explicitly preserve the anti-circumvention boundary", async () => {
  const [clientInterviews, vaInterviews] = await Promise.all([
    read("src/app/workspace/client/interviews/page.tsx"),
    read("src/app/workspace/va/interviews/page.tsx"),
  ]);

  assert.match(clientInterviews, /Keep the hiring process inside VAPH/);
  assert.match(clientInterviews, /applicable VAPH commercial fee has been paid/);
  assert.match(vaInterviews, /Keep the hiring process inside VAPH/);
  assert.match(vaInterviews, /Do not exchange personal contact details, accept direct payment/);
});
