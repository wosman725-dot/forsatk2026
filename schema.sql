create extension if not exists pgcrypto;

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  name text not null,
  phone text not null,
  email text not null,
  request_type text not null check (request_type in ('jobs','files')),
  country text not null,
  message text,
  status text not null default 'NEW' check (status in ('NEW','PAYMENT_PENDING','PAID','UNDER_REVIEW','NEED_MORE_INFO','APPROVED','NOT_ELIGIBLE','COMPLETED','CANCELLED')),
  payment_status text not null default 'NOT_STARTED' check (payment_status in ('NOT_STARTED','PENDING','PAID','FAILED','REFUNDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists requests_updated_at on public.requests;
create trigger requests_updated_at before update on public.requests for each row execute function public.set_updated_at();

alter table public.requests enable row level security;

drop policy if exists "public_can_insert_requests" on public.requests;
create policy "public_can_insert_requests" on public.requests for insert to anon
with check (status = 'NEW' and payment_status = 'NOT_STARTED');

-- Intentionally no public SELECT/UPDATE/DELETE policy.
-- Admin access will be added later through authenticated server-side/admin tooling.
