import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const candidates = fs.readFileSync("src/app/workspace/client/candidates/page.tsx", "utf8");
const candidate = fs.readFileSync("src/app/workspace/client/candidates/[id]/page.tsx", "utf8");
const compare = fs.readFileSync("src/app/workspace/client/compare/page.tsx", "utf8");
const job = fs.readFileSync("src/app/workspace/client/jobs/[id]/page.tsx", "utf8");
const matchingAction = fs.readFileSync("src/app/actions/matching.ts", "utf8");
const matchingLib = fs.readFileSync("src/lib/matching.ts", "utf8");
const matchEmail = fs.readFileSync("src/lib/match-email.ts", "utf8");

const clientSurfaces = [candidates, candidate, compare, job];

test("client candidate surfaces use qualitative fit labels without numeric match scores", () => {
  for (const source of clientSurfaces) {
    assert.match(source, /clientMatchLabel/);
    assert.doesNotMatch(source, /Match confidence:/);
    assert.doesNotMatch(source, /\{score\}\/100/);
    assert.doesNotMatch(source, /\{row\.match_score\}\/100/);
    assert.doesNotMatch(source, /\{row\.match_score\}%/);
  }
  assert.match(candidates, /Why your recruiter recommends this VA/);
  assert.match(job, /Why your recruiter recommends this VA/);
});

test("client fit vocabulary is limited to strong good and potential", () => {
  assert.match(matchingLib, /export function clientMatchLabel/);
  const helper = matchingLib.slice(matchingLib.indexOf("export function clientMatchLabel"));
  assert.match(helper, /Strong fit/);
  assert.match(helper, /Good fit/);
  assert.match(helper, /Potential fit/);
  assert.doesNotMatch(helper, /Review fit/);
});

test("VA match alert only fires for newly released good-or-better matches", () => {
  assert.match(matchingAction, /mode === "release"/);
  assert.match(matchingAction, /row\.match_score >= 60/);
  assert.match(matchingAction, /existingMap\.get\(row\.va_id\) !== "released"/);
  assert.match(matchingAction, /sendVaMatchEmail/);
  assert.match(matchingAction, /A client role may be a good fit/);
  assert.match(matchEmail, /This is not yet an interview or job offer/);
  assert.match(matchEmail, /va_match_alert/);
  assert.match(matchEmail, /workspace\/va\/profile/);
});
