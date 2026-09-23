-- Consolidate Foundations from 13 short lessons to 10 stronger lessons.
-- Existing lesson IDs are retained where possible so learner progress is preserved.

update public.training_courses
set status = 'draft',
    published_at = null,
    estimated_minutes = 220,
    content_version = content_version + 1,
    last_reviewed_at = null,
    updated_at = now()
where slug = 'virtual-assistant-foundations';

with course as (
  select id from public.training_courses where slug = 'virtual-assistant-foundations'
),
lessons as (
  select l.id,l.title,l.content
  from public.training_lessons l
  join public.training_modules m on m.id=l.module_id
  join course c on c.id=m.course_id
),
src as (
  select
    (select content from lessons where title='Professional Standards, Boundaries, and Confidentiality' limit 1) as standards_content,
    (select content from lessons where title='Updates, Questions, Mistakes, and Escalation' limit 1) as escalation_content,
    (select content from lessons where title='Time Zones, Deadlines, and Handoffs' limit 1) as handoff_content
)
update public.training_lessons target
set title = case target.title
      when 'What a Virtual Assistant Actually Does' then 'The VA Role, Standards, Boundaries, and Confidentiality'
      when 'Clear Written Client Communication' then 'Client Communication, Updates, Mistakes, and Escalation'
      when 'Task Management and Prioritization' then 'Priorities, Deadlines, Time Zones, and Handoffs'
      else target.title
    end,
    estimated_minutes = 30,
    content = case target.title
      when 'What a Virtual Assistant Actually Does' then
        target.content ||
        jsonb_build_array(jsonb_build_object('type','heading','text','Professional standards in practice')) ||
        coalesce((select standards_content - 0 from src),'[]'::jsonb)
      when 'Clear Written Client Communication' then
        target.content ||
        jsonb_build_array(jsonb_build_object('type','heading','text','When the work goes off-plan')) ||
        coalesce((select escalation_content - 0 from src),'[]'::jsonb)
      when 'Task Management and Prioritization' then
        target.content ||
        jsonb_build_array(jsonb_build_object('type','heading','text','Deadlines, time zones, and handoffs')) ||
        coalesce((select handoff_content - 0 from src),'[]'::jsonb)
      else target.content
    end,
    content_version = target.content_version + 1,
    reviewed_by = 'Curriculum QA',
    last_reviewed_at = now(),
    is_published = true,
    updated_at = now()
from course c
where target.module_id in (select id from public.training_modules where course_id=c.id)
  and target.title in (
    'What a Virtual Assistant Actually Does',
    'Clear Written Client Communication',
    'Task Management and Prioritization'
  );

-- Carry completion from a merged source lesson to the retained lesson so
-- existing learners do not lose credited progress.
with course as (
  select id from public.training_courses where slug = 'virtual-assistant-foundations'
),
mapping(source_title,target_title) as (
  values
    ('Professional Standards, Boundaries, and Confidentiality','The VA Role, Standards, Boundaries, and Confidentiality'),
    ('Updates, Questions, Mistakes, and Escalation','Client Communication, Updates, Mistakes, and Escalation'),
    ('Time Zones, Deadlines, and Handoffs','Priorities, Deadlines, Time Zones, and Handoffs')
),
lesson_map as (
  select source.id as source_id, target.id as target_id
  from mapping x
  join public.training_modules sm on sm.course_id=(select id from course)
  join public.training_lessons source on source.module_id=sm.id and source.title=x.source_title
  join public.training_modules tm on tm.course_id=(select id from course)
  join public.training_lessons target on target.module_id=tm.id and target.title=x.target_title
)
insert into public.training_lesson_progress (user_id,lesson_id,completed_at)
select p.user_id,m.target_id,p.completed_at
from public.training_lesson_progress p
join lesson_map m on m.source_id=p.lesson_id
on conflict (user_id,lesson_id) do nothing;

with course as (
  select id from public.training_courses where slug = 'virtual-assistant-foundations'
)
update public.training_lessons l
set is_published = false,
    reviewed_by = 'Curriculum QA',
    last_reviewed_at = now(),
    updated_at = now()
from public.training_modules m, course c
where l.module_id=m.id
  and m.course_id=c.id
  and l.title in (
    'Professional Standards, Boundaries, and Confidentiality',
    'Updates, Questions, Mistakes, and Escalation',
    'Time Zones, Deadlines, and Handoffs'
  );

update public.training_courses
set reviewed_by = 'Curriculum QA',
    last_reviewed_at = now(),
    status = 'published',
    published_at = now(),
    updated_at = now()
where slug = 'virtual-assistant-foundations';
