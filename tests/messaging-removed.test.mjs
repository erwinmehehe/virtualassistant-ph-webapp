import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function path(rel) {
  return new URL(`../${rel}`, import.meta.url);
}
function source(rel) {
  return readFileSync(path(rel), "utf8");
}

test("in-app client/VA messaging is gone", () => {
  for (const rel of [
    "src/app/workspace/client/messages/page.tsx",
    "src/app/workspace/va/messages/page.tsx",
    "src/app/actions/messages.ts",
    "src/components/message-live-sync.tsx",
    "src/components/mark-thread-read.tsx",
    "src/app/api/message-attachment/[messageId]/route.ts"
  ]) {
    assert.equal(existsSync(path(rel)), false, `${rel} should have been removed`);
  }

  // Nothing opens a thread any more, in the UI or on apply/accept.
  const nav = source("src/components/app-nav-links.tsx");
  assert.doesNotMatch(nav, /\/messages/);
  const applications = source("src/app/actions/applications.ts");
  assert.doesNotMatch(applications, /from\("conversations"\)/);
  for (const rel of ["src/app/workspace/client/workroom/page.tsx", "src/app/workspace/va/workroom/page.tsx"]) {
    assert.doesNotMatch(source(rel), /from\("conversations"\)/, `${rel} still queries threads`);
  }
});

test("old message links land on recruiter support instead of a 404", () => {
  const config = source("next.config.ts");
  assert.match(config, /source: "\/workspace\/client\/messages", destination: "\/workspace\/client\/support"/);
  assert.match(config, /source: "\/workspace\/va\/messages", destination: "\/workspace\/va\/support"/);
});
