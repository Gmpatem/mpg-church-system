-- Internal fund transfer ledger for treasury.
-- Transfers move balance between funds and must not be treated as income or expense.

begin;

create table if not exists public.treasury_fund_transfers (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  source_fund_id uuid not null references public.treasury_funds(id) on delete restrict,
  destination_fund_id uuid not null references public.treasury_funds(id) on delete restrict,
  amount numeric(14, 2) not null check (amount > 0),
  transfer_date date not null,
  reason text not null,
  reference_number text null,
  note text null,
  recorded_by_user_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint treasury_fund_transfers_source_destination_diff
    check (source_fund_id <> destination_fund_id)
);

create index if not exists idx_treasury_fund_transfers_church_date
  on public.treasury_fund_transfers (church_id, transfer_date desc);

create index if not exists idx_treasury_fund_transfers_source_fund
  on public.treasury_fund_transfers (source_fund_id);

create index if not exists idx_treasury_fund_transfers_destination_fund
  on public.treasury_fund_transfers (destination_fund_id);

alter table public.treasury_fund_transfers enable row level security;

drop policy if exists treasury_fund_transfers_select_managers_v1
  on public.treasury_fund_transfers;
drop policy if exists treasury_fund_transfers_insert_managers_v1
  on public.treasury_fund_transfers;

create policy treasury_fund_transfers_select_managers_v1
on public.treasury_fund_transfers
for select
to authenticated
using (
  exists (
    select 1
    from public.church_users cu
    where cu.church_id = treasury_fund_transfers.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_role_assignments cra
    join public.role_definitions rd on rd.id = cra.role_id
    where cra.church_id = treasury_fund_transfers.church_id
      and cra.user_id = auth.uid()
      and cra.is_active = true
      and (cra.start_date is null or cra.start_date <= current_date)
      and (cra.end_date is null or cra.end_date >= current_date)
      and rd.code = any (array['church_admin', 'treasurer', 'pastor'])
  )
);

create policy treasury_fund_transfers_insert_managers_v1
on public.treasury_fund_transfers
for insert
to authenticated
with check (
  treasury_fund_transfers.recorded_by_user_id = auth.uid()
  and exists (
    select 1
    from public.church_users cu
    where cu.church_id = treasury_fund_transfers.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_role_assignments cra
    join public.role_definitions rd on rd.id = cra.role_id
    where cra.church_id = treasury_fund_transfers.church_id
      and cra.user_id = auth.uid()
      and cra.is_active = true
      and (cra.start_date is null or cra.start_date <= current_date)
      and (cra.end_date is null or cra.end_date >= current_date)
      and rd.code = any (array['church_admin', 'treasurer', 'pastor'])
  )
  and exists (
    select 1
    from public.treasury_funds source_fund
    where source_fund.id = treasury_fund_transfers.source_fund_id
      and source_fund.church_id = treasury_fund_transfers.church_id
      and source_fund.is_active = true
  )
  and exists (
    select 1
    from public.treasury_funds destination_fund
    where destination_fund.id = treasury_fund_transfers.destination_fund_id
      and destination_fund.church_id = treasury_fund_transfers.church_id
      and destination_fund.is_active = true
  )
);

commit;
