import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function path(rel) {
  return new URL(`../${rel}`, import.meta.url);
}
function source(rel) {
  return readFileSync(path(rel), "utf8");
}

test("direct client/VA messaging remains gone", () => {
  for (const rel of [
    "src/app/actions/messages.ts",
    "src/components/message-live-sync.tsx",
    "src/components/mark-thread-read.tsx",
    "src/app/api/message-attachment/[messageId]/route.ts"
  ]) {
    assert.equal(existsSync(path(rel)), false, `${rel} should remain removed`);
  }

  const nav = source("src/components/app-nav-links.tsx");
  assert.match(nav, /\["Messages", "\/workspace\/client\/messages", MessageCircle\]/);
  assert.doesNotMatch(nav, /\["Messages", "\/workspace\/va\/messages"/);
  assert.match(nav, /\["Recruiter messages", "\/workspace\/va\/messages", MessageCircle\]/);

  const vaMessages = source("src/app/workspace/va/messages/page.tsx");
  assert.match(vaMessages, /requireRoleFast\("va"\)/);
  const recruiterMessages = source("src/app/workspace/recruiter/va-messages/page.tsx");
  assert.match(recruiterMessages, /requireRoleFast\("recruiter"\)/);
  const action = source("src/app/actions/recruiter-va-chat.ts");
  assert.match(action, /requireAnyRole\(\["recruiter", "va"\]\)/);
  assert.match(action, /user\.id !== thread\.recruiter_id && user\.id !== thread\.va_id/);
  assert.doesNotMatch(action, /"client"/);

  const clientMessages = source("src/app/workspace/client/messages/page.tsx");
  assert.match(clientMessages, /Chat with your recruiter/);
  assert.match(clientMessages, /Virtual Assistants are never participants/);

  const applications = source("src/app/actions/applications.ts");
  assert.doesNotMatch(applications, /from\("conversations"\)/);
  for (const rel of ["src/app/workspace/client/workroom/page.tsx", "src/app/workspace/va/workroom/page.tsx"]) {
    assert.doesNotMatch(source(rel), /from\("conversations"\)/, `${rel} still queries direct client-VA threads`);
  }
});

test("VA messages open recruiter chat while client messages remain separate", () => {
  const config = source("next.config.ts");
  assert.doesNotMatch(config, /source: "\/workspace\/client\/messages", destination: "\/workspace\/client\/support"/);
  assert.doesNotMatch(config, /source: "\/workspace\/va\/messages", destination: "\/workspace\/va\/support"/);
});

test("a lost recruiter claim cannot render another recruiter's client messages", () => {
  const inbox = source("src/app/workspace/recruiter/messages/page.tsx");
  assert.match(inbox, /active = claimed \? claimed as RecruiterClientThread : null/);
  const action = source("src/app/actions/client-recruiter-chat.ts");
  assert.match(action, /if \(!claimed\) throw new Error\("Another recruiter has taken this conversation/);
  assert.doesNotMatch(action, /thread = claimed \|\| data/);
});


test("client recruiter chat stays scoped to the selected hiring role", () => {
  const lib = source("src/lib/recruiter-client-chat.ts");
  assert.match(lib, /getOrCreateClientRecruiterThread\(clientId: string, jobId\?: string \| null\)/);
  assert.match(lib, /\.eq\("job_id", normalizedJobId\)/);

  const clientAction = source("src/app/actions/client-recruiter-chat.ts");
  assert.match(clientAction, /\.eq\("id", requestedThreadId\)/);
  assert.match(clientAction, /\.eq\("client_id", user\.id\)/);
  assert.match(clientAction, /if \(thread\.job_id\) leadQuery = leadQuery\.eq\("job_id", thread\.job_id\)/);

  const recruiterInbox = source("src/app/workspace/recruiter/messages/page.tsx");
  assert.match(recruiterInbox, /getOrCreateClientRecruiterThread\(client\.id, params\.job \|\| null\)/);

  const clientInbox = source("src/app/workspace/client/messages/page.tsx");
  assert.match(clientInbox, /Choose hiring role/);
  assert.match(clientInbox, /getOrCreateClientRecruiterThread\(userId, selectedJob\?\.id \|\| null\)/);

  const migration = source("supabase/migrations/20260929152000_client_recruiter_role_threads.sql");
  assert.match(migration, /add column if not exists job_id uuid references public\.jobs/);
  assert.match(migration, /client_recruiter_threads_job_unique/);
  assert.match(migration, /where id = new\.job_id and client_id = new\.client_id/);
});


test("recruiter and client messaging stay first-class beside recruiter VA chat", () => {
  const nav = source("src/components/app-nav-links.tsx");
  assert.match(nav, /\["Client messages", "\/workspace\/recruiter\/messages", MessageCircle\]/);
  assert.match(nav, /\["VA messages", "\/workspace\/recruiter\/va-messages", MessageCircle\]/);
  assert.match(nav, /\["Messages", "\/workspace\/client\/messages", MessageCircle\]/);

  const badges = source("src/lib/workspace-badges.ts");
  assert.match(badges, /from\("client_recruiter_threads"\)[\s\S]*\.eq\("client_id", userId\)/);
  assert.match(badges, /\.in\("thread_id", threadIds\)/);
  assert.doesNotMatch(badges, /role === "client"[\s\S]{0,700}\.maybeSingle\(\)/);

  const recruiterInbox = source("src/app/workspace/recruiter/messages/page.tsx");
  assert.match(recruiterInbox, /<h1>Client messages<\/h1>/);
  assert.match(recruiterInbox, /jobMap/);
  assert.match(recruiterInbox, /General conversation/);
  assert.match(recruiterInbox, /Assigned to you/);
});
