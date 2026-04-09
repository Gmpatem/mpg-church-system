"use client";

import Link from "next/link";
import { Church } from "lucide-react";
import { LanguageToggle } from "./LanguageSwitcher";
import { useI18n } from "@/features/i18n";

export function MarketingFooter() {
  const { t, language } = useI18n();

  const labels = {
    product: language === "fr" ? "Produit" : "Product",
    account: language === "fr" ? "Compte" : "Account",
    support: language === "fr" ? "Support" : "Support",
    features: language === "fr" ? "Fonctionnalités" : "Features",
    howItWorks: language === "fr" ? "Comment Ça Marche" : "How It Works",
    forYourRole: language === "fr" ? "Pour Votre Rôle" : "For Your Role",
    signIn: language === "fr" ? "Connexion" : "Sign In",
    getStarted: language === "fr" ? "Commencer" : "Get Started",
    createChurch: language === "fr" ? "Créer une Église" : "Create Church",
    builtForSDA: language === "fr" ? "Conçu pour les églises ASD" : "Built for SDA churches",
    bilingual: language === "fr" ? "Support EN & FR" : "English & French support",
    secureAccess: language === "fr" ? "Accès sécurisé par rôle" : "Secure, role-based access",
    rights: language === "fr" ? "Tous droits réservés." : "All rights reserved.",
    tagline: language === "fr" ? "La gestion d'église simplifiée." : "Church management made simple.",
  };

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950">
                <Church className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">MPG Church</span>
            </Link>
            <p className="text-sm text-slate-500 max-w-xs mb-4">
              {language === "fr" 
                ? "Une plateforme complète de gestion d'église pour les ministères modernes. Membres, personnel et trésorerie au même endroit."
                : "A complete church management platform for modern ministries. Members, staff, and treasury in one place."
              }
            </p>
            <LanguageToggle />
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">{labels.product}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#features" className="text-slate-500 hover:text-slate-900 transition-colors">
                  {labels.features}
                </Link>
              </li>
              <li>
                <Link href="#workflow" className="text-slate-500 hover:text-slate-900 transition-colors">
                  {labels.howItWorks}
                </Link>
              </li>
              <li>
                <Link href="#roles" className="text-slate-500 hover:text-slate-900 transition-colors">
                  {labels.forYourRole}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">{labels.account}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="text-slate-500 hover:text-slate-900 transition-colors">
                  {labels.signIn}
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-slate-500 hover:text-slate-900 transition-colors">
                  {labels.getStarted}
                </Link>
              </li>
              <li>
                <Link href="/create-church" className="text-slate-500 hover:text-slate-900 transition-colors">
                  {labels.createChurch}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">{labels.support}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-slate-500">
                  {labels.builtForSDA}
                </span>
              </li>
              <li>
                <span className="text-slate-500">
                  {labels.bilingual}
                </span>
              </li>
              <li>
                <span className="text-slate-500">
                  {labels.secureAccess}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} MPG Church Systems. {labels.rights}
          </p>
          <p className="text-sm text-slate-400">
            {labels.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
