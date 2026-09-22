import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("recruiter candidate profile uses the compact premium layout",()=>{
  const css=read("src/app/workspace/recruiter-candidate.css");
  assert.match(css,/width:min\(100%,1280px\)/);
  assert.match(css,/candidate-status-grid[\s\S]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css,/recruiter-candidate-layout[\s\S]*310px/);
  assert.match(css,/recruiter-candidate-main \.score-grid[\s\S]*repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css,/recruiter-candidate-sidebar[\s\S]*position:sticky/);
  assert.match(css,/@media \(max-width:480px\)/);
});

test("authenticated visual QA covers recruiter candidate profile on all breakpoints",()=>{
  const script=read("scripts/authenticated-dashboard-visual.mjs");
  assert.match(script,/workspace\/recruiter\/candidates\/\$\{smokeVaId\}/);
  assert.match(script,/recruiter-candidate-profile-\$\{viewport\.name\}\.png/);
  assert.match(script,/has horizontal page overflow/);
  assert.match(script,/Smoke VA One/);
});
