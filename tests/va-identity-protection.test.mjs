import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

// Matches tests/va-applicant-detection.test.mjs: transpile rather than rely on
// the runner's TypeScript support.
function loadIdentity() {
  const js = ts.transpileModule(source("src/lib/va-identity.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", js)(module, module.exports);
  return module.exports;
}

const { maskVaName, clientFacingVaName, offerRevealsIdentity } = loadIdentity();

test("a masked name cannot be searched back to the person", () => {
  assert.equal(maskVaName("Marc Pascual"), "Marc P.");
  assert.equal(maskVaName("  maria  clara  santos "), "maria S.");
  assert.equal(maskVaName("Cher"), "Cher");
  assert.equal(maskVaName(""), "Vetted VA");
  assert.equal(maskVaName(null), "Vetted VA");
});

test("the full name appears only once the client is committed", () => {
  assert.equal(offerRevealsIdentity("accepted"), true);
  assert.equal(offerRevealsIdentity("placed"), true);
  assert.equal(offerRevealsIdentity("sent"), false);
  assert.equal(offerRevealsIdentity(null), false);
  assert.equal(clientFacingVaName("Marc Pascual", false), "Marc P.");
  assert.equal(clientFacingVaName("Marc Pascual", true), "Marc Pascual");
});

test("pre-placement client surfaces mask the name", () => {
  for (const rel of [
    "src/app/workspace/client/candidates/page.tsx",
    "src/app/workspace/client/candidates/[id]/page.tsx",
    "src/app/workspace/client/compare/page.tsx",
    "src/app/workspace/client/interviews/page.tsx"
  ]) {
    assert.match(source(rel), /maskVaName\(/, `${rel} should mask the VA name`);
  }
  assert.match(source("src/app/workspace/client/offers/page.tsx"), /offerRevealsIdentity\(offer\.status\)/);
});

test("nothing hands a client the VA's contact details", () => {
  const resume = source("src/app/api/resume/[applicationId]/route.ts");
  // A resume carries email, phone and address: recruiters and the VA only.
  assert.doesNotMatch(resume, /profile\.role === "client"/);
  assert.match(resume, /profile\.role === "admin" \|\| profile\.role === "recruiter" \|\| application\.va_id === user\.id/);

  const detail = source("src/app/workspace/client/candidates/[id]/page.tsx");
  assert.doesNotMatch(detail, /api\/resume/);
  assert.doesNotMatch(detail, /portfolio_url/);

  // Google shows guests each other unless told not to.
  const booking = source("src/lib/booking-operations.ts");
  assert.equal((booking.match(/guestsCanSeeOtherGuests: false/g) || []).length, 2);
});
