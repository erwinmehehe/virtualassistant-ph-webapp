-- Add concise expert worked examples to high-judgment Customer Support and SEO lessons.
-- Examples use different micro-cases from the learner exercise, model reasoning,
-- and are inserted immediately before the existing exercise.
-- Preserve lesson IDs, learner progress, and existing practical artifacts.

with worked_examples (
  course_slug,
  lesson_slug,
  example_title,
  example_text
) as (
  values
  (
    'customer-support-virtual-assistant',
    'ticket-triage-priority-and-routing',
    'Worked example: consequence beats volume',
    'Two tickets arrive together. One customer is angry about a parcel that arrived one day late. Another reports a password-reset attempt from an email address that does not match the account. The louder complaint is not automatically first. The account-security case has a higher potential consequence and a shorter safe decision window, so secure routing and identity protection come before routine complaint handling.'
  ),
  (
    'customer-support-virtual-assistant',
    'using-a-knowledge-base-without-copy-paste-support',
    'Worked example: prefer the reviewed source of truth',
    'A saved macro says approved refunds appear within five business days, but the reviewed knowledge-base article says posting time depends on the payment provider and no fixed date should be promised. Do not choose the more convenient wording. Use the current reviewed source, flag the stale macro for correction, and tell the customer only what the approved source supports.'
  ),
  (
    'customer-support-virtual-assistant',
    'troubleshooting-boundaries-and-escalation',
    'Worked example: stop when identity is uncertain',
    'A customer asks for a password reset from an email address that does not match the account. Even if the request sounds urgent, the next step is not to change the account or reveal account details. Verify only through the approved identity process, document the mismatch, preserve access, and escalate to the authorised security owner when the evidence does not resolve safely.'
  ),
  (
    'customer-support-virtual-assistant',
    'complaints-angry-customers-and-de-escalation',
    'Worked example: move the investigation private without hiding the complaint',
    'A customer posts publicly that a refund has not arrived. A strong response acknowledges the delay without exposing order, payment, or account details, moves the investigation to the approved private channel, links the public contact to the existing case, and gives a realistic checkpoint. De-escalation comes from clear ownership and accurate next steps, not from arguing or making a refund-posting promise.'
  ),
  (
    'seo-virtual-assistant',
    'keywords-topics-entities-and-cannibalization',
    'Worked example: overlap is not automatically cannibalization',
    'A service page ranks for "small business bookkeeping" while a guide ranks for "how small business bookkeeping works." Both mention similar terms, but their jobs are different. Before consolidating anything, compare intent, query patterns, page purpose, internal links, and performance. Shared keywords are evidence of overlap; they are not proof that one URL should be removed.'
  ),
  (
    'seo-virtual-assistant',
    'canonicals-indexability-redirects-and-sitemap-basics',
    'Worked example: diagnose each signal separately',
    'A URL returns 200, has a self-referencing canonical, carries a noindex directive, and still appears in the XML sitemap. The canonical does not cancel the noindex. The issue is conflicting indexation intent: the page is explicitly non-indexable but is still being submitted for discovery. Record status, indexability, canonical, and sitemap state separately before recommending the exact correction.'
  ),
  (
    'seo-virtual-assistant',
    'google-search-console-and-performance-analysis',
    'Worked example: describe the change before explaining it',
    'A page moves from 5,000 to 6,200 impressions while clicks fall from 48 to 42 and average position shifts from 7.8 to 8.4. The evidence shows more visibility, fewer clicks, lower CTR, and slightly weaker average position. It does not prove the title caused the decline. Check query mix, device, country, page changes, and comparable periods before turning an observation into a causal claim.'
  ),
  (
    'seo-virtual-assistant',
    'seo-qa-reporting-and-change-validation',
    'Worked example: implementation claims are not validation',
    'A developer says a redirect chain was fixed, a sitemap entry was removed, and two internal links were added. Your validation finds the redirect fixed, the sitemap entry still present, one link present, and one link missing. Report each item independently as verified, failed, or incomplete. Do not mark the whole ticket complete because part of the implementation succeeded.'
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
where slug in ('customer-support-virtual-assistant', 'seo-virtual-assistant');
