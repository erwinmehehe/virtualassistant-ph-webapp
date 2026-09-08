import test from 'node:test';
import assert from 'node:assert/strict';
import { pendingReleasedMatches, validateLeadUpdate } from '../src/lib/agency-pipeline.ts';

test('released shortlists appear before any applications exist',()=>{
  assert.equal(pendingReleasedMatches([{job_id:'a',va_id:'x'}],[]).length,1);
});
test('application stages take precedence; duplicate releases do not inflate counts',()=>{
  const matches=[{job_id:'a',va_id:'x'},{job_id:'a',va_id:'x'},{job_id:'b',va_id:'x'}];
  assert.deepEqual(pendingReleasedMatches(matches,[{job_id:'a',va_id:'x',status:'hired'}]),[{job_id:'b',va_id:'x'}]);
});
function form(stage='qualified',date='2026-10-02'){
  const f=new FormData();f.set('lead_id','11111111-1111-4111-8111-111111111111');f.set('sales_stage',stage);f.set('follow_up_on',date);f.set('sales_notes','  Budget discussed  ');return f;
}
test('lead updates preserve valid follow-ups and trim notes',()=>{
  assert.equal(validateLeadUpdate(form()).follow_up_on,'2026-10-02');
  assert.equal(validateLeadUpdate(form()).sales_notes,'Budget discussed');
});
test('closed opportunities no longer create follow-up reminders',()=>{
  for(const stage of ['won','lost']) assert.equal(validateLeadUpdate(form(stage)).follow_up_on,null);
});
test('malformed IDs, impossible dates, unknown stages and oversized notes fail',()=>{
  assert.throws(()=>validateLeadUpdate(form('invented')));
  assert.throws(()=>validateLeadUpdate(form('qualified','2026-02-30')));
  assert.throws(()=>validateLeadUpdate(form('qualified','invalid')));
  const f=form();f.set('lead_id','bad');assert.throws(()=>validateLeadUpdate(f));
  const long=form();long.set('sales_notes','x'.repeat(4001));assert.throws(()=>validateLeadUpdate(long));
});
