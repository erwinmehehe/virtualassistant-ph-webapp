import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("candidate identity access requires a paid state", async () => {
  const access = await read("src/lib/candidate-access.ts");
  assert.match(access, /return status === "paid";/);
  assert.doesNotMatch(access, /status === "comped"/);
});

test("experience alone can no longer bypass VA vetting", async () => {
  const [admin, page] = await Promise.all([
    read("src/app/actions/admin.ts"),
    read("src/app/workspace/admin/vetting/page.tsx"),
  ]);
  assert.doesNotMatch(admin, /bulkApproveExperiencedVAsAction/);
  assert.doesNotMatch(page, /Bulk-approve/);
  assert.match(page, /Approval itself always requires the normal evidence review/);
});

test("current managed chats feed an admin-only circumvention moderation queue", async () => {
  const [migration, page] = await Promise.all([
    read("supabase/migrations/20261003114500_current_chat_moderation_and_bans.sql"),
    read("src/app/workspace/admin/moderation/page.tsx"),
  ]);
  assert.match(migration, /client_recruiter_messages/);
  assert.match(migration, /recruiter_va_messages/);
  assert.match(migration, /external_payment/);
  assert.match(migration, /external_contact_channel/);
  assert.match(migration, /revoke all on public\.message_flags from public, anon, authenticated/);
  assert.match(page, /body_snapshot/);\n  assert.match(page, /channel,message_id,thread_id/);\n  assert.doesNotMatch(page, /source_type|source_message_id/);
  assert.doesNotMatch(page, /from\("messages"\)/);
});
