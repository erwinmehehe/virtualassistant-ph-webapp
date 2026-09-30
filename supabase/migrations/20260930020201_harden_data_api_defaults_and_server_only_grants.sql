-- Production-applied 2026-09-30.
-- Browser roles must only reach Data API objects that are granted deliberately.

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete, truncate, references, trigger on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete, truncate, references, trigger on tables to service_role;
alter default privileges for role postgres in schema public
  grant usage, select, update on sequences to service_role;
alter default privileges for role postgres in schema public
  grant execute on functions to service_role;

revoke all on table
  public.crm_companies,
  public.crm_contacts,
  public.crm_custom_fields,
  public.crm_custom_values,
  public.crm_dashboard_preferences,
  public.crm_saved_views,
  public.crm_workflows,
  public.training_lesson_engagement
from anon, authenticated;

grant all on table
  public.crm_companies,
  public.crm_contacts,
  public.crm_custom_fields,
  public.crm_custom_values,
  public.crm_dashboard_preferences,
  public.crm_saved_views,
  public.crm_workflows,
  public.training_lesson_engagement
to service_role;

create policy "client_recruiter_messages_server_only" on public.client_recruiter_messages
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "client_recruiter_threads_server_only" on public.client_recruiter_threads
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "legacy_conversations_server_only" on public.conversations
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "legacy_messages_server_only" on public.messages
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "crm_companies_server_only" on public.crm_companies
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "crm_contacts_server_only" on public.crm_contacts
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "crm_custom_fields_server_only" on public.crm_custom_fields
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "crm_custom_values_server_only" on public.crm_custom_values
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "crm_dashboard_preferences_server_only" on public.crm_dashboard_preferences
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "crm_saved_views_server_only" on public.crm_saved_views
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "crm_workflows_server_only" on public.crm_workflows
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "recruiter_action_claims_server_only" on public.recruiter_action_claims
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "recruiter_va_messages_server_only" on public.recruiter_va_messages
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "recruiter_va_threads_server_only" on public.recruiter_va_threads
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "training_lesson_engagement_server_only" on public.training_lesson_engagement
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "training_specialist_review_events_server_only" on public.training_specialist_review_events
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "training_specialist_review_invites_server_only" on public.training_specialist_review_invites
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy "training_specialist_reviews_server_only" on public.training_specialist_reviews
  as restrictive for all to anon, authenticated using (false) with check (false);
