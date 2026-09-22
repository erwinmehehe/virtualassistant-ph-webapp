import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("canonical recruiter My Day exposes the call rebooking queue",()=>{
  const page=read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(page,/Call rebooking/);
  assert.match(page,/Clients who missed a discovery call stay here until they choose another time/);
  assert.match(page,/sendDiscoveryNoShowRebookAction/);
  assert.match(page,/Send rebooking link/);
  assert.match(page,/Link sent/);
  assert.match(page,/no_show_preview/);
  assert.match(page,/rebook_email_sent/);
  assert.match(page,/rebook_email_already_sent/);
  assert.match(page,/rebook_email_error/);
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
