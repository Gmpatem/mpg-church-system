-- Department Finance System rollout
-- Purpose:
-- 1) Keep Treasury as the single processing engine.
-- 2) Add department-linked treasury references (no duplicate ledger).
-- 3) Add department fund request workflow with strict tenant-safe RLS.

begin;

-- ---------------------------------------------------------------------------
-- Schema updates for department-linked treasury transactions
-- ---------------------------------------------------------------------------

alter table public.treasury_inflows
  add column if not exists department_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'church_departments_church_id_id_key'
      and conrelid = 'public.church_departments'::regclass
  ) then
    alter table public.church_departments
      add constraint church_departments_church_id_id_key unique (church_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'treasury_funds_church_id_id_key'
      and conrelid = 'public.treasury_funds'::regclass
  ) then
    alter table public.treasury_funds
      add constraint treasury_funds_church_id_id_key unique (church_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'treasury_outflows_church_id_id_key'
      and conrelid = 'public.treasury_outflows'::regclass
  ) then
    alter table public.treasury_outflows
      add constraint treasury_outflows_church_id_id_key unique (church_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'treasury_inflows_church_department_fkey'
      and conrelid = 'public.treasury_inflows'::regclass
  ) then
    alter table public.treasury_inflows
      add constraint treasury_inflows_church_department_fkey
      foreign key (church_id, department_id)
      references public.church_departments(church_id, id)
      on update cascade
      on delete set null
      not valid;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'treasury_outflows_church_department_fkey'
      and conrelid = 'public.treasury_outflows'::regclass
  ) then
    alter table public.treasury_outflows
      add constraint treasury_outflows_church_department_fkey
      foreign key (church_id, department_id)
      references public.church_departments(church_id, id)
      on update cascade
      on delete set null
      not valid;
  end if;
end
$$;

create index if not exists treasury_inflows_church_department_date_idx
  on public.treasury_inflows (church_id, department_id, inflow_date desc)
  where department_id is not null;

create index if not exists treasury_outflows_church_department_date_idx
  on public.treasury_outflows (church_id, department_id, outflow_date desc)
  where department_id is not null;

-- ---------------------------------------------------------------------------
-- Department fund requests table (maps directly to treasury outflow processing)
-- ---------------------------------------------------------------------------

create table if not exists public.department_fund_requests (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id),
  department_id uuid not null references public.church_departments(id),
  requested_by_user_id uuid not null references public.profiles(id),
  title text not null,
  purpose text not null,
  amount numeric not null check (amount > 0),
  outflow_type text not null check (
    outflow_type = any (
      array[
        'project',
        'evangelism',
        'mission_remittance',
        'department_expense',
        'operations',
        'welfare',
        'equipment',
        'other'
      ]
    )
  ),
  preferred_fund_id uuid null references public.treasury_funds(id),
  payee text null,
  project_name text null,
  note text null,
  requested_date date not null,
  status text not null default 'pending' check (
    status = any (array['pending', 'approved', 'rejected', 'processed', 'cancelled'])
  ),
  treasury_decision_note text null,
  treasury_reviewed_by_user_id uuid null references public.profiles(id),
  treasury_reviewed_at timestamptz null,
  processed_outflow_id uuid null references public.treasury_outflows(id),
  processed_by_user_id uuid null references public.profiles(id),
  processed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'department_fund_requests_church_department_fkey'
      and conrelid = 'public.department_fund_requests'::regclass
  ) then
    alter table public.department_fund_requests
      add constraint department_fund_requests_church_department_fkey
      foreign key (church_id, department_id)
      references public.church_departments(church_id, id)
      on update cascade
      on delete restrict
      not valid;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'department_fund_requests_church_preferred_fund_fkey'
      and conrelid = 'public.department_fund_requests'::regclass
  ) then
    alter table public.department_fund_requests
      add constraint department_fund_requests_church_preferred_fund_fkey
      foreign key (church_id, preferred_fund_id)
      references public.treasury_funds(church_id, id)
      on update cascade
      on delete set null
      not valid;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'department_fund_requests_church_processed_outflow_fkey'
      and conrelid = 'public.department_fund_requests'::regclass
  ) then
    alter table public.department_fund_requests
      add constraint department_fund_requests_church_processed_outflow_fkey
      foreign key (church_id, processed_outflow_id)
      references public.treasury_outflows(church_id, id)
      on update cascade
      on delete set null
      not valid;
  end if;
end
$$;

create index if not exists department_fund_requests_church_department_status_idx
  on public.department_fund_requests (church_id, department_id, status, requested_date desc);

create index if not exists department_fund_requests_church_status_created_idx
  on public.department_fund_requests (church_id, status, created_at desc);

create index if not exists department_fund_requests_requested_by_idx
  on public.department_fund_requests (requested_by_user_id, created_at desc);

create or replace function public.set_department_fund_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_department_fund_requests_set_updated_at
  on public.department_fund_requests;

create trigger trg_department_fund_requests_set_updated_at
before update on public.department_fund_requests
for each row
execute function public.set_department_fund_requests_updated_at();

-- ---------------------------------------------------------------------------
-- RLS for department_fund_requests
-- ---------------------------------------------------------------------------

alter table public.department_fund_requests enable row level security;

grant select, insert, update on table public.department_fund_requests to authenticated;

drop policy if exists department_fund_requests_select_church_users_v1
  on public.department_fund_requests;
create policy department_fund_requests_select_church_users_v1
on public.department_fund_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.church_users cu
    where cu.church_id = department_fund_requests.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
);

