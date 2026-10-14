create index if not exists recruiter_activity_actor_id_idx
  on public.recruiter_activity (actor_id);

create index if not exists job_shortlist_candidates_created_by_idx
  on public.job_shortlist_candidates (created_by);

create index if not exists training_lesson_progress_lesson_id_idx
  on public.training_lesson_progress (lesson_id);

create index if not exists workflow_reminders_recipient_id_idx
  on public.workflow_reminders (recipient_id);

create index if not exists va_vetting_recruiter_id_idx
  on public.va_vetting (recruiter_id);

create index if not exists app_error_events_user_id_idx
  on public.app_error_events (user_id);
