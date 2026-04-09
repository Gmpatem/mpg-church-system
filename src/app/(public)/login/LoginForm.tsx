"use client";

import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirect} />

      {state && !state.ok && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
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

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? (
          <span className="inline-flex items-center justify-center gap-2">
            <ButtonSpinner />
            Signing in...
          </span>
        ) : "Login"}
      </button>

      <div className="text-sm text-gray-600">
        <Link href="/" className="underline hover:text-gray-800">
          Back to home
        </Link>
      </div>
    </form>
  );
}
