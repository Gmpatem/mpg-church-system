"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { useI18n } from "@/features/i18n";

export function LoginForm({ redirect = "" }: { redirect?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const { language } = useI18n();

  const isFr = language === "fr";

  const labels = {
    email: isFr ? "Email" : "Email",
    emailPlaceholder: isFr ? "vous@exemple.com" : "you@example.com",
    password: isFr ? "Mot de passe" : "Password",
    passwordPlaceholder: isFr ? "Entrez votre mot de passe" : "Enter your password",
    signIn: isFr ? "Se connecter" : "Sign In",
    signingIn: isFr ? "Connexion..." : "Signing in...",
  };

  return (
    <form action={formAction} className="space-y-4 sm:space-y-5">
      <input type="hidden" name="redirect" value={redirect} />

      {/* Error message */}
      {state && !state.ok && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {state.error}
          </div>
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-slate-700">
          {labels.email}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={labels.emailPlaceholder}
          className="h-12 rounded-xl border-slate-200 focus:border-cyan-500 focus:ring-cyan-500"
        />
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-slate-700">
          {labels.password}
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder={labels.passwordPlaceholder}
            className="h-12 rounded-xl border-slate-200 pr-10 focus:border-cyan-500 focus:ring-cyan-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? (isFr ? "Masquer le mot de passe" : "Hide password") : (isFr ? "Afficher le mot de passe" : "Show password")}
            className="mobile-touch-feedback absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isPending}
        className="mobile-touch-feedback flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-900 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <ButtonSpinner className="text-white" />
            {labels.signingIn}
          </span>
        ) : (
          labels.signIn
        )}
      </button>
    </form>
  );
}
