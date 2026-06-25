-- Migration: Harden public member registration date parsing, key validation, and church gender values.
-- Scope: Public registration RPCs and member gender constraint only.

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
  if coalesce(p_church_slug, '') = '' then
    return jsonb_build_object('ok', false, 'error', 'Church slug is required.');
  end if;

  if coalesce(p_key, '') = '' then
    return jsonb_build_object('ok', false, 'error', 'Registration key is required.');
  end if;

  if p_payload is null or p_payload = '{}'::jsonb then
    return jsonb_build_object('ok', false, 'error', 'Payload is required.');
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

  if p_payload->>'firstName' is null or length(trim(p_payload->>'firstName')) = 0 then
    return jsonb_build_object('ok', false, 'error', 'First name is required.');
  end if;

  if p_payload->>'lastName' is null or length(trim(p_payload->>'lastName')) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Last name is required.');
  end if;

  if coalesce(p_payload->>'privacyConsent', 'false') <> 'true' then
    return jsonb_build_object('ok', false, 'error', 'Privacy consent is required.');
  end if;

  v_household_action := coalesce(p_payload->>'householdAction', 'self_only');
  if v_household_action not in ('self_only','existing_household','new_household','not_sure') then
    v_household_action := 'self_only';
  end if;

  v_email := public.normalize_registration_email(p_payload->>'email');
  if v_email = '' then v_email := null; end if;
  v_phone := public.normalize_registration_phone(p_payload->>'phone');
  if v_phone = '' then v_phone := null; end if;

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

  select count(*) into v_count
  from public.members
  where church_id = v_church_id
    and (
      (v_email is not null and lower(trim(coalesce(email,''))) = v_email)
      or (v_phone is not null and public.normalize_registration_phone(phone) = v_phone)
    );

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

revoke all on function public.submit_member_registration(text, text, jsonb) from public;
grant execute on function public.submit_member_registration(text, text, jsonb) to anon;
grant execute on function public.submit_member_registration(text, text, jsonb) to authenticated;

alter table public.members drop constraint if exists members_gender_check;
alter table public.members
  add constraint members_gender_check
  check (gender is null or gender in ('male','female')) not valid;
alter table public.members validate constraint members_gender_check;
