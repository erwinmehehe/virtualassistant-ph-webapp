-- Production-applied 2026-09-30.
-- Align browser Data API grants with the operations that current RLS policies
-- actually permit. These revokes are defense in depth: each removed privilege
-- already had no matching RLS policy for the affected role/operation.

revoke select, insert, update, delete on table
  public.application_status_history,
  public.client_profiles,
  public.job_candidate_access,
  public.job_commercials,
  public.job_invites,
  public.notifications,
  public.profiles,
  public.saved_jobs,
  public.saved_vas,
  public.time_entries,
  public.training_assessments,
  public.training_certificates,
  public.training_courses,
  public.training_enrollments,
  public.training_learning_path_courses,
  public.training_learning_paths,
  public.training_lesson_progress,
  public.training_lessons,
  public.training_modules,
  public.va_profiles,
  public.va_test_attempts,
  public.va_vetting,
  public.workroom_checklist,
  public.workroom_tasks,
  public.workrooms
from anon;

revoke insert, update, delete on table
  public.applications,
  public.focus_verticals,
  public.jobs
from anon;

revoke insert, update, delete on table
  public.application_status_history,
  public.applications,
  public.client_profiles,
  public.job_candidate_access,
  public.job_commercials,
  public.job_invites,
  public.jobs,
  public.profiles,
  public.va_profiles,
  public.va_test_attempts,
  public.va_vetting,
  public.workroom_checklist,
  public.workroom_tasks,
  public.workrooms
from authenticated;

revoke insert on table public.notifications from authenticated;
revoke update on table public.time_entries from authenticated;
revoke update, delete on table public.training_enrollments from authenticated;
revoke delete on table public.training_lesson_progress from authenticated;
