"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, Search, X } from "lucide-react";
import { assignMemberToDepartmentAction } from "@/features/departments/actions";
import type { ActionState } from "@/features/departments/types";

const initialState: ActionState = { ok: false };

interface MemberOption {
  id: string;
  label: string;
  member_code: string | null;
  membership_status: string | null;
}

interface AssignMemberToDepartmentProps {
  churchSlug: string;
  departmentId?: string;
  members: MemberOption[];
  departments: Array<{ id: string; name: string; code: string | null; is_active: boolean }>;
  existingActiveMemberIds?: string[];
}

function MemberSearchCombobox({
  members,
  selectedMemberId,
  onSelect,
  disabled,
  existingActiveMemberIds,
}: {
  members: MemberOption[];
  selectedMemberId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  existingActiveMemberIds?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  const blocked = useMemo(() => new Set(existingActiveMemberIds ?? []), [existingActiveMemberIds]);

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? null,
    [members, selectedMemberId]
  );

  const selectedLabel = selectedMember?.label ?? "";

  useEffect(() => {
    setInputValue(selectedLabel);
  }, [selectedLabel]);

  useEffect(() => {
    setActiveIndex(0);
  }, [inputValue]);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (event.target instanceof Node && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const normalizedQuery = useMemo(() => {
    const normalized = inputValue.trim().toLowerCase();
    if (!normalized) return "";
    if (selectedMemberId && normalized === selectedLabel.toLowerCase()) return "";
    return normalized;
  }, [inputValue, selectedMemberId, selectedLabel]);

  const filteredMembers = useMemo(() => {
    if (!normalizedQuery) return members;
    return members.filter((m) => {
      const text = `${m.label} ${m.member_code ?? ""}`.trim().toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [members, normalizedQuery]);

  const activeMemberId = filteredMembers[activeIndex]?.id ?? null;
  const activeOptionId = activeMemberId ? `${listboxId}-option-${activeMemberId}` : undefined;
  const showClear = Boolean(selectedMemberId || inputValue.trim());

  function handleSelect(memberId: string) {
    onSelect(memberId);
    const picked = members.find((m) => m.id === memberId) ?? null;
    setInputValue(picked ? picked.label : "");
    setActiveIndex(0);
    setOpen(false);
  }

  function handleInputChange(value: string) {
    if (disabled) return;
    setInputValue(value);
    if (selectedMemberId) onSelect("");
    setOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      setActiveIndex((prev) => Math.min(prev + 1, Math.max(filteredMembers.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (event.key === "Enter" && open && filteredMembers.length > 0) {
      event.preventDefault();
      const picked = filteredMembers[activeIndex] ?? filteredMembers[0];
      if (picked && !blocked.has(picked.id)) handleSelect(picked.id);
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor="member-search" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
        Member
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          id="member-search"
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Search members by name or code"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={open && activeOptionId ? activeOptionId : undefined}
          className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          autoComplete="off"
          spellCheck={false}
        />
        {!disabled && showClear ? (
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              onSelect("");
              setOpen(true);
            }}
            className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && !disabled ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
        >
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredMembers.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                No members match this search.
              </p>
            ) : (
              <div className="space-y-1">
                {filteredMembers.map((member, index) => {
                  const selected = member.id === selectedMemberId;
                  const active = index === activeIndex;
                  const isBlocked = blocked.has(member.id);
                  return (
                    <button
                      id={`${listboxId}-option-${member.id}`}
                      key={member.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={isBlocked}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (!isBlocked) handleSelect(member.id);
                      }}
                      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                        isBlocked
                          ? "cursor-not-allowed border-transparent bg-slate-50 text-slate-400"
                          : active && !selected
                            ? "border-slate-300 bg-slate-100 text-slate-900"
                            : selected
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{member.label}</span>
                        {member.member_code ? (
                          <span className="block truncate text-xs text-slate-500">{member.member_code}</span>
                        ) : null}
                      </span>
                      {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
                      {isBlocked ? <span className="shrink-0 text-xs text-slate-400">Already assigned</span> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <input type="hidden" name="member_id" value={selectedMemberId} />

      {selectedMember ? (
        <div className="mt-1.5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">
          <Check className="h-3.5 w-3.5" />
          <span>
            Selected: <span className="font-semibold">{selectedMember.label}</span>
            {selectedMember.member_code ? <span className="ml-1 text-emerald-700/80">({selectedMember.member_code})</span> : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function AssignMemberToDepartment({
  churchSlug,
  departmentId,
  members,
  departments,
  existingActiveMemberIds = [],
}: AssignMemberToDepartmentProps) {
  const [state, formAction, pending] = useActionState(assignMemberToDepartmentAction, initialState);
  const [selectedMemberId, setSelectedMemberId] = useState("");

  const availableMembers = useMemo(() => {
    if (!departmentId) return members;
    return members;
  }, [departmentId, members]);

  const allAssigned = useMemo(() => {
    if (!departmentId) return false;
    return availableMembers.length > 0 && availableMembers.every((m) => existingActiveMemberIds.includes(m.id));
  }, [departmentId, availableMembers, existingActiveMemberIds]);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <input type="hidden" name="churchSlug" value={churchSlug} />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_190px_auto]">
        <MemberSearchCombobox
          members={availableMembers}
          selectedMemberId={selectedMemberId}
          onSelect={setSelectedMemberId}
          disabled={pending || allAssigned}
          existingActiveMemberIds={existingActiveMemberIds}
        />

        <div>
          <label htmlFor="department_id" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Department
          </label>
          <select
            id="department_id"
            name="department_id"
            required
            defaultValue={departmentId ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select department</option>
            {departments
              .filter((item) => item.is_active || item.id === departmentId)
              .map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                  {department.code ? ` (${department.code})` : ""}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label htmlFor="role_title" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Role
          </label>
          <input
            id="role_title"
            name="role_title"
            placeholder="Leader, Assistant, Member"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="start_date" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Start Date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end gap-2">
          <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2">
            <input type="checkbox" name="is_active" value="true" defaultChecked />
            <span className="text-sm text-slate-700">Active</span>
          </label>
          <button
            type="submit"
            disabled={pending || !selectedMemberId || allAssigned}
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "Assigning..." : "Add Assignment"}
          </button>
        </div>
      </div>

      {allAssigned ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Every active member option is already assigned to this department.
        </div>
      ) : null}

      {state?.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      {state?.ok && state?.message ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
