"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { updatePasswordAction } from "@/features/auth/actions";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UpdatePasswordPage() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <LockKeyhole className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Choose a new password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter a new password for your Member Portal account.
          </p>
        </div>

        {state && !state.ok && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700"
          >
            {state.error}
          </div>
        )}

        <form action={formAction} className="grid gap-5">
          <PasswordField
            id="password"
            name="password"
            label="New password"
            show={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
          />
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm password"
            show={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((value) => !value)}
          />

          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <ButtonSpinner className="text-white" />
                Updating...
              </span>
            ) : (
              "Update password"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

function PasswordField({
  id,
  name,
  label,
  show,
  onToggle,
}: {
  id: string;
  name: string;
  label: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          required
          autoComplete="new-password"
          className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pr-10 focus:border-cyan-500 focus:ring-cyan-500"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}
