create or replace function public.enforce_va_approval_completion_floor()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_completion integer;
begin
  if new.stage in ('approved','bench')
     and (
       tg_op = 'INSERT'
       or old.stage is null
       or old.stage not in ('approved','bench')
     ) then
    select coalesce(d.completion_score,0)
      into v_completion
    from public.recruiter_va_directory d
    where d.user_id = new.va_id;

    if coalesce(v_completion,0) < 80 then
      raise exception using
        errcode = '23514',
        message = format(
          'VA profile must be at least 80%% complete before approval. Current completion: %s%%.',
          coalesce(v_completion,0)
        );
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists enforce_va_approval_completion_floor on public.va_vetting;
create trigger enforce_va_approval_completion_floor
before insert or update of stage on public.va_vetting
for each row
execute function public.enforce_va_approval_completion_floor();
