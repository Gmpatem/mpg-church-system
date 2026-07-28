-- Attendance MVP hardening
-- Run this in Supabase SQL Editor before deploying the code if your production DB does not already have these fields.

alter table public.visitor_contacts
  add column if not exists follow_up_status text default 'not_contacted',
  add column if not exists follow_up_notes text,
  add column if not exists contacted_at timestamp with time zone,
  add column if not exists contacted_by_user_id uuid references public.profiles(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'visitor_contacts_follow_up_status_check'
      and conrelid = 'public.visitor_contacts'::regclass
  ) then
    alter table public.visitor_contacts
      add constraint visitor_contacts_follow_up_status_check
      check (follow_up_status in ('not_contacted', 'contacted', 'needs_membership_review', 'no_follow_up_needed'));
  end if;
end $$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.attendance_qr_codes to authenticated;
grant select, insert, update, delete on public.attendance_occurrences to authenticated;
grant select, insert, update, delete on public.attendance_records to authenticated;
grant select, insert, update, delete on public.attendance_member_devices to authenticated;
grant select, insert, update, delete on public.visitor_contacts to authenticated;
grant select, insert, update, delete on public.attendance_review_items to authenticated;
grant select, insert, update, delete on public.attendance_audit_logs to authenticated;
