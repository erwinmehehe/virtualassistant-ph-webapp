-- Verified VAPH training is supporting matching evidence only.
-- It can add at most five points when directly relevant to a role, while
-- must-have skills/tools/industry evidence and readiness continue to come
-- from the VA profile and vetting state.

create or replace function public.verified_training_match_bonus(
  p_job_id uuid,
  p_va_id uuid
)
returns integer
language sql
stable
security invoker
set search_path = 'pg_catalog', 'public'
as $$
  with job as (
    select
      j.title,
      coalesce(j.categories, '{}'::text[]) as categories,
      coalesce(j.required_skills, '{}'::text[]) as required_skills,
      coalesce(j.required_tools, '{}'::text[]) as required_tools
    from public.jobs j
    where j.id = p_job_id
  ),
  evidence as (
    select coalesce(
      string_agg(
        public.normalize_matching_text(coalesce(tc.title, '') || ' ' || coalesce(tc.slug, '')),
        ' '
      ),
      ''
    ) as haystack
    from public.training_certificates cert
    join public.training_courses tc on tc.id = cert.course_id
    where cert.user_id = p_va_id
      and cert.revoked_at is null
      and tc.status = 'published'
  ),
  title_tokens as (
    select distinct token
    from job,
    unnest(regexp_split_to_array(public.normalize_matching_text(job.title), '\s+')) token
    where char_length(token) >= 2
      and token not in (
        'virtual','assistant','va','remote','philippines','filipino',
        'full','time','part','senior','junior','specialist','expert',
        'staff','needed','hiring'
      )
  ),
  ratios as (
    select
      case when cardinality(job.required_tools) = 0 then 0::numeric else
        (
          select count(*)::numeric
          from unnest(job.required_tools) value
          cross join evidence e
          where (' ' || e.haystack || ' ') like ('% ' || public.normalize_matching_text(value) || ' %')
        ) / greatest(cardinality(job.required_tools), 1)
      end as tool_ratio,
      case when cardinality(job.required_skills) = 0 then 0::numeric else
        (
          select count(*)::numeric
          from unnest(job.required_skills) value
          cross join evidence e
          where (' ' || e.haystack || ' ') like ('% ' || public.normalize_matching_text(value) || ' %')
        ) / greatest(cardinality(job.required_skills), 1)
      end as skill_ratio,
      case when cardinality(job.categories) = 0 then 0::numeric else
        (
          select count(*)::numeric
          from unnest(job.categories) value
          cross join evidence e
          where (' ' || e.haystack || ' ') like ('% ' || public.normalize_matching_text(value) || ' %')
        ) / greatest(cardinality(job.categories), 1)
      end as category_ratio,
      case when (select count(*) from title_tokens) = 0 then 0::numeric else
        (
          select count(*)::numeric
          from title_tokens t
          cross join evidence e
          where (' ' || e.haystack || ' ') like ('% ' || t.token || ' %')
        ) / greatest((select count(*) from title_tokens), 1)
      end as role_ratio
    from job
  )
  select coalesce(
    least(
      5,
      greatest(
        0,
        round(
          ratios.tool_ratio * 2
          + ratios.skill_ratio * 1.5
          + ratios.category_ratio * 1
          + ratios.role_ratio * 0.5
        )::integer
      )
    ),
    0
  )
  from ratios;
$$;

revoke all on function public.verified_training_match_bonus(uuid, uuid) from public, anon, authenticated;
grant execute on function public.verified_training_match_bonus(uuid, uuid) to service_role;

