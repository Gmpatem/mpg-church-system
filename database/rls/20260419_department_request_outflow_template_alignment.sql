-- Department request alignment with treasury_outflows template fields.
-- Keeps backward compatibility while enforcing tenant-safe request -> outflow mapping.

begin;

alter table public.department_fund_requests
  add column if not exists fund_id uuid null;

alter table public.department_fund_requests
  add column if not exists outflow_date date null;

alter table public.department_fund_requests
  add column if not exists reference_number text null;

alter table public.department_fund_requests
  add column if not exists event_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'church_events_church_id_id_key'
      and conrelid = 'public.church_events'::regclass
  ) then
    alter table public.church_events
      add constraint church_events_church_id_id_key unique (church_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'department_fund_requests_church_fund_fkey'
      and conrelid = 'public.department_fund_requests'::regclass
  ) then
    alter table public.department_fund_requests
      add constraint department_fund_requests_church_fund_fkey
      foreign key (church_id, fund_id)
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
    where conname = 'department_fund_requests_church_event_fkey'
      and conrelid = 'public.department_fund_requests'::regclass
  ) then
    alter table public.department_fund_requests
      add constraint department_fund_requests_church_event_fkey
      foreign key (church_id, event_id)
      references public.church_events(church_id, id)
      on update cascade
      on delete set null
      not valid;
  end if;
end
$$;

update public.department_fund_requests
set fund_id = preferred_fund_id
where fund_id is null
  and preferred_fund_id is not null;

update public.department_fund_requests
set outflow_date = requested_date
where outflow_date is null
  and requested_date is not null;

update public.department_fund_requests
set requested_date = outflow_date
where requested_date is null
  and outflow_date is not null;

create index if not exists department_fund_requests_church_status_outflow_date_idx
  on public.department_fund_requests (church_id, status, outflow_date desc, created_at desc);

create index if not exists department_fund_requests_church_fund_idx
  on public.department_fund_requests (church_id, fund_id)
  where fund_id is not null;

create index if not exists department_fund_requests_church_event_idx
  on public.department_fund_requests (church_id, event_id)
  where event_id is not null;

create or replace function public.sync_department_fund_request_template_fields()
returns trigger
language plpgsql
as $$
begin
  if new.outflow_date is null then
    new.outflow_date := new.requested_date;
  end if;
  if new.requested_date is null then
    new.requested_date := new.outflow_date;
  end if;

  if new.fund_id is null then
    new.fund_id := new.preferred_fund_id;
  end if;
  if new.preferred_fund_id is null then
    new.preferred_fund_id := new.fund_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_department_fund_requests_sync_template_fields
  on public.department_fund_requests;

create trigger trg_department_fund_requests_sync_template_fields
before insert or update on public.department_fund_requests
for each row
execute function public.sync_department_fund_request_template_fields();

drop policy if exists department_fund_requests_insert_leaders_v1
  on public.department_fund_requests;
create policy department_fund_requests_insert_leaders_v1
on public.department_fund_requests
for insert
to authenticated
with check (
  department_fund_requests.requested_by_user_id = auth.uid()
  and department_fund_requests.status = 'pending'
  and department_fund_requests.outflow_date is not null
  and coalesce(department_fund_requests.fund_id, department_fund_requests.preferred_fund_id) is not null
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
  and exists (
    select 1
    from public.treasury_funds tf
    where tf.id = coalesce(department_fund_requests.fund_id, department_fund_requests.preferred_fund_id)
      and tf.church_id = department_fund_requests.church_id
  )
  and (
    department_fund_requests.event_id is null
    or exists (
      select 1
      from public.church_events ce
      where ce.id = department_fund_requests.event_id
        and ce.church_id = department_fund_requests.church_id
        and ce.department_id = department_fund_requests.department_id
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
  department_fund_requests.outflow_date is not null
  and coalesce(department_fund_requests.fund_id, department_fund_requests.preferred_fund_id) is not null
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
  and exists (
    select 1
    from public.treasury_funds tf
    where tf.id = coalesce(department_fund_requests.fund_id, department_fund_requests.preferred_fund_id)
      and tf.church_id = department_fund_requests.church_id
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
  and (
    department_fund_requests.event_id is null
    or exists (
      select 1
      from public.church_events ce
      where ce.id = department_fund_requests.event_id
        and ce.church_id = department_fund_requests.church_id
        and ce.department_id = department_fund_requests.department_id
    )
  )
);

commit;
