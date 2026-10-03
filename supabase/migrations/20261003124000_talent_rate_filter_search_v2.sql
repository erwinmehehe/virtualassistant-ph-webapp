-- Add budget-aware public talent search without changing the privacy-filtered directory surface.
create or replace function public.search_public_va_directory_hybrid_v2(
  p_query text default null,
  p_query_embedding vector default null,
  p_category text default null,
  p_tool text default null,
  p_min_hours integer default 0,
  p_min_experience integer default 2,
  p_min_overlap integer default 0,
  p_timezone text default null,
  p_portfolio_only boolean default false,
  p_min_rate numeric default 0,
  p_max_rate numeric default null,
  p_sort text default 'recommended',
  p_offset integer default 0,
  p_limit integer default 24
)
returns table(
  user_id uuid,
  slug text,
  full_name text,
  avatar_url text,
  headline text,
  bio text,
  primary_category text,
  categories text[],
  skills text[],
  tools text[],
  industries text[],
  languages text[],
  years_experience integer,
  weekly_hours integer,
  schedule text,
  preferred_timezone text,
  overlap_hours integer,
  hourly_rate numeric,
  has_portfolio boolean,
  created_at timestamptz,
  hybrid_score double precision,
  total_count bigint
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  with filtered as (
    select
      d.*,
      to_tsvector(
        'english',
        concat_ws(
          ' ',
          coalesce(d.full_name, ''),
          coalesce(d.headline, ''),
          coalesce(d.bio, ''),
          coalesce(d.primary_category, ''),
          array_to_string(coalesce(d.categories, '{}'::text[]), ' '),
          array_to_string(coalesce(d.skills, '{}'::text[]), ' '),
          array_to_string(coalesce(d.tools, '{}'::text[]), ' '),
          array_to_string(coalesce(d.industries, '{}'::text[]), ' '),
          array_to_string(coalesce(d.languages, '{}'::text[]), ' '),
          coalesce(d.schedule, ''),
          coalesce(d.preferred_timezone, '')
        )
      ) as document,
      e.embedding
    from private.public_va_directory_rows() d
    left join private.va_search_embeddings e on e.va_id = d.user_id
    where
      coalesce(d.years_experience, 0) >= greatest(coalesce(p_min_experience, 2), 2)
      and (coalesce(p_min_hours, 0) <= 0 or coalesce(d.weekly_hours, 0) >= p_min_hours)
      and (coalesce(p_min_overlap, 0) <= 0 or coalesce(d.overlap_hours, 0) >= p_min_overlap)
      and (coalesce(p_min_rate, 0) <= 0 or coalesce(d.hourly_rate, 0) >= p_min_rate)
      and (p_max_rate is null or p_max_rate <= 0 or coalesce(d.hourly_rate, 0) <= p_max_rate)
      and (
        nullif(btrim(coalesce(p_category, '')), '') is null
        or d.primary_category = p_category
        or p_category = any(coalesce(d.categories, '{}'::text[]))
      )
      and (
        nullif(btrim(coalesce(p_tool, '')), '') is null
        or exists (
          select 1 from unnest(coalesce(d.tools, '{}'::text[])) t
          where lower(t) like '%' || lower(btrim(p_tool)) || '%'
        )
      )
      and (
        nullif(btrim(coalesce(p_timezone, '')), '') is null
        or lower(coalesce(d.preferred_timezone, '')) like '%' || lower(btrim(p_timezone)) || '%'
        or lower(coalesce(d.schedule, '')) like '%' || lower(btrim(p_timezone)) || '%'
      )
      and (not coalesce(p_portfolio_only, false) or d.has_portfolio)
  ),
  scored as (
    select
      f.*,
      case
        when nullif(btrim(coalesce(p_query, '')), '') is null then 0::double precision
        else ts_rank_cd(f.document, websearch_to_tsquery('english', p_query))::double precision
      end as lexical_score,
      case
        when p_query_embedding is null or f.embedding is null then 0::double precision
        else greatest(0::double precision, 1 - (f.embedding operator(extensions.<=>) p_query_embedding))
      end as semantic_score
    from filtered f
    where
      nullif(btrim(coalesce(p_query, '')), '') is null
      or f.document @@ websearch_to_tsquery('english', p_query)
      or (
        p_query_embedding is not null
        and f.embedding is not null
        and (1 - (f.embedding operator(extensions.<=>) p_query_embedding)) >= 0.35
      )
  ),
  ranked as (
    select
      s.*,
      case
        when nullif(btrim(coalesce(p_query, '')), '') is null then 0::double precision
        when p_query_embedding is null then s.lexical_score
        else (0.45 * s.lexical_score) + (0.55 * s.semantic_score)
      end as combined_score
    from scored s
  )
  select
    r.user_id, r.slug, r.full_name, r.avatar_url, r.headline, r.bio,
    r.primary_category, r.categories, r.skills, r.tools, r.industries, r.languages,
    r.years_experience, r.weekly_hours, r.schedule, r.preferred_timezone,
    r.overlap_hours, r.hourly_rate, r.has_portfolio, r.created_at,
    r.combined_score as hybrid_score,
    count(*) over() as total_count
  from ranked r
  order by
    case when p_sort = 'experience' then r.years_experience end desc nulls last,
    case when p_sort = 'availability' then r.weekly_hours end desc nulls last,
    case when p_sort = 'rate_low' then r.hourly_rate end asc nulls last,
    case when p_sort = 'rate_high' then r.hourly_rate end desc nulls last,
    case when p_sort = 'newest' then r.created_at end desc nulls last,
    case when p_sort = 'recommended' then r.combined_score end desc nulls last,
    r.years_experience desc nulls last,
    r.weekly_hours desc nulls last,
    r.user_id
  offset greatest(coalesce(p_offset, 0), 0)
  limit greatest(1, least(coalesce(p_limit, 24), 100));
$$;

revoke execute on function public.search_public_va_directory_hybrid_v2(text,vector,text,text,integer,integer,integer,text,boolean,numeric,numeric,text,integer,integer)
from public, anon, authenticated;
grant execute on function public.search_public_va_directory_hybrid_v2(text,vector,text,text,integer,integer,integer,text,boolean,numeric,numeric,text,integer,integer)
to service_role;
