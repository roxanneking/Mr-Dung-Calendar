create extension if not exists "pgcrypto";

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  date date not null,
  start_time time not null,
  end_time time not null,
  location text,
  description text,
  owner text,
  deadline date,
  status text,
  result text,
  notes text,
  category text not null check (category in ('meeting', 'business_trip', 'internal', 'client', 'other')),
  color text not null default '#059669',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_check check (start_time < end_time)
);

create index if not exists idx_events_date on public.events(date);
create index if not exists idx_events_date_start_time on public.events(date, start_time);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_event_creator()
returns trigger
language plpgsql
as $$
begin
  if new.created_by is null then
    new.created_by = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_events_set_updated_at on public.events;
create trigger trg_events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

drop trigger if exists trg_events_set_creator on public.events;
create trigger trg_events_set_creator
before insert on public.events
for each row
execute function public.set_event_creator();
