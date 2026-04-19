-- Apply in Supabase SQL editor.
-- Purpose: allow treasury inflow inserts only for active church treasury managers,
-- and enforce recorded_by_user_id = auth.uid() with strict church scoping.

alter table public.treasury_inflows enable row level security;

do $$
declare
  policy_name text;
begin
  -- Remove every existing INSERT policy for this table so one canonical policy remains.
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

create policy treasury_inflows_insert_managers_v2
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
);
