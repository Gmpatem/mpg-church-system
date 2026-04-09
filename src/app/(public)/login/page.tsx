"use client";

import Link from "next/link";
import { Church } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { useI18n } from "@/features/i18n";

export default function LoginPage() {
  const { language } = useI18n();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const checkEmail = searchParams.get("check_email") === "1";

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
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="container flex h-16 items-center justify-between">
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
      <main className="flex-1 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50" />
        
        <div className="relative w-full max-w-md px-4 py-12">
          {/* Login Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
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
            <LoginForm />

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
                  className="font-medium text-cyan-700 hover:text-cyan-800 transition-colors"
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

      <MarketingFooter />
    </div>
  );
}
