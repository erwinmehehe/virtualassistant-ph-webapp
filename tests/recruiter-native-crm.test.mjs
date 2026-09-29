import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("recruiter CRM keeps table and board views on the same live lead records",async()=>{
  const page=await read("src/app/workspace/recruiter/crm/page.tsx");
  assert.match(page,/mode === "board"/);
  assert.match(page,/RecruiterLeadKanban/);
  assert.match(page,/Client pipeline/);
  assert.match(page,/Search client, company, email, or role/);
  assert.match(page,/lead_intake/);
  assert.match(page,/jobs/);
});

test("CRM record page keeps client actions primary and secondary controls collapsed",async()=>{
  const page=await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");
  assert.match(page,/updateLeadCrmAction/);
  assert.match(page,/addRecruiterNoteAction/);
  assert.match(page,/createRecruiterTaskAction/);
  assert.match(page,/recruiter_activity/);
  assert.match(page,/recruiter_notes/);
  assert.match(page,/recruiter_tasks/);
  assert.match(page,/Open linked role/);
  assert.match(page,/sendClientFollowupAction/);
  assert.match(page,/Move this hire forward/);
  assert.match(page,/Activity history/);
});

test("recruiter navigation exposes CRM as a primary workspace destination",async()=>{
  const nav=await read("src/components/app-nav-links.tsx");
  assert.match(nav,/\["Clients", "\/workspace\/recruiter\/crm", UsersRound\]/);
  assert.match(nav,/\["Client messages", "\/workspace\/recruiter\/messages", MessageCircle\]/);
  assert.ok(nav.includes('recruiter: ["/workspace/recruiter/today", "/workspace/recruiter/crm", "/workspace/recruiter/messages", "/workspace/recruiter/roles"],'));
});
