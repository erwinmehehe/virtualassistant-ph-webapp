import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function loadVisibility() {
  const js = ts.transpileModule(source("src/lib/public-visibility.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const module = { exports: {} };
  const require_ = (name) => {
    if (name.endsWith("constants")) return { MIN_HOURLY_RATE: 6 };
    if (name.endsWith("profile-completeness")) return { getVaCompletion: () => ({ score: 0 }) };
    if (name.endsWith("public-routing")) return { PUBLIC_VA_MIN_EXPERIENCE: 2 };
    return {};
  };
  new Function("module", "exports", "require", js)(module, module.exports, require_);
  return module.exports;
}

const { isRowApprovable, APPROVAL_MIN_COMPLETION, PUBLIC_VA_MIN_COMPLETION } = loadVisibility();

test("a recruiter can approve a part-built profile into the bench", () => {
  assert.equal(APPROVAL_MIN_COMPLETION, 60);
  assert.equal(isRowApprovable({ completion_score: 60, missing_items: ["photo", "bio"] }), true);
  assert.equal(isRowApprovable({ completion_score: 80, missing_items: ["photo"] }), true);
  assert.equal(isRowApprovable({ completion_score: 59 }), false);
  assert.equal(isRowApprovable({ completion_score: null }), false);
});

test("the public bar stays where it was and stays higher", () => {
  assert.equal(PUBLIC_VA_MIN_COMPLETION, 80);
  assert.ok(APPROVAL_MIN_COMPLETION < PUBLIC_VA_MIN_COMPLETION);

  // Approving must not publish: that is a separate column plus the view's gates.
  const recruiter = source("src/app/actions/recruiter.ts");
  assert.match(recruiter, /action === "approve_publish"/);
  assert.match(recruiter, /directory_visible: true/);
  assert.doesNotMatch(recruiter, /action === "approve"[^)]*directory_visible/);
});
