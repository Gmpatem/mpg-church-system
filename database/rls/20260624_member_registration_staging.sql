-- Migration: Public Member + Household registration staging tables and RPC
-- Scope: Add reusable public registration intake separate from auth/onboarding/invites.

-- Ensure pgcrypto is available for key hashing (Supabase installs it in the extensions schema).
create extension if not exists "pgcrypto" with schema extensions;

-- Add household_role to members if the live schema does not already have it
-- (existing code already references this column). Safe to run idempotently.
alter table public.members
  add column if not exists household_role text
  check (household_role is null or household_role in ('head','spouse','child','relative','guardian','other'));

alter table public.members drop constraint if exists members_gender_check;
alter table public.members
  add constraint members_gender_check
  check (gender is null or gender in ('male','female')) not valid;
alter table public.members validate constraint members_gender_check;

-- ---------------------------------------------------------------------------
-- 1. Registration settings per church
-- ---------------------------------------------------------------------------
create table if not exists public.church_member_registration_settings (
  church_id uuid primary key references public.churches(id) on delete cascade,
  is_enabled boolean not null default false,
  registration_key_hash text,
  require_admin_review boolean not null default true,
  auto_create_as_visitor boolean not null default false,
  collect_date_of_birth boolean not null default true,
  collect_emergency_contact boolean not null default true,
  collect_household_information boolean not null default true,
  collect_department_interests boolean not null default true,
  welcome_message text,
  success_message text,
  created_by_user_id uuid references public.profiles(id),
  updated_by_user_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.church_member_registration_settings is 'Per-church configuration for the reusable public member/household registration form.';

-- ---------------------------------------------------------------------------
-- 2. Staging table for public registrations
-- ---------------------------------------------------------------------------
create table if not exists public.church_member_registrations (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,

  first_name text not null,
  last_name text not null,
  display_name text,
  email text,
  phone text,
  date_of_birth date,
  gender text check (gender is null or gender in ('male','female')),
  marital_status text check (marital_status is null or marital_status in ('single','married','widowed','divorced','separated')),
  profession text,

  address text,
  city text,
  country text,
  preferred_contact_method text check (preferred_contact_method is null or preferred_contact_method in ('email','phone','any')),
  emergency_contact_name text,
  emergency_contact_phone text,

  how_heard_about_church text,
  christian_status text,
  is_baptized boolean,
  baptism_date date,
  previous_church text,
  wants_membership boolean,
  requested_membership_type text,
  transfer_in_date date,

  household_action text not null check (household_action in ('self_only','existing_household','new_household','not_sure')),
  suggested_household_name text,
  suggested_household_head_name text,
  suggested_household_head_phone text,
  suggested_household_role text check (suggested_household_role is null or suggested_household_role in ('head','spouse','child','relative','guardian','other')),
  suggested_household_address text,
  suggested_household_city text,
  suggested_household_country text,
  suggested_household_phone text,
  suggested_household_email text,
  household_notes text,

  department_interest_ids jsonb not null default '[]'::jsonb,
  notes text,
  privacy_consent boolean not null default false,

  status text not null default 'pending'
    check (status in ('pending','needs_member_duplicate_review','needs_household_duplicate_review','needs_review','approved','rejected','converted','merged')),
  possible_duplicate_member_id uuid references public.members(id),
  possible_duplicate_household_id uuid references public.households(id),
  matched_member_id uuid references public.members(id),
  matched_household_id uuid references public.households(id),
  created_member_id uuid references public.members(id),
  created_household_id uuid references public.households(id),

  reviewed_by_user_id uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text,

  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

comment on table public.church_member_registrations is 'Staging table for public member + household registration submissions awaiting admin review.';

-- ---------------------------------------------------------------------------
-- 3. Staging table for additional family members submitted with a registration
-- ---------------------------------------------------------------------------
create table if not exists public.church_member_registration_household_members (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.church_member_registrations(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,

  first_name text not null,
  last_name text not null,
  relationship text not null check (relationship in ('spouse','child','relative','guardian','other')),
  date_of_birth date,
  gender text check (gender is null or gender in ('male','female')),
  email text,
  phone text,
  membership_status_suggestion text,

  status text not null default 'pending'
    check (status in ('pending','needs_review','matched','created','skipped')),
  possible_member_match_id uuid references public.members(id),
  matched_member_id uuid references public.members(id),
  resulting_member_id uuid references public.members(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.church_member_registration_household_members is 'Additional family members submitted as part of a public registration.';

-- ---------------------------------------------------------------------------
-- 4. Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_church_member_registrations_church_status
  on public.church_member_registrations(church_id, status);

create index if not exists idx_church_member_registrations_submitted_at
  on public.church_member_registrations(submitted_at desc);

create index if not exists idx_church_member_registrations_email
  on public.church_member_registrations(lower(email)) where email is not null;

create index if not exists idx_church_member_registrations_phone
  on public.church_member_registrations(phone) where phone is not null;

create index if not exists idx_church_member_registration_household_members_registration
  on public.church_member_registration_household_members(registration_id);

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
alter table public.church_member_registration_settings enable row level security;
alter table public.church_member_registrations enable row level security;
alter table public.church_member_registration_household_members enable row level security;

grant select, insert, update, delete on public.church_member_registration_settings to authenticated;
grant select, insert, update, delete on public.church_member_registrations to authenticated;
grant select, insert, update, delete on public.church_member_registration_household_members to authenticated;

grant select, insert, update, delete on public.church_member_registration_settings to service_role;
grant select, insert, update, delete on public.church_member_registrations to service_role;
grant select, insert, update, delete on public.church_member_registration_household_members to service_role;

-- Public registration settings: admins of the church may read/update.
drop policy if exists "registration_settings_admin_manage"
  on public.church_member_registration_settings;

create policy "registration_settings_admin_manage"
  on public.church_member_registration_settings
  for all
  to authenticated
  using (
    exists (
      select 1 from public.church_users cu
      join public.church_role_assignments cra on cra.church_id = cu.church_id and cra.user_id = cu.user_id and cra.is_active = true
      join public.role_definitions rd on rd.id = cra.role_id
      where cu.church_id = church_member_registration_settings.church_id
        and cu.user_id = auth.uid()
        and cu.status = 'active'
        and rd.code in ('church_admin','pastor','elder','clerk')
    )
  )
  with check (
    exists (
      select 1 from public.church_users cu
      join public.church_role_assignments cra on cra.church_id = cu.church_id and cra.user_id = cu.user_id and cra.is_active = true
      join public.role_definitions rd on rd.id = cra.role_id
      where cu.church_id = church_member_registration_settings.church_id
        and cu.user_id = auth.uid()
        and cu.status = 'active'
        and rd.code in ('church_admin','pastor','elder','clerk')
    )
  );

-- Registrations: church management may read/update rows for their church.
drop policy if exists "church_member_registrations_admin_manage"
  on public.church_member_registrations;

create policy "church_member_registrations_admin_manage"
  on public.church_member_registrations
  for all
  to authenticated
  using (
    exists (
      select 1 from public.church_users cu
      join public.church_role_assignments cra on cra.church_id = cu.church_id and cra.user_id = cu.user_id and cra.is_active = true
      join public.role_definitions rd on rd.id = cra.role_id
      where cu.church_id = church_member_registrations.church_id
        and cu.user_id = auth.uid()
        and cu.status = 'active'
        and rd.code in ('church_admin','pastor','elder','clerk')
    )
  )
  with check (
    exists (
      select 1 from public.church_users cu
      join public.church_role_assignments cra on cra.church_id = cu.church_id and cra.user_id = cu.user_id and cra.is_active = true
      join public.role_definitions rd on rd.id = cra.role_id
      where cu.church_id = church_member_registrations.church_id
        and cu.user_id = auth.uid()
        and cu.status = 'active'
        and rd.code in ('church_admin','pastor','elder','clerk')
    )
  );

-- Household members: church management may read/update rows for their church.
drop policy if exists "church_member_registration_household_members_admin_manage"
  on public.church_member_registration_household_members;

create policy "church_member_registration_household_members_admin_manage"
  on public.church_member_registration_household_members
  for all
  to authenticated
  using (
    exists (
      select 1 from public.church_users cu
      join public.church_role_assignments cra on cra.church_id = cu.church_id and cra.user_id = cu.user_id and cra.is_active = true
      join public.role_definitions rd on rd.id = cra.role_id
      where cu.church_id = church_member_registration_household_members.church_id
        and cu.user_id = auth.uid()
        and cu.status = 'active'
        and rd.code in ('church_admin','pastor','elder','clerk')
    )
  )
  with check (
    exists (
      select 1 from public.church_users cu
      join public.church_role_assignments cra on cra.church_id = cu.church_id and cra.user_id = cu.user_id and cra.is_active = true
      join public.role_definitions rd on rd.id = cra.role_id
      where cu.church_id = church_member_registration_household_members.church_id
        and cu.user_id = auth.uid()
        and cu.status = 'active'
        and rd.code in ('church_admin','pastor','elder','clerk')
    )
  );

-- Anonymous users must not select/update/delete staging rows. No public policies.

-- ---------------------------------------------------------------------------
-- 6. Helper functions
-- ---------------------------------------------------------------------------
create or replace function public.normalize_registration_phone(p_phone text)
returns text
language plpgsql
immutable
security invoker
set search_path = public
as $$
begin
  return regexp_replace(lower(coalesce(p_phone, '')), '[^0-9]', '', 'g');
end;
$$;

revoke all on function public.normalize_registration_phone(text) from public;
revoke all on function public.normalize_registration_phone(text) from anon;
revoke all on function public.normalize_registration_phone(text) from authenticated;

create or replace function public.normalize_registration_email(p_email text)
returns text
language plpgsql
immutable
security invoker
set search_path = public
as $$
begin
  return lower(trim(coalesce(p_email, '')));
end;
$$;

revoke all on function public.normalize_registration_email(text) from public;
revoke all on function public.normalize_registration_email(text) from anon;
revoke all on function public.normalize_registration_email(text) from authenticated;

create or replace function public.parse_registration_date(
  p_value text,
  p_error_message text
)
returns date
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_value text;
  v_year int;
  v_month int;
  v_day int;
begin
  v_value := nullif(trim(coalesce(p_value, '')), '');
  if v_value is null then
    return null;
  end if;

  if v_value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception '%', p_error_message;
  end if;

  v_year := substring(v_value from 1 for 4)::int;
  v_month := substring(v_value from 6 for 2)::int;
  v_day := substring(v_value from 9 for 2)::int;

  begin
    return make_date(v_year, v_month, v_day);
  exception when others then
    raise exception '%', p_error_message;
  end;
end;
$$;

revoke all on function public.parse_registration_date(text, text) from public;
revoke all on function public.parse_registration_date(text, text) from anon;
revoke all on function public.parse_registration_date(text, text) from authenticated;

create or replace function public.normalize_registration_gender(
  p_value text,
  p_error_message text
)
returns text
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_value text;
begin
  v_value := nullif(trim(coalesce(p_value, '')), '');
  if v_value is null then
    return null;
  end if;

  if v_value not in ('male', 'female') then
    raise exception '%', p_error_message;
  end if;

  return v_value;
end;
$$;

revoke all on function public.normalize_registration_gender(text, text) from public;
revoke all on function public.normalize_registration_gender(text, text) from anon;
revoke all on function public.normalize_registration_gender(text, text) from authenticated;

create or replace function public.validate_member_registration_key(
  p_church_slug text,
  p_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_church_id uuid;
  v_settings public.church_member_registration_settings%rowtype;
begin
  if coalesce(p_church_slug, '') = '' then
    return jsonb_build_object('ok', false, 'error', 'Church slug is required.');
  end if;

  if coalesce(p_key, '') = '' then
    return jsonb_build_object('ok', false, 'error', 'Registration key is required.');
  end if;

  select id into v_church_id
  from public.churches
  where slug = p_church_slug and is_active = true;

  if v_church_id is null then
    return jsonb_build_object('ok', false, 'error', 'Church not found or registration unavailable.');
  end if;

  select * into v_settings
  from public.church_member_registration_settings
  where church_id = v_church_id;

  if v_settings.church_id is null or v_settings.is_enabled is distinct from true then
    return jsonb_build_object('ok', false, 'error', 'Registration is not enabled for this church.');
  end if;

  if v_settings.registration_key_hash is null or v_settings.registration_key_hash = '' then
    return jsonb_build_object('ok', false, 'error', 'Registration is not configured.');
  end if;

  if not (extensions.crypt(p_key, v_settings.registration_key_hash) = v_settings.registration_key_hash) then
    return jsonb_build_object('ok', false, 'error', 'Invalid registration key.');
  end if;

  return jsonb_build_object('ok', true);
exception when others then
  return jsonb_build_object('ok', false, 'error', 'Registration key could not be validated.');
end;
$$;

revoke all on function public.validate_member_registration_key(text, text) from public;
revoke all on function public.validate_member_registration_key(text, text) from anon;
revoke all on function public.validate_member_registration_key(text, text) from authenticated;
grant execute on function public.validate_member_registration_key(text, text) to anon;
grant execute on function public.validate_member_registration_key(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. SECURITY DEFINER RPC: submit public registration
-- ---------------------------------------------------------------------------
create or replace function public.submit_member_registration(
  p_church_slug text,
  p_key text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_church_id uuid;
  v_settings public.church_member_registration_settings%rowtype;
  v_registration_id uuid;
  v_member jsonb;
  v_members jsonb;
  v_dept_ids jsonb;
  v_household_action text;
  v_relationship text;
  v_email text;
  v_phone text;
  v_count int;
begin
  -- Validate inputs
  if coalesce(p_church_slug, '') = '' then
    return jsonb_build_object('ok', false, 'error', 'Church slug is required.');
  end if;

  if coalesce(p_key, '') = '' then
    return jsonb_build_object('ok', false, 'error', 'Registration key is required.');
  end if;

  if p_payload is null or p_payload = '{}'::jsonb then
    return jsonb_build_object('ok', false, 'error', 'Payload is required.');
  end if;

  -- Resolve church
  select id into v_church_id
  from public.churches
  where slug = p_church_slug and is_active = true;

  if v_church_id is null then
    return jsonb_build_object('ok', false, 'error', 'Church not found or registration unavailable.');
  end if;

  -- Resolve settings and validate key
  select * into v_settings
  from public.church_member_registration_settings
  where church_id = v_church_id;

  if v_settings.church_id is null or v_settings.is_enabled is distinct from true then
    return jsonb_build_object('ok', false, 'error', 'Registration is not enabled for this church.');
  end if;

  if v_settings.registration_key_hash is null or v_settings.registration_key_hash = '' then
    return jsonb_build_object('ok', false, 'error', 'Registration is not configured.');
  end if;

  if not (extensions.crypt(p_key, v_settings.registration_key_hash) = v_settings.registration_key_hash) then
    return jsonb_build_object('ok', false, 'error', 'Invalid registration key.');
  end if;

  -- Basic payload shape validation
  if p_payload->>'firstName' is null or length(trim(p_payload->>'firstName')) = 0 then
    return jsonb_build_object('ok', false, 'error', 'First name is required.');
  end if;

  if p_payload->>'lastName' is null or length(trim(p_payload->>'lastName')) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Last name is required.');
  end if;

  if coalesce(p_payload->>'privacyConsent', 'false') <> 'true' then
    return jsonb_build_object('ok', false, 'error', 'Privacy consent is required.');
  end if;

  -- Coerce household action
  v_household_action := coalesce(p_payload->>'householdAction', 'self_only');
  if v_household_action not in ('self_only','existing_household','new_household','not_sure') then
    v_household_action := 'self_only';
  end if;

  -- Normalize contact
  v_email := public.normalize_registration_email(p_payload->>'email');
  if v_email = '' then v_email := null; end if;
  v_phone := public.normalize_registration_phone(p_payload->>'phone');
  if v_phone = '' then v_phone := null; end if;

  -- Department interests: validate IDs belong to church and keep only safe values
  v_dept_ids := coalesce(p_payload->'departmentInterestIds', '[]'::jsonb);
  if jsonb_typeof(v_dept_ids) != 'array' then
    v_dept_ids := '[]'::jsonb;
  end if;

  with submitted_department_ids as (
    select value
    from jsonb_array_elements_text(v_dept_ids) as submitted(value)
    where value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  )
  select coalesce(jsonb_agg(cd.id), '[]'::jsonb) into v_dept_ids
  from public.church_departments cd
  where cd.church_id = v_church_id
    and cd.is_active = true
    and cd.id in (select value::uuid from submitted_department_ids);

  -- Duplicate: soft signal for admin review (do not block submission)
  -- Check normalized email or phone against existing members of same church.
  select count(*) into v_count
  from public.members
  where church_id = v_church_id
    and (
      (v_email is not null and lower(trim(coalesce(email,''))) = v_email)
      or (v_phone is not null and public.normalize_registration_phone(phone) = v_phone)
    );

  -- Insert main registration
  insert into public.church_member_registrations (
    church_id,
    first_name,
    last_name,
    display_name,
    email,
    phone,
    date_of_birth,
    gender,
    marital_status,
    profession,
    address,
    city,
    country,
    preferred_contact_method,
    emergency_contact_name,
    emergency_contact_phone,
    how_heard_about_church,
    christian_status,
    is_baptized,
    baptism_date,
    previous_church,
    wants_membership,
    requested_membership_type,
    transfer_in_date,
    household_action,
    suggested_household_name,
    suggested_household_head_name,
    suggested_household_head_phone,
    suggested_household_role,
    suggested_household_address,
    suggested_household_city,
    suggested_household_country,
    suggested_household_phone,
    suggested_household_email,
    household_notes,
    department_interest_ids,
    notes,
    privacy_consent,
    status,
    metadata
  ) values (
    v_church_id,
    trim(p_payload->>'firstName'),
    trim(p_payload->>'lastName'),
    nullif(trim(coalesce(p_payload->>'displayName','')),''),
    v_email,
    v_phone,
    public.parse_registration_date(p_payload->>'dateOfBirth', 'Date of birth must be a valid date.'),
    public.normalize_registration_gender(p_payload->>'gender', 'Gender must be male or female.'),
    nullif(trim(coalesce(p_payload->>'maritalStatus','')),''),
    nullif(trim(coalesce(p_payload->>'profession','')),''),
    nullif(trim(coalesce(p_payload->>'address','')),''),
    nullif(trim(coalesce(p_payload->>'city','')),''),
    nullif(trim(coalesce(p_payload->>'country','')),''),
    nullif(trim(coalesce(p_payload->>'preferredContactMethod','')),''),
    nullif(trim(coalesce(p_payload->>'emergencyContactName','')),''),
    nullif(trim(coalesce(p_payload->>'emergencyContactPhone','')),''),
    nullif(trim(coalesce(p_payload->>'howHeardAboutChurch','')),''),
    nullif(trim(coalesce(p_payload->>'christianStatus','')),''),
    case when p_payload->>'isBaptized' = 'true' then true when p_payload->>'isBaptized' = 'false' then false else null end,
    public.parse_registration_date(p_payload->>'baptismDate', 'Baptism date must be a valid date.'),
    nullif(trim(coalesce(p_payload->>'previousChurch','')),''),
    case when p_payload->>'wantsMembership' = 'true' then true when p_payload->>'wantsMembership' = 'false' then false else null end,
    nullif(trim(coalesce(p_payload->>'requestedMembershipType','')),''),
    public.parse_registration_date(p_payload->>'transferInDate', 'Transfer in date must be a valid date.'),
    v_household_action,
    nullif(trim(coalesce(p_payload->>'suggestedHouseholdName','')),''),
    nullif(trim(coalesce(p_payload->>'suggestedHouseholdHeadName','')),''),
    nullif(trim(coalesce(p_payload->>'suggestedHouseholdHeadPhone','')),''),
    nullif(trim(coalesce(p_payload->>'suggestedHouseholdRole','')),''),
    nullif(trim(coalesce(p_payload->>'suggestedHouseholdAddress','')),''),
    nullif(trim(coalesce(p_payload->>'suggestedHouseholdCity','')),''),
    nullif(trim(coalesce(p_payload->>'suggestedHouseholdCountry','')),''),
    nullif(trim(coalesce(p_payload->>'suggestedHouseholdPhone','')),''),
    nullif(trim(coalesce(p_payload->>'suggestedHouseholdEmail','')),''),
    nullif(trim(coalesce(p_payload->>'householdNotes','')),''),
    v_dept_ids,
    nullif(trim(coalesce(p_payload->>'notes','')),''),
    true,
    case when v_count > 0 then 'needs_member_duplicate_review' else 'pending' end,
    jsonb_build_object(
      'submitted_via', 'public_form',
      'submitter_ip', coalesce(current_setting('request.headers', true)::jsonb->>'x-forwarded-for', ''),
      'submitter_user_agent', coalesce(current_setting('request.headers', true)::jsonb->>'user-agent', '')
    )
  )
  returning id into v_registration_id;

  -- Insert additional household members
  v_members := coalesce(p_payload->'householdMembers', '[]'::jsonb);
  if jsonb_typeof(v_members) = 'array' then
    for v_member in select * from jsonb_array_elements(v_members)
    loop
      if length(trim(coalesce(v_member->>'firstName',''))) = 0
         or length(trim(coalesce(v_member->>'lastName',''))) = 0 then
        continue;
      end if;

      v_relationship := coalesce(nullif(trim(coalesce(v_member->>'relationship','')),''), 'other');
      if v_relationship not in ('spouse','child','relative','guardian','other') then
        v_relationship := 'other';
      end if;

      insert into public.church_member_registration_household_members (
        registration_id,
        church_id,
        first_name,
        last_name,
        relationship,
        date_of_birth,
        gender,
        email,
        phone,
        membership_status_suggestion
      ) values (
        v_registration_id,
        v_church_id,
        trim(v_member->>'firstName'),
        trim(v_member->>'lastName'),
        v_relationship,
        public.parse_registration_date(v_member->>'dateOfBirth', 'Family member date of birth must be a valid date.'),
        public.normalize_registration_gender(v_member->>'gender', 'Family member gender must be male or female.'),
        nullif(public.normalize_registration_email(v_member->>'email'), ''),
        nullif(public.normalize_registration_phone(v_member->>'phone'), ''),
        nullif(trim(coalesce(v_member->>'membershipStatusSuggestion','')), '')
      );
    end loop;
  end if;

  return jsonb_build_object('ok', true, 'registration_id', v_registration_id);
exception when others then
  return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

-- Restrict RPC execution to anon and authenticated as needed.
revoke all on function public.submit_member_registration(text, text, jsonb) from public;
revoke all on function public.submit_member_registration(text, text, jsonb) from anon;
revoke all on function public.submit_member_registration(text, text, jsonb) from authenticated;
grant execute on function public.submit_member_registration(text, text, jsonb) to anon;
grant execute on function public.submit_member_registration(text, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. SECURITY DEFINER RPC: rotate registration key (admin use)
-- ---------------------------------------------------------------------------
create or replace function public.rotate_member_registration_key(
  p_church_id uuid,
  p_plain_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_church_id is null or coalesce(p_plain_key, '') = '' then
    raise exception 'Church id and key are required.';
  end if;

  if not exists (
    select 1 from public.church_users cu
    join public.church_role_assignments cra on cra.church_id = cu.church_id and cra.user_id = cu.user_id and cra.is_active = true
    join public.role_definitions rd on rd.id = cra.role_id
    where cu.church_id = p_church_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
      and rd.code in ('church_admin','pastor','elder','clerk')
  ) then
    raise exception 'Not authorized to rotate registration key.';
  end if;

  update public.church_member_registration_settings
  set registration_key_hash = extensions.crypt(p_plain_key, extensions.gen_salt('bf')),
      updated_at = now()
  where church_id = p_church_id;

  if not found then
    insert into public.church_member_registration_settings (church_id, registration_key_hash)
    values (p_church_id, extensions.crypt(p_plain_key, extensions.gen_salt('bf')));
  end if;
end;
$$;

revoke all on function public.rotate_member_registration_key(uuid, text) from public;
revoke all on function public.rotate_member_registration_key(uuid, text) from anon;
revoke all on function public.rotate_member_registration_key(uuid, text) from authenticated;
grant execute on function public.rotate_member_registration_key(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Trigger: update updated_at on settings
-- ---------------------------------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.update_updated_at_column() from public;
revoke all on function public.update_updated_at_column() from anon;
revoke all on function public.update_updated_at_column() from authenticated;

drop trigger if exists trg_church_member_registration_settings_updated_at
  on public.church_member_registration_settings;

create trigger trg_church_member_registration_settings_updated_at
  before update on public.church_member_registration_settings
  for each row execute function public.update_updated_at_column();

drop trigger if exists trg_church_member_registrations_updated_at
  on public.church_member_registrations;

create trigger trg_church_member_registrations_updated_at
  before update on public.church_member_registrations
  for each row execute function public.update_updated_at_column();

drop trigger if exists trg_church_member_registration_household_members_updated_at
  on public.church_member_registration_household_members;

create trigger trg_church_member_registration_household_members_updated_at
  before update on public.church_member_registration_household_members
  for each row execute function public.update_updated_at_column();
