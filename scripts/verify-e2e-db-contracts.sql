\set ON_ERROR_STOP on

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'lead_proposals',
    'recruiter_tasks',
    'workflow_reminders',
    'payment_events',
    'action_rate_limits'
  ]
  loop
    if to_regclass('public.' || table_name) is null then
      raise exception 'Required server-side table public.% is missing', table_name;
    end if;

    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = table_name
        and c.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', table_name;
    end if;
  end loop;
end
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'lead_proposals',
    'recruiter_tasks',
    'workflow_reminders',
    'payment_events',
    'action_rate_limits'
  ]
  loop
    if has_table_privilege('anon', format('public.%I', table_name), 'SELECT')
       or has_table_privilege('authenticated', format('public.%I', table_name), 'SELECT') then
      raise exception 'Browser role retains SELECT on server-only table public.%', table_name;
    end if;
  end loop;
end
$$;

do $service_role_contract$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'client_profiles',
    'va_profiles',
    'action_rate_limits'
  ]
  loop
    if not has_table_privilege('service_role', format('public.%I', table_name), 'SELECT')
       or not has_table_privilege('service_role', format('public.%I', table_name), 'INSERT')
       or not has_table_privilege('service_role', format('public.%I', table_name), 'UPDATE')
       or not has_table_privilege('service_role', format('public.%I', table_name), 'DELETE') then
      raise exception 'service_role is missing required CRUD privileges on public.%', table_name;
    end if;
  end loop;
end
$service_role_contract$;

do $authenticated_profile_contract$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'client_profiles',
    'va_profiles',
    'va_vetting'
  ]
  loop
    if not has_table_privilege('authenticated', format('public.%I', table_name), 'SELECT') then
      raise exception 'authenticated is missing required SELECT on public.%', table_name;
    end if;
  end loop;
end
$authenticated_profile_contract$;

do $rpc_contract$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(array[
        'accept_lead_proposal_atomic',
        'find_auth_user_id_by_email',
        'respond_to_lead_proposal_atomic',
        'finalize_lead_proposal_send_atomic',
        'can_purge_abandoned_va',
        'consume_action_rate_limit'
      ])
      and (
        has_function_privilege('anon', p.oid, 'EXECUTE')
        or has_function_privilege('authenticated', p.oid, 'EXECUTE')
      )
  ) then
    raise exception 'A server-only RPC is executable by a browser role';
  end if;
end
$rpc_contract$;

do $rate_limit_rpc_contract$
declare
  fn regprocedure := to_regprocedure('public.consume_action_rate_limit(text,text,integer,integer)');
begin
  if fn is null then
    raise exception 'Required atomic rate-limit RPC is missing';
  end if;

  if not has_function_privilege('service_role', fn, 'EXECUTE') then
    raise exception 'service_role cannot execute the atomic rate-limit RPC';
  end if;
end
$rate_limit_rpc_contract$;

do $view_contract$
declare
  view_name text;
  options text[];
begin
  foreach view_name in array array[
    'public_va_directory',
    'public_company_profiles',
    'public_va_reviews',
    'public_va_certifications'
  ]
  loop
    select coalesce(c.reloptions, array[]::text[])
      into options
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = view_name
      and c.relkind = 'v';

    if options is null then
      raise exception 'Required public view public.% is missing', view_name;
    end if;

    if not ('security_invoker=true' = any(options))
       or not ('security_barrier=true' = any(options)) then
      raise exception 'Public view public.% is missing security_invoker/security_barrier', view_name;
    end if;
  end loop;
end
$view_contract$;

do $upload_quarantine_contract$
declare
  quarantine_public boolean;
  quarantine_limit bigint;
  quarantine_mimes text[];
begin
  select public, file_size_limit, allowed_mime_types
    into quarantine_public, quarantine_limit, quarantine_mimes
  from storage.buckets
  where id = 'upload-quarantine';

  if not found then
    raise exception 'Private upload quarantine bucket is missing';
  end if;
  if quarantine_public then
    raise exception 'Upload quarantine bucket must remain private';
  end if;
  if quarantine_limit <> 10485760 then
    raise exception 'Upload quarantine bucket must keep the 10 MB hard limit';
  end if;
  if not array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[] <@ coalesce(quarantine_mimes, array[]::text[]) then
    raise exception 'Upload quarantine bucket MIME allowlist is incomplete';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        coalesce(qual, '') ilike '%upload-quarantine%'
        or coalesce(with_check, '') ilike '%upload-quarantine%'
      )
      and (
        'anon'::name = any(roles)
        or 'authenticated'::name = any(roles)
      )
  ) then
    raise exception 'Browser role policy exposes the upload quarantine bucket';
  end if;
end
$upload_quarantine_contract$;

select 'database_contracts_ok' as result;
