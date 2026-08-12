-- Ministry Operations + Deacon/Usher Attendance Support MVP
-- Run this in Supabase SQL Editor before testing the new routes.

create table if not exists public.ministry_duty_types (
  id uuid primary key default extensions.gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  scope_type text not null check (scope_type in ('department', 'small_group')),
  scope_id uuid not null,
  name text not null,
  system_key text,
  icon_key text,
  description text,
  requires_attendance_support boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ministry_duty_types_scope_name_idx
  on public.ministry_duty_types (church_id, scope_type, scope_id, lower(name));

create table if not exists public.ministry_duty_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  scope_type text not null check (scope_type in ('department', 'small_group')),
  scope_id uuid not null,
  duty_type_id uuid references public.ministry_duty_types(id) on delete set null,
  event_id uuid,
  member_id uuid not null references public.members(id) on delete cascade,
  service_date date not null,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'served', 'missed', 'replacement_requested', 'replaced', 'cancelled')),
  leader_note text,
  member_note text,
  replacement_reason text,
  confirmed_at timestamptz,
  served_at timestamptz,
  requested_replacement_at timestamptz,
  created_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ministry_duty_assignments_scope_date_idx
  on public.ministry_duty_assignments (church_id, scope_type, scope_id, service_date desc);

create index if not exists ministry_duty_assignments_member_idx
  on public.ministry_duty_assignments (church_id, member_id, service_date desc);

create table if not exists public.ministry_tasks (
  id uuid primary key default extensions.gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  scope_type text not null check (scope_type in ('department', 'small_group')),
  scope_id uuid not null,
  title text not null,
  description text,
  assigned_to_member_id uuid references public.members(id) on delete set null,
  due_date date,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'cancelled')),
  linked_event_id uuid,
  created_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ministry_tasks_scope_idx
  on public.ministry_tasks (church_id, scope_type, scope_id, status, due_date);

create table if not exists public.ministry_reports (
  id uuid primary key default extensions.gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  scope_type text not null check (scope_type in ('department', 'small_group')),
  scope_id uuid not null,
  report_type text not null default 'monthly',
  title text not null,
  period_start date,
  period_end date,
  summary text,
  challenges text,
  needs text,
  recommendations text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed')),
  submitted_by_user_id uuid references auth.users(id),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ministry_reports_scope_idx
  on public.ministry_reports (church_id, scope_type, scope_id, status, period_end desc);

alter table public.ministry_duty_types enable row level security;
alter table public.ministry_duty_assignments enable row level security;
alter table public.ministry_tasks enable row level security;
alter table public.ministry_reports enable row level security;

-- The app uses server-side role/scope checks and an admin client for the operations shell.
-- These policies still allow safe read visibility for church members and management for church leaders.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ministry_duty_types' and policyname='ministry_duty_types_church_read') then
    create policy ministry_duty_types_church_read on public.ministry_duty_types
      for select to authenticated using (public.is_church_member(church_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ministry_duty_types' and policyname='ministry_duty_types_church_manage') then
    create policy ministry_duty_types_church_manage on public.ministry_duty_types
      for all to authenticated
      using (public.has_church_role(church_id, array['church_admin','pastor','elder','clerk','church_secretary']))
      with check (public.has_church_role(church_id, array['church_admin','pastor','elder','clerk','church_secretary']));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ministry_duty_assignments' and policyname='ministry_duty_assignments_church_read') then
    create policy ministry_duty_assignments_church_read on public.ministry_duty_assignments
      for select to authenticated using (public.is_church_member(church_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ministry_duty_assignments' and policyname='ministry_duty_assignments_church_manage') then
    create policy ministry_duty_assignments_church_manage on public.ministry_duty_assignments
      for all to authenticated
      using (public.has_church_role(church_id, array['church_admin','pastor','elder','clerk','church_secretary']))
      with check (public.has_church_role(church_id, array['church_admin','pastor','elder','clerk','church_secretary']));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ministry_tasks' and policyname='ministry_tasks_church_read') then
    create policy ministry_tasks_church_read on public.ministry_tasks
      for select to authenticated using (public.is_church_member(church_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ministry_tasks' and policyname='ministry_tasks_church_manage') then
    create policy ministry_tasks_church_manage on public.ministry_tasks
      for all to authenticated
      using (public.has_church_role(church_id, array['church_admin','pastor','elder','clerk','church_secretary']))
      with check (public.has_church_role(church_id, array['church_admin','pastor','elder','clerk','church_secretary']));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ministry_reports' and policyname='ministry_reports_church_read') then
    create policy ministry_reports_church_read on public.ministry_reports
      for select to authenticated using (public.is_church_member(church_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ministry_reports' and policyname='ministry_reports_church_manage') then
    create policy ministry_reports_church_manage on public.ministry_reports
      for all to authenticated
      using (public.has_church_role(church_id, array['church_admin','pastor','elder','clerk','church_secretary']))
      with check (public.has_church_role(church_id, array['church_admin','pastor','elder','clerk','church_secretary']));
  end if;
end $$;

grant select, insert, update, delete on public.ministry_duty_types to authenticated;
grant select, insert, update, delete on public.ministry_duty_assignments to authenticated;
grant select, insert, update, delete on public.ministry_tasks to authenticated;
grant select, insert, update, delete on public.ministry_reports to authenticated;