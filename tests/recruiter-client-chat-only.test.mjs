import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("legacy client-VA messaging is hard disabled", async () => {
  const migration = await read("supabase/migrations/20260929112000_recruiter_client_chat_only.sql");

  assert.match(migration, /drop policy if exists "conversation participants"/);
  assert.match(migration, /drop policy if exists "message participants read"/);
  assert.match(migration, /drop policy if exists "message participants send"/);
  assert.match(migration, /revoke all on public\.conversations from anon, authenticated/);
  assert.match(migration, /revoke all on public\.messages from anon, authenticated/);
  assert.match(migration, /Only a client or recruiter can send chat messages/);
});

test("recruiter-client chat uses dedicated private tables", async () => {
  const [migration, action, clientPage, recruiterPage] = await Promise.all([
    read("supabase/migrations/20260929112000_recruiter_client_chat_only.sql"),
    read("src/app/actions/client-recruiter-chat.ts"),
    read("src/app/workspace/client/messages/page.tsx"),
    read("src/app/workspace/recruiter/messages/page.tsx"),
  ]);

  assert.match(migration, /create table if not exists public\.client_recruiter_threads/);
  assert.match(migration, /create table if not exists public\.client_recruiter_messages/);
  assert.match(migration, /VAs are never participants/);
  assert.match(action, /requireAnyRole\(\["client", "recruiter"\]\)/);
  assert.match(clientPage, /Chat with your recruiter/);
  assert.match(clientPage, /Virtual Assistants are never participants/);
  assert.match(recruiterPage, /Virtual Assistants cannot access or send messages here/);
  assert.match(recruiterPage, /recruiter_id: userId/);
});

test("chat is first-class in client and recruiter navigation with unread badges", async () => {
  const [nav, badges, dashboard, crm] = await Promise.all([
    read("src/components/app-nav-links.tsx"),
    read("src/lib/workspace-badges.ts"),
    read("src/app/workspace/client/page.tsx"),
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
  ]);

  assert.match(nav, /\["Messages", "\/workspace\/client\/messages", MessageCircle\]/);
  assert.match(nav, /\["Client messages", "\/workspace\/recruiter\/messages", MessageCircle\]/);
  assert.match(badges, /client_recruiter_messages/);
  assert.match(badges, /recruiter_va_messages/);
  assert.match(badges, /"\/workspace\/recruiter\/messages": clientChatUnread/);
  assert.match(badges, /"\/workspace\/recruiter\/va-messages": vaChatUnread/);
  assert.match(badges, /\[\`\$\{base\}\/messages\`\]: role === "client" \? clientChatUnread : vaChatUnread/);
  assert.match(dashboard, /Message your recruiter/);
  assert.match(crm, /Message client/);
  assert.match(crm, /\/workspace\/recruiter\/messages\?client=/);
});

test("client messages notify recruiters and recruiter replies notify only the client", async () => {
  const action = await read("src/app/actions/client-recruiter-chat.ts");

  assert.match(action, /Client sent a new message/);
  assert.match(action, /Your recruiter replied/);
  assert.match(action, /client_chat_message/);
  assert.match(action, /source: "in_app_chat"/);
});
