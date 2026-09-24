import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const shellPath = "src/components/training-shell.tsx";
const cssPath = "src/app/workspace/training/training-home.css";
const dashboardPath = "src/app/workspace/training/page.tsx";

test("signed-in training keeps the public training identity visible", async () => {
  const shell = await readFile(shellPath, "utf8");

  assert.match(shell, /href="\/training" aria-label="Go to public Training home"/);
  assert.match(shell, /\.com\.ph · Training/);
  assert.match(shell, /href="\/training"[\s\S]*Training home/);
  assert.match(shell, /href="\/jobs"[\s\S]*VA jobs/);
  assert.match(shell, /href="\/blog"[\s\S]*VA guides/);
});

test("learner navigation exposes learning, course browsing, certificates, and workspace return", async () => {
  const shell = await readFile(shellPath, "utf8");

  assert.match(shell, /href="\/workspace\/training" aria-current="page"/);
  assert.match(shell, /\/workspace\/training\?browse=1#course-library-title/);
  assert.match(shell, /\/workspace\/training#certificates/);
  assert.match(shell, /roleWorkspaceLabel/);
  assert.match(shell, /VA workspace/);
});

test("mobile training navigation stays compact and connected", async () => {
  const [shell, css] = await Promise.all([
    readFile(shellPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(shell, /app-nav-mobile training-shell-mobile-nav/);
  assert.match(shell, />Learning<\/span>/);
  assert.match(shell, />Courses<\/span>/);
  assert.match(shell, />Training<\/span>/);
  assert.match(shell, />Workspace<\/span>/);

  assert.match(css, /Training shell continuity with the public training experience/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*training-shell-browse[\s\S]*display: none/);
  assert.match(css, /@media \(max-width: 390px\)[\s\S]*training-shell-public[\s\S]*display: none/);
});


test("certificate navigation always lands on a real learner-dashboard section", async () => {
  const dashboard = await readFile(dashboardPath, "utf8");

  assert.match(dashboard, /<section id="certificates"/);
  assert.match(dashboard, /No certificates yet\./);
  assert.match(dashboard, /Your verified certificate will appear here automatically/);
});
