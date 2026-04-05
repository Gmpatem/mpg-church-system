"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeMemberOnboardingAction } from "@/features/member-onboarding/actions";
import type { MemberOnboardingChurchSummary } from "@/features/member-onboarding/types";

type MemberJoinFormProps = {
  church: MemberOnboardingChurchSummary;
};

export function MemberJoinForm({ church }: MemberJoinFormProps) {
  const [state, formAction, isPending] = useActionState(
    completeMemberOnboardingAction,
    null
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Member Access Setup
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Join {church.name}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Create your account and connect it to your church member profile.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="churchSlug" value={church.slug} />

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
              placeholder="Enter your first name"
              autoComplete="given-name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="Enter your last name"
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
            placeholder="Enter your email"
            autoComplete="email"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="Enter your phone number"
              autoComplete="tel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memberCode">Member code</Label>
            <Input
              id="memberCode"
              name="memberCode"
              placeholder="Optional if you know it"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create a password"
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
            placeholder="Confirm your password"
            autoComplete="new-password"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating member access..." : "Continue"}
        </Button>
      </form>

      <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
        Need help? Contact the church administrator
        {church.email ? ` at ${church.email}` : ""}
        {church.phone ? ` or ${church.phone}` : ""}.
      </div>
    </div>
  );
}
