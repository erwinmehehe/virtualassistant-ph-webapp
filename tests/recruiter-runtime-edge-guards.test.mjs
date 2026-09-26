test("availability confirmation does not block client shortlist release",()=>{
  const action=read("src/app/actions/matching.ts");
  const table=read("src/components/matching-candidate-table.tsx");
  const matching=read("src/lib/matching.ts");
  const migration=read("supabase/migrations/20260926123000_remove_matching_availability_overlap_gates.sql");

  assert.doesNotMatch(action,/AVAILABILITY_FRESH_DAYS/);
  assert.doesNotMatch(action,/must reconfirm availability before client release/);
  assert.doesNotMatch(action,/VA availability is stale/);
  assert.doesNotMatch(table,/selectedReleaseBlocked|Confirmation needed|Send availability reminder/);
  assert.doesNotMatch(matching,/hours of daily overlap; profile shows/);
  assert.match(migration,/drop trigger if exists shortlist_release_availability_guard/);
});

test("recruiter commercial actions stay on the canonical role workspace",()=>{
  const actions=read("src/app/actions/agency-role.ts");
  assert.doesNotMatch(actions,/workspace\/recruiter\/matching/);
  assert.match(actions,/workspace\/recruiter\/roles/);
  assert.doesNotMatch(actions,/This role is assigned to another recruiter/);
  assert.doesNotMatch(actions,/job\.recruiter_id && job\.recruiter_id !==/);
});
