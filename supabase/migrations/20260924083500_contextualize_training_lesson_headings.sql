-- Replace generic repeated training section headings with lesson-specific labels.
-- Content blocks, lesson IDs, slugs, learner progress, and publication state are preserved.

with target as (
  select
    c.id as course_id,
    l.id as lesson_id,
    l.title as lesson_title,
    l.content
  from public.training_courses c
  join public.training_modules m on m.course_id = c.id
  join public.training_lessons l on l.module_id = m.id
  where exists (
    select 1
    from jsonb_array_elements(l.content) b
    where b->>'type' = 'heading'
      and b->>'text' in (
        'Work product drill',
        'Practice',
        'Common mistakes',
        'Before you move on',
        'What you will learn',
        'What you''ll learn',
        'Why this matters',
        'Key takeaways',
        'Key takeaway',
        'Decision rules',
        'Failure modes',
        'Ready-to-work check',
        'Run the workflow',
        'The work outcome',
        'Why clients care',
        'Handoff check',
        'QA traps',
        'What to notice',
        'Where this fails in practice',
        'Work it step by step',
        'Your operating goal',
        'A practical workflow',
        'Core ideas',
        'Operating context'
      )
  )
),
rebuilt as (
  select
    t.course_id,
    t.lesson_id,
    jsonb_agg(
      case
        when e.block->>'type' <> 'heading' then e.block
        when e.block->>'text' = 'Work product drill'
          then jsonb_set(e.block,'{text}',to_jsonb(('Work product: ' || t.lesson_title)::text))
        when e.block->>'text' = 'Practice'
          then jsonb_set(e.block,'{text}',to_jsonb(('Practice: ' || t.lesson_title)::text))
        when e.block->>'text' = 'Common mistakes'
          then jsonb_set(e.block,'{text}',to_jsonb(('Pitfalls: ' || t.lesson_title)::text))
        when e.block->>'text' in ('Failure modes','QA traps','Where this fails in practice')
          then jsonb_set(e.block,'{text}',to_jsonb(('QA risks: ' || t.lesson_title)::text))
        when e.block->>'text' in ('Before you move on','Ready-to-work check','Handoff check')
          then jsonb_set(e.block,'{text}',to_jsonb(('Ready check: ' || t.lesson_title)::text))
        when e.block->>'text' in ('What you will learn','What you''ll learn','The work outcome','Your operating goal')
          then jsonb_set(e.block,'{text}',to_jsonb(('Outcome: ' || t.lesson_title)::text))
        when e.block->>'text' in ('Why this matters','Why clients care')
          then jsonb_set(e.block,'{text}',to_jsonb(('Business impact: ' || t.lesson_title)::text))
        when e.block->>'text' in ('Key takeaways','Key takeaway')
          then jsonb_set(e.block,'{text}',to_jsonb(('Takeaway: ' || t.lesson_title)::text))
        when e.block->>'text' = 'Decision rules'
          then jsonb_set(e.block,'{text}',to_jsonb(('Decision rules: ' || t.lesson_title)::text))
        when e.block->>'text' in ('Run the workflow','Work it step by step','A practical workflow')
          then jsonb_set(e.block,'{text}',to_jsonb(('Workflow: ' || t.lesson_title)::text))
        when e.block->>'text' in ('What to notice','Core ideas','Operating context')
          then jsonb_set(e.block,'{text}',to_jsonb(('Focus: ' || t.lesson_title)::text))
        else e.block
      end
      order by e.ord
    ) as content
  from target t
  cross join lateral jsonb_array_elements(t.content) with ordinality as e(block,ord)
  group by t.course_id,t.lesson_id,t.lesson_title
),
changed_courses as (
  select distinct course_id from rebuilt
)
update public.training_lessons l
set content = r.content,
    content_version = l.content_version + 1,
    reviewed_by = 'Curriculum QA',
    last_reviewed_at = now(),
    updated_at = now()
from rebuilt r
where l.id = r.lesson_id;

with changed_courses as (
  select distinct c.id as course_id
  from public.training_courses c
  join public.training_modules m on m.course_id = c.id
  join public.training_lessons l on l.module_id = m.id
  cross join lateral jsonb_array_elements(l.content) b
  where b->>'type' = 'heading'
    and (
      b->>'text' like 'Work product: %'
      or b->>'text' like 'Practice: %'
      or b->>'text' like 'Pitfalls: %'
      or b->>'text' like 'QA risks: %'
      or b->>'text' like 'Ready check: %'
      or b->>'text' like 'Outcome: %'
      or b->>'text' like 'Business impact: %'
      or b->>'text' like 'Takeaway: %'
      or b->>'text' like 'Decision rules: %'
      or b->>'text' like 'Workflow: %'
      or b->>'text' like 'Focus: %'
    )
)
update public.training_courses c
set content_version = c.content_version + 1,
    reviewed_by = 'Curriculum QA',
    last_reviewed_at = now(),
    updated_at = now()
from changed_courses x
where c.id = x.course_id;
