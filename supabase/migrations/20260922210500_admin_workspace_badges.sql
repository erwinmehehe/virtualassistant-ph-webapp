create or replace function public.admin_workspace_badges()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'sales',
      (select count(*)::int
       from public.lead_intake
       where crm_stage = 'new'
         and status <> 'spam'),
    'finance',
      (select count(*)::int
       from public.placement_finance_profiles
       where exception_status = 'pending')
      +
      (select count(*)::int
       from public.payments
       where status = 'awaiting_payment')
      +
      (select count(*)::int
       from public.payments
       where status = 'release_pending')
  );
$$;

revoke all on function public.admin_workspace_badges() from public;
revoke all on function public.admin_workspace_badges() from anon;
revoke all on function public.admin_workspace_badges() from authenticated;
grant execute on function public.admin_workspace_badges() to service_role;
