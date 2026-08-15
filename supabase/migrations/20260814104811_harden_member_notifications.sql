-- Shared church/member notification hardening.
-- Keeps one per-user inbox while adding acknowledgement, expiry, delivery
-- idempotency, and role policies that match the application workflow.

alter table public.church_notifications
  add column if not exists requires_acknowledgement boolean not null default false,
  add column if not exists acknowledged_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists delivery_key text;

create unique index if not exists church_notifications_delivery_unique
  on public.church_notifications (
    church_id,
    target_user_id,
    delivery_key
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'church_notifications'
  ) then
    alter publication supabase_realtime add table public.church_notifications;
  end if;
end
$$;

drop policy if exists church_announcements_select_access on public.church_announcements;
drop policy if exists church_announcements_select_managers on public.church_announcements;
drop policy if exists church_announcements_insert_managers on public.church_announcements;
drop policy if exists church_announcements_update_managers on public.church_announcements;

create policy church_announcements_select_managers
  on public.church_announcements
  for select
  to authenticated
  using (
    public.has_church_role(
      church_id,
      array['church_admin', 'pastor', 'elder', 'clerk', 'church_secretary']
    )
  );

create policy church_announcements_insert_managers
  on public.church_announcements
  for insert
  to authenticated
  with check (
    public.has_church_role(
      church_id,
      array['church_admin', 'pastor', 'elder', 'clerk', 'church_secretary']
    )
  );

create policy church_announcements_update_managers
  on public.church_announcements
  for update
  to authenticated
  using (
    public.has_church_role(
      church_id,
      array['church_admin', 'pastor', 'elder', 'clerk', 'church_secretary']
    )
  )
  with check (
    public.has_church_role(
      church_id,
      array['church_admin', 'pastor', 'elder', 'clerk', 'church_secretary']
    )
  );

drop policy if exists department_announcements_select_access on public.department_announcements;
drop policy if exists department_announcements_select_managers on public.department_announcements;
drop policy if exists department_announcements_insert_managers on public.department_announcements;
drop policy if exists department_announcements_update_managers on public.department_announcements;

create policy department_announcements_select_managers
  on public.department_announcements
  for select
  to authenticated
  using (
    public.has_church_role(
      church_id,
      array['church_admin', 'pastor', 'elder', 'clerk', 'church_secretary']
    )
  );

create policy department_announcements_insert_managers
  on public.department_announcements
  for insert
  to authenticated
  with check (
    public.has_church_role(
      church_id,
      array['church_admin', 'pastor', 'elder', 'clerk', 'church_secretary']
    )
  );

create policy department_announcements_update_managers
  on public.department_announcements
  for update
  to authenticated
  using (
    public.has_church_role(
      church_id,
      array['church_admin', 'pastor', 'elder', 'clerk', 'church_secretary']
    )
  )
  with check (
    public.has_church_role(
      church_id,
      array['church_admin', 'pastor', 'elder', 'clerk', 'church_secretary']
    )
  );

drop policy if exists church_notifications_select_target on public.church_notifications;
drop policy if exists church_notifications_insert_managers on public.church_notifications;
drop policy if exists church_notifications_insert_reviewers on public.church_notifications;
drop policy if exists church_notifications_update_target on public.church_notifications;

create policy church_notifications_select_target
  on public.church_notifications
  for select
  to authenticated
  using (
    target_user_id = (select auth.uid())
    or public.has_church_role(
      church_id,
      array['church_admin', 'pastor', 'elder', 'clerk', 'church_secretary']
    )
  );

create policy church_notifications_insert_reviewers
  on public.church_notifications
  for insert
  to authenticated
  with check (
    public.has_church_role(
      church_id,
      array[
        'church_admin',
        'pastor',
        'elder',
        'clerk',
        'church_secretary',
        'treasurer',
        'tech_team'
      ]
    )
  );

create policy church_notifications_update_target
  on public.church_notifications
  for update
  to authenticated
  using (
    target_user_id = (select auth.uid())
    or public.has_church_role(
      church_id,
      array['church_admin', 'pastor', 'elder', 'clerk', 'church_secretary']
    )
  )
  with check (
    target_user_id = (select auth.uid())
    or public.has_church_role(
      church_id,
      array['church_admin', 'pastor', 'elder', 'clerk', 'church_secretary']
    )
  );
