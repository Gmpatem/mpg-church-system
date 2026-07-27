create extension if not exists "pgcrypto" with schema extensions;

create table if not exists public.attendance_qr_codes (
  id uuid primary key default extensions.gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  public_code text not null,
  qr_type text not null default 'sabbath_universal',
  title text not null default 'Sabbath attendance',
  description text,
  is_permanent boolean not null default true,
  is_active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_qr_codes_type_check
    check (qr_type in ('sabbath_universal', 'temporary_activity')),
  constraint attendance_qr_codes_public_code_check
    check (public_code ~ '^[A-Za-z0-9_-]{10,96}$')
);

create table if not exists public.attendance_occurrences (
  id uuid primary key default extensions.gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  qr_code_id uuid references public.attendance_qr_codes(id) on delete set null,
  occurrence_date date not null,
  title text not null,
  source_type text not null default 'sabbath_universal',
  starts_at timestamptz,
  ended_at timestamptz,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_occurrences_source_type_check
    check (source_type in ('sabbath_universal', 'temporary_activity', 'manual')),
  constraint attendance_occurrences_church_date_qr_unique
    unique (church_id, occurrence_date, qr_code_id)
);

create table if not exists public.visitor_contacts (
  id uuid primary key default extensions.gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  household_name text,
  notes text,
  wants_follow_up boolean not null default false,
  interested_in_membership boolean not null default false,
  visit_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visitor_contacts_contact_check
    check (nullif(trim(phone), '') is not null or nullif(trim(email), '') is not null or length(trim(full_name)) >= 2)
);

create table if not exists public.attendance_records (
  id uuid primary key default extensions.gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  occurrence_id uuid not null references public.attendance_occurrences(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  visitor_contact_id uuid references public.visitor_contacts(id) on delete set null,
  status text not null default 'present',
  check_in_method text not null default 'qr_self',
  checked_in_at timestamptz not null default now(),
  checked_in_by_user_id uuid references auth.users(id) on delete set null,
  checked_in_by_member_id uuid references public.members(id) on delete set null,
  device_token_hash text,
  household_id uuid references public.households(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_records_subject_check
    check (
      (member_id is not null and visitor_contact_id is null)
      or (member_id is null and visitor_contact_id is not null)
    ),
  constraint attendance_records_status_check
    check (status in ('present', 'late', 'excused', 'removed')),
  constraint attendance_records_method_check
    check (check_in_method in ('qr_self', 'recognized_device', 'household', 'kiosk', 'manual_admin', 'visitor'))
);

create table if not exists public.attendance_member_devices (
  id uuid primary key default extensions.gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  device_token_hash text not null,
  label text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_used_at timestamptz,
  confirmed_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_review_items (
  id uuid primary key default extensions.gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  occurrence_id uuid references public.attendance_occurrences(id) on delete cascade,
  attendance_record_id uuid references public.attendance_records(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  visitor_contact_id uuid references public.visitor_contacts(id) on delete set null,
  item_type text not null,
  status text not null default 'open',
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_user_id uuid references auth.users(id) on delete set null,
  constraint attendance_review_items_type_check
    check (item_type in ('visitor_follow_up', 'membership_interest', 'duplicate_scan', 'manual_review')),
  constraint attendance_review_items_status_check
    check (status in ('open', 'resolved', 'dismissed'))
);

create table if not exists public.attendance_audit_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_member_id uuid references public.members(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists attendance_qr_codes_public_code_key
  on public.attendance_qr_codes (public_code);

create unique index if not exists attendance_qr_codes_one_active_sabbath_qr
  on public.attendance_qr_codes (church_id)
  where qr_type = 'sabbath_universal' and is_permanent = true and is_active = true;

create index if not exists attendance_occurrences_church_date_idx
  on public.attendance_occurrences (church_id, occurrence_date desc);

create index if not exists attendance_records_church_occurrence_idx
  on public.attendance_records (church_id, occurrence_id, checked_in_at desc);

create unique index if not exists attendance_records_member_once_per_occurrence
  on public.attendance_records (occurrence_id, member_id)
  where member_id is not null and status <> 'removed';

create unique index if not exists attendance_records_visitor_once_per_occurrence
  on public.attendance_records (occurrence_id, visitor_contact_id)
  where visitor_contact_id is not null and status <> 'removed';

create index if not exists attendance_records_member_recent_idx
  on public.attendance_records (church_id, member_id, checked_in_at desc)
  where member_id is not null;

create index if not exists attendance_records_household_recent_idx
  on public.attendance_records (church_id, household_id, checked_in_at desc)
  where household_id is not null;

create unique index if not exists attendance_member_devices_hash_key
  on public.attendance_member_devices (device_token_hash);

create index if not exists visitor_contacts_church_last_seen_idx
  on public.visitor_contacts (church_id, last_seen_at desc);

create index if not exists attendance_review_items_church_status_idx
  on public.attendance_review_items (church_id, status, created_at desc);

alter table public.attendance_qr_codes enable row level security;
alter table public.attendance_occurrences enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_member_devices enable row level security;
alter table public.visitor_contacts enable row level security;
alter table public.attendance_review_items enable row level security;
alter table public.attendance_audit_logs enable row level security;

grant all on table public.attendance_qr_codes to service_role;
grant all on table public.attendance_occurrences to service_role;
grant all on table public.attendance_records to service_role;
grant all on table public.attendance_member_devices to service_role;
grant all on table public.visitor_contacts to service_role;
grant all on table public.attendance_review_items to service_role;
grant all on table public.attendance_audit_logs to service_role;

revoke all on table public.attendance_qr_codes from anon, authenticated;
revoke all on table public.attendance_occurrences from anon, authenticated;
revoke all on table public.attendance_records from anon, authenticated;
revoke all on table public.attendance_member_devices from anon, authenticated;
revoke all on table public.visitor_contacts from anon, authenticated;
revoke all on table public.attendance_review_items from anon, authenticated;
revoke all on table public.attendance_audit_logs from anon, authenticated;

do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'attendance_qr_codes',
    'attendance_occurrences',
    'attendance_records',
    'attendance_member_devices',
    'visitor_contacts',
    'attendance_review_items',
    'attendance_audit_logs'
  ]
  loop
    foreach policy_name in array array[
      table_name || '_church_select',
      table_name || '_church_insert',
      table_name || '_church_update',
      table_name || '_church_delete'
    ]
    loop
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    end loop;
  end loop;
end $$;

comment on table public.attendance_qr_codes
  is 'Stable public attendance QR/link codes. Anon users never receive direct table access.';

comment on table public.attendance_records
  is 'Attendance presence rows for members and visitors, protected from duplicate scans per occurrence.';

comment on table public.attendance_member_devices
  is 'Confirmed member recognition devices. Only the SHA-256 token hash is stored.';
