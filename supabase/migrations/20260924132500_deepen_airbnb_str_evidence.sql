-- Deepen Coastline Stays final assessment evidence pack.
-- Keep #434 instructions/rubric and append cross-file evidence idempotently.

update public.training_assessments a
set resource_pack =
  a.resource_pack
  || case when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id'='property_facts'
    ) then '[]'::jsonb else jsonb_build_array(
      jsonb_build_object(
        'id','property_facts','kind','csv','title','Coastline Stays approved property facts',
        'content',$r$property,check_in,check_out,access,parking,approved_occupancy,key_fact
A,15:00,10:00,Smart lock after readiness release,None,4,Early check-in depends on verified turnover readiness
B,15:00,10:00,Smart lock plus approved on-call lockout process,One onsite bay,2,Lockout support uses approved locksmith workflow
C,15:00,10:00,Lockbox released through approved guest workflow,Street parking only,6,Long-stay discount delegated up to 10 percent
D,15:00,10:00,Smart lock,One onsite bay,4,PMS owner block overrides channel availability until corrected$r$
      )
    ) end
  || case when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id'='pms_calendar'
    ) then '[]'::jsonb else jsonb_build_array(
      jsonb_build_object(
        'id','pms_calendar','kind','csv','title','PMS and channel calendar extract',
        'content',$r$property,pms_state,channel_state,last_sync,next_booking,exception
A,Booked and turnover scheduled,Booked,2026-09-24 08:05,Guest arrival 15:00,Early-arrival request 13:00
B,In stay,In stay,2026-09-24 08:02,Checkout tomorrow 10:00,Guest lockout reported 21:40
C,Open inquiry,Available,2026-09-24 08:10,None,Guest requests 25 percent long-stay discount
D,Owner block 24-27 Sep,Available,2026-09-24 07:50,None,Channel conflicts with PMS owner block$r$
      )
    ) end
  || case when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id'='vendor_evidence'
    ) then '[]'::jsonb else jsonb_build_array(
      jsonb_build_object(
        'id','vendor_evidence','kind','document','title','Turnover, access, and maintenance evidence',
        'content',$r$Property A
- Cleaner started 10:35 after checkout.
- Cleaner ETA for completion: 14:30.
- Required completion photo set not yet uploaded at 13:15.
- Previous guest reported damaged bedside lamp; two photos exist.
- Maintenance vendor quote for lamp replacement: 185.
- Owner has not yet approved the replacement quote.
- Arriving guest asks for 13:00 early check-in.

Property B
- Guest reports lockout at 21:40.
- Identity/booking match confirmed in PMS.
- Approved on-call locksmith: Coastal Access Services.
- Locksmith accepted job at 21:47; ETA 22:10.
- No compensation or refund has been approved.

Vendor privacy rule
- Vendors receive only the property/access information required for the job.
- Guest phone, identity documents, or unrelated booking details must not be copied into vendor chat.$r$
      )
    ) end
  || case when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id'='owner_reporting'
    ) then '[]'::jsonb else jsonb_build_array(
      jsonb_build_object(
        'id','owner_reporting','kind','csv','title','Owner reporting and post-stay records',
        'content',$r$property,period,occupancy_or_status,guest_issue,verified_evidence,owner_attention
A,Current shift,Arrival 15:00,Early check-in plus prior lamp damage,Cleaner ETA 14:30; lamp photos captured,Readiness and lamp approval
B,Current stay,Occupied,Lockout,Booking identity confirmed; locksmith ETA recorded,Monitor access resolution
C,Inquiry,Not booked,25 percent discount request,Owner rule allows VA up to 10 percent,Owner approval needed for larger concession
D,Blocked in PMS,No booking,Channel shows available,PMS owner block and older channel sync,Contain calendar conflict
A,Previous stay,Completed,Negative review says room was unclean,Turnover photos exist; missed-bin note recorded,Review response and process follow-up$r$
      )
    ) end,
  updated_at=now()
from public.training_courses c
where a.course_id=c.id
  and c.slug='airbnb-short-term-rental-virtual-assistant'
  and a.is_published=true;

update public.training_courses
set content_version=content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
where slug='airbnb-short-term-rental-virtual-assistant';
