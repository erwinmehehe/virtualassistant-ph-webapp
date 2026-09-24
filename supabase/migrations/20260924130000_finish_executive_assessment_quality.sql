-- Finish the remaining core training quality gap for Executive VA.
-- Operations, Project Management, Customer Support, and SEO already have
-- course-specific final rubrics/evidence packs plus expert worked examples.
-- This migration brings Executive VA to the same standard without changing
-- lesson IDs, learner progress, assessment submissions, or publication state.

with worked_examples (
  lesson_slug,
  example_title,
  example_text
) as (
  values
  (
    'confidentiality-judgment-and-authority',
    'Worked example: access does not equal authority',
    'A vendor emails new bank details and asks for today''s payment while a colleague separately asks why a private candidate interview is on the executive calendar. Both requests are easy to act on quickly and both are risky. Put the bank change on hold until independently verified through the approved process. For the interview, share only the minimum operational information needed, not the confidential purpose or candidate details. Executive access should make the response more controlled, not more permissive.'
  ),
  (
    'complex-calendar-management',
    'Worked example: protect consequence, preparation, and travel time',
    'An investor call from 14:00-15:00 overlaps a candidate interview from 14:30-15:30, while a critical finance review starts at 16:00 and an airport transfer begins at 17:00. Do not simply move the shortest meeting. Check who owns each commitment, preparation needs, stakeholder consequence, travel buffer, and which trade-off requires executive approval. The repaired day should make the important commitments physically and operationally possible.'
  ),
  (
    'meeting-preparation-agendas-and-briefing-notes',
    'Worked example: surface the conflicting number instead of choosing one',
    'The investor deck says revenue is 4.8M while the finance note says 4.5M. Do not silently pick the newer-looking figure or average them. Put the discrepancy in the brief, link both sources, state what is verified and what is unresolved, and identify the finance owner who must confirm the number before the executive presents it as fact.'
  ),
  (
    'changes-disruptions-and-contingency-handoffs',
    'Worked example: contain travel disruption before making commitments',
    'A flight cancellation threatens tomorrow''s 09:00 client meeting. The hotel is non-refundable and the airport transfer is already booked. First confirm the cancellation, identify the meeting and booking dependencies, prepare realistic travel/remote-meeting options, show the cost and stakeholder trade-offs, and ask for the exact decision the executive must make. Do not promise a new arrival time or cancel paid bookings outside delegated authority.'
  )
),
targets as (
  select l.id, w.example_title, w.example_text
  from worked_examples w
  join public.training_courses c
    on c.slug = 'executive-virtual-assistant'
  join public.training_modules m
    on m.course_id = c.id
  join public.training_lessons l
    on l.module_id = m.id
   and l.slug = w.lesson_slug
  where l.is_published = true
),
rebuilt as (
  select
    t.id,
    coalesce(
      jsonb_agg(b.block order by b.ord)
        filter (where b.ord < ex.exercise_ord),
      '[]'::jsonb
    )
    || jsonb_build_array(
      jsonb_build_object(
        'type','callout',
        'title',t.example_title,
        'text',t.example_text
      )
    )
    || coalesce(
      jsonb_agg(b.block order by b.ord)
        filter (where b.ord >= ex.exercise_ord),
      '[]'::jsonb
    ) as content
  from targets t
  join lateral (
    select min(b2.ord) as exercise_ord
    from jsonb_array_elements(
      (select l2.content from public.training_lessons l2 where l2.id = t.id)
    ) with ordinality b2(block, ord)
    where b2.block->>'type' = 'exercise'
  ) ex on ex.exercise_ord is not null
  cross join lateral jsonb_array_elements(
    (select l3.content from public.training_lessons l3 where l3.id = t.id)
  ) with ordinality b(block, ord)
  where not exists (
    select 1
    from jsonb_array_elements(
      (select l4.content from public.training_lessons l4 where l4.id = t.id)
    ) existing
    where existing->>'type' = 'callout'
      and existing->>'title' = t.example_title
  )
  group by t.id, t.example_title, t.example_text, ex.exercise_ord
)
update public.training_lessons l
set
  content = r.content,
  content_version = l.content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
