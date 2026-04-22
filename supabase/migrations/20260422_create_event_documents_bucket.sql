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
