import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function loadDetector() {
  const source = readFileSync(new URL("../src/lib/va-applicant-detection.ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", js)(module, module.exports);
  return module.exports;
}

const { looksLikeVaApplication } = loadDetector();

test("hiring-form messages written by VAs applying for work are detected", () => {
  for (const message of [
    "Hi I am a virtual assistant with 3 years experience",
    "Good day! I want to apply as VA",
    "applying for the position of virtual assistant",
    "Please hire me, I am hardworking",
    "Attached is my resume",
    "I am looking for an online job",
    "I'm a VA looking for clients",
    "I saw your job opening for VA",
  ]) assert.equal(looksLikeVaApplication(message), true, message);
});

test("normal client briefs are not treated as VA applications", () => {
  for (const message of [
    "Handle inbox and calendar, CRM updates in HubSpot",
    "We need a VA who has applied SEO best practices",
    "Looking for a VA to manage my job applications pipeline for our recruitment agency",
    "I am hiring a VA for my real estate business",
    "Looking for work to be done on Shopify listings",
    "Review my resume screening workflow in JobAdder",
    "Post our job vacancy ads on Seek",
    "update my portfolio website on Squarespace",
    "I am a VA agency looking to outsource overflow",
  ]) assert.equal(looksLikeVaApplication(message), false, message);
});

test("hiring forms point VAs to the sign-up and route detected applicants away from the client pipeline", () => {
  const form = readFileSync(new URL("../src/components/hiring-brief-form.tsx", import.meta.url), "utf8");
  const leads = readFileSync(new URL("../src/app/actions/leads.ts", import.meta.url), "utf8");
  assert.match(form, /Looking for VA work\?/);
  assert.match(form, /\/auth\/join\/va/);
  assert.equal((leads.match(/looksLikeVaApplication\(/g) || []).length, 3);
  assert.match(leads, /lead_type: "va_support"/);
});
