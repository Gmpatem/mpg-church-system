-- Extend automatic remittance settings with live activation and per-source controls.
-- Safe to run after 20260425_treasury_auto_remittance.sql.

begin;

do $$
begin
  if to_regclass('public.treasury_remittance_settings') is null then
    raise notice 'Skipping 20260426_treasury_auto_remittance_live_controls.sql because public.treasury_remittance_settings does not exist. Apply 20260425_treasury_auto_remittance.sql first.';
    return;
  end if;

  alter table public.treasury_remittance_settings
    add column if not exists is_live boolean not null default false,
    add column if not exists tithe_enabled boolean not null default true,
    add column if not exists tithe_percentage numeric(5, 2) not null default 100,
    add column if not exists offering_enabled boolean not null default false,
    add column if not exists offering_percentage numeric(5, 2) not null default 100;

  if not exists (
    select 1 from pg_constraint
    where conname = 'treasury_remittance_settings_tithe_percentage_chk'
  ) then
    alter table public.treasury_remittance_settings
      add constraint treasury_remittance_settings_tithe_percentage_chk
      check (tithe_percentage >= 0 and tithe_percentage <= 100);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'treasury_remittance_settings_offering_percentage_chk'
  ) then
    alter table public.treasury_remittance_settings
      add constraint treasury_remittance_settings_offering_percentage_chk
      check (offering_percentage >= 0 and offering_percentage <= 100);
  end if;

  update public.treasury_remittance_settings
  set
    is_live = coalesce(is_live, false),
    tithe_enabled = case when source_type = 'offering' then false else true end,
    offering_enabled = case when source_type = 'tithe' then false else true end,
    tithe_percentage = coalesce(tithe_percentage, percentage, 100),
    offering_percentage = coalesce(offering_percentage, percentage, 100),
    updated_at = timezone('utc', now());
end
$$;

commit;
