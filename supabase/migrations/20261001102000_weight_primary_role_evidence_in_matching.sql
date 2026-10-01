-- Prefer evidence that actually identifies the VA's role.
-- An exact Executive Assistant headline must outrank a Personal Assistant who
-- only lists Executive Assistance as an additional category.

create or replace function public.role_title_match_ratio(
  p_job_title text,
  p_headline text,
  p_primary_category text,
  p_categories text[],
  p_skills text[]
)
returns numeric
language sql
immutable
set search_path = 'pg_catalog', 'public'
as $$
  with title_tokens as (
    select distinct token
    from unnest(regexp_split_to_array(public.normalize_matching_text(p_job_title), '\s+')) as token
    where char_length(token) >= 2
      and token not in (
        'virtual','assistant','va','remote','philippines','filipino',
        'full','time','part','senior','junior','specialist','expert',
        'staff','needed','hiring'
      )
  ),
  token_count as (
    select count(*)::numeric as total from title_tokens
  ),
  source_values as (
    select public.normalize_matching_text(coalesce(p_headline, '')) as value, 1.00::numeric as weight
    union all
    select public.normalize_matching_text(coalesce(p_primary_category, '')), 0.95::numeric
    union all
    select public.normalize_matching_text(value), 0.60::numeric
      from unnest(coalesce(p_categories, '{}'::text[])) value
      where public.normalize_matching_text(value) <> public.normalize_matching_text(coalesce(p_primary_category, ''))
    union all
    select public.normalize_matching_text(value), 0.50::numeric
      from unnest(coalesce(p_skills, '{}'::text[])) value
  ),
  source_scores as (
    select
      sv.weight,
      case
        when tc.total = 0 then null
        else (
          select count(*)::numeric
          from title_tokens tt
          where (' ' || sv.value || ' ') like ('% ' || tt.token || ' %')
        ) / tc.total
      end as token_ratio
    from source_values sv
    cross join token_count tc
    where sv.value <> ''
  )
  select case
    when (select total from token_count) = 0 then null
    else coalesce(max(weight * token_ratio), 0)
  end
  from source_scores;
$$;

revoke all on function public.role_title_match_ratio(text,text,text,text[],text[]) from public, anon, authenticated;
grant execute on function public.role_title_match_ratio(text,text,text,text[],text[]) to service_role;

create or replace function public.role_category_match_ratio(
  p_job_categories text[],
  p_primary_category text,
  p_categories text[]
)
returns numeric
language sql
immutable
set search_path = 'pg_catalog', 'public'
as $$
  with required as (
    select public.normalize_matching_text(value) as value
    from unnest(coalesce(p_job_categories, '{}'::text[])) value
  ),
  primary_hit as (
    select exists (
      select 1 from required r
      where r.value = public.normalize_matching_text(coalesce(p_primary_category, ''))
    ) as matched
  ),
  secondary_hit as (
    select exists (
      select 1
      from required r
      cross join unnest(coalesce(p_categories, '{}'::text[])) c
      where r.value = public.normalize_matching_text(c)
        and public.normalize_matching_text(c) <> public.normalize_matching_text(coalesce(p_primary_category, ''))
    ) as matched
  )
  select case
    when cardinality(coalesce(p_job_categories, '{}'::text[])) = 0 then null
    when (select matched from primary_hit) then 1.0::numeric
    when (select matched from secondary_hit) then 0.7::numeric
    else 0::numeric
  end;
$$;

revoke all on function public.role_category_match_ratio(text[],text,text[]) from public, anon, authenticated;
grant execute on function public.role_category_match_ratio(text[],text,text[]) to service_role;

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
      jsonb_build_object('suggestions',proposed_count,'ranking','role_evidence_priority_v3')
    );
  end if;

  return proposed_count;
end;
$function$;
