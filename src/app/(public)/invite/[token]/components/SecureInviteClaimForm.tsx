"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeMemberInviteOnboardingAction } from "@/features/member-invite/actions";
import type { SecureInviteClaimResult } from "@/features/member-invite/types";

type SecureInviteClaimFormProps = {
  token: string;
  churchName: string;
  defaultFirstName: string;
  defaultLastName: string;
  defaultEmail: string;
  isUsable: boolean;
};

export function SecureInviteClaimForm({
  token,
  churchName,
  defaultFirstName,
  defaultLastName,
  defaultEmail,
  isUsable,
}: SecureInviteClaimFormProps) {
  const [state, formAction, isPending] = useActionState<SecureInviteClaimResult | null, FormData>(
    completeMemberInviteOnboardingAction,
    null
  );

  if (!isUsable) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Invite Unavailable
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            This invite can no longer be used
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            The invite for {churchName} is no longer pending. Please contact your church administrator for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Secure Member Invite
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Complete your church access
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Create your account and claim your invited member profile.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        {state && !state.ok ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              name="firstName"
              defaultValue={defaultFirstName}
              autoComplete="given-name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              name="lastName"
              defaultValue={defaultLastName}
              autoComplete="family-name"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultEmail}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            name="phone"
            autoComplete="tel"
            placeholder="Optional phone number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating your access..." : "Join Church Platform"}
        </Button>
      </form>
    </div>
  );
}
