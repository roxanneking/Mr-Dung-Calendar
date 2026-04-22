alter table public.events enable row level security;
alter table public.admin_users enable row level security;
alter table public.event_attachments enable row level security;

drop policy if exists "public can read events" on public.events;
create policy "public can read events"
on public.events
for select
to anon, authenticated
using (true);

drop policy if exists "admins can insert events" on public.events;
create policy "admins can insert events"
on public.events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

drop policy if exists "admins can update events" on public.events;
create policy "admins can update events"
on public.events
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

drop policy if exists "admins can delete events" on public.events;
create policy "admins can delete events"
on public.events
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

drop policy if exists "admin can view own mapping" on public.admin_users;
create policy "admin can view own mapping"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

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

insert into storage.buckets (id, name, public)
values ('event-documents', 'event-documents', true)
on conflict (id) do update
set public = true;

drop policy if exists "public can read event documents" on storage.objects;
create policy "public can read event documents"
on storage.objects
for select
to public
using (bucket_id = 'event-documents');

drop policy if exists "admins can upload event documents" on storage.objects;
create policy "admins can upload event documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-documents'
  and exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

drop policy if exists "admins can delete event documents" on storage.objects;
create policy "admins can delete event documents"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-documents'
  and exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);
