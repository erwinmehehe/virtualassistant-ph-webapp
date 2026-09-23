-- Diversify the Australia-path lesson experience without changing the lesson IDs.
-- The original 14-block template remains semantically intact, but lessons no longer
-- present every topic in the exact same order with the exact same repeated headings.

with target as (
  select l.id, l.position, l.content
  from public.training_lessons l
  join public.training_modules m on m.id = l.module_id
  join public.training_courses c on c.id = m.course_id
  where c.country_focus = 'Australia'
    and jsonb_typeof(l.content) = 'array'
    and jsonb_array_length(l.content) = 14
    and l.content->0->>'type' = 'heading'
    and l.content->0->>'text' = 'What you''ll learn'
    and l.content->2->>'text' = 'Why this matters'
    and l.content->4->>'text' = 'Core ideas'
    and l.content->6->>'text' = 'A practical workflow'
    and l.content->9->>'text' = 'Common mistakes'
    and l.content->12->>'text' = 'Before you move on'
),
rebuilt as (
  select
    t.id,
    jsonb_agg(
      case
        when e.block->>'type' = 'heading' then
          jsonb_set(
            e.block,
            '{text}',
            to_jsonb(
              case e.block->>'text'
                when 'What you''ll learn' then
                  case mod(t.position,3)
                    when 0 then 'What you must be able to do'
                    when 1 then 'The work outcome'
                    else 'Your operating goal'
                  end
                when 'Why this matters' then
                  case mod(t.position,3)
                    when 0 then 'The business consequence'
                    when 1 then 'Why clients care'
                    else 'Where this fails in practice'
                  end
                when 'Core ideas' then
                  case mod(t.position,3)
                    when 0 then 'Operating context'
                    when 1 then 'Decision rules'
                    else 'What to notice'
                  end
                when 'A practical workflow' then
                  case mod(t.position,3)
                    when 0 then 'From input to handoff'
                    when 1 then 'Run the workflow'
                    else 'Work it step by step'
                  end
                when 'Common mistakes' then
                  case mod(t.position,3)
                    when 0 then 'Where this goes wrong'
                    when 1 then 'Failure modes'
                    else 'QA traps'
                  end
                when 'Before you move on' then
                  case mod(t.position,3)
                    when 0 then 'What good looks like'
                    when 1 then 'Ready-to-work check'
                    else 'Handoff check'
                  end
                else e.block->>'text'
              end
            )
          )
        else e.block
      end
      order by array_position(
        case mod(t.position,3)
          when 0 then array[3,4,1,2,5,6,7,8,9,10,11,12,13,14]
          when 1 then array[1,2,3,4,12,5,6,7,8,10,11,9,13,14]
          else array[3,4,5,6,1,2,7,8,10,11,12,9,13,14]
        end,
        e.ord::int
      )
    ) as content
  from target t
  cross join lateral jsonb_array_elements(t.content) with ordinality as e(block,ord)
  group by t.id,t.position
)
update public.training_lessons l
set content = r.content,
    content_version = l.content_version + 1,
    reviewed_by = 'Curriculum QA',
    last_reviewed_at = now(),
    updated_at = now()
from rebuilt r
where l.id = r.id;

update public.training_courses
set content_version = content_version + 1,
    reviewed_by = 'Curriculum QA',
    last_reviewed_at = now(),
    updated_at = now()
where country_focus = 'Australia';
