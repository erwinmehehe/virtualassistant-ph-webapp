import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source=readFileSync(new URL("../src/lib/seo-priority-links.ts",import.meta.url),"utf8");

test("GSC top opportunity blogs get intentional authority links",()=>{
  for(const slug of [
    "do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va",
    "dental-virtual-assistant-interview-questions",
    "medical-virtual-assistant-interview-questions",
    "what-does-a-cold-calling-virtual-assistant-do",
    "medical-virtual-assistant-cost-philippines",
    "get-paid-virtual-assistant-philippines",
    "hourly-rates-for-filipino-virtual-project-manager",
  ]) assert.match(source,new RegExp(`"${slug}"\\s*:\\s*\\[`),`${slug}: priority links missing`);
});

test("GSC service opportunities keep supporting research without new URLs",()=>{
  for(const slug of [
    "project-coordination",
    "operations",
    "fulfilment",
    "dental-virtual-assistant",
    "hvac-virtual-assistant",
    "ebay-virtual-assistant",
    "transcription",
    "travel-lifestyle",
    "content-writing",
  ]) assert.match(source,new RegExp(`"${slug}"\\s*:\\s*\\[`),`${slug}: service authority links missing`);

  assert.match(source,/\/blog\/dental-virtual-assistant-interview-questions/);
  assert.match(source,/\/blog\/how-to-hire-a-hvac-virtual-assistant/);
  assert.match(source,/\/blog\/how-to-hire-a-ebay-virtual-assistant/);
  assert.match(source,/\/research\/virtual-assistant-rates-philippines-2026/);
});
