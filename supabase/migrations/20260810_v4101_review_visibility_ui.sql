-- v4.10.1: verified placement reviews with explicit public vs contract-only visibility.
-- Review writes remain server-only. Anonymous users can only read the public-safe view,
-- which exposes client -> VA reviews while the reviewed VA has a published directory profile.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  workroom_id uuid not null references public.workrooms(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(btrim(body)) between 10 and 1600),
  visibility text not null default 'contract' check (visibility in ('public','contract')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_distinct_parties check (reviewer_id <> reviewee_id),
  unique (workroom_id, reviewer_id)
);

create index if not exists reviews_reviewee_idx on public.reviews(reviewee_id, created_at desc);
create index if not exists reviews_workroom_idx on public.reviews(workroom_id, created_at desc);

create or replace function public.validate_review_parties()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  room record;
begin
  select id, client_id, va_id into room
  from public.workrooms
  where id = new.workroom_id;

  if room.id is null then
    raise exception 'Workroom not found';
  end if;

  if new.reviewer_id = room.client_id then
    if new.reviewee_id <> room.va_id then
      raise exception 'Client reviews must review the VA in this workroom';
    end if;
  elsif new.reviewer_id = room.va_id then
    if new.reviewee_id <> room.client_id then
      raise exception 'VA reviews must review the client in this workroom';
    end if;
    if new.visibility <> 'contract' then
      raise exception 'VA-to-client reviews are contract-only';
    end if;
  else
    raise exception 'Reviewer is not a workroom participant';
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_validate_parties on public.reviews;
create trigger reviews_validate_parties
before insert or update on public.reviews
for each row execute procedure public.validate_review_parties();

-- touch_updated_at already exists in the base schema. Keep this trigger idempotent.
drop trigger if exists reviews_touch on public.reviews;
create trigger reviews_touch
before update on public.reviews
for each row execute procedure public.touch_updated_at();

alter table public.reviews enable row level security;

drop policy if exists "review contract parties read" on public.reviews;
create policy "review contract parties read" on public.reviews
for select to authenticated
using (auth.uid() = reviewer_id or auth.uid() = reviewee_id);

-- Review creation and changes are intentionally server-only after workroom ownership checks.
revoke all on public.reviews from anon;
revoke insert, update, delete on public.reviews from authenticated;
grant select on public.reviews to authenticated;
grant all on public.reviews to service_role;

-- Public-safe review surface. It intentionally exposes no client name, email, company,
-- job title, workroom id, or other contract data. If a VA profile is unpublished, these
-- rows automatically disappear from public access while remaining visible to both parties.
create or replace view public.public_va_reviews as
select
  r.id,
  r.reviewee_id,
  r.rating,
  r.body,
  r.created_at,
  'Verified client'::text as reviewer_label
from public.reviews r
join public.workrooms w on w.id = r.workroom_id
join public.public_va_directory d on d.user_id = r.reviewee_id
where r.visibility = 'public'
  and r.reviewer_id = w.client_id
  and r.reviewee_id = w.va_id;

revoke all on public.public_va_reviews from anon, authenticated;
grant select on public.public_va_reviews to anon, authenticated;
