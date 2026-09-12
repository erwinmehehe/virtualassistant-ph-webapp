create index if not exists va_test_attempts_va_submitted_idx
  on public.va_test_attempts (va_id, submitted_at desc);

create index if not exists vetting_scorecards_va_created_idx
  on public.vetting_scorecards (va_id, created_at desc);
