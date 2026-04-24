-- Tighten treasury_outflows write-path RLS for department-linked finance.
-- Ensures only active treasury managers can insert/update outflows,
-- while preserving church isolation and department/fund tenant checks.

begin;

alter table public.treasury_outflows enable row level security;

-- Keep one canonical INSERT/UPDATE policy set for outflows.
do $$
declare
  policy_name text;
begin
  for policy_name in
    select p.policyname
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'treasury_outflows'
      and p.cmd = 'INSERT'
  loop
    execute format('drop policy if exists %I on public.treasury_outflows', policy_name);
  end loop;

  for policy_name in
    select p.policyname
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'treasury_outflows'
      and p.cmd = 'UPDATE'
  loop
    execute format('drop policy if exists %I on public.treasury_outflows', policy_name);
  end loop;
end
$$;

create policy treasury_outflows_insert_managers_v2
on public.treasury_outflows
for insert
to authenticated
with check (
  treasury_outflows.recorded_by_user_id = auth.uid()
  and exists (
    select 1
    from public.church_users cu
    where cu.church_id = treasury_outflows.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_role_assignments cra
    join public.role_definitions rd on rd.id = cra.role_id
    where cra.church_id = treasury_outflows.church_id
      and cra.user_id = auth.uid()
      and cra.is_active = true
      and (cra.start_date is null or cra.start_date <= current_date)
      and (cra.end_date is null or cra.end_date >= current_date)
      and rd.code = any (array['church_admin', 'pastor', 'treasurer'])
  )
  and exists (
    select 1
    from public.treasury_funds tf
    where tf.id = treasury_outflows.fund_id
      and tf.church_id = treasury_outflows.church_id
  )
  and (
    treasury_outflows.department_id is null
    or exists (
      select 1
      from public.church_departments cd
      where cd.id = treasury_outflows.department_id
        and cd.church_id = treasury_outflows.church_id
    )
  )
);

create policy treasury_outflows_update_managers_v2
on public.treasury_outflows
for update
to authenticated
using (
  exists (
    select 1
    from public.church_users cu
    where cu.church_id = treasury_outflows.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_role_assignments cra
    join public.role_definitions rd on rd.id = cra.role_id
    where cra.church_id = treasury_outflows.church_id
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
    where cu.church_id = treasury_outflows.church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
  )
  and exists (
    select 1
    from public.church_role_assignments cra
    join public.role_definitions rd on rd.id = cra.role_id
    where cra.church_id = treasury_outflows.church_id
      and cra.user_id = auth.uid()
      and cra.is_active = true
      and (cra.start_date is null or cra.start_date <= current_date)
      and (cra.end_date is null or cra.end_date >= current_date)
      and rd.code = any (array['church_admin', 'pastor', 'treasurer'])
  )
  and exists (
    select 1
    from public.treasury_funds tf
    where tf.id = treasury_outflows.fund_id
      and tf.church_id = treasury_outflows.church_id
  )
  and (
    treasury_outflows.department_id is null
    or exists (
      select 1
      from public.church_departments cd
      where cd.id = treasury_outflows.department_id
        and cd.church_id = treasury_outflows.church_id
    )
  )
);

commit;
