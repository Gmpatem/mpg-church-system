"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils/cn";
import type { DepartmentsWorkspaceData } from "../types";

export type ManageActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

export type ManageServerAction = (
  previousState: ManageActionState | null,
  formData: FormData
) => Promise<ManageActionState>;

export function useManageMutation({
  action,
  onSuccess,
}: {
  action: ManageServerAction;
  onSuccess: (message?: string) => void;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const handledState = useRef<ManageActionState | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!state || handledState.current === state) return;
    handledState.current = state;
    if (state.ok) {
      toast({ title: "Saved", description: state.message ?? "Changes saved successfully." });
      onSuccess(state.message);
      return;
    }
    toast({
      title: "Could not save",
      description: state.error ?? "Please review the form and try again.",
      variant: "destructive",
    });
  }, [onSuccess, state, toast]);

  return { state, formAction, pending };
}

export function FormMessage({ state }: { state: ManageActionState | null }) {
  if (!state?.error && !state?.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cn(
        "rounded-xl border px-3 py-2 text-sm",
        state.ok
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-destructive/20 bg-destructive/10 text-destructive"
      )}
    >
      {state.error || state.message}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ManagePanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[22px] border border-primary/10 bg-background p-4 shadow-sm sm:p-5", className)}>
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

type MemberOption = DepartmentsWorkspaceData["options"]["members"][number];

export function MemberPicker({
  members,
  value,
  onChange,
  disabled,
  inputName = "member_id",
  placeholder = "Select a church member",
}: {
  members: MemberOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  inputName?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = members.find((member) => member.id === value) ?? null;
  const filteredMembers = members.filter((member) =>
    [member.label, member.member_code, member.email, member.phone]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(query.trim().toLowerCase()))
  );

  return (
    <>
      <input type="hidden" name={inputName} value={value} />
      <div className="relative">
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            disabled={disabled}
            className="h-11 w-full justify-between rounded-xl border-primary/10 bg-background px-3 font-normal"
          >
            <span className="min-w-0 truncate text-left">
              {selected ? selected.label : placeholder}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Button>
        {open ? (
        <div className="absolute left-0 top-[calc(100%+0.35rem)] z-50 w-[min(420px,calc(100vw-3rem))] rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, code, email, or phone..."
              className="h-10 pl-9"
            />
          </div>
          <div className="mt-2 max-h-[300px] overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No matching church member found.</p>
            ) : (
              filteredMembers.map((member) => (
                  <button
                    type="button"
                    key={member.id}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      onChange(member.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    onClick={() => {
                      onChange(member.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-start gap-2 rounded-lg px-2 py-2.5 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Check
                      className={cn("mt-0.5 size-4 shrink-0", value === member.id ? "opacity-100" : "opacity-0")}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{member.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[member.member_code, member.email, member.phone].filter(Boolean).join(" · ") || "No contact details"}
                      </span>
                    </span>
                  </button>
                ))
            )}
          </div>
        </div>
        ) : null}
      </div>
    </>
  );
}

export function MultiMemberPicker({
  members,
  values,
  onChange,
  disabled,
}: {
  members: MemberOption[];
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedIds = new Set(values);
  const filteredMembers = members.filter((member) =>
    [member.label, member.member_code, member.email, member.phone]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(query.trim().toLowerCase()))
  );
  const selectedLabels = values
    .map((value) => members.find((member) => member.id === value)?.label)
    .filter((label): label is string => Boolean(label));

  function toggleMember(memberId: string) {
    onChange(
      selectedIds.has(memberId)
        ? values.filter((value) => value !== memberId)
        : [...values, memberId]
    );
  }

  return (
    <>
      {values.map((value) => <input key={value} type="hidden" name="member_ids" value={value} />)}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          disabled={disabled}
          className="h-11 w-full justify-between rounded-xl border-primary/10 bg-background px-3 font-normal"
        >
          <span className="min-w-0 truncate text-left">
            {selectedLabels.length === 0
              ? "Select one or more church members"
              : selectedLabels.length === 1
                ? selectedLabels[0]
                : `${selectedLabels.length} members selected`}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
        {open ? (
          <div className="absolute left-0 top-[calc(100%+0.35rem)] z-50 w-[min(420px,calc(100vw-3rem))] rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, code, email, or phone..." className="h-10 pl-9" />
            </div>
            <div className="mt-2 max-h-[300px] overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No matching church member found.</p>
              ) : (
                filteredMembers.map((member) => (
                  <button
                    type="button"
                    key={member.id}
                    aria-pressed={selectedIds.has(member.id)}
                    onClick={() => toggleMember(member.id)}
                    className="flex w-full items-start gap-2 rounded-lg px-2 py-2.5 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Check className={cn("mt-0.5 size-4 shrink-0", selectedIds.has(member.id) ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{member.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[member.member_code, member.email, member.phone].filter(Boolean).join(" · ") || "No contact details"}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <span className="text-xs text-muted-foreground">{values.length} selected</span>
              <Button type="button" size="sm" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

export function SearchInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className="sr-only">{placeholder}</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border-primary/10 bg-background pl-9"
      />
    </div>
  );
}

export const manageControlClass =
  "h-11 rounded-xl border-primary/10 bg-background focus-visible:ring-primary/30";
