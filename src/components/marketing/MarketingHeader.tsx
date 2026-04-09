"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Church, Menu, X } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "@/features/i18n";

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, language } = useI18n();

  // Navigation labels based on language
  const navLabels = {
    features: language === "fr" ? "Fonctionnalités" : "Features",
    forYou: language === "fr" ? "Pour Vous" : "For You",
    howItWorks: language === "fr" ? "Comment Ça Marche" : "How It Works",
    signIn: language === "fr" ? "Connexion" : "Sign In",
    getStarted: language === "fr" ? "Commencer" : "Get Started",
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950">
            <Church className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">MPG Church</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            {navLabels.features}
          </Link>
          <Link
            href="#roles"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            {navLabels.forYou}
          </Link>
          <Link
            href="#workflow"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            {navLabels.howItWorks}
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher variant="minimal" />
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            {navLabels.signIn}
          </Link>
          <Button asChild className="bg-slate-900 hover:bg-slate-800">
            <Link href="/register">{navLabels.getStarted}</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher variant="minimal" />
          <button
            type="button"
            className="p-2 text-slate-600 hover:text-slate-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="container py-4 space-y-4">
            <Link
              href="#features"
              className="block text-sm font-medium text-slate-600 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              {navLabels.features}
            </Link>
            <Link
              href="#roles"
              className="block text-sm font-medium text-slate-600 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              {navLabels.forYou}
            </Link>
            <Link
              href="#workflow"
              className="block text-sm font-medium text-slate-600 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              {navLabels.howItWorks}
            </Link>
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <Link
                href="/login"
                className="block text-sm font-medium text-slate-600 hover:text-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                {navLabels.signIn}
              </Link>
              <Button asChild className="w-full bg-slate-900 hover:bg-slate-800">
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  {navLabels.getStarted}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
