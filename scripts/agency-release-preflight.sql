-- Read-only agency release preflight. Run against the intended production project.
-- No customer identifiers, emails, proposal tokens, or secrets are returned.
-- Returns one JSON document so API/MCP clients do not lose intermediate SELECT results.
begin transaction read only;

with required_migrations as (
  select coalesce(
    jsonb_agg(jsonb_build_object('version', version, 'name', name) order by version),
    '[]'::jsonb
  ) as rows
  from supabase_migrations.schema_migrations
  where name in (
    'v4144_sales_crm',
    'v4145_discovery_proposals',
    'v4146_proposal_table_hardening',
    'v4147_finish_agency_sales_handoff',
    'v4148_harden_public_directory_views',
    'v4149_atomic_proposal_acceptance',
    'v4150_server_only_table_grants',
    'v4151_explicit_server_only_rls'
  )
),
latest_migrations as (
  select coalesce(
    jsonb_agg(jsonb_build_object('version', version, 'name', name) order by version desc),
    '[]'::jsonb
  ) as rows
  from (
    select version, name
    from supabase_migrations.schema_migrations
    order by version desc
    limit 12
  ) latest
),
rls_rows as (
  select coalesce(
    jsonb_agg(jsonb_build_object('table', tablename, 'rls', rowsecurity) order by tablename),
    '[]'::jsonb
  ) as rows
  from pg_tables
  where schemaname = 'public'
    and tablename in ('lead_proposals', 'recruiter_activity', 'recruiter_notes', 'workflow_reminders')
),
constraint_rows as (
  select coalesce(
    jsonb_agg(jsonb_build_object('name', conname, 'definition', pg_get_constraintdef(oid)) order by conname),
    '[]'::jsonb
  ) as rows
  from pg_constraint
  where conname in ('lead_proposals_status_check', 'workflow_reminders_subject_type_check')
),
grant_rows as (
  select coalesce(
    jsonb_agg(jsonb_build_object('grantee', grantee, 'privilege', privilege_type) order by grantee, privilege_type),
    '[]'::jsonb
  ) as rows
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'lead_proposals'
    and grantee in ('anon', 'authenticated')
),
policy_rows as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'policy', policyname,
        'roles', roles,
        'using', qual,
        'check', with_check
      )
      order by policyname
    ),
    '[]'::jsonb
  ) as rows
  from pg_policies
  where schemaname = 'public'
    and tablename = 'lead_proposals'
),
view_rows as (
  select coalesce(
    jsonb_agg(jsonb_build_object('view', c.relname, 'options', c.reloptions) order by c.relname),
    '[]'::jsonb
  ) as rows
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in (
      'public_va_directory',
      'public_company_profiles',
      'public_va_reviews',
      'public_va_certifications'
    )
)
select jsonb_build_object(
  'required_migrations', (select rows from required_migrations),
  'latest_migrations', (select rows from latest_migrations),
  'rls', (select rows from rls_rows),
  'constraints', (select rows from constraint_rows),
  'lead_proposal_browser_grants', (select rows from grant_rows),
  'lead_proposal_policies', (select rows from policy_rows),
  'public_view_options', (select rows from view_rows),
  'offered_stage_exists', exists(
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'application_status'
      and e.enumlabel = 'offered'
  ),
  'accepted_active_roles_missing_access', (
    select count(*)
    from public.jobs j
    join public.job_commercials c on c.job_id = j.id
    left join public.job_candidate_access a on a.job_id = j.id
    where j.client_id is not null
      and j.status in ('pending', 'published')
      and c.commercial_status = 'accepted'
      and (a.job_id is null or a.access_status not in ('paid', 'comped'))
  ),
  'proposal_count', (
    select count(*)
    from public.lead_proposals
  ),
  'accepted_proposals_missing_role_or_commercials', (
    select count(*)
    from public.lead_proposals p
    left join public.jobs j on j.id = p.job_id
    left join public.job_commercials c on c.job_id = p.job_id
    where p.status = 'accepted'
      and (j.id is null or c.commercial_status is distinct from 'accepted')
  )
) as release_preflight;

rollback;
