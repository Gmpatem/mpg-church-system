-- Migration: Allow public registration account setup to be verified by the user's Auth session.
-- Scope: Authenticated RPC only; validates auth.uid() and Auth user identity before linking.

create or replace function public.submit_member_registration_with_account(
  p_church_slug text,
  p_key text,
  p_payload jsonb,
  p_auth_user_id uuid,
  p_login_identifier_type text,
  p_login_email text default null,
  p_login_phone text default null,
  p_recovery_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $function$
declare
  v_request_user_id uuid := auth.uid();
  v_auth_user auth.users%rowtype;
  v_church_id uuid;
  v_existing public.church_member_registrations%rowtype;
  v_submit_result jsonb;
  v_registration_id uuid;
  v_login_identifier_type text := nullif(trim(coalesce(p_login_identifier_type, '')), '');
  v_login_email text := public.normalize_registration_email(p_login_email);
  v_login_phone text := nullif(trim(coalesce(p_login_phone, '')), '');
  v_recovery_email text := public.normalize_registration_email(p_recovery_email);
  v_account_setup_status text;
begin
  if p_auth_user_id is null
     or v_request_user_id is null
     or v_request_user_id <> p_auth_user_id then
    return jsonb_build_object(
      'ok', false,
      'error', 'Portal account session could not be verified. Please sign in to the portal account and submit the registration again.'
    );
  end if;

  select *
  into v_auth_user
  from auth.users
  where id = p_auth_user_id;

  if v_auth_user.id is null then
    return jsonb_build_object('ok', false, 'error', 'Portal account details could not be verified.');
  end if;

  if v_login_identifier_type not in ('email', 'phone') then
    return jsonb_build_object('ok', false, 'error', 'Portal account details could not be verified.');
  end if;

  if v_login_identifier_type = 'email' then
    if v_login_email is null
       or v_login_email = ''
       or public.normalize_registration_email(v_auth_user.email) <> v_login_email then
      return jsonb_build_object('ok', false, 'error', 'Portal account email does not match this registration.');
    end if;

    v_account_setup_status := case
      when v_auth_user.email_confirmed_at is not null or v_auth_user.confirmed_at is not null
        then 'pending_approval'
      else 'pending_email_confirmation'
    end;
  else
    if v_login_phone is null
       or v_login_phone = ''
       or public.normalize_registration_phone(v_auth_user.phone) <> v_login_phone then
      return jsonb_build_object('ok', false, 'error', 'Portal account mobile number does not match this registration.');
    end if;

    v_account_setup_status := case
      when v_auth_user.phone_confirmed_at is not null or v_auth_user.confirmed_at is not null
        then 'pending_approval'
      else 'pending_phone_verification'
    end;
  end if;

  select id
  into v_church_id
  from public.churches
  where slug = p_church_slug
    and is_active = true;

  if v_church_id is null then
    return jsonb_build_object('ok', false, 'error', 'Church not found or registration unavailable.');
  end if;

  select *
  into v_existing
  from public.church_member_registrations
  where auth_user_id = p_auth_user_id
  order by created_at desc
  limit 1;

  if v_existing.id is not null then
    if v_existing.church_id <> v_church_id then
      return jsonb_build_object('ok', false, 'error', 'This portal account is already linked to another registration.');
    end if;

    return jsonb_build_object(
      'ok', true,
      'registration_id', v_existing.id,
      'account_setup_status', v_existing.account_setup_status,
      'login_identifier_type', coalesce(v_existing.login_identifier_type, v_login_identifier_type),
      'login_email', v_existing.login_email,
      'login_phone', v_existing.login_phone
    );
  end if;

  select *
  into v_existing
  from public.church_member_registrations
  where church_id = v_church_id
    and account_setup_status in (
      'pending_email_confirmation',
      'pending_phone_verification',
      'pending_approval',
      'active'
    )
    and (
      (v_login_identifier_type = 'email' and login_email = v_login_email)
      or (v_login_identifier_type = 'phone' and login_phone = v_login_phone)
    )
  order by created_at desc
  limit 1;

  if v_existing.id is not null then
    return jsonb_build_object(
      'ok', true,
      'registration_id', v_existing.id,
      'account_setup_status', v_existing.account_setup_status,
      'login_identifier_type', coalesce(v_existing.login_identifier_type, v_login_identifier_type),
      'login_email', v_existing.login_email,
      'login_phone', v_existing.login_phone
    );
  end if;

  v_submit_result := public.submit_member_registration(p_church_slug, p_key, p_payload);

  if coalesce((v_submit_result->>'ok')::boolean, false) is not true then
    return v_submit_result;
  end if;

  v_registration_id := (v_submit_result->>'registration_id')::uuid;

  update public.church_member_registrations
  set auth_user_id = p_auth_user_id,
      login_identifier_type = v_login_identifier_type,
      login_email = case when v_login_identifier_type = 'email' then v_login_email else null end,
      login_phone = case when v_login_identifier_type = 'phone' then v_login_phone else null end,
      recovery_email = case when v_login_identifier_type = 'phone' then nullif(v_recovery_email, '') else null end,
      account_setup_requested = true,
      account_setup_status = v_account_setup_status,
      account_setup_verified_at = now(),
      updated_at = now()
  where id = v_registration_id
    and church_id = v_church_id;

  return jsonb_build_object(
    'ok', true,
    'registration_id', v_registration_id,
    'account_setup_status', v_account_setup_status,
    'login_identifier_type', v_login_identifier_type,
    'login_email', case when v_login_identifier_type = 'email' then v_login_email else null end,
    'login_phone', case when v_login_identifier_type = 'phone' then v_login_phone else null end
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'This portal account is already linked to another registration.');
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$function$;

revoke all on function public.submit_member_registration_with_account(
  text,
  text,
  jsonb,
  uuid,
  text,
  text,
  text,
  text
) from public;
revoke all on function public.submit_member_registration_with_account(
  text,
  text,
  jsonb,
  uuid,
  text,
  text,
  text,
  text
) from anon;
revoke all on function public.submit_member_registration_with_account(
  text,
  text,
  jsonb,
  uuid,
  text,
  text,
  text,
  text
) from authenticated;
grant execute on function public.submit_member_registration_with_account(
  text,
  text,
  jsonb,
  uuid,
  text,
  text,
  text,
  text
) to authenticated;
