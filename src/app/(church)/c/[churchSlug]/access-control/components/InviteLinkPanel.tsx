"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createMemberInviteAction,
  createOpenOnboardingInviteAction,
} from "@/features/member-invite/actions";
import type { InviteCreationMode, MemberInviteManagementData } from "@/features/member-invite/types";
import { InviteHistoryList } from "./InviteHistoryList";

type InviteLinkPanelProps = {
  churchSlug: string;
  data: MemberInviteManagementData;
};

function portalStateLabel(state: "not_invited" | "invited" | "joined") {
  if (state === "joined") return "Joined";
  if (state === "invited") return "Invited";
  return "Not invited";
}

export function InviteLinkPanel({ churchSlug, data }: InviteLinkPanelProps) {
  const [mode, setMode] = useState<InviteCreationMode>("existing_member");
  const [selectedMemberId, setSelectedMemberId] = useState<string>(data.memberOptions[0]?.id ?? "");
  const [openInviteEmail, setOpenInviteEmail] = useState("");
  const [openInviteNote, setOpenInviteNote] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedMember = useMemo(
    () => data.memberOptions.find((item) => item.id === selectedMemberId) ?? null,
    [data.memberOptions, selectedMemberId]
  );

  const fullGeneratedLink = useMemo(() => {
    if (!generatedLink) return "";
    if (typeof window === "undefined") return generatedLink;
    return `${window.location.origin}${generatedLink}`;
  }, [generatedLink]);

  function handleGenerate() {
    startTransition(async () => {
      const result =
        mode === "existing_member"
          ? await createMemberInviteAction(churchSlug, selectedMemberId)
          : await createOpenOnboardingInviteAction(
              churchSlug,
              openInviteEmail || null,
              openInviteNote || null
            );

      if (!result.ok) {
        setStatusMessage(result.error);
        window.alert(result.error);
        return;
      }

      setGeneratedLink(result.path);
      setStatusMessage(
        result.reused
          ? "Existing pending secure invite reused."
          : result.mode === "open_onboarding"
            ? "New open onboarding invite generated."
            : "New existing-member secure invite generated."
      );

      try {
        const full =
          typeof window === "undefined"
            ? result.path
            : `${window.location.origin}${result.path}`;
        await navigator.clipboard.writeText(full);
      } catch {
      }
    });
  }

  function handleCopyGenerated() {
    if (!fullGeneratedLink) return;

    navigator.clipboard.writeText(fullGeneratedLink).catch(() => {
      window.prompt("Copy invite link", fullGeneratedLink);
    });
  }

  const canGenerateExisting = mode === "existing_member" && !!selectedMemberId;
  const canGenerateOpen = mode === "open_onboarding";
  const canGenerate = canGenerateExisting || canGenerateOpen;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
        Generate either an invite for an existing member or an open onboarding invite for a brand-new person who will create their own member profile during signup.
      </div>

      <div className="space-y-4 rounded-2xl border p-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Invite mode</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("existing_member")}
              className={
                mode === "existing_member"
                  ? "inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background"
                  : "inline-flex h-10 items-center rounded-xl border px-4 text-sm font-medium"
              }
            >
              Existing member
            </button>
            <button
              type="button"
              onClick={() => setMode("open_onboarding")}
              className={
                mode === "open_onboarding"
                  ? "inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background"
                  : "inline-flex h-10 items-center rounded-xl border px-4 text-sm font-medium"
              }
            >
              New person onboarding
            </button>
          </div>
        </div>

        {mode === "existing_member" ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="member-invite-member" className="text-sm font-medium">
                  Select member
                </label>
                <select
                  id="member-invite-member"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a member</option>
                  {data.memberOptions.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border p-3 text-sm">
                  <p className="text-muted-foreground">Email</p>
                  <p className="mt-1 font-medium text-foreground">
                    {selectedMember?.email ?? "—"}
                  </p>
                </div>
                <div className="rounded-2xl border p-3 text-sm">
                  <p className="text-muted-foreground">Member code</p>
                  <p className="mt-1 font-medium text-foreground">
                    {selectedMember?.memberCode ?? "—"}
                  </p>
                </div>
                <div className="rounded-2xl border p-3 text-sm">
                  <p className="text-muted-foreground">Portal state</p>
                  <p className="mt-1 font-medium text-foreground">
                    {selectedMember ? portalStateLabel(selectedMember.portalState) : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
              Use this when the church already has a member record and you want that exact record to be claimed and completed through secure onboarding.
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="open-invite-email" className="text-sm font-medium">
                  Invite email (optional)
                </label>
                <input
                  id="open-invite-email"
                  type="email"
                  value={openInviteEmail}
                  onChange={(e) => setOpenInviteEmail(e.target.value)}
                  placeholder="person@example.com"
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="open-invite-note" className="text-sm font-medium">
                  Note (optional)
                </label>
                <textarea
                  id="open-invite-note"
                  value={openInviteNote}
                  onChange={(e) => setOpenInviteNote(e.target.value)}
                  placeholder="Example: Staff onboarding invite for church secretary"
                  className="min-h-[96px] w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
              Use this when the person does not exist in the system yet. They will create their own member profile during secure onboarding.
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isPending || !canGenerate}
            onClick={handleGenerate}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Generating..." : "Generate secure invite"}
          </button>

          {fullGeneratedLink ? (
            <button
              type="button"
              onClick={handleCopyGenerated}
              className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium transition hover:bg-accent"
            >
              Copy latest link
            </button>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="generated-secure-invite" className="text-sm font-medium">
            Latest secure invite
          </label>
          <input
            id="generated-secure-invite"
            readOnly
            value={fullGeneratedLink}
            placeholder="Generate an invite to see the secure link here"
            className="h-11 w-full rounded-xl border bg-muted/30 px-3 text-sm"
          />
        </div>

        {statusMessage ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-muted-foreground">
            {statusMessage}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border p-4">
          <p className="text-sm text-muted-foreground">Total invites</p>
          <p className="mt-2 text-2xl font-semibold">{data.summary.total}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="mt-2 text-2xl font-semibold">{data.summary.pending}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-sm text-muted-foreground">Claimed</p>
          <p className="mt-2 text-2xl font-semibold">{data.summary.claimed}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-sm text-muted-foreground">Expired / Revoked</p>
          <p className="mt-2 text-2xl font-semibold">
            {data.summary.expired + data.summary.revoked}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold">Invite history</h3>
          <p className="text-sm text-muted-foreground">
            View recent secure invites, whether they were for existing members or open onboarding, then copy links again or revoke pending ones.
          </p>
        </div>

        <InviteHistoryList churchSlug={churchSlug} invites={data.invites} />
      </div>
    </div>
  );
}
