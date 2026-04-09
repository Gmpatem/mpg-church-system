"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { completeFirstLoginPasswordChangeAction } from "../actions";

export function FirstLoginPasswordGate({ churchSlug }: { churchSlug: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await completeFirstLoginPasswordChangeAction({
      churchSlug,
      password,
    });

    if (!result.ok) {
      setError(result.error || "Failed to update password.");
      setLoading(false);
      return;
    }

    router.push(`/my/${churchSlug}?tab=overview&welcome=1`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-3xl border bg-card p-6 shadow-sm"
      >
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">First login security</p>
          <h1 className="text-2xl font-semibold text-foreground">
            Secure your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Before continuing into your member portal, confirm your password for security.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
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
          <Label htmlFor="confirm-password">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-700 dark:text-rose-300">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <ButtonSpinner />
              Saving...
            </span>
          ) : "Save and continue"}
        </button>
      </form>
    </div>
  );
}
