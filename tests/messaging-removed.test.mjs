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
  assert.doesNotMatch(inbox, /thread = claimed \|\| data/);
});
