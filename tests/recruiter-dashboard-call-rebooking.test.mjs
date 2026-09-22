import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("main recruiter dashboard exposes call rebooking queue",()=>{
  const page=read("src/app/workspace/recruiter/page.tsx");
  assert.match(page,/title="Call rebooking"/);
  assert.match(page,/No-show discovery calls stay here until the client chooses another time/);
  assert.match(page,/sendDiscoveryNoShowRebookAction/);
  assert.match(page,/Send rebooking link/);
  assert.match(page,/Link sent/);
  assert.match(page,/Open full rebooking queue/);
  assert.match(page,/rebook_email_sent/);
  assert.match(page,/rebook_email_already_sent/);
  assert.match(page,/rebook_email_error/);
});

test("rebooking queue is scoped to client hiring no-shows owned by recruiter or unassigned",()=>{
  const page=read("src/app/workspace/recruiter/page.tsx");
  assert.match(page,/\.eq\("lead_type", "client_hiring"\)/);
  assert.match(page,/\.eq\("discovery_outcome", "no_show"\)/);
  assert.match(page,/owner_id\.eq\.\$\{userId\},owner_id\.is\.null/);
  assert.match(page,/outbound_email_events/);
  assert.match(page,/discovery_no_show_rebook/);
});
