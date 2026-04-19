-- Apply in Supabase SQL editor.
-- Purpose:
-- 1) Keep treasury_audit_logs server-controlled (trigger-driven).
-- 2) Prevent direct client inserts into treasury_audit_logs.
-- 3) Ensure treasury write triggers can always persist audit rows under RLS.

alter table public.treasury_audit_logs enable row level security;

-- Remove any existing INSERT policies so one canonical trigger-only policy remains.
do $$
declare
  policy_name text;
begin
  for policy_name in
    select p.policyname
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'treasury_audit_logs'
      and p.cmd = 'INSERT'
  loop
    execute format('drop policy if exists %I on public.treasury_audit_logs', policy_name);
  end loop;
end
$$;

-- Deny direct writes from client-facing roles.
revoke insert, update, delete on table public.treasury_audit_logs from anon, authenticated;

-- Keep read capability under existing/explicit SELECT policies.
grant select on table public.treasury_audit_logs to authenticated;

-- If FORCE RLS is enabled in this project, this policy still permits only trigger-context inserts.
create policy treasury_audit_logs_insert_from_trigger_only_v1
on public.treasury_audit_logs
for insert
to public
with check (
  pg_trigger_depth() > 0
  and treasury_audit_logs.entity_type = any (array['treasury_fund', 'treasury_inflow', 'treasury_outflow'])
  and treasury_audit_logs.action_type = any (array['create', 'update'])
  and treasury_audit_logs.church_id is not null
  and treasury_audit_logs.entity_id is not null
);

create or replace function public.treasury_write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity_type text;
  v_changed_by_user_id uuid;
  v_correction_note text;
begin
  if tg_op not in ('INSERT', 'UPDATE') then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_table_name = 'treasury_inflows' then
    v_entity_type := 'treasury_inflow';
    v_changed_by_user_id := coalesce(auth.uid(), new.recorded_by_user_id, old.recorded_by_user_id);
    if tg_op = 'UPDATE' and new.note is distinct from old.note then
      v_correction_note := nullif(new.note, '');
    end if;
  elsif tg_table_name = 'treasury_outflows' then
    v_entity_type := 'treasury_outflow';
    v_changed_by_user_id := coalesce(auth.uid(), new.recorded_by_user_id, old.recorded_by_user_id);
    if tg_op = 'UPDATE' and new.note is distinct from old.note then
      v_correction_note := nullif(new.note, '');
    end if;
  elsif tg_table_name = 'treasury_funds' then
    v_entity_type := 'treasury_fund';
    v_changed_by_user_id := auth.uid();
  else
    return new;
  end if;

  insert into public.treasury_audit_logs (
    church_id,
    entity_type,
    entity_id,
    action_type,
    changed_by_user_id,
    correction_note,
    before_snapshot,
    after_snapshot
  )
  values (
    coalesce(new.church_id, old.church_id),
    v_entity_type,
    coalesce(new.id, old.id),
    case when tg_op = 'INSERT' then 'create' else 'update' end,
    v_changed_by_user_id,
    v_correction_note,
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    to_jsonb(new)
  );

  return new;
end;
$$;

-- Remove old treasury audit triggers that write into treasury_audit_logs.
do $$
declare
  trigger_row record;
begin
  for trigger_row in
    select
      n.nspname as schema_name,
      c.relname as table_name,
      t.tgname as trigger_name
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where not t.tgisinternal
      and n.nspname = 'public'
      and c.relname in ('treasury_inflows', 'treasury_outflows', 'treasury_funds')
      and (
        pg_get_triggerdef(t.oid) ilike '%treasury_audit_logs%'
        or t.tgname ilike '%treasury%audit%'
      )
  loop
    execute format(
      'drop trigger if exists %I on %I.%I',
      trigger_row.trigger_name,
      trigger_row.schema_name,
      trigger_row.table_name
    );
  end loop;
end
$$;

create trigger trg_treasury_inflows_audit_write
after insert or update on public.treasury_inflows
for each row execute function public.treasury_write_audit_log();

create trigger trg_treasury_outflows_audit_write
after insert or update on public.treasury_outflows
for each row execute function public.treasury_write_audit_log();

create trigger trg_treasury_funds_audit_write
after insert or update on public.treasury_funds
for each row execute function public.treasury_write_audit_log();
