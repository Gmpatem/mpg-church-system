"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Church } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { useI18n } from "@/features/i18n";

function LoginPageContent() {
  const { language } = useI18n();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const checkEmail = searchParams.get("check_email") === "1";
  const redirect = searchParams.get("redirect") ?? "";

  const isFr = language === "fr";

  const labels = {
    backToHome: isFr ? "Retour à l'accueil" : "Back to home",
    signInTitle: isFr ? "Connectez-vous à votre espace" : "Sign in to your church workspace",
    signInSubtitle: isFr ? "Entrez vos identifiants pour continuer" : "Enter your email and password to continue",
    registrationSuccess: isFr ? "Inscription réussie" : "Registration successful",
    checkEmail: isFr ? "Vérifiez votre email avant de vous connecter." : "Check your email before signing in if confirmation is required.",
    noAccount: isFr ? "Vous n'avez pas de compte ?" : "Don't have an account?",
    createAccount: isFr ? "Créer un compte" : "Create one",
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <Church className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">MPG Church</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="minimal" />
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
            >
              {labels.backToHome}
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="mobile-fade-up rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8">
            {/* Header */}
            <div className="mb-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 shadow-sm">
                <Church className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {labels.signInTitle}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {labels.signInSubtitle}
              </p>
            </div>

            {/* Registration success banner */}
            {registered && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium">{labels.registrationSuccess}</p>
                    {checkEmail && <p className="mt-1 text-emerald-700">{labels.checkEmail}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <LoginForm redirect={redirect} />

            {/* Register link */}
            <div className="mt-6 border-t border-slate-200 pt-4 text-center">
              <p className="text-sm text-slate-600">
                {labels.noAccount}{" "}
                <Link
                  href="/register"
                  className="mobile-touch-feedback font-medium text-cyan-700 transition-colors hover:text-cyan-800"
                >
                  {labels.createAccount}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="space-y-3">
            <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-60 animate-pulse rounded bg-slate-100" />
            <div className="h-11 animate-pulse rounded bg-slate-100" />
            <div className="h-11 animate-pulse rounded bg-slate-100" />
            <div className="h-11 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
