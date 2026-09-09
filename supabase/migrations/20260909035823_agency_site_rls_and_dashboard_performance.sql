-- High-use RLS: cache auth.uid() once per statement and tighten role scope.

alter policy "profiles own read" on public.profiles
  to authenticated
  using ((select auth.uid()) = id);

alter policy "client profile own read" on public.client_profiles
  to authenticated
  using ((select auth.uid()) = user_id);

alter policy "va profile own read" on public.va_profiles
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "clients own jobs read" on public.jobs;
drop policy if exists "public published jobs" on public.jobs;
create policy "public published jobs"
  on public.jobs for select to anon
  using (status = 'published'::public.job_status);
create policy "authenticated jobs read"
  on public.jobs for select to authenticated
  using (status = 'published'::public.job_status or client_id = (select auth.uid()));

drop policy if exists "clients see unlocked job applications" on public.applications;
drop policy if exists "va own applications" on public.applications;
create policy "application participants read"
  on public.applications for select to authenticated
  using (
    va_id = (select auth.uid())
    or exists (
      select 1
      from public.jobs j
      join public.job_candidate_access ca on ca.job_id = j.id
      where j.id = applications.job_id
        and j.client_id = (select auth.uid())
        and ca.access_status in ('paid','comped')
    )
  );

alter policy "client candidate access read" on public.job_candidate_access
  to authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_candidate_access.job_id
        and j.client_id = (select auth.uid())
    )
  );

alter policy "conversation participants" on public.conversations
  to authenticated
  using (
    va_id = (select auth.uid())
    or (
      client_id = (select auth.uid())
      and exists (
        select 1
        from public.applications a
        join public.job_candidate_access ca on ca.job_id = a.job_id
        where a.id = conversations.application_id
          and ca.access_status in ('paid','comped')
      )
    )
  );

alter policy "message participants read" on public.messages
  to authenticated
  using (
    exists (
      select 1
      from public.conversations c
      left join public.applications a on a.id = c.application_id
      left join public.job_candidate_access ca on ca.job_id = a.job_id
      where c.id = messages.conversation_id
        and (
          c.va_id = (select auth.uid())
          or (c.client_id = (select auth.uid()) and ca.access_status in ('paid','comped'))
        )
    )
  );

alter policy "message participants send" on public.messages
  to authenticated
  with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1
      from public.conversations c
      left join public.applications a on a.id = c.application_id
      left join public.job_candidate_access ca on ca.job_id = a.job_id
      where c.id = messages.conversation_id
        and (
          c.va_id = (select auth.uid())
          or (c.client_id = (select auth.uid()) and ca.access_status in ('paid','comped'))
        )
    )
  );

alter policy "notifications own read" on public.notifications
  to authenticated
  using ((select auth.uid()) = user_id);

alter policy "notifications own update" on public.notifications
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "notifications own delete" on public.notifications
  to authenticated
  using ((select auth.uid()) = user_id);

alter policy "clients own saved vas" on public.saved_vas
  to authenticated
  using ((select auth.uid()) = client_id)
  with check ((select auth.uid()) = client_id);

alter policy "workroom participants" on public.workrooms
  to authenticated
  using ((select auth.uid()) = client_id or (select auth.uid()) = va_id);

drop policy if exists "client reads own payments" on public.payments;
drop policy if exists "va reads own payments" on public.payments;
create policy "payment participants read"
  on public.payments for select to authenticated
  using ((select auth.uid()) = client_id or (select auth.uid()) = va_id);

-- Dashboard/query-path indexes. Avoid duplicating indexes already present.
create index if not exists applications_job_applied_idx on public.applications (job_id, applied_at desc);
create index if not exists applications_va_applied_idx on public.applications (va_id, applied_at desc);
create index if not exists conversations_client_created_idx on public.conversations (client_id, created_at desc);
create index if not exists conversations_va_created_idx on public.conversations (va_id, created_at desc);
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists lead_intake_client_id_idx on public.lead_intake (client_id);
create index if not exists lead_intake_job_id_idx on public.lead_intake (job_id);
create index if not exists saved_vas_va_id_idx on public.saved_vas (va_id);
create index if not exists workrooms_job_id_idx on public.workrooms (job_id);
create index if not exists job_candidate_access_unlocked_by_idx on public.job_candidate_access (unlocked_by);
drop index if exists public.jobs_client_idx;

-- Payout view can safely use caller permissions/RLS.
alter view public.va_payout_view set (security_invoker = true);

-- Public discovery views intentionally expose a curated subset of privileged
-- base tables. Keep the owner-context design, but make grants explicit and
-- add a security barrier so predicates cannot be pushed through the view.
alter view public.public_va_directory set (security_barrier = true);
alter view public.public_va_certifications set (security_barrier = true);
alter view public.public_va_reviews set (security_barrier = true);
alter view public.public_company_profiles set (security_barrier = true);

revoke all on public.public_va_directory from public;
revoke all on public.public_va_certifications from public;
revoke all on public.public_va_reviews from public;
revoke all on public.public_company_profiles from public;
grant select on public.public_va_directory to anon, authenticated, service_role;
grant select on public.public_va_certifications to anon, authenticated, service_role;
grant select on public.public_va_reviews to anon, authenticated, service_role;
grant select on public.public_company_profiles to anon, authenticated, service_role;

-- Trigger/helper hardening.
alter function public.touch_updated_at() set search_path = public;
alter function public.payments_touch_updated_at() set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;
