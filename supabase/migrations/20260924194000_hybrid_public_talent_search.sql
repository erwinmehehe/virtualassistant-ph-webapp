-- Hybrid public talent search: database-side pagination + full-text + optional
-- semantic similarity. Embeddings stay private; only sanitized public directory
-- fields can be returned by the public search RPC.

create extension if not exists vector with schema extensions;

create table if not exists private.va_search_embeddings (
  va_id uuid primary key references public.va_profiles(user_id) on delete cascade,
  embedding extensions.vector(384) not null,
  source_hash text not null,
  model text not null default 'gte-small',
  updated_at timestamptz not null default now()
);

revoke all on private.va_search_embeddings from public, anon, authenticated;

create table if not exists private.va_search_embedding_jobs (
  va_id uuid primary key references public.va_profiles(user_id) on delete cascade,
  requested_at timestamptz not null default now(),
  claimed_at timestamptz
);

revoke all on private.va_search_embedding_jobs from public, anon, authenticated;

create or replace function private.queue_va_search_embedding()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_va_id uuid;
begin
  v_va_id := coalesce(
    nullif(to_jsonb(new)->>'user_id','')::uuid,
    nullif(to_jsonb(new)->>'va_id','')::uuid
  );
  if v_va_id is null then return new; end if;

  insert into private.va_search_embedding_jobs(va_id, requested_at, claimed_at)
  values(v_va_id, now(), null)
  on conflict(va_id) do update
  set requested_at = excluded.requested_at,
      claimed_at = null;

  return new;
end;
$$;

drop trigger if exists va_profiles_queue_search_embedding on public.va_profiles;
create trigger va_profiles_queue_search_embedding
after insert or update on public.va_profiles
for each row execute function private.queue_va_search_embedding();

drop trigger if exists va_vetting_queue_search_embedding on public.va_vetting;
create trigger va_vetting_queue_search_embedding
after insert or update on public.va_vetting
for each row execute function private.queue_va_search_embedding();

create or replace function public.claim_va_search_embedding_jobs(p_limit integer default 50)
returns table(va_id uuid, requested_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  return query
  with candidates as (
    select j.va_id, j.requested_at
    from private.va_search_embedding_jobs j
    where j.claimed_at is null
       or j.claimed_at < now() - interval '10 minutes'
    order by j.requested_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 50), 100))
  ),
  claimed as (
    update private.va_search_embedding_jobs j
    set claimed_at = now()
    from candidates c
    where j.va_id = c.va_id
    returning j.va_id, j.requested_at
  )
  select claimed.va_id, claimed.requested_at from claimed;
end;
$$;

revoke all on function public.claim_va_search_embedding_jobs(integer)
  from public, anon, authenticated;
grant execute on function public.claim_va_search_embedding_jobs(integer)
  to service_role;

create or replace function public.complete_va_search_embedding_job(
  p_va_id uuid,
  p_requested_at timestamptz
)
returns void
language sql
security definer
set search_path = pg_catalog
as $$
  delete from private.va_search_embedding_jobs
  where va_id = p_va_id
    and requested_at = p_requested_at;
$$;

revoke all on function public.complete_va_search_embedding_job(uuid,timestamptz)
  from public, anon, authenticated;
grant execute on function public.complete_va_search_embedding_job(uuid,timestamptz)
  to service_role;

create or replace function public.upsert_va_search_embedding(
  p_va_id uuid,
  p_embedding text,
  p_source_hash text,
  p_model text default 'gte-small'
)
returns void
language sql
security definer
set search_path = pg_catalog, extensions
as $$
  insert into private.va_search_embeddings(va_id, embedding, source_hash, model, updated_at)
  values(
    p_va_id,
    p_embedding::extensions.vector(384),
    p_source_hash,
    coalesce(nullif(p_model,''), 'gte-small'),
    now()
  )
  on conflict(va_id) do update
  set embedding = excluded.embedding,
      source_hash = excluded.source_hash,
      model = excluded.model,
      updated_at = excluded.updated_at;
$$;

revoke all on function public.upsert_va_search_embedding(uuid,text,text,text)
  from public, anon, authenticated;
grant execute on function public.upsert_va_search_embedding(uuid,text,text,text)
  to service_role;

create or replace function public.delete_va_search_embedding(p_va_id uuid)
returns void
language sql
security definer
set search_path = pg_catalog
as $$
  delete from private.va_search_embeddings where va_id = p_va_id;
$$;

revoke all on function public.delete_va_search_embedding(uuid)
  from public, anon, authenticated;
grant execute on function public.delete_va_search_embedding(uuid)
  to service_role;

