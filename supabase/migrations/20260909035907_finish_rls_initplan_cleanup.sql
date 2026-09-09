alter policy "application participants read status history" on public.application_status_history
  to authenticated
  using (
    exists (
      select 1
      from public.applications a
      left join public.jobs j on j.id = a.job_id
      left join public.job_candidate_access ca on ca.job_id = a.job_id
      where a.id = application_status_history.application_id
        and (
          a.va_id = (select auth.uid())
          or (j.client_id = (select auth.uid()) and ca.access_status in ('paid','comped'))
        )
    )
  );

alter policy "client commercials read" on public.job_commercials
  to authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_commercials.job_id
        and j.client_id = (select auth.uid())
    )
  );

alter policy "invites participant read" on public.job_invites
  to authenticated
  using ((select auth.uid()) = va_id or (select auth.uid()) = client_id);

alter policy "review contract parties read" on public.reviews
  to authenticated
  using ((select auth.uid()) = reviewer_id or (select auth.uid()) = reviewee_id);

alter policy "saved jobs own" on public.saved_jobs
  to authenticated
  using ((select auth.uid()) = va_id)
  with check ((select auth.uid()) = va_id);

alter policy "va deletes unapproved own time" on public.time_entries
  to authenticated
  using ((select auth.uid()) = va_id and status <> 'approved');

alter policy "va logs own pending time" on public.time_entries
  to authenticated
  with check (
    (select auth.uid()) = va_id
    and status = 'pending'
    and exists (
      select 1 from public.workrooms w
      where w.id = time_entries.workroom_id
        and w.va_id = (select auth.uid())
    )
  );

alter policy "workroom time participants read" on public.time_entries
  to authenticated
  using (
    exists (
      select 1 from public.workrooms w
      where w.id = time_entries.workroom_id
        and (w.client_id = (select auth.uid()) or w.va_id = (select auth.uid()))
    )
  );

alter policy "va test own read" on public.va_test_attempts
  to authenticated
  using ((select auth.uid()) = va_id);

alter policy "va vetting own read" on public.va_vetting
  to authenticated
  using ((select auth.uid()) = va_id);

alter policy "workroom checklist participants read" on public.workroom_checklist
  to authenticated
  using (
    exists (
      select 1 from public.workrooms w
      where w.id = workroom_checklist.workroom_id
        and (w.client_id = (select auth.uid()) or w.va_id = (select auth.uid()))
    )
  );

alter policy "workroom task participants read" on public.workroom_tasks
  to authenticated
  using (
    exists (
      select 1 from public.workrooms w
      where w.id = workroom_tasks.workroom_id
        and (w.client_id = (select auth.uid()) or w.va_id = (select auth.uid()))
    )
  );
