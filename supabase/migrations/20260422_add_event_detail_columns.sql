alter table public.events
  add column if not exists owner text,
  add column if not exists deadline date,
  add column if not exists status text,
  add column if not exists result text,
  add column if not exists notes text;
