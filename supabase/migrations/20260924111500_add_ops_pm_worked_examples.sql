-- Add concise expert worked examples to the highest-judgment Operations and
-- Project Management lessons. These use different micro-cases from the learner
-- exercise so they model reasoning without giving away the answer.
-- Preserve all lesson IDs, progress, and existing practice blocks.

with worked_examples (
  course_slug,
  lesson_slug,
  example_title,
  example_text
) as (
  values
  (
    'operations-virtual-assistant',
    'processes-inputs-outputs-owners-and-controls',
    'Worked example: move the control upstream',
    'A booking reaches Dispatch with no gate-code information. The weak response is to let Dispatch discover the problem and call the customer later. The stronger operations response is to place a required-access check before dispatch eligibility. The control belongs where the missing input can still be fixed cheaply, not after a technician is already travelling.'
  ),
  (
    'operations-virtual-assistant',
    'operational-data-quality-and-reconciliation',
    'Worked example: preserve the mismatch',
    'CRM says Job A is Active while Dispatch says Cancelled. Do not choose the status that looks newer and overwrite the other system. Record the mismatch, identify each source timestamp and owner, stop any downstream action that depends on the disputed status, and route the exception to the person who can confirm the authoritative event.'
  ),
  (
    'operations-virtual-assistant',
    'kpi-reporting-and-exception-summaries',
    'Worked example: report evidence before explanation',
    'If on-time completion falls from 91% to 79%, the verified finding is the 12-point decline. "Supplier delays caused it" is only a hypothesis until the underlying jobs support that claim. A strong KPI brief separates what changed, what the data proves, what may explain it, and what should be checked next.'
  ),
  (
    'operations-virtual-assistant',
    'incident-coordination-and-business-continuity-handoffs',
    'Worked example: contain first, diagnose second',
    'A booking system stops creating follow-up tasks. The first operations move is not to edit the automation in production. Preserve incoming enquiries, activate the approved manual capture process, timestamp the last known-good event, record affected records, and escalate the technical diagnosis to the authorised owner. Continuity keeps customers from being lost while the cause is investigated.'
  ),
  (
    'project-management-for-virtual-assistants',
    'projects-scope-deliverables-and-success-criteria',
    'Worked example: separate baseline from a good idea',
    'A stakeholder requests a training video after the portal scope was approved. The video may be valuable, but value does not make it baseline scope. Record it as a requested change, keep the approved portal deliverables unchanged, and ask the sponsor to decide whether the new work should affect budget, resources, or launch timing.'
  ),
  (
    'project-management-for-virtual-assistants',
    'tasks-dependencies-milestones-and-estimates',
    'Worked example: dependencies determine the sequence',
    'If data migration requires a client spreadsheet, and QA requires both development and migration to finish, the spreadsheet is not just another late task. It is a dependency that can move the QA start. Show the chain explicitly so a delay upstream automatically changes the realistic downstream forecast.'
  ),
  (
    'project-management-for-virtual-assistants',
    'risks-issues-dependencies-and-escalation',
    'Worked example: classify what already happened',
    'A client spreadsheet was due Monday and is still missing on Thursday. It is no longer a risk that the spreadsheet might be late; the lateness is an issue. The migration remains dependent on that spreadsheet. The register should show both facts separately so the team can manage the current problem and its downstream consequence.'
  ),
  (
    'project-management-for-virtual-assistants',
    'scope-changes-requests-and-change-control',
    'Worked example: make the trade-off visible',
    'A new deliverable needs three days of marketing work, half a developer day, extra QA, and unbudgeted contractor cost. The coordinator should not answer "yes" or "no". Present options such as post-launch delivery, extra approved capacity, or a revised launch plan, then record the sponsor decision and update the baseline only after approval.'
  )
),
targets as (
  select l.id, w.example_title, w.example_text
  from worked_examples w
  join public.training_courses c on c.slug = w.course_slug
  join public.training_modules m on m.course_id = c.id
  join public.training_lessons l on l.module_id = m.id and l.slug = w.lesson_slug
  where l.is_published = true
),
rebuilt as (
  select
    t.id,
    coalesce(
      jsonb_agg(
        b.block
        order by b.ord
      ) filter (where b.ord < ex.exercise_ord),
      '[]'::jsonb
    )
    || jsonb_build_array(
      jsonb_build_object(
        'type', 'callout',
        'title', t.example_title,
        'text', t.example_text
      )
    )
    || coalesce(
      jsonb_agg(
        b.block
        order by b.ord
      ) filter (where b.ord >= ex.exercise_ord),
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

update public.training_courses
set
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug in ('operations-virtual-assistant', 'project-management-for-virtual-assistants');
