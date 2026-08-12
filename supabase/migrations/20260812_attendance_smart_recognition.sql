-- Smart Attendance Recognition
-- Extends the existing trusted attendance phone table. Raw tokens stay in secure cookies only.

alter table public.attendance_member_devices
  add column if not exists profile_id uuid references public.profiles(id) on delete set null;

update public.attendance_member_devices amd
set profile_id = m.profile_id
from public.members m
where amd.member_id = m.id
  and amd.profile_id is null
  and m.profile_id is not null;

create index if not exists attendance_member_devices_token_hash_idx
  on public.attendance_member_devices(device_token_hash)
  where revoked_at is null;

create index if not exists attendance_member_devices_member_idx
  on public.attendance_member_devices(church_id, member_id)
  where revoked_at is null;

create index if not exists attendance_member_devices_profile_idx
  on public.attendance_member_devices(church_id, profile_id)
  where revoked_at is null and profile_id is not null;

comment on column public.attendance_member_devices.profile_id
  is 'Optional linked Supabase profile for a trusted attendance phone. The raw device token is never stored.';
