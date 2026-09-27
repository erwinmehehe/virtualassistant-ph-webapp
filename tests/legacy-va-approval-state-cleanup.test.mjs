import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("legacy directory-visible rows are hidden when they are not actually public eligible",async()=>{
  const migration=await read("supabase/migrations/20260927103000_cleanup_legacy_va_approval_state.sql");
  assert.match(migration,/update public\.va_profiles v/);
  assert.match(migration,/directory_visible = false/);
  assert.match(migration,/private\.public_va_directory_rows\(\)/);
});

test("legacy approved or bench VAs below 80 percent return to profile review when safe",async()=>{
  const migration=await read("supabase/migrations/20260927103000_cleanup_legacy_va_approval_state.sql");
  assert.match(migration,/d\.stage in \('approved','bench'\)/);
  assert.match(migration,/coalesce\(d\.completion_score,0\) < 80/);
  assert.match(migration,/s\.shortlist_status = 'released'/);
  assert.match(migration,/i\.status <> 'cancelled'/);
  assert.match(migration,/a\.status in \('interview','offered','hired'\)/);
  assert.match(migration,/o\.status not in \('declined','cancelled'\)/);
  assert.match(migration,/set stage = 'profile'/);
});
