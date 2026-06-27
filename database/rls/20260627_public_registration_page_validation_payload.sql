-- Migration: Return public-safe page data from the existing registration-key validator.
-- Scope: Keep public registration page loading behind the reusable registration key.

create extension if not exists "pgcrypto" with schema extensions;

create or replace function public.validate_member_registration_key(
  p_church_slug text,
  p_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_slug text;
  v_key text;
  v_church public.churches%rowtype;
  v_settings public.church_member_registration_settings%rowtype;
  v_church_payload jsonb;
  v_settings_payload jsonb;
  v_departments_payload jsonb;
begin
  v_slug := trim(coalesce(p_church_slug, ''));
  v_key := trim(coalesce(p_key, ''));

  if v_slug = '' then
    return jsonb_build_object('ok', false, 'reason', 'church_not_found');
  end if;

  select
    c.*
  into v_church
  from public.churches c
  where c.slug = v_slug;

  if v_church.id is null then
    return jsonb_build_object('ok', false, 'reason', 'church_not_found');
  end if;

  v_church_payload := jsonb_build_object(
    'id', v_church.id,
    'name', v_church.name,
    'slug', v_church.slug,
    'logo_url', v_church.logo_url,
    'city', v_church.city,
    'country', v_church.country,
    'default_language', v_church.default_language
  );

  if v_church.is_active is distinct from true then
    return jsonb_build_object(
      'ok', false,
      'reason', 'church_inactive',
      'church', v_church_payload
    );
  end if;

  if v_key = '' then
    return jsonb_build_object(
      'ok', false,
      'reason', 'missing_key',
      'church', v_church_payload
    );
  end if;

  if length(v_key) > 80 or v_key !~ '^reg_[1-9A-HJ-NP-Za-km-z]{43,44}$' then
    return jsonb_build_object(
      'ok', false,
      'reason', 'malformed_key',
      'church', v_church_payload
    );
  end if;

  select *
  into v_settings
  from public.church_member_registration_settings
  where church_id = v_church.id;

  if v_settings.church_id is null or v_settings.is_enabled is distinct from true then
    return jsonb_build_object(
      'ok', false,
      'reason', 'registration_disabled',
      'church', v_church_payload
    );
  end if;

  if v_settings.registration_key_hash is null or v_settings.registration_key_hash = '' then
    return jsonb_build_object(
      'ok', false,
      'reason', 'configuration_error',
      'church', v_church_payload
    );
  end if;

  if not (extensions.crypt(v_key, v_settings.registration_key_hash) = v_settings.registration_key_hash) then
    return jsonb_build_object(
      'ok', false,
      'reason', 'invalid_key',
      'church', v_church_payload
    );
  end if;

  v_settings_payload := jsonb_build_object(
    'is_enabled', true,
    'welcome_message', v_settings.welcome_message,
    'success_message', v_settings.success_message,
    'collect_date_of_birth', v_settings.collect_date_of_birth,
    'collect_emergency_contact', v_settings.collect_emergency_contact,
    'collect_household_information', v_settings.collect_household_information,
    'collect_department_interests', v_settings.collect_department_interests
  );

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', cd.id,
        'department_name', cd.department_name
      )
      order by cd.department_name
    ),
    '[]'::jsonb
  )
  into v_departments_payload
  from public.church_departments cd
  where cd.church_id = v_church.id
    and cd.is_active = true;

  return jsonb_build_object(
    'ok', true,
    'church', v_church_payload,
    'settings', v_settings_payload,
    'departments', v_departments_payload
  );
exception when others then
  return jsonb_build_object('ok', false, 'reason', 'configuration_error');
end;
$$;

revoke all on function public.validate_member_registration_key(text, text) from public;
revoke all on function public.validate_member_registration_key(text, text) from anon;
revoke all on function public.validate_member_registration_key(text, text) from authenticated;
grant execute on function public.validate_member_registration_key(text, text) to anon;
grant execute on function public.validate_member_registration_key(text, text) to authenticated;

alter function public.submit_member_registration(text, text, jsonb)
  set search_path = public, pg_temp;

alter function public.rotate_member_registration_key(uuid, text)
  set search_path = public, pg_temp;
