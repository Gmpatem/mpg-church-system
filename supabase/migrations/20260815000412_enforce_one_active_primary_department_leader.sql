-- Enforce the product rule that a department can have only one active primary leader.
-- Review-only: do not apply this migration to production until existing rows have been audited.
create unique index if not exists department_leadership_assignments_one_active_primary_idx
  on public.department_leadership_assignments (church_id, department_id)
  where is_active = true and is_primary = true;
