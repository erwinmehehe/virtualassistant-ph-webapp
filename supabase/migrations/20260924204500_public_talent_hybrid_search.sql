-- Scalable public talent search: DB-side filters + FTS + pgvector hybrid ranking.
-- Embeddings are generated only from the already-consented public directory.

create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create table if not exists private.va_search_embeddings (
  va_id uuid primary key references public.va_profiles(user_id) on delete cascade,
  search_text text not null,
  source_hash text not null,
  model text not null,
  embedding extensions.vector(768) not null,
  updated_at timestamptz not null default now()
);

revoke all on private.va_search_embeddings from public, anon, authenticated;
grant all on private.va_search_embeddings to service_role;

create index if not exists va_search_embeddings_hnsw_idx
  on private.va_search_embeddings
  using hnsw (embedding vector_cosine_ops);

create or replace function public.list_public_va_embedding_sources(p_limit integer default 25)
returns table(
  va_id uuid,
  search_text text,
  source_hash text
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  with sources as (
    select
      d.user_id as va_id,
      concat_ws(
        ' ',
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
      ) as search_text
    from private.public_va_directory_rows() d
  )
  select
    s.va_id,
    s.search_text,
    md5(s.search_text) as source_hash
  from sources s
  left join private.va_search_embeddings e on e.va_id = s.va_id
  where e.va_id is null or e.source_hash <> md5(s.search_text)
  order by e.updated_at nulls first, s.va_id
  limit greatest(1, least(coalesce(p_limit, 25), 100));
$$;

revoke all on function public.list_public_va_embedding_sources(integer) from public, anon, authenticated;
grant execute on function public.list_public_va_embedding_sources(integer) to service_role;

create or replace function public.upsert_public_va_search_embedding(
  p_va_id uuid,
  p_search_text text,
  p_source_hash text,
  p_model text,
  p_embedding extensions.vector(768)
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if not exists (
    select 1 from private.public_va_directory_rows() d where d.user_id = p_va_id
  ) then
    delete from private.va_search_embeddings where va_id = p_va_id;
    return;
  end if;

  insert into private.va_search_embeddings(va_id, search_text, source_hash, model, embedding, updated_at)
  values (p_va_id, p_search_text, p_source_hash, p_model, p_embedding, now())
  on conflict (va_id) do update set
    search_text = excluded.search_text,
    source_hash = excluded.source_hash,
    model = excluded.model,
    embedding = excluded.embedding,
    updated_at = now();
end;
$$;

revoke all on function public.upsert_public_va_search_embedding(uuid,text,text,text,extensions.vector) from public, anon, authenticated;
grant execute on function public.upsert_public_va_search_embedding(uuid,text,text,text,extensions.vector) to service_role;

create or replace function public.search_public_va_directory_hybrid(
  p_query text default null,
  p_query_embedding extensions.vector(768) default null,
  p_category text default null,
  p_tool text default null,
  p_min_hours integer default 0,
  p_min_experience integer default 2,
  p_min_overlap integer default 0,
  p_timezone text default null,
  p_portfolio_only boolean default false,
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
    case when p_sort = 'newest' then r.created_at end desc nulls last,
    case when p_sort = 'recommended' then r.combined_score end desc nulls last,
    r.years_experience desc nulls last,
    r.weekly_hours desc nulls last,
    r.user_id
  offset greatest(coalesce(p_offset, 0), 0)
  limit greatest(1, least(coalesce(p_limit, 24), 100));
$$;

revoke all on function public.search_public_va_directory_hybrid(text,extensions.vector,text,text,integer,integer,integer,text,boolean,text,integer,integer) from public, anon, authenticated;
grant execute on function public.search_public_va_directory_hybrid(text,extensions.vector,text,text,integer,integer,integer,text,boolean,text,integer,integer) to service_role;
