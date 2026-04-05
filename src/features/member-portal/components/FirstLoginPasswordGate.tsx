"use client";

import { useState } from "react";
import { completeFirstLoginPasswordChangeAction } from "../actions";

export function FirstLoginPasswordGate({ churchSlug }: { churchSlug: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    window.location.href = `/my/${churchSlug}?tab=overview&welcome=1`;
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
          <label className="text-sm font-medium" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            placeholder="Enter new password"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="confirm-password">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            placeholder="Confirm password"
          />
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
          {loading ? "Saving..." : "Save and continue"}
        </button>
      </form>
    </div>
  );
}
