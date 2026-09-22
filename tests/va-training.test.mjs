import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function load(path) {
  const js = ts.transpileModule(source(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", "require", js)(module, module.exports, () => ({}));
  return module.exports;
}

const { TRAINING_LESSONS } = load("src/lib/va-training.ts");
const completeness = source("src/lib/profile-completeness.ts");

test("every lesson finishes a real profile field", () => {
  assert.equal(TRAINING_LESSONS.length, 11);
  for (const lesson of TRAINING_LESSONS) {
    // The key must exist in the completion checklist, or the lesson can never
    // be marked done and the page would show it forever.
    assert.match(completeness, new RegExp(`key: "${lesson.key}"`), `no completion item for ${lesson.key}`);
    assert.ok(lesson.steps.length >= 3, `${lesson.key} needs real steps`);
    assert.ok(lesson.why.length > 40, `${lesson.key} needs a reason`);
    assert.ok(lesson.minutes > 0 && lesson.minutes <= 15);
  }
  assert.equal(new Set(TRAINING_LESSONS.map((l) => l.key)).size, TRAINING_LESSONS.length);
});

test("training is free and never changes standing", () => {
  const page = source("src/app/workspace/va/training/page.tsx");
  const lib = source("src/lib/va-training.ts");

  // Progress is derived from the profile, so there is nothing to sell and no
  // separate record that payment could alter.
  assert.match(page, /getVaCompletion/);
  assert.doesNotMatch(page, /price|checkout|payment|purchase|enroll/i);
  assert.doesNotMatch(lib, /price|checkout|payment|purchase/i);
  assert.match(page, /free, it always will be, and it never affects whether you are shortlisted/);
});

test("the lesson list is reachable from the VA nav", () => {
  const nav = source("src/components/app-nav-links.tsx");
  assert.match(nav, /"Free Training", "\/workspace\/va\/training"/);
});
