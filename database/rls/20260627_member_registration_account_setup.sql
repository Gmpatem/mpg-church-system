-- Migration: Link optional public registration portal accounts after secure Auth verification.
-- Scope: Pending registration metadata only; no anonymous table policies are added.

alter table public.church_member_registrations
  add column if not exists auth_user_id uuid,
  add column if not exists login_email text,
  add column if not exists account_setup_requested boolean not null default false,
  add column if not exists account_setup_status text not null default 'not_requested',
  add column if not exists account_setup_verified_at timestamptz;

alter table public.church_member_registrations
  drop constraint if exists church_member_registrations_account_setup_status_check;

alter table public.church_member_registrations
  add constraint church_member_registrations_account_setup_status_check
  check (
    account_setup_status in (
      'not_requested',
      'pending_email_confirmation',
      'pending_approval',
      'active',
      'rejected',
      'link_failed'
    )
  );

create unique index if not exists idx_church_member_registrations_auth_user_id
  on public.church_member_registrations(auth_user_id)
  where auth_user_id is not null;

create index if not exists idx_church_member_registrations_login_email
  on public.church_member_registrations(church_id, login_email)
  where login_email is not null;

comment on column public.church_member_registrations.auth_user_id
  is 'Verified Supabase Auth user ID supplied by optional public registration account setup.';

comment on column public.church_member_registrations.login_email
  is 'Normalized login email for the optional public registration portal account.';

comment on column public.church_member_registrations.account_setup_status
  is 'Non-sensitive lifecycle state for optional public registration account setup.';
