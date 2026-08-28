-- v4.10.6: payment disputes.
-- A client can flag a paid-but-not-yet-released invoice as disputed, which
-- freezes it (the admin release action only fires from status = 'paid').
-- An admin then resolves it by releasing anyway or refunding via Stripe.

alter table public.payments add column if not exists disputed_at timestamptz;
alter table public.payments add column if not exists dispute_reason text;
alter table public.payments add column if not exists disputed_by uuid references public.profiles(id) on delete set null;
alter table public.payments add column if not exists dispute_resolution text;
alter table public.payments add column if not exists dispute_resolved_at timestamptz;
alter table public.payments add column if not exists dispute_resolved_by uuid references public.profiles(id) on delete set null;

alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check
  check (status in ('draft', 'awaiting_payment', 'paid', 'disputed', 'release_pending', 'released', 'failed', 'refunded', 'void'));
