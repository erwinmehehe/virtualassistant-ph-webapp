import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { Script } from "node:vm";
import test from "node:test";

const base = path.resolve("docs/training-v2/foundations");
const read = (name) => readFile(path.join(base, name), "utf8");

test("Foundations V2 plan has 10 coherent modules, 40 lessons and reconciled time", async () => {
  const s = await read("CURRICULUM_BLUEPRINT.md");
  const lessons = [...s.matchAll(/\*\*M(\d\d)-L(\d\d) · [^\n]+? · (\d+) min/g)]
    .map((match) => ({ module: match[1], lesson: match[2], minutes: Number(match[3]) }));
  assert.equal(lessons.length, 40);
  assert.equal(new Set(lessons.map((x) => x.module)).size, 10);
  for (const module of new Set(lessons.map((x) => x.module))) {
    const each = lessons.filter((x) => x.module === module);
    assert.deepEqual(each.map((x) => x.lesson).sort(), ["01", "02", "03", "04"]);
  }
  assert.equal(lessons.reduce((total, x) => total + x.minutes, 0), 2115);
  assert.match(s, /2,115 = 35h 15m/);
  assert.match(s, /M03-L01 · Inbox triage and ownership lab · 150 min/);
  assert.match(s, /V2 course with new IDs/);
});

test("all relative links in curriculum, lesson, guide and README resolve to committed files", async () => {
  for (const relative of [
    "README.md",
    "CURRICULUM_BLUEPRINT.md",
    "LESSON_03_01_INBOX_TRIAGE.md",
    "CLIENT_OPERATING_GUIDE.md",
    "ASSESSMENT_RUBRIC_AND_FEEDBACK.md",
    "ACCESSIBILITY_AND_PILOT_QA.md",
  ]) {
    const source = await read(relative);
    const hrefs = [...source.matchAll(/\]\(\.\/([^)#?]+)(?:#[^)]*)?\)/g)].map((m) => m[1]);
    for (const href of hrefs) {
      await access(path.join(base, href));
    }
  }
});

test("learner messages do not include hinted actions or an answer column", async () => {
  const s = await read("inbox-case-messages.csv");
  const lines = s.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  assert.deepEqual(header, [
    "message_id","stage","received_aedt","from_address","subject","message_body","related_record",
  ]);
  assert.equal(lines.length, 13);
  const ids = lines.slice(1).map((line) => line.slice(0, 3));
  assert.deepEqual(ids, Array.from({ length: 12 }, (_, i) => "M" + String(i + 1).padStart(2, "0")));
  assert.equal(lines.filter((line) => line.includes(",DEMO,")).length, 4);
  assert.equal(lines.filter((line) => line.includes(",PRACTICE,")).length, 8);
  assert.doesNotMatch(header.join(","), /scenario_note|correct_answer|priority|suggested_action/i);
});

test("eight-row learner tracker separates actual deadlines from reminders", async () => {
  const s = await read("inbox-triage-blank.csv");
  const lines = s.trim().split(/\r?\n/);
  const cols = lines[0].split(",");
  assert.equal(cols.length, 13);
  assert.ok(cols.includes("hard_deadline_aedt"));
  assert.ok(cols.includes("next_checkpoint_aedt"));
  assert.ok(cols.includes("source_reference"));
  assert.equal(lines.length, 9);
  for (const row of lines.slice(1)) assert.equal(row.split(",").length, cols.length);
});

test("fictional supporting records and open cases are available for real cross-checking", async () => {
  const records = [
    ["records/bookings.csv", "B-109"],
    ["records/finance-records.csv", "INV-219"],
    ["records/customer-directory.csv", "CUST-407"],
    ["records/weekly-jobs.csv", "JOB-012"],
    ["records/approval-register.csv", "CMP-12"],
    ["records/rates-and-policies.md", "Identity"],
    ["records/meeting-MN-22.md", "15:19"],
  ];
  for (const [file, token] of records) {
    const content = await read(file);
    assert.ok(content.includes(token), "Expected " + token + " in " + file);
  }
});

test("offline lab is parseable JavaScript without external persistence or model calls", async () => {
  const s = await read("practice-inbox-lab.html");
  assert.match(s, /<html lang="en">/);
  // This is a repository-owned, fixed HTML test fixture, not arbitrary HTML.
  // Locate the sole inline script with literal tags rather than an HTML-filter
  // regex (which CodeQL correctly warns would miss uppercase tags).
  const startTag = "<script>";
  const endTag = "</script>";
  const start = s.indexOf(startTag);
  const end = s.indexOf(endTag, start + startTag.length);
  assert.ok(start !== -1 && end > start, "expected an inline script");
  assert.equal(s.indexOf(startTag, start + startTag.length), -1, "expected one inline script");
  assert.equal(s.indexOf(endTag, end + endTag.length), -1, "expected one closing script tag");
  const code = s.slice(start + startTag.length, end);
  assert.doesNotThrow(() => new Script(code));
  assert.doesNotMatch(code, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|WebSocket/);
  assert.match(s, /max-width:800px/);
  assert.match(s, /aria-live="polite"/);
  assert.match(s, /Export all eight practice records as CSV/);
  assert.match(s, /completeness check ONLY/);
  assert.match(s, /hard_deadline_aedt/);
  assert.match(s, /next_checkpoint_aedt/);
});

test("public reviewer scorecard adds to 100 and protects critical safety decisions", async () => {
  const s = await read("ASSESSMENT_RUBRIC_AND_FEEDBACK.md");
  const criterionRows = s.split("\n").filter((line) => /^\| \*\*/.test(line) && /\| \d+ \| \d+ \| 0 \|/.test(line));
  const weights = criterionRows.map((line) => Number(line.split("|")[2].trim()));
  assert.equal(weights.length, 12);
  assert.equal(weights.reduce((a, b) => a + b, 0), 100);
  assert.match(s, /Critical safety gate/);
  assert.match(s, /do not upload a hidden case-specific answer key to this public repository/i);
  assert.match(s, /Needs revision/);
});

test("mobile workflow illustration is accessible and sequential", async () => {
  const s = await read("assets/inbox-triage-flow-mobile.svg");
  assert.match(s, /viewBox="0 0 360 1000"/);
  assert.match(s, /aria-labelledby="flow-title flow-desc"/);
  for (const heading of ["Capture", "Verify", "Prioritize", "Check authority", "Take safe action", "Track and hand off"]) {
    assert.ok(s.includes(heading));
  }
});

