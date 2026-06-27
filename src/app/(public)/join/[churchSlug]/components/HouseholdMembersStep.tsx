"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { RegistrationHouseholdMemberInput } from "@/features/member-registration/schemas";
import type { PublicRegistrationPageData } from "@/features/member-registration/public-queries";
import { CHURCH_GENDER_OPTIONS } from "@/lib/domain/church-gender";

const EMPTY_GENDER_VALUE = "__none";

const relationshipLabels: Record<RegistrationHouseholdMemberInput["relationship"], string> = {
  spouse: "Spouse",
  child: "Child",
  relative: "Relative",
  guardian: "Guardian",
  other: "Other",
};

type HouseholdMembersStepProps = {
  members: RegistrationHouseholdMemberInput[];
  onAdd: () => void;
  onUpdate: (index: number, updates: Partial<RegistrationHouseholdMemberInput>) => void;
  onRemove: (index: number) => void;
  settings: PublicRegistrationPageData["settings"];
};

export function HouseholdMembersStep({ members, onAdd, onUpdate, onRemove, settings }: HouseholdMembersStepProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(members.length > 0 ? 0 : null);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (members.length === 0) {
      setExpandedIndex(null);
      return;
    }

    if (expandedIndex === null || expandedIndex >= members.length) {
      setExpandedIndex(members.length - 1);
    }
  }, [expandedIndex, members.length]);

  if (!settings.collectHouseholdInformation) {
    return (
      <div className="py-8 text-center text-sm text-stone-500">
        Household information is not being collected at this time.
      </div>
    );
  }

  function handleAdd() {
    onAdd();
    setExpandedIndex(members.length);
  }

  function confirmRemove() {
    if (removeIndex === null) return;

    onRemove(removeIndex);
    setExpandedIndex((current) => {
      if (members.length <= 1) return null;
      if (current === null) return Math.min(removeIndex, members.length - 2);
      if (current === removeIndex) return Math.min(removeIndex, members.length - 2);
      if (current > removeIndex) return current - 1;
      return current;
    });
    setRemoveIndex(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Other Household Members</h2>
        <p className="text-sm text-stone-600">Add family members you&apos;d like to register together.</p>
      </div>

      {members.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-500">
          No additional household members added yet.
        </div>
      )}

      <div className="space-y-4">
        {members.map((member, index) => (
          <FamilyMemberCard
            key={index}
            index={index}
            member={member}
            expanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
            onRemove={() => setRemoveIndex(index)}
            onUpdate={(updates) => onUpdate(index, updates)}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
        className="h-12 w-full gap-2 rounded-xl border-stone-200 text-stone-700"
      >
        <Plus className="size-4" />
        Add family member
      </Button>

      <ConfirmDialog
        open={removeIndex !== null}
        onOpenChange={(open) => !open && setRemoveIndex(null)}
        title="Remove family member?"
        description="This removes the family member from this registration draft."
        confirmLabel="Remove"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={confirmRemove}
      />
    </div>
  );
}

function FamilyMemberCard({
  index,
  member,
  expanded,
  onToggle,
  onRemove,
  onUpdate,
}: {
  index: number;
  member: RegistrationHouseholdMemberInput;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<RegistrationHouseholdMemberInput>) => void;
}) {
  const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
  const summary = [fullName || "Name not entered", relationshipLabels[member.relationship]]
    .filter(Boolean)
    .join(" • ");
  const contentId = `family-${index}-details`;

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-3 rounded-xl px-2 text-left transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          aria-expanded={expanded}
          aria-controls={contentId}
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-stone-900">Family member {index + 1}</span>
            <span className="block truncate text-sm text-stone-600">{summary}</span>
          </span>
          {expanded ? <ChevronUp className="size-5 shrink-0 text-stone-500" /> : <ChevronDown className="size-5 shrink-0 text-stone-500" />}
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl text-stone-500 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          aria-label={`Remove family member ${index + 1}`}
        >
          <Trash2 className="size-5" />
        </button>
      </div>

      <div
        id={contentId}
        className={cn("border-t border-stone-100 p-4", expanded ? "block" : "hidden")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`family-${index}-firstName`}>First name</Label>
            <Input
              id={`family-${index}-firstName`}
              value={member.firstName}
              onChange={e => onUpdate({ firstName: e.target.value })}
              placeholder="First name"
              autoComplete="given-name"
              enterKeyHint="next"
              className="h-12 rounded-xl text-base sm:text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`family-${index}-lastName`}>Last name</Label>
            <Input
              id={`family-${index}-lastName`}
              value={member.lastName}
              onChange={e => onUpdate({ lastName: e.target.value })}
              placeholder="Last name"
              autoComplete="family-name"
              enterKeyHint="next"
              className="h-12 rounded-xl text-base sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`family-${index}-relationship`}>Relationship</Label>
            <Select
              value={member.relationship}
              onValueChange={value => onUpdate({ relationship: value as RegistrationHouseholdMemberInput["relationship"] })}
            >
              <SelectTrigger id={`family-${index}-relationship`} className="h-12 rounded-xl text-base sm:text-sm">
                <SelectValue placeholder="Relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="relative">Relative</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`family-${index}-dateOfBirth`}>Date of birth</Label>
            <Input
              id={`family-${index}-dateOfBirth`}
              type="date"
              value={member.dateOfBirth ?? ""}
              onChange={e => onUpdate({ dateOfBirth: e.target.value || null })}
              className="h-12 rounded-xl text-base sm:text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`family-${index}-gender`}>Gender</Label>
            <Select
              value={member.gender ?? EMPTY_GENDER_VALUE}
              onValueChange={(value) =>
                onUpdate({
                  gender:
                    value === EMPTY_GENDER_VALUE
                      ? null
                      : (value as RegistrationHouseholdMemberInput["gender"]),
                })
              }
            >
              <SelectTrigger id={`family-${index}-gender`} className="h-12 rounded-xl text-base sm:text-sm">
                <SelectValue placeholder="Select gender" />
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
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`family-${index}-phone`}>Phone</Label>
            <Input
              id={`family-${index}-phone`}
              type="tel"
              inputMode="tel"
              value={member.phone ?? ""}
              onChange={e => onUpdate({ phone: e.target.value || null })}
              placeholder="Phone number"
              autoComplete="tel"
              enterKeyHint="next"
              className="h-12 rounded-xl text-base sm:text-sm"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor={`family-${index}-email`}>Email</Label>
            <Input
              id={`family-${index}-email`}
              type="email"
              inputMode="email"
              value={member.email ?? ""}
              onChange={e => onUpdate({ email: e.target.value || null })}
              placeholder="email@example.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="done"
              className="h-12 rounded-xl text-base sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
