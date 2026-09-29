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
    "src/app/workspace/va/messages/page.tsx",
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

  const clientMessages = source("src/app/workspace/client/messages/page.tsx");
  assert.match(clientMessages, /Chat with your recruiter/);
  assert.match(clientMessages, /Virtual Assistants are never participants/);

  const applications = source("src/app/actions/applications.ts");
  assert.doesNotMatch(applications, /from\("conversations"\)/);
  for (const rel of ["src/app/workspace/client/workroom/page.tsx", "src/app/workspace/va/workroom/page.tsx"]) {
    assert.doesNotMatch(source(rel), /from\("conversations"\)/, `${rel} still queries direct client-VA threads`);
  }
});

test("legacy VA message links land on support while client messages open recruiter chat", () => {
  const config = source("next.config.ts");
  assert.doesNotMatch(config, /source: "\/workspace\/client\/messages", destination: "\/workspace\/client\/support"/);
  assert.match(config, /source: "\/workspace\/va\/messages", destination: "\/workspace\/va\/support"/);
});
