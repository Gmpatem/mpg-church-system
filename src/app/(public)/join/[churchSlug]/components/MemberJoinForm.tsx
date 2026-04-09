"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            <Label htmlFor="memberCode">Member Code (optional)</Label>
            <Input
              id="memberCode"
              name="memberCode"
              placeholder="e.g. MC-001"
            />
            <p className="text-xs text-muted-foreground">
              Your member code was given to you by your church administrator. Leave this blank if you don&apos;t have one.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              autoComplete="new-password"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <ButtonSpinner />
              Creating member access...
            </span>
          ) : "Continue"}
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
