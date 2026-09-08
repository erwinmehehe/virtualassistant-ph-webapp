-- Sales progress is independent of the existing intake conversion status.
-- Existing lead access policies remain unchanged; updates are admin-only server actions.
alter table public.lead_intake
  add column if not exists sales_stage text not null default 'new'
    check (sales_stage in ('new','contacted','qualified','proposal','won','lost')),
  add column if not exists follow_up_on date,
  add column if not exists sales_notes text check (char_length(sales_notes) <= 4000);

create index if not exists lead_intake_sales_follow_up_idx
  on public.lead_intake (follow_up_on, sales_stage)
  where status <> 'archived' and sales_stage not in ('won','lost');
