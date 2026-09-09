import test from 'node:test';
import assert from 'node:assert/strict';
import { philippineDate, followUpView, leadQueueHref, followUpLabel } from '../src/lib/lead-follow-ups.ts';
test('follow-up day changes at Philippine midnight, not UTC midnight',()=>{
 assert.equal(philippineDate(new Date('2026-09-08T15:59:59Z')),'2026-09-08');
 assert.equal(philippineDate(new Date('2026-09-08T16:00:00Z')),'2026-09-09');
});
test('queue pagination retains both stage and follow-up filters',()=>{
 assert.equal(leadQueueHref('qualified','overdue',2),'/workspace/admin/leads?stage=qualified&follow=overdue&page=2');
 assert.equal(followUpView('invented'),'');
 assert.equal(leadQueueHref('','invented'),'/workspace/admin/leads');
});
test('closed leads never display a follow-up reminder',()=>{
 for(const stage of ['won','lost']) assert.equal(followUpLabel('2026-09-01',stage,'2026-09-09'),'');
 assert.equal(followUpLabel(null,'new','2026-09-09'),'No follow-up scheduled');
 assert.equal(followUpLabel('2026-09-09','new','2026-09-09'),'Due today');
 assert.equal(followUpLabel('2026-09-08','new','2026-09-09'),'Overdue · 2026-09-08');
});
