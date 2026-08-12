"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, UsersRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CHURCH_GENDER_OPTIONS } from "@/lib/domain/church-gender";
import { addChildToHouseholdAction } from "@/features/households/actions";
import type { ActionState } from "@/features/access/types";

const initialState: ActionState | null = null;
const EMPTY_GENDER_VALUE = "__none";

export function AddChildToHouseholdDialog({
  churchSlug,
  householdId,
  householdName,
}: {
  churchSlug: string;
  householdId: string;
  householdName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addChildToHouseholdAction, initialState);

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
    }
  }, [state?.ok]);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" aria-hidden="true" />
        Add Child
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-3xl p-0">
          <DialogHeader className="border-b border-border px-5 py-4 pr-14 text-left">
            <DialogTitle>Add Child to Household</DialogTitle>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </DialogHeader>

          <form action={action} className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
            <input type="hidden" name="churchSlug" value={churchSlug} />
            <input type="hidden" name="householdId" value={householdId} />

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First Name" htmlFor="child-first-name" required>
                  <Input id="child-first-name" name="firstName" required className="h-11" />
                </Field>

                <Field label="Last Name" htmlFor="child-last-name" required>
                  <Input id="child-last-name" name="lastName" required className="h-11" />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Date of Birth" htmlFor="child-date-of-birth">
                  <Input id="child-date-of-birth" name="dateOfBirth" type="date" className="h-11" />
                </Field>

                <Field label="Gender" htmlFor="child-gender">
                  <Select name="gender" defaultValue={EMPTY_GENDER_VALUE}>
                    <SelectTrigger id="child-gender" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY_GENDER_VALUE}>Not specified</SelectItem>
                      {CHURCH_GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Care Note" htmlFor="child-care-note">
                <Textarea
                  id="child-care-note"
                  name="careNote"
                  rows={4}
                  placeholder="Optional note for allergies, pickup, or pastoral care."
                />
              </Field>

              <label className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-sm">
                <Checkbox
                  name="assignChildrenDepartment"
                  value="true"
                  defaultChecked
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-medium text-emerald-950">Add to Children&apos;s Department</span>
                  <span className="mt-1 block text-emerald-900">
                    Child will be assigned to Children&apos;s Ministry if available.
                  </span>
                </span>
              </label>

              {state?.ok === false && state.error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  {state.error}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending} className="gap-2">
                  <Plus className="size-4" aria-hidden="true" />
                  {pending ? "Adding..." : "Add Child"}
                </Button>
              </div>
            </div>

            <aside className="hidden rounded-2xl bg-emerald-50 p-5 text-emerald-950 md:block">
              <UsersRound className="size-10" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold">Household</p>
              <p className="mt-1 text-sm text-emerald-900">{householdName}</p>
              <p className="mt-5 text-sm leading-6 text-emerald-900">
                This creates an active child member, links the child to this household, and can place them in the Children&apos;s Department in one reviewable action.
              </p>
            </aside>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
