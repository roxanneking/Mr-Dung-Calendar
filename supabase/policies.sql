alter table public.events enable row level security;
alter table public.admin_users enable row level security;

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