drop policy if exists department_fund_requests_insert_leaders_v1
  on public.department_fund_requests;
create policy department_fund_requests_insert_leaders_v1
on public.department_fund_requests
for insert
to authenticated
with check (
  department_fund_requests.requested_by_user_id = auth.uid()
  and department_fund_requests.status = 'pending'
  and exists (
    select 1
    from public.church_users cu
    where cu.church_id = department_fund_requests.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_departments cd
    where cd.id = department_fund_requests.department_id
      and cd.church_id = department_fund_requests.church_id
  )
  and (
    exists (
      select 1
      from public.church_role_assignments cra
      join public.role_definitions rd on rd.id = cra.role_id
      where cra.church_id = department_fund_requests.church_id
        and cra.user_id = auth.uid()
        and cra.is_active = true
        and (cra.start_date is null or cra.start_date <= current_date)
        and (cra.end_date is null or cra.end_date >= current_date)
        and rd.code = any (array['church_admin', 'pastor'])
    )
    or exists (
      select 1
      from public.members m
      join public.department_leadership_assignments dla
        on dla.member_id = m.id
      where m.profile_id = auth.uid()
        and m.church_id = department_fund_requests.church_id
        and dla.church_id = department_fund_requests.church_id
        and dla.department_id = department_fund_requests.department_id
        and dla.is_active = true
    )
    or exists (
      select 1
      from public.members m
      join public.member_departments md
        on md.member_id = m.id
      where m.profile_id = auth.uid()
        and m.church_id = department_fund_requests.church_id
        and md.church_id = department_fund_requests.church_id
        and md.department_id = department_fund_requests.department_id
        and coalesce(md.is_active, true) = true
        and lower(coalesce(md.role_title, '')) like any (
          array[
            '%leader%',
            '%head%',
            '%director%',
            '%coordinator%',
            '%pastor%',
            '%elder%',
            '%captain%',
            '%chair%',
            '%manager%',
            '%supervisor%'
          ]
        )
    )
  )
  and (
    department_fund_requests.preferred_fund_id is null
    or exists (
      select 1
      from public.treasury_funds tf
      where tf.id = department_fund_requests.preferred_fund_id
        and tf.church_id = department_fund_requests.church_id
    )
  )
);

drop policy if exists department_fund_requests_update_treasury_managers_v1
  on public.department_fund_requests;
create policy department_fund_requests_update_treasury_managers_v1
on public.department_fund_requests
for update
to authenticated
using (
  exists (
    select 1
    from public.church_users cu
    where cu.church_id = department_fund_requests.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_role_assignments cra
    join public.role_definitions rd on rd.id = cra.role_id
    where cra.church_id = department_fund_requests.church_id
      and cra.user_id = auth.uid()
      and cra.is_active = true
      and (cra.start_date is null or cra.start_date <= current_date)
      and (cra.end_date is null or cra.end_date >= current_date)
      and rd.code = any (array['church_admin', 'pastor', 'treasurer'])
  )
)
with check (
  exists (
    select 1
    from public.church_users cu
    where cu.church_id = department_fund_requests.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_departments cd
    where cd.id = department_fund_requests.department_id
      and cd.church_id = department_fund_requests.church_id
  )
  and (
    department_fund_requests.preferred_fund_id is null
    or exists (
      select 1
      from public.treasury_funds tf
      where tf.id = department_fund_requests.preferred_fund_id
        and tf.church_id = department_fund_requests.church_id
    )
  )
  and (
    department_fund_requests.processed_outflow_id is null
    or exists (
      select 1
      from public.treasury_outflows tout
      where tout.id = department_fund_requests.processed_outflow_id
        and tout.church_id = department_fund_requests.church_id
    )
  )
);

-- ---------------------------------------------------------------------------
-- Tighten treasury inflow insert policy to include optional department check
-- ---------------------------------------------------------------------------

do $$
declare
  policy_name text;
begin
  for policy_name in
    select p.policyname
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'treasury_inflows'
      and p.cmd = 'INSERT'
  loop
    execute format('drop policy if exists %I on public.treasury_inflows', policy_name);
  end loop;
end
$$;

create policy treasury_inflows_insert_managers_v3
on public.treasury_inflows
for insert
to authenticated
with check (
  treasury_inflows.recorded_by_user_id = auth.uid()
  and exists (
    select 1
    from public.church_users cu
    where cu.church_id = treasury_inflows.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_role_assignments cra
    join public.role_definitions rd on rd.id = cra.role_id
    where cra.church_id = treasury_inflows.church_id
      and cra.user_id = auth.uid()
      and cra.is_active = true
      and (cra.start_date is null or cra.start_date <= current_date)
      and (cra.end_date is null or cra.end_date >= current_date)
      and rd.code = any (array['church_admin', 'pastor', 'treasurer'])
  )
  and exists (
    select 1
    from public.treasury_funds tf
    where tf.id = treasury_inflows.fund_id
      and tf.church_id = treasury_inflows.church_id
  )
  and (
    treasury_inflows.member_id is null
    or exists (
      select 1
      from public.members m
      where m.id = treasury_inflows.member_id
        and m.church_id = treasury_inflows.church_id
    )
  )
  and (
    treasury_inflows.department_id is null
    or exists (
      select 1
      from public.church_departments cd
      where cd.id = treasury_inflows.department_id
        and cd.church_id = treasury_inflows.church_id
    )
  )
);

commit;
