-- Keep existing open roles aligned with the role-first matcher introduced
-- in the October 2026 matching pass. This is intentionally conservative:
-- it only adds an obvious category when the role title clearly implies one.
-- Existing categories are preserved.

with inferred as (
  select id,
    case
      when lower(title) ~ '(executive assistant|executive support)' then 'Executive Assistance'
      when lower(title) ~ '(administrative|admin(istrative)? tasks)' then 'Administrative Support'
      when lower(title) ~ '(customer service|customer support)' then 'Customer Service'
      when lower(title) ~ '(wordpress|web virtual assistant|web assistant)' then 'Web & WordPress'
      when lower(title) ~ '(dental|healthcare|medical)' then 'Dental & Healthcare'
      when lower(title) ~ '(video edit|creative virtual assistant)' then 'Video Editing & Creative'
      when lower(title) ~ '(ecommerce|e-commerce)' then 'Ecommerce'
      when lower(title) ~ '(^|[^a-z])seo([^a-z]|$)' then 'SEO'
      when lower(title) ~ '(sales person|sales virtual assistant|lead generation|lead gen)' then 'Lead Generation & Sales'
      when lower(title) ~ '(real estate|property management|strata)' then 'Real Estate'
      when lower(title) ~ '(bookkeep|accounting|payroll)' then 'Bookkeeping & Finance'
      when lower(title) ~ '(social media|marketing virtual assistant)' then 'Marketing & Social Media'
      when lower(title) ~ '(reception|receptionist|phone support)' then 'Phone & Reception'
      else null
    end as inferred_category
  from public.jobs
  where status in ('pending','published')
)
update public.jobs j
set categories = array_prepend(i.inferred_category, array_remove(coalesce(j.categories,'{}'::text[]), i.inferred_category)),
    updated_at = now()
from inferred i
where j.id=i.id
  and i.inferred_category is not null
  and not (coalesce(j.categories,'{}'::text[]) @> array[i.inferred_category]::text[]);

-- Auto-generated recruiter suggestions are safe to rebuild. Preserve manual
-- shortlist selections, released candidates, and hidden history.
delete from public.job_shortlist_candidates s
using public.jobs j
where s.job_id=j.id
  and j.status in ('pending','published')
  and s.shortlist_status='proposed'
  and s.created_by is null;

select public.refresh_all_match_suggestions();

-- Manual proposed rows may predate the current ranking model. Refresh their
-- stored score/confidence without changing shortlist status or ownership.
with scored as (
  select
    s.id,
    case
      when not public.array_contains_all_ci(j.must_have_skills,v.skills)
        or not public.array_contains_all_ci(j.must_have_tools,v.tools)
        or not public.array_contains_all_ci(j.required_industries,v.industries)
      then 0
      else least(100, round(
        (
          coalesce(public.role_title_match_ratio(j.title,v.headline,v.primary_category,v.categories,v.skills),0) * 35
          + coalesce(public.role_category_match_ratio(j.categories,v.primary_category,v.categories),0) * 20
          + case when cardinality(coalesce(j.required_skills,'{}'))>0
              then 25.0 * public.array_overlap_count_ci(j.required_skills,v.skills) / greatest(cardinality(j.required_skills),1)
              else 0 end
          + case when cardinality(coalesce(j.required_tools,'{}'))>0
              then 10.0 * public.array_overlap_count_ci(j.required_tools,v.tools) / greatest(cardinality(j.required_tools),1)
              else 0 end
          + case when cardinality(coalesce(j.nice_to_have_skills,'{}'))>0
              then 5.0 * public.array_overlap_count_ci(j.nice_to_have_skills,v.skills) / greatest(cardinality(j.nice_to_have_skills),1)
              else 0 end
          + case when j.hours_per_week is not null and v.weekly_hours is not null
              then 5.0 * least(1.0, greatest(0.0, v.weekly_hours::numeric / greatest(j.hours_per_week,1)))
              else 0 end
        )
        /
        greatest(
          (case when public.role_title_match_ratio(j.title,v.headline,v.primary_category,v.categories,v.skills) is not null then 35 else 0 end)
          + (case when cardinality(coalesce(j.categories,'{}'))>0 then 20 else 0 end)
          + (case when cardinality(coalesce(j.required_skills,'{}'))>0 then 25 else 0 end)
          + (case when cardinality(coalesce(j.required_tools,'{}'))>0 then 10 else 0 end)
          + (case when cardinality(coalesce(j.nice_to_have_skills,'{}'))>0 then 5 else 0 end)
          + (case when j.hours_per_week is not null then 5 else 0 end),
          1
        ) * 100
      ))::integer
    end as new_score,
    least(100,
      (case when public.role_title_match_ratio(j.title,v.headline,v.primary_category,v.categories,v.skills) is not null then 35 else 0 end)
      + (case when cardinality(coalesce(j.categories,'{}'))>0 then 20 else 0 end)
      + (case when cardinality(coalesce(j.required_skills,'{}'))>0 then 25 else 0 end)
      + (case when cardinality(coalesce(j.required_tools,'{}'))>0 then 10 else 0 end)
      + (case when cardinality(coalesce(j.nice_to_have_skills,'{}'))>0 then 5 else 0 end)
      + (case when j.hours_per_week is not null then 5 else 0 end)
    )::integer as new_confidence
  from public.job_shortlist_candidates s
  join public.jobs j on j.id=s.job_id and j.status in ('pending','published')
  join public.va_profiles v on v.user_id=s.va_id
  where s.shortlist_status='proposed'
)
update public.job_shortlist_candidates s
set match_score=scored.new_score,
    match_confidence=scored.new_confidence,
    updated_at=now()
from scored
where s.id=scored.id;
