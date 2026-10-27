import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(path, "utf8");

test("reading progress persistence failures are visible and recorded once per lesson view", async () => {
  const [gate, errorRoute, actions] = await Promise.all([
    source("src/components/training-lesson-integrity-gate.tsx"),
    source("src/app/api/errors/route.ts"),
    source("src/app/actions/training.ts"),
  ]);

  assert.match(gate, /readingSyncReportedRef = useRef\(false\)/);
  assert.match(gate, /if \(!readingSyncReportedRef\.current\)/);
  assert.match(gate, /source: "training_progress_recoverable"/);
  assert.match(gate, /setReadingSyncError\(true\)/);
  assert.match(errorRoute, /body\?\.source === "training_progress_recoverable"/);
  assert.match(actions, /console\.error\("Training engagement RPC failed"/);
  assert.match(actions, /engagementError\?\.code \|\| "EMPTY_RESULT"/);
  assert.doesNotMatch(actions, /console\.error\([^\n]*userId/);
});

test("unenrolled learners do not receive misleading wrong-answer feedback", async () => {
  const [gate, actions] = await Promise.all([
    source("src/components/training-lesson-integrity-gate.tsx"),
    source("src/app/actions/training.ts"),
  ]);

  assert.match(actions, /reason: "not_enrolled" as const/);
  assert.match(gate, /result\.reason === "not_enrolled"/);
  assert.match(gate, /start this course from its overview/i);
});

test("local browser acceptance requires a real saved correct answer", async () => {
  const browserTest = await source("e2e/training-transactional-uat.spec.ts");
  assert.match(browserTest, /expect\(saved\)\.toBe\(true\)/);
  assert.match(browserTest, /select\("checkpoint_key"\)/);
  assert.match(browserTest, /\.toBe\(true\);/);
  assert.doesNotMatch(browserTest, /quick check is saved\|Not quite/);
});
