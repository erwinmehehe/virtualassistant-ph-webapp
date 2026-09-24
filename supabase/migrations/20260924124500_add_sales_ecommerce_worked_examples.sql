-- Add concise expert worked examples before the highest-judgment Sales and E-commerce exercises.
-- Each example uses a different mini-case from the learner task so it models reasoning without giving away the answer.

with worked_examples(course_slug, lesson_slug, example_title, example_text) as (
  values
  (
    'sales-lead-generation-virtual-assistant',
    'ethical-lead-research-and-data-quality',
    'Worked example: available data is not automatically usable data',
    'A public profile shows a prospect’s personal mobile number, while the company website provides a generic business contact form. The client brief only requires a business contact route. Do not collect the personal number merely because it is visible. Use the approved business route, record the source, and keep data collection limited to what the sales workflow actually needs.'
  ),
  (
    'sales-lead-generation-virtual-assistant',
    'deduplication-enrichment-and-crm-hygiene',
    'Worked example: newest does not always mean authoritative',
    'Two CRM records share the same company and person. The newer import has a different title but no source, while the older record links to a current company page and contains the opt-out history. Do not overwrite the older record just because the import is newer. Preserve suppression and interaction history, verify the role from a current source, and merge only after identity is clear.'
  ),
  (
    'sales-lead-generation-virtual-assistant',
    'sequences-follow-ups-and-reply-triage',
    'Worked example: an opt-out is an action, not a debate',
    'A prospect replies, "Stop emailing me and remove my details." The next step is not another persuasive reply or one more automated touch. Stop the sequence through the approved suppression process, update the CRM, preserve the original request, send only the approved confirmation if the client workflow calls for one, and escalate any data-source/privacy question separately.'
  ),
  (
    'sales-lead-generation-virtual-assistant',
    'qualification-support-and-discovery-boundaries',
    'Worked example: interest is not complete qualification',
    'A prospect says the service sounds useful and agrees to a call, but budget authority and timing are unknown. A meeting can be booked if the workflow allows it, but the record should not be promoted to a stage that requires confirmed commercial criteria. Record what is known, show what remains unanswered, and hand the discovery questions to the salesperson.'
  ),
  (
    'ecommerce-virtual-assistant',
    'products-variants-skus-and-source-data',
    'Worked example: fix identity before fixing the listing',
    'Two product records use the same SKU but show different titles and inventory counts. Do not pick the prettier listing, combine stock, or delete one record first. Identify the authoritative product/variant source, confirm whether the records represent one item or two, preserve order history, then plan the correction and downstream sync checks.'
  ),
  (
    'ecommerce-virtual-assistant',
    'shipping-tracking-and-fulfilment-communication',
    'Worked example: delivered does not end the investigation',
    'A carrier event says Delivered, but the customer says the parcel is missing and the supplied evidence has no delivery photo. Do not accuse the customer or promise an immediate replacement. Verify the order/address, review available carrier evidence, follow the approved missing-parcel workflow, communicate the next checkpoint, and route any replacement/refund decision to the authorised owner.'
  ),
  (
    'ecommerce-virtual-assistant',
    'inventory-monitoring-and-reorder-administration',
    'Worked example: preserve the discrepancy',
    'ERP shows 18 units, the warehouse count shows 14, and the marketplace shows 9. The goal is not to make all three numbers equal by editing them. Record timestamps and sources, identify the approved inventory source of truth, contain any overselling risk, investigate the mismatch, and only update downstream systems once evidence supports the correction.'
  ),
  (
    'ecommerce-virtual-assistant',
    'promotions-discount-codes-and-launch-checklists',
    'Worked example: a broken eligibility rule is a no-go',
    'A promotion is meant to exclude a premium collection, but staging applies the discount anyway. The banner and email are already approved. Creative approval does not make the pricing logic safe. Hold launch, record the failed test, route the rule fix to the correct owner, retest eligible and excluded products plus stacking, and release only after the actual checkout behavior matches the brief.'
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
      jsonb_agg(b.block order by b.ord)
        filter (where b.ord < ex.exercise_ord),
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

update public.training_courses
set
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug in (
  'sales-lead-generation-virtual-assistant',
  'ecommerce-virtual-assistant'
);