create or replace function public.search_public_va_directory(
  p_query text default null,
  p_query_embedding text default null,
  p_category text default null,
  p_tool text default null,
  p_min_hours integer default 0,
  p_min_experience integer default 2,
  p_min_overlap integer default 0,
  p_timezone text default null,
  p_portfolio_only boolean default false,
  p_sort text default 'recommended',
  p_limit integer default 24,
  p_offset integer default 0
)
returns table(
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
  lexical_rank double precision,
  semantic_similarity double precision,
  search_score double precision,
  total_count bigint
)
language sql
stable
security definer
set search_path = pg_catalog, extensions
as $$
  with params as (
    select
      nullif(btrim(coalesce(p_query,'')), '') as q,
      case
        when nullif(btrim(coalesce(p_query_embedding,'')), '') is null then null
        else p_query_embedding::extensions.vector(384)
      end as query_embedding
  ),
  source as (
    select
      d.*,
      e.embedding,
      concat_ws(
        ' ',
        d.headline,
        d.bio,
        d.primary_category,
        array_to_string(coalesce(d.categories, '{}'::text[]), ' '),
        array_to_string(coalesce(d.skills, '{}'::text[]), ' '),
        array_to_string(coalesce(d.tools, '{}'::text[]), ' '),
        array_to_string(coalesce(d.industries, '{}'::text[]), ' '),
        array_to_string(coalesce(d.languages, '{}'::text[]), ' '),
        d.schedule,
        d.preferred_timezone
      ) as search_text
    from private.public_va_directory_rows() d
    left join private.va_search_embeddings e on e.va_id = d.user_id
    where coalesce(d.years_experience, 0) >= greatest(2, coalesce(p_min_experience, 2))
      and (coalesce(p_min_hours, 0) <= 0 or coalesce(d.weekly_hours, 0) >= p_min_hours)
      and (coalesce(p_min_overlap, 0) <= 0 or coalesce(d.overlap_hours, 0) >= p_min_overlap)
      and (
        nullif(btrim(coalesce(p_category,'')), '') is null
        or d.primary_category = p_category
        or p_category = any(coalesce(d.categories, '{}'::text[]))
      )
      and (
        nullif(btrim(coalesce(p_tool,'')), '') is null
        or exists (
          select 1
          from unnest(coalesce(d.tools, '{}'::text[])) tool_value
          where lower(tool_value) like '%' || lower(btrim(p_tool)) || '%'
        )
      )
      and (
        nullif(btrim(coalesce(p_timezone,'')), '') is null
        or lower(coalesce(d.preferred_timezone,'')) like '%' || lower(btrim(p_timezone)) || '%'
        or lower(coalesce(d.schedule,'')) like '%' || lower(btrim(p_timezone)) || '%'
      )
      and (not coalesce(p_portfolio_only, false) or d.has_portfolio)
  ),
  scored as (
    select
      s.*,
      case
        when p.q is null then 0::double precision
        else ts_rank_cd(
          to_tsvector('english', coalesce(s.search_text,'')),
          websearch_to_tsquery('english', p.q)
        )::double precision
      end as lex,
      case
        when p.query_embedding is null or s.embedding is null then 0::double precision
        else greatest(0::double precision, 1 - (s.embedding <=> p.query_embedding))
      end as sem,
      p.q,
      p.query_embedding
    from source s
    cross join params p
    where p.q is null
       or p.query_embedding is not null
       or to_tsvector('english', coalesce(s.search_text,'')) @@ websearch_to_tsquery('english', p.q)
  ),
  ranked as (
    select
      scored.*,
      case
        when scored.q is null then 0::double precision
        when scored.query_embedding is null then least(1::double precision, scored.lex * 4)
        when scored.embedding is null then least(1::double precision, scored.lex * 4)
        else (
          0.45 * least(1::double precision, scored.lex * 4)
          + 0.55 * scored.sem
        )
      end as combined_score
    from scored
  )
  select
    r.slug,
    r.full_name,
    r.avatar_url,
    r.headline,
    r.bio,
    r.primary_category,
    r.categories,
    r.skills,
    r.tools,
    r.industries,
    r.languages,
    r.years_experience,
    r.weekly_hours,
    r.schedule,
    r.preferred_timezone,
    r.overlap_hours,
    r.hourly_rate,
    r.has_portfolio,
    r.created_at,
    r.lex as lexical_rank,
    r.sem as semantic_similarity,
    r.combined_score as search_score,
    count(*) over() as total_count
  from ranked r
  order by
    case when p_sort = 'experience' then r.years_experience end desc nulls last,
    case when p_sort = 'availability' then r.weekly_hours end desc nulls last,
    case when p_sort = 'newest' then r.created_at end desc nulls last,
    case when coalesce(p_sort,'recommended') = 'recommended' and r.q is not null then r.combined_score end desc nulls last,
    r.years_experience desc nulls last,
    r.weekly_hours desc nulls last,
    r.slug asc
  limit greatest(1, least(coalesce(p_limit, 24), 50))
  offset greatest(0, least(coalesce(p_offset, 0), 10000));
$$;

revoke all on function public.search_public_va_directory(
  text,text,text,text,integer,integer,integer,text,boolean,text,integer,integer
) from public;

grant execute on function public.search_public_va_directory(
  text,text,text,text,integer,integer,integer,text,boolean,text,integer,integer
) to anon, authenticated, service_role;

-- Queue every currently public profile for the initial semantic backfill.
insert into private.va_search_embedding_jobs(va_id, requested_at, claimed_at)
select d.user_id, now(), null
from private.public_va_directory_rows() d
on conflict(va_id) do update
set requested_at = excluded.requested_at,
    claimed_at = null;
