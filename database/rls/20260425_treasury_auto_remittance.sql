-- Automatic treasury remittance settings and execution logs.
-- This keeps remittance configuration and execution history separate
-- from standard income/expense entries while preserving traceability.

begin;

create table if not exists public.treasury_remittance_settings (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  is_enabled boolean not null default false,
  source_type text not null default 'tithe'
    check (source_type in ('tithe', 'offering', 'both')),
  percentage numeric(5, 2) not null default 100
    check (percentage >= 0 and percentage <= 100),
  fixed_amount numeric(14, 2) null
    check (fixed_amount is null or fixed_amount >= 0),
  destination text not null default 'conference'
    check (destination in ('conference', 'mission', 'union')),
  frequency text not null default 'manual'
    check (frequency in ('daily', 'weekly', 'monthly', 'manual')),
  mode text not null default 'auto_create'
    check (mode in ('auto_create', 'auto_process')),
  allow_override boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint treasury_remittance_settings_church_unique unique (church_id)
);

create table if not exists public.treasury_remittance_logs (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  run_date date not null,
  source_type text not null
    check (source_type in ('tithe', 'offering', 'both')),
  source_amount numeric(14, 2) not null check (source_amount >= 0),
  remitted_amount numeric(14, 2) not null check (remitted_amount >= 0),
  destination text not null
    check (destination in ('conference', 'mission', 'union')),
  frequency text not null
    check (frequency in ('daily', 'weekly', 'monthly', 'manual')),
  mode text not null
    check (mode in ('auto_create', 'auto_process')),
  status text not null default 'processed'
    check (status in ('processed', 'skipped', 'failed')),
  outflow_reference text null,
  note text null,
  recorded_by_user_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_treasury_remittance_settings_church
  on public.treasury_remittance_settings(church_id);

create index if not exists idx_treasury_remittance_logs_church_run_date
  on public.treasury_remittance_logs(church_id, run_date desc, created_at desc);

alter table public.treasury_remittance_settings enable row level security;
alter table public.treasury_remittance_logs enable row level security;

drop policy if exists treasury_remittance_settings_select_managers_v1
  on public.treasury_remittance_settings;
drop policy if exists treasury_remittance_settings_insert_managers_v1
  on public.treasury_remittance_settings;
drop policy if exists treasury_remittance_settings_update_managers_v1
  on public.treasury_remittance_settings;

create policy treasury_remittance_settings_select_managers_v1
on public.treasury_remittance_settings
for select
to authenticated
using (
  exists (
    select 1
    from public.church_users cu
    where cu.church_id = treasury_remittance_settings.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_role_assignments cra
    join public.role_definitions rd on rd.id = cra.role_id
    where cra.church_id = treasury_remittance_settings.church_id
      and cra.user_id = auth.uid()
      and cra.is_active = true
      and (cra.start_date is null or cra.start_date <= current_date)
      and (cra.end_date is null or cra.end_date >= current_date)
      and rd.code = any (array['church_admin', 'treasurer', 'pastor'])
  )
);

create policy treasury_remittance_settings_insert_managers_v1
on public.treasury_remittance_settings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.church_users cu
    where cu.church_id = treasury_remittance_settings.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_role_assignments cra
    join public.role_definitions rd on rd.id = cra.role_id
    where cra.church_id = treasury_remittance_settings.church_id
      and cra.user_id = auth.uid()
      and cra.is_active = true
      and (cra.start_date is null or cra.start_date <= current_date)
      and (cra.end_date is null or cra.end_date >= current_date)
      and rd.code = any (array['church_admin', 'treasurer', 'pastor'])
  )
);

create policy treasury_remittance_settings_update_managers_v1
on public.treasury_remittance_settings
for update
to authenticated
using (
  exists (
    select 1
    from public.church_users cu
    where cu.church_id = treasury_remittance_settings.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_role_assignments cra
    join public.role_definitions rd on rd.id = cra.role_id
    where cra.church_id = treasury_remittance_settings.church_id
      and cra.user_id = auth.uid()
      and cra.is_active = true
      and (cra.start_date is null or cra.start_date <= current_date)
      and (cra.end_date is null or cra.end_date >= current_date)
      and rd.code = any (array['church_admin', 'treasurer', 'pastor'])
  )
)
with check (
  exists (
    select 1
    from public.church_users cu
    where cu.church_id = treasury_remittance_settings.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_role_assignments cra
    join public.role_definitions rd on rd.id = cra.role_id
    where cra.church_id = treasury_remittance_settings.church_id
      and cra.user_id = auth.uid()
      and cra.is_active = true
      and (cra.start_date is null or cra.start_date <= current_date)
      and (cra.end_date is null or cra.end_date >= current_date)
      and rd.code = any (array['church_admin', 'treasurer', 'pastor'])
  )
);

drop policy if exists treasury_remittance_logs_select_managers_v1
  on public.treasury_remittance_logs;
drop policy if exists treasury_remittance_logs_insert_managers_v1
  on public.treasury_remittance_logs;

create policy treasury_remittance_logs_select_managers_v1
on public.treasury_remittance_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.church_users cu
    where cu.church_id = treasury_remittance_logs.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_role_assignments cra
    join public.role_definitions rd on rd.id = cra.role_id
    where cra.church_id = treasury_remittance_logs.church_id
      and cra.user_id = auth.uid()
      and cra.is_active = true
      and (cra.start_date is null or cra.start_date <= current_date)
      and (cra.end_date is null or cra.end_date >= current_date)
      and rd.code = any (array['church_admin', 'treasurer', 'pastor'])
  )
);

create policy treasury_remittance_logs_insert_managers_v1
on public.treasury_remittance_logs
for insert
to authenticated
with check (
  treasury_remittance_logs.recorded_by_user_id = auth.uid()
  and exists (
    select 1
    from public.church_users cu
    where cu.church_id = treasury_remittance_logs.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_role_assignments cra
    join public.role_definitions rd on rd.id = cra.role_id
    where cra.church_id = treasury_remittance_logs.church_id
      and cra.user_id = auth.uid()
      and cra.is_active = true
      and (cra.start_date is null or cra.start_date <= current_date)
      and (cra.end_date is null or cra.end_date >= current_date)
      and rd.code = any (array['church_admin', 'treasurer', 'pastor'])
  )
);

commit;
