import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";

const read = (file) => readFile(new URL("../" + file, import.meta.url), "utf8");

async function loadLogic() {
  const ts = await import("typescript");
  const source = await read("src/lib/kiro-career-coach.ts");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  const module = { exports };
  runInNewContext(code, { exports, module });
  return module.exports;
}

test("Kiro course and progress context is authenticated and private", async () => {
  const [page, shell, dashboard] = await Promise.all([
    read("src/app/workspace/training/coach/page.tsx"),
    read("src/components/training-shell.tsx"),
    read("src/app/workspace/training/page.tsx"),
  ]);
  assert.match(page, /requireTrainingAccessFast\(\)/);
  assert.match(page, /getTrainingDashboard\(userId\)/);
  assert.match(page, /chooseTrainingResumeCourse\(courses\)/);
  assert.match(page, /recommendNextTrainingCourses\(/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /if \(error\)/);
  assert.doesNotMatch(page, /createAdminClient|AI_GATEWAY_API_KEY|api\/training\/coach/);
  assert.match(shell, /href="\/workspace\/training\/coach"/);
  assert.match(dashboard, /training_career_coach_open/);
});

test("Kiro practice is genuinely browser-only with no provider or database calls", async () => {
  const [ui, helper, css] = await Promise.all([
    read("src/components/kiro-career-studio.tsx"),
    read("src/lib/kiro-career-coach.ts"),
    read("src/app/workspace/training/coach/kiro-career-studio.css"),
  ]);
  for (const term of ["Resume lab", "Portfolio builder", "Interview practice", "Review my answer", "Browser-only drafts"]) {
    assert.ok(ui.includes(term), "Missing practice control: " + term);
  }
  assert.match(ui, /navigator\.clipboard\.writeText/);
  assert.match(ui, /aria-pressed/);
  assert.match(ui, /role="region"/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.doesNotMatch(ui + helper, /\bfetch\(|XMLHttpRequest|localStorage|sessionStorage|dangerouslySetInnerHTML|AI_GATEWAY_API_KEY|createClient\(/);
  assert.match(ui, /vaAccount \? <Link href="\/workspace\/va\/profile/);
});

test("specialization prompts are deterministic and topic-specific", async () => {
  const { careerScenarioForCategory } = await loadLogic();
  assert.match(careerScenarioForCategory("SEO").question, /traffic dropped/i);
  assert.match(careerScenarioForCategory("Customer Service").question, /refund/i);
  assert.match(careerScenarioForCategory("Bookkeeping & Finance").question, /spreadsheet/i);
  assert.match(careerScenarioForCategory("Dental & Healthcare").question, /sensitive details/i);
  assert.match(careerScenarioForCategory(null).question, /fictional client/i);
});

test("resume statements never convert simulated work into employment evidence or invent results", async () => {
  const { createResumeExample } = await loadLogic();
  const practice = createResumeExample({
    evidence: "practice", task: "  Sorted a fictional inbox. ", tools: " Gmail ", result: "",
  });
  assert.match(practice, /^Practice project \(simulated\): Practiced /);
  assert.match(practice, /using Gmail/);
  assert.doesNotMatch(practice, /improved|increased|%|revenue/i);
  const work = createResumeExample({
    evidence: "real", task: "Created a weekly support report", tools: "Sheets", result: "Shared the approved report with the client",
  });
  assert.match(work, /^Work experience draft: /);
  assert.match(work, /Shared the approved report with the client/);
  assert.equal(createResumeExample({ evidence: "real", task: "", tools: "Sheets", result: "" }), "");
});

test("portfolio outline is labeled as a practice sample and uses only supplied facts", async () => {
  const { createPortfolioOutline } = await loadLogic();
  const output = createPortfolioOutline({
    project: "Weekly updates", task: "Prepare a fictional project status note",
    deliverable: "", tools: "Docs",
  });
  assert.match(output, /PRACTICE PORTFOLIO SAMPLE — NOT PAID CLIENT WORK/);
  assert.match(output, /Tools practiced: Docs/);
  assert.match(output, /\[Describe or link your fictional work sample\]/);
  assert.equal(createPortfolioOutline({ project: "", task: "anything", deliverable: "", tools: "" }), "");
});

test("interview feedback provides transparent cues without a grade or automated hiring score", async () => {
  const { interviewPracticeTips } = await loadLogic();
  const first = interviewPracticeTips("");
  assert.ok(first.some((tip) => /write your own answer/i.test(tip)));
  const short = interviewPracticeTips("I can do that.");
  assert.ok(short.length > 1);
  assert.ok(short.some((tip) => /clarify or verify/i.test(tip)));
  const longer = interviewPracticeTips("I will first confirm the priority and time zone. I will plan and track the tasks, then send a client update and ask for approval.");
  assert.ok(longer.length >= 1);
  assert.doesNotMatch(longer.join(" "), /\d+\/10|score:|guaranteed|hired/i);
});
