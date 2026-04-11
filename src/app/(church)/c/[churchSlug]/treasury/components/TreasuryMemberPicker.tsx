"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { TreasuryMemberOption } from "@/features/treasury/hooks";

interface TreasuryMemberPickerProps {
  members: TreasuryMemberOption[];
  selectedMemberId: string;
  onSelect: (memberId: string) => void;
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  clearLabel: string;
  selectedLabel: string;
  disabled?: boolean;
}

function getMemberName(member: TreasuryMemberOption) {
  return member.display_name ?? `${member.first_name} ${member.last_name}`.trim();
}

function getMemberSearchText(member: TreasuryMemberOption) {
  const fullName = getMemberName(member);
  return `${fullName} ${member.member_code ?? ""}`.trim().toLowerCase();
}

export function TreasuryMemberPicker({
  members,
  selectedMemberId,
  onSelect,
  label,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  clearLabel,
  selectedLabel,
  disabled = false,
}: TreasuryMemberPickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) ?? null,
    [members, selectedMemberId]
  );

  const selectedMemberName = selectedMember ? getMemberName(selectedMember) : "";

  useEffect(() => {
    setInputValue(selectedMemberName);
  }, [selectedMemberName]);

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
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  const normalizedQuery = useMemo(() => {
    const normalized = inputValue.trim().toLowerCase();
    if (!normalized) return "";
    if (selectedMemberId && normalized === selectedMemberName.toLowerCase()) {
      return "";
    }
    return normalized;
  }, [inputValue, selectedMemberId, selectedMemberName]);

  const filteredMembers = useMemo(() => {
    if (!normalizedQuery) return members;

    return members.filter((member) => {
      return getMemberSearchText(member).includes(normalizedQuery);
    });
  }, [members, normalizedQuery]);
  const activeMemberId = filteredMembers[activeIndex]?.id ?? null;
  const activeOptionId = activeMemberId ? `${listboxId}-option-${activeMemberId}` : undefined;
  const showClearListAction = Boolean(selectedMemberId || inputValue.trim());

  const showSuggestions = !disabled && open;

  function handleSelect(memberId: string) {
    onSelect(memberId);
    const picked = members.find((member) => member.id === memberId) ?? null;
    setInputValue(picked ? getMemberName(picked) : "");
    setActiveIndex(0);
    setOpen(false);
  }

  function handleInputChange(value: string) {
    if (disabled) return;
    setInputValue(value);
    if (selectedMemberId) {
      onSelect("");
    }
    setOpen(true);
  }

  function handleInputFocus() {
    if (!disabled) {
      setOpen(true);
    }
  }

  function handleInputBlur() {
    setTimeout(() => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(document.activeElement)) {
        setOpen(false);
      }
    }, 0);
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
      const selected = filteredMembers[activeIndex] ?? filteredMembers[0];
      if (selected) {
        handleSelect(selected.id);
      }
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={inputValue}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || searchPlaceholder}
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={showSuggestions && activeOptionId ? activeOptionId : undefined}
          className={cn(
            "w-full rounded-md border border-slate-300 py-2 pl-9 pr-10 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25",
            disabled ? "cursor-not-allowed bg-slate-100 text-slate-400" : "bg-white"
          )}
          autoComplete="off"
          spellCheck={false}
        />
        {!disabled && inputValue ? (
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              onSelect("");
              setOpen(true);
            }}
            className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label={clearLabel}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showSuggestions ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
        >
          <div className="max-h-64 overflow-y-auto p-1">
            {showClearListAction ? (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect("")}
                className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700"
              >
                <span>{clearLabel}</span>
                <X className="h-4 w-4" />
              </button>
            ) : null}
            {filteredMembers.length === 0 ? (
              <p className={cn("rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500", showClearListAction ? "mt-1" : "")}>
                {emptyMessage}
              </p>
            ) : (
              <div className={cn("space-y-1", showClearListAction ? "mt-1" : "")}>
                {filteredMembers.map((member) => {
                  const selected = member.id === selectedMemberId;
                  const active = member.id === filteredMembers[activeIndex]?.id;
                  return (
                    <button
                      id={`${listboxId}-option-${member.id}`}
                      key={member.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(member.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm",
                        active && !selected ? "border-slate-300 bg-slate-100 text-slate-900" : "",
                        selected
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-700"
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{getMemberName(member)}</span>
                        {member.member_code ? (
                          <span className="block truncate text-xs text-slate-500">{member.member_code}</span>
                        ) : null}
                      </span>
                      {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {selectedMember ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">
          <Check className="h-3.5 w-3.5" />
          <span>
            {selectedLabel}: <span className="font-semibold">{getMemberName(selectedMember)}</span>
            {selectedMember.member_code ? <span className="ml-1 text-emerald-700/80">({selectedMember.member_code})</span> : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}
