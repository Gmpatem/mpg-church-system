"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Church } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
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
    secureNote: isFr ? "Connexion sécurisée par cryptage standard" : "Secure sign-in powered by industry-standard encryption",
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950">
              <Church className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">MPG Church</span>
          </Link>
          <div className="flex items-center gap-4">
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
      <main className="relative flex flex-1 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/70 to-slate-50" />

        <div className="relative mx-auto flex w-full max-w-md flex-col justify-end px-4 pb-8 pt-6 sm:justify-center sm:py-12">
          {/* Login Card */}
          <div className="mobile-fade-up rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 mb-4">
                <Church className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {labels.signInTitle}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {labels.signInSubtitle}
              </p>
            </div>

            {/* Registration success banner */}
            {registered && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
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

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-400">{isFr ? "ou" : "or"}</span>
              </div>
            </div>

            {/* Register link */}
            <div className="text-center">
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

          {/* Trust note */}
          <p className="mt-6 text-center text-xs text-slate-400">
            {labels.secureNote}
          </p>
        </div>
      </main>

      <div className="hidden md:block">
        <MarketingFooter />
      </div>
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
