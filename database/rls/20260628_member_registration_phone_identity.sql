-- Migration: Extend public registration portal account setup to phone identities.
-- Scope: Metadata only; no anonymous table access or Auth secrets are introduced.

alter table public.church_member_registrations
  add column if not exists login_identifier_type text,
  add column if not exists login_phone text,
  add column if not exists recovery_email text;

update public.church_member_registrations
set login_identifier_type = 'email'
where login_identifier_type is null
  and login_email is not null;

alter table public.church_member_registrations
  drop constraint if exists church_member_registrations_account_setup_status_check;

alter table public.church_member_registrations
  add constraint church_member_registrations_account_setup_status_check
  check (
    account_setup_status in (
      'not_requested',
      'pending_email_confirmation',
      'pending_phone_verification',
      'pending_approval',
      'active',
      'rejected',
      'link_failed'
    )
  );

alter table public.church_member_registrations
  drop constraint if exists church_member_registrations_login_identifier_type_check;

alter table public.church_member_registrations
  add constraint church_member_registrations_login_identifier_type_check
  check (
    login_identifier_type is null
      or login_identifier_type in ('email', 'phone')
  );

create index if not exists idx_church_member_registrations_login_phone
  on public.church_member_registrations(church_id, login_phone)
  where login_phone is not null;

comment on column public.church_member_registrations.login_identifier_type
  is 'Portal login identifier kind for public registration account setup: email or phone.';

comment on column public.church_member_registrations.login_phone
  is 'E.164 mobile number for optional public registration portal account setup.';

comment on column public.church_member_registrations.recovery_email
  is 'Optional email used to help phone-login members recover account access.';
