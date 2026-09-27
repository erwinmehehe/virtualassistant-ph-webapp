import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("workspace clears transient action feedback from the URL after it renders", async () => {
  const [component, shell] = await Promise.all([
    readFile("src/components/workspace-feedback-hygiene.tsx", "utf8"),
    readFile("src/components/app-shell.tsx", "utf8"),
  ]);

  assert.match(component, /FLASH_KEY_PATTERN/);
  assert.match(component, /window\.history\.replaceState/);
  assert.match(component, /url\.searchParams\.delete\(key\)/);
  assert.match(component, /key === "affected"/);
  assert.match(component, /key === "published"/);
  assert.match(component, /key === "skipped"/);
  assert.match(shell, /<WorkspaceFeedbackHygiene \/>/);
});

test("workspace feedback cleanup preserves navigation and filter params", async () => {
  const component = await readFile("src/components/workspace-feedback-hygiene.tsx", "utf8");
  for (const key of ["view", "q", "owner", "page", "sort", "tab", "status"]) {
    assert.doesNotMatch(component, new RegExp(`"${key}",`));
  }
});