from rebuilt r
where l.id = r.id;

update public.training_assessments a
set
  instructions = $ins$Complete the Executive Office control-desk simulation using only the supplied evidence.

Submit:
1. A prioritised and classified executive work queue with deadline, consequence, decision owner, and next checkpoint.
2. An inbox triage log covering the board request, vendor bank-detail change, private candidate message, travel disruption, and other time-sensitive threads.
3. A repaired calendar plan that resolves the investor/candidate conflict while preserving preparation, travel, and critical finance-review constraints.
4. A bank-detail verification hold and escalation note showing what may proceed and what cannot.
5. A one-page investor briefing note that preserves the conflicting 4.8M vs 4.5M revenue evidence and identifies the owner who must resolve it.
6. A travel-disruption options note with stakeholder impact, costs/penalties, actions the VA may take now, and the decision still needed.
7. A confidentiality-safe response for the private candidate enquiry.
8. Three decision-ready executive queue items written so the executive can answer quickly.
9. A renewal/thread summary with the exact decision, deadline, owner, and supporting source.
10. An end-of-day handoff listing completed work, open decisions, waiting items, risks, tomorrow-first actions, and source links.

Do not invent approvals or executive intent, disclose confidential personnel information beyond need-to-know, treat emailed bank-detail changes as verified, present conflicting figures as confirmed, make major schedule trade-offs without authority, or create commercial/travel commitments outside delegated limits.$ins$,
  rubric = $rubric$[
    {"id":"prioritisation","label":"Executive prioritisation and consequence judgment","weight":20,"description":"Orders work by deadline, consequence, dependency and reversibility rather than sender tone or recency."},
    {"id":"confidentiality_security","label":"Confidentiality, security and payment controls","weight":20,"description":"Uses minimum-necessary information, protects personnel and executive data, and independently verifies sensitive financial changes before action.","hard_fail":true},
    {"id":"calendar_continuity","label":"Calendar, travel and continuity control","weight":15,"description":"Produces a feasible schedule and disruption response that includes preparation, travel buffers, stakeholder impact, options and checkpoints."},
    {"id":"evidence_briefing","label":"Evidence and executive briefing quality","weight":20,"description":"Separates verified facts from conflicts and assumptions, cites source material, and prepares concise decision-ready briefings."},
    {"id":"authority_decisions","label":"Authority and decision preparation","weight":15,"description":"Moves delegated work independently while keeping high-impact commitments, schedule trade-offs, payments and material statements with the authorised owner."},
    {"id":"handoff","label":"Communication and end-of-day handoff","weight":10,"description":"Leaves clear drafts, owners, deadlines, open decisions, risks and next checkpoints another assistant can continue from."}
  ]$rubric$::jsonb,
  resource_pack = case
    when exists (
      select 1
      from jsonb_array_elements(a.resource_pack) r
      where r->>'id' = 'travel_finance'
    ) then a.resource_pack
    else a.resource_pack || $pack$[
      {
        "id":"travel_finance",
        "title":"Travel disruption and finance evidence",
        "kind":"document",
        "content":"Travel: evening flight cancelled. Tomorrow client meeting is 09:00 local time. Alternative flight arrives 08:25 with a 45-minute airport-to-client transfer. Remote attendance is possible if the client agrees. Current hotel is non-refundable. Airport transfer is booked and cancellable with a fee.\nFinance: vendor email requests bank-account change before an urgent invoice payment. Existing supplier record has different bank details. Client rule: bank-detail changes require independent verification through an approved contact route before the payment workflow continues.\nInvestor reporting: deck draft says revenue 4.8M; finance review note says 4.5M; neither source explains the difference."
      }
    ]$pack$::jsonb
  end,
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'executive-virtual-assistant';

update public.training_courses
set
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug = 'executive-virtual-assistant';
