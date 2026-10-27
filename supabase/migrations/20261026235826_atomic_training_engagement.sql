-- Serialize engagement updates for one learner/lesson in the database.
-- Calls must use the server-only service-role client. No direct learner RPC access.
create or replace function public.record_training_engagement_atomic(
  p_user_id uuid,
  p_lesson_id uuid,
  p_scroll_percent integer
)
returns table(active_seconds integer, max_scroll_percent smallint)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_prior timestamptz;
  v_elapsed integer;
begin
  if p_scroll_percent is null or p_scroll_percent < 0 or p_scroll_percent > 100 then
    raise exception 'Invalid scroll percent';
  end if;

  -- An advisory transaction lock serializes competing requests, including first insert.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_lesson_id::text, 0));

  insert into public.training_lesson_engagement(user_id, lesson_id, last_activity_at, updated_at, max_scroll_percent)
  values(p_user_id, p_lesson_id, v_now, v_now, p_scroll_percent)
  on conflict(user_id, lesson_id) do nothing;

  select t.last_activity_at into v_prior
  from public.training_lesson_engagement t
  where t.user_id = p_user_id and t.lesson_id = p_lesson_id
  for update;

  -- First insertion uses v_now; it must not award reading time.
  v_elapsed := floor(extract(epoch from (v_now - v_prior)))::integer;

  update public.training_lesson_engagement t
  set active_seconds = t.active_seconds +
      case when v_elapsed between 5 and 45 then least(30, v_elapsed) else 0 end,
      max_scroll_percent = greatest(t.max_scroll_percent::integer, p_scroll_percent)::smallint,
      last_activity_at = v_now,
      updated_at = v_now
  where t.user_id = p_user_id and t.lesson_id = p_lesson_id;

  return query
  select t.active_seconds, t.max_scroll_percent
  from public.training_lesson_engagement t
  where t.user_id = p_user_id and t.lesson_id = p_lesson_id;
end;
$$;

revoke all on function public.record_training_engagement_atomic(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.record_training_engagement_atomic(uuid, uuid, integer) to service_role;
