import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("canonical recruiter My Day exposes the no-show queue without sending client email",()=>{
  const page=read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(page,/Call rebooking/);
  assert.match(page,/No-show calls stay visible here/);
  assert.match(page,/Client email is held until a VA shortlist is sent/);
  assert.match(page,/Open lead/);
  assert.doesNotMatch(page,/sendDiscoveryNoShowRebookAction/);
  assert.doesNotMatch(page,/Send rebooking link/);
  assert.doesNotMatch(page,/rebook_email_sent/);
  assert.doesNotMatch(page,/rebook_email_already_sent/);
  assert.doesNotMatch(page,/rebook_email_error/);
});

test("rebooking preview is scoped inside the single recruiter summary fast path",()=>{
  const migration=read("supabase/migrations/20260922102500_dashboard_summary_rebooking_preview.sql");
  assert.match(migration,/l\.lead_type='client_hiring'/);
  assert.match(migration,/l\.discovery_outcome='no_show'/);
  assert.match(migration,/l\.owner_id=p_user_id or l\.owner_id is null/);
  assert.match(migration,/outbound_email_events/);
  assert.match(migration,/discovery_no_show_rebook/);
  assert.match(migration,/no_show_preview/);
  assert.match(migration,/limit 8/);
});
