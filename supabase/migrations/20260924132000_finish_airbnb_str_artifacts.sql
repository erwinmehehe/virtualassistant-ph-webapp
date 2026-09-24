-- Finish Airbnb / Short-Term Rental VA operating artifacts and expert modelling.
-- Preserves lesson IDs and learner progress.

with artifact_specs(lesson_slug,template_title,template_text,checklist_items) as (
values
('booking-lifecycle-and-channel-basics','Guest journey and source-system control map','Stage:
Booking / property:
Channel:
System of record:
Verified status:
Guest communication:
Payment / approval boundary:
Turnover dependency:
Maintenance dependency:
Owner:
Exception:
Next handoff:
Evidence link:','["Every lifecycle stage names its system of record.","Guest communication uses verified booking/property facts.","Payment, refund, and commercial decisions are separated from admin work.","Turnover and maintenance dependencies are visible before arrival.","Exceptions remain linked to an owner.","The next handoff can continue without reconstructing the booking."]'::jsonb),
('listing-information-house-rules-and-source-of-truth','Property facts and listing discrepancy register','Property:
Fact / field:
Approved source:
Approved value:
Channel / listing value:
Mismatch:
Guest-facing risk:
Correction owner:
Approval required:
Correction status:
Verification date:
Evidence link:','["Each fact traces to an approved source.","Channel text is not treated as authoritative merely because it is public.","Amenities, fees, access, rules, and check-in details are checked separately.","Conflicts stay visible until corrected.","Guest-facing risk is identified.","Verification date and owner are recorded."]'::jsonb),
('reservation-administration-and-guest-details','Reservation administration and guest-detail exception tracker','Booking:
Property:
Channel:
Stay dates:
Guest count:
Required contact details:
Special request:
Approved rule:
Payment / status reference:
Exception / risk:
Action allowed:
Owner decision needed:
Guest update:
Next checkpoint:','["Only necessary guest/contact information is recorded.","Stay dates, guest count, and booking state match the source system.","Special requests are not treated as approved until checked.","Payment references are recorded without exposing unnecessary financial data.","Exceptions route to the correct owner.","Guest updates state verified status and a realistic checkpoint."]'::jsonb),
('calendar-coordination-and-double-booking-prevention','Calendar conflict and availability containment log','Property:
Affected dates:
Channel calendar:
PMS state:
Owner block / maintenance hold:
Last sync time:
Conflict:
Immediate containment:
Channels verified:
Guest / booking risk:
Owner:
Recovery action:
Recheck:
Evidence:','["The PMS/configured source of truth is checked first.","No availability is promised while calendars conflict.","Owner stays, maintenance holds, and reservations are distinguished.","Immediate containment prevents a new conflicting booking.","Sync timestamps and affected channels are recorded.","Recovery is rechecked after correction."]'::jsonb),
('pre-arrival-check-in-and-stay-messaging','Guest messaging and access-release record','Booking:
Property:
Stay stage:
Message type:
Approved source:
Access instruction status:
Release timing:
Guest question / request:
Response:
Privacy / security check:
Escalation trigger:
Owner:
Next checkpoint:
Message sent / held:','["Access information is released only at the approved time/channel.","Messages use the current property source of truth.","Codes or sensitive access details are not exposed early or broadly.","Requests beyond delegated authority stay pending.","Escalation triggers are explicit.","Sent/held status and next checkpoint are recorded."]'::jsonb),
('questions-complaints-and-escalation','Guest complaint and incident triage log','Property / booking:
Guest issue:
Reported time:
Safety impact:
Service impact:
Verified facts:
Unknowns:
Immediate admin action:
Guest response:
Refund / compensation boundary:
Escalation owner:
Evidence:
Next checkpoint:
Status:','["Safety and service issues are separated but both remain visible.","Guest wording and verified facts are distinguished.","The VA does not promise refunds, compensation, or liability outcomes.","Immediate actions stay within approved procedures.","Evidence is preserved before conclusions are made.","Escalation owner and next checkpoint are explicit."]'::jsonb),
('cleaning-linen-supplies-and-turnover-checklists','Turnover readiness and arrival-release board','Property:
Checkout:
Next check-in:
Cleaner:
Cleaning status:
Completion evidence:
Linen:
Supplies:
Damage / missing items:
Maintenance blocker:
Final QA:
Ready / not ready:
Owner:
Guest impact:
Next checkpoint:','["Cleaner completion is supported by required evidence.","Linen, supplies, damage, and maintenance are checked independently.","A cleaner saying ''done'' does not automatically mean guest-ready.","Blockers remain visible until resolved.","Ready/not-ready state reflects actual evidence.","Arrival messaging follows the verified readiness state."]'::jsonb),
('maintenance-requests-and-emergency-routing','Maintenance and vendor incident queue','Property:
Issue:
Reported by / time:
Severity:
Safety / access impact:
Evidence:
Immediate action:
Vendor:
Vendor ETA:
Spend / approval boundary:
Owner approval:
Guest communication:
Next checkpoint:
Resolution evidence:','["Severity is based on the approved routing rule, not guesswork.","Emergency/access handling is separated from routine maintenance.","Vendor access and guest privacy are protected.","Spend approval is separate from issue severity.","Guest messages avoid unsupported timing or compensation promises.","Resolution requires evidence and a final checkpoint."]'::jsonb),
('rates-discounts-fees-and-approval-boundaries','Commercial change and discount approval request','Property / booking:
Stay dates:
Current rate / rule:
Guest request:
Requested discount / fee change:
VA delegated authority:
Action VA may take:
Owner approval required:
Context supplied:
Decision:
Guest response after decision:
Channel update:
Evidence:
Status:','["The current approved pricing/rule is shown.","The guest request is not confused with an approved change.","VA authority limit is explicit.","Anything beyond delegated authority is routed before commitment.","Channel/rate changes occur only after approval.","Guest wording matches the approved decision."]'::jsonb),
('reviews-guest-records-and-owner-reporting','Post-stay review and owner reporting pack','Property / booking:
Verified stay events:
Guest complaint / praise:
Resolution evidence:
Review text / rating:
Facts supported:
Unverified claims:
Response draft:
Maintenance follow-up:
Owner metric / issue:
Recommendation:
Owner decision needed:
Next action:','["Verified events are separated from guest opinions or unverified claims.","The review response does not invent facts or argue aggressively.","Operational fixes are supported by evidence.","Owner reporting includes unresolved risk, not only positive outcomes.","Recommendations are separated from owner decisions.","Next action and ownership are clear."]'::jsonb),
('vendor-and-multi-property-handoffs','Multi-property end-of-shift handoff','Property:
Current guest / booking state:
Arrival / departure:
Turnover state:
Calendar risk:
Guest messages open:
Maintenance:
Vendor:
Approval pending:
Commercial exception:
Owner:
Next checkpoint:
High-risk note:
Evidence link:','["Every property has an explicit current state.","Arrivals, departures, turnovers, maintenance, and calendar risks are all visible.","Open guest messages have owners/checkpoints.","Vendor work and approvals are not blended together.","High-risk exceptions are surfaced first.","The next shift can continue without reopening every thread."]'::jsonb),
('composite-short-term-rental-va-simulation','Coastline Stays multi-property control-desk portfolio','SHIFT:
Properties in scope:
Highest-priority issue:

BOOKINGS / CALENDAR
Conflicts:
Containment:
Owner decisions:

GUESTS
Open messages:
Access issues:
Complaints:
Checkpoints:

TURNOVER / MAINTENANCE
Ready properties:
Blocked properties:
Vendor actions:
Evidence:

COMMERCIAL
Discount / refund requests:
Authority boundary:
Pending approvals:

REPORTING / HANDOFF
Owner risks:
Next-shift priorities:
Owners:
Evidence links:','["All properties use one consistent source-of-truth model.","Calendar, guest, turnover, maintenance, and commercial issues are prioritised by timing/impact.","Safety/access problems do not get buried behind routine requests.","Refund/discount/pricing decisions stay within delegated authority.","Evidence and unresolved risks remain visible.","The final handoff is actionable for both owner and next shift."]'::jsonb)
),
targets as (
  select l.id,s.template_title,s.template_text,s.checklist_items
  from artifact_specs s
  join public.training_courses c on c.slug='airbnb-short-term-rental-virtual-assistant'
  join public.training_modules m on m.course_id=c.id
  join public.training_lessons l on l.module_id=m.id and l.slug=s.lesson_slug
  where l.is_published=true
),
rebuilt as (
  select t.id,
    jsonb_agg(
      case
        when b.block->>'type'='template' then jsonb_build_object(
          'type','template','title',t.template_title,'text',t.template_text
        )
        when b.block->>'type'='checklist' then jsonb_build_object(
          'type','checklist','title','Before you submit','items',t.checklist_items
        )
        else b.block
      end order by b.ord
    ) as content
  from targets t
  cross join lateral jsonb_array_elements(
    (select l2.content from public.training_lessons l2 where l2.id=t.id)
  ) with ordinality b(block,ord)
  group by t.id,t.template_title,t.template_text,t.checklist_items
)
update public.training_lessons l
set content=r.content,
    content_version=l.content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
from rebuilt r
where l.id=r.id;

with worked_examples(lesson_slug,example_title,example_text) as (
values
('listing-information-house-rules-and-source-of-truth','Worked example: public listing text is not automatically the source of truth','A channel listing says parking is included, but the approved property sheet says parking is not available. Do not preserve the channel copy because guests can already see it. Treat the approved property record as the authority, flag the public mismatch, route the correction, and avoid repeating the unsupported parking promise in guest messages.'),
('reservation-administration-and-guest-details','Worked example: collect only what the booking workflow actually needs','A guest offers passport details and a full home address in a chat message even though the current booking workflow only requires the approved identity fields already stored on-platform. Do not copy extra personal data into another tracker just because it was provided. Keep only the necessary booking/admin data and use approved systems for any required verification.'),
('cleaning-linen-supplies-and-turnover-checklists','Worked example: cleaner complete is not the same as guest-ready','A cleaner marks the job complete at 14:10, but the required photo set is missing and a broken lamp is still logged in the bedroom. The property should not be marked ready solely from the cleaner status. Verify the required completion evidence, confirm whether the lamp blocks safe/approved use, assign the maintenance decision, and update the arriving guest only from the verified readiness state.'),
('reviews-guest-records-and-owner-reporting','Worked example: report the complaint and the evidence separately','A guest review says the apartment was ''never cleaned,'' but the turnover record contains timestamped completion photos and a later complaint about one missed bathroom bin. Do not call the guest dishonest or rewrite the event to protect the property. Report the guest claim, the verified cleaning evidence, the documented missed item, the resolution, and any process improvement separately.')
),
targets as (
  select l.id,w.example_title,w.example_text
  from worked_examples w
  join public.training_courses c on c.slug='airbnb-short-term-rental-virtual-assistant'
  join public.training_modules m on m.course_id=c.id
  join public.training_lessons l on l.module_id=m.id and l.slug=w.lesson_slug
  where l.is_published=true
),
rebuilt as (
  select t.id,
    coalesce(jsonb_agg(b.block order by b.ord) filter(where b.ord<ex.exercise_ord),'[]'::jsonb)
    || jsonb_build_array(jsonb_build_object('type','callout','title',t.example_title,'text',t.example_text))
    || coalesce(jsonb_agg(b.block order by b.ord) filter(where b.ord>=ex.exercise_ord),'[]'::jsonb) as content
  from targets t
  join lateral (
    select min(b2.ord) exercise_ord
    from jsonb_array_elements((select l2.content from public.training_lessons l2 where l2.id=t.id))
      with ordinality b2(block,ord)
    where b2.block->>'type'='exercise'
  ) ex on ex.exercise_ord is not null
  cross join lateral jsonb_array_elements((select l3.content from public.training_lessons l3 where l3.id=t.id))
    with ordinality b(block,ord)
  where not exists (
    select 1 from jsonb_array_elements((select l4.content from public.training_lessons l4 where l4.id=t.id)) e
    where e->>'type'='callout' and e->>'title'=t.example_title
  )
  group by t.id,t.example_title,t.example_text,ex.exercise_ord
)
update public.training_lessons l
set content=r.content,
    content_version=l.content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
from rebuilt r
where l.id=r.id;

update public.training_courses
set content_version=content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
where slug='airbnb-short-term-rental-virtual-assistant';
