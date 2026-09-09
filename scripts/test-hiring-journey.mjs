import test from 'node:test';
import assert from 'node:assert/strict';
import { hiringJourney } from '../src/lib/hiring-journey.ts';
const base={id:'role-a',status:'published',applications:[],releasedCount:0,rooms:[],checks:[]};
test('brief and fee blockers take priority over released matches',()=>{
 assert.equal(hiringJourney({...base,status:'draft',releasedCount:2}).step,0);
 assert.equal(hiringJourney({...base,status:'pending',commercial:'quoted',releasedCount:2}).label,'Review fee');
 assert.equal(hiringJourney({...base,status:'pending'}).title,'Brief under review');
});
test('private candidates route to access before decision controls',()=>{
 const applications=[{id:'offer-a',status:'offered'}];
 assert.equal(hiringJourney({...base,applications}).label,'View candidate access');
 assert.equal(hiringJourney({...base,applications,access:'paid'}).href,'/workspace/client/candidates/offer-a');
 assert.equal(hiringJourney({...base,releasedCount:1,access:'comped'}).href,'/workspace/client/jobs/role-a#curated-shortlist');
});
test('completed and paused placements do not restart recruitment',()=>{
 for(const status of ['completed','paused']) assert.match(hiringJourney({...base,status:'closed',rooms:[{id:'room',status}]}).href,/#workroom-room$/);
 assert.equal(hiringJourney({...base,status:'closed'}).title,'Role closed');
});
test('onboarding requires an existing fully completed checklist',()=>{
 const rooms=[{id:'room',status:'active'}];
 assert.equal(hiringJourney({...base,rooms}).title,'Complete onboarding');
 assert.equal(hiringJourney({...base,rooms,checks:[{workroom_id:'room',completed_at:null}]}).step,4);
 assert.equal(hiringJourney({...base,rooms,checks:[{workroom_id:'room',completed_at:'2026-09-09'}]}).title,'Onboarding complete');
});
test('another unfinished hire is not hidden by a completed checklist',()=>{
 const rooms=[{id:'first',status:'active'},{id:'second',status:'active'}];
 assert.match(hiringJourney({...base,rooms,checks:[{workroom_id:'first',completed_at:'2026-09-09'}]}).href,/#workroom-second$/);
});
test('failed queries never claim recruitment or onboarding completion',()=>{
 assert.equal(hiringJourney({...base,unavailable:true}).step,-1);
 assert.equal(hiringJourney({...base,applications:[{id:'a',status:'hired'}]}).title,'Check your hire setup');
});
