create table if not exists public.event_attachments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint not null check (file_size > 0),
  mime_type text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(event_id, file_name)
);

create index if not exists idx_event_attachments_event_id on public.event_attachments(event_id);

alter table public.event_attachments enable row level security;

drop policy if exists "public can read attachments" on public.event_attachments;
create policy "public can read attachments"
on public.event_attachments
for select
to anon, authenticated
using (true);

drop policy if exists "admins can insert attachments" on public.event_attachments;
create policy "admins can insert attachments"
on public.event_attachments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

drop policy if exists "admins can delete attachments" on public.event_attachments;
create policy "admins can delete attachments"
on public.event_attachments
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);