create or replace function public.refresh_match_suggestions_for_va(p_va_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v record;
  j record;
  raw_score numeric;
  assessed integer;
  normalized integer;
  role_ratio numeric;
  category_ratio numeric;
  training_bonus integer;
  proposed_count integer := 0;
  existed boolean;
begin
  select vp.*, vv.stage into v
  from va_profiles vp
  join va_vetting vv on vv.va_id = vp.user_id
  where vp.user_id = p_va_id
    and vv.stage in ('approved','bench')
    and vp.availability_status = 'available'
    and vp.availability_confirmed_at is not null
    and vp.availability_confirmed_at >= now() - interval '30 days';

  if not found then return 0; end if;

  for j in select * from jobs where status in ('pending','published') loop
    if not public.array_contains_all_ci(j.must_have_skills,v.skills) then continue; end if;
    if not public.array_contains_all_ci(j.must_have_tools,v.tools) then continue; end if;
    if not public.array_contains_all_ci(j.required_industries,v.industries) then continue; end if;
    if exists(
      select 1 from job_shortlist_candidates s
      where s.job_id = j.id
        and s.va_id = p_va_id
        and s.shortlist_status in ('hidden','released')
    ) then continue; end if;

    raw_score := 0;
    assessed := 0;

    role_ratio := public.role_title_match_ratio(
      j.title,
      v.headline,
      v.primary_category,
      v.categories,
      v.skills
    );
    if role_ratio is not null then
      assessed := assessed + 35;
      raw_score := raw_score + 35.0 * role_ratio;
    end if;

    category_ratio := public.role_category_match_ratio(j.categories, v.primary_category, v.categories);
    if category_ratio is not null then
      assessed := assessed + 20;
      raw_score := raw_score + 20.0 * category_ratio;
    end if;

    if cardinality(coalesce(j.required_skills,'{}')) > 0 then
      assessed := assessed + 25;
      raw_score := raw_score + 25.0 * public.array_overlap_count_ci(j.required_skills,v.skills) / greatest(cardinality(j.required_skills),1);
    end if;

    if cardinality(coalesce(j.required_tools,'{}')) > 0 then
      assessed := assessed + 10;
      raw_score := raw_score + 10.0 * public.array_overlap_count_ci(j.required_tools,v.tools) / greatest(cardinality(j.required_tools),1);
    end if;

    if cardinality(coalesce(j.nice_to_have_skills,'{}')) > 0 then
      assessed := assessed + 5;
      raw_score := raw_score + 5.0 * public.array_overlap_count_ci(j.nice_to_have_skills,v.skills) / greatest(cardinality(j.nice_to_have_skills),1);
    end if;

    if j.hours_per_week is not null then
      assessed := assessed + 5;
      if v.weekly_hours is not null then
        raw_score := raw_score + 5.0 * least(1.0, greatest(0.0, v.weekly_hours::numeric / greatest(j.hours_per_week,1)));
      end if;
    end if;

    normalized := case when assessed = 0 then 0 else least(100,round(raw_score / assessed * 100))::integer end;
    training_bonus := public.verified_training_match_bonus(j.id, p_va_id);
    normalized := least(100, normalized + coalesce(training_bonus, 0));

    if normalized < 60 then continue; end if;

    select exists(
      select 1 from job_shortlist_candidates s
      where s.job_id = j.id and s.va_id = p_va_id
    ) into existed;

    insert into job_shortlist_candidates(
      job_id,va_id,match_score,match_confidence,shortlist_status,created_by,released_at
    )
    values(
      j.id,p_va_id,normalized,least(100,assessed),'proposed',null,null
    )
    on conflict(job_id,va_id) do update set
      match_score = excluded.match_score,
      match_confidence = excluded.match_confidence,
      updated_at = now()
    where job_shortlist_candidates.shortlist_status = 'proposed'
      and job_shortlist_candidates.created_by is null;

    if not existed then proposed_count := proposed_count + 1; end if;
  end loop;

  if proposed_count > 0 then
    insert into recruiter_activity(subject_type,subject_id,action,description,actor_id,metadata)
    values(
      'va',
      p_va_id,
      'automatic_match_refresh',
      proposed_count || ' new recruiter-only role suggestion(s) found',
      null,
      jsonb_build_object(
        'suggestions', proposed_count,
        'ranking', 'role_evidence_plus_verified_training_v4',
        'training_bonus_cap', 5
      )
    );
  end if;

  return proposed_count;
end;
$function$;

revoke all on function public.refresh_match_suggestions_for_va(uuid) from public, anon, authenticated;
grant execute on function public.refresh_match_suggestions_for_va(uuid) to service_role;
