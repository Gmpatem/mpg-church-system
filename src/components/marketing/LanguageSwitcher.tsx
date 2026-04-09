"use client";

import { useState, useEffect } from "react";
import { useLanguageSwitcher, type Language, updateUserPreferredLanguage } from "@/features/i18n";
import { Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LanguageSwitcherProps {
  variant?: "dropdown" | "buttons" | "minimal";
  className?: string;
  showLabel?: boolean;
  syncWithProfile?: boolean;
}

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export function LanguageSwitcher({
  variant = "dropdown",
  className,
  showLabel = false,
  syncWithProfile = false,
}: LanguageSwitcherProps) {
  const { language, switchLanguage } = useLanguageSwitcher();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageChange = async (newLang: Language) => {
    if (newLang === language || isUpdating) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    
    try {
      // Update client state immediately
      await switchLanguage(newLang);
      
      // Sync with profile if requested
      if (syncWithProfile) {
        await updateUserPreferredLanguage(newLang);
      }
    } catch (error) {
      console.error("Failed to switch language:", error);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  const currentLanguage = languages.find((l) => l.code === language) ?? languages[0];

  // Prevent hydration mismatch by showing placeholder until mounted
  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-1 opacity-50", className)}>
        <span className="px-2 py-1 text-xs font-medium rounded bg-slate-200 text-slate-400">
          EN
        </span>
        <span className="px-2 py-1 text-xs font-medium rounded bg-slate-200 text-slate-400">
          FR
        </span>
      </div>
    );
  }

  // Minimal variant - just text buttons
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isUpdating}
            type="button"
            className={cn(
              "px-2 py-1 text-xs font-medium rounded transition-colors",
              language === lang.code
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
              isUpdating && "opacity-50 cursor-not-allowed"
            )}
            aria-label={`Switch to ${lang.label}`}
            aria-pressed={language === lang.code}
          >
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Button variant - two visible buttons
  if (variant === "buttons") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showLabel && (
          <Globe className="h-4 w-4 text-slate-500" />
        )}
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isUpdating}
            type="button"
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
              language === lang.code
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200",
              isUpdating && "opacity-50 cursor-not-allowed"
            )}
            aria-label={`Switch to ${lang.label}`}
            aria-pressed={language === lang.code}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
            {language === lang.code && <Check className="h-3.5 w-3.5" />}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        type="button"
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors",
          isUpdating && "opacity-50 cursor-not-allowed"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="h-4 w-4" />
        <span>{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.label}</span>
        <svg
          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1"
            role="listbox"
            aria-label="Select language"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                role="option"
                aria-selected={language === lang.code}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-slate-50 transition-colors",
                  language === lang.code && "bg-slate-50 font-medium"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span className={language === lang.code ? "text-slate-900" : "text-slate-700"}>
                    {lang.label}
                  </span>
                </div>
                {language === lang.code && (
                  <Check className="h-4 w-4 text-cyan-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Simple inline language toggle for footers/headers
export function LanguageToggle({ className }: { className?: string }) {
  const { language, switchLanguage } = useLanguageSwitcher();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = async () => {
    const newLang = language === "en" ? "fr" : "en";
    await switchLanguage(newLang);
  };

  if (!mounted) {
    return (
      <button className={cn("text-sm text-slate-400", className)} disabled>
        <Globe className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      type="button"
      className={cn(
        "flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors",
        className
      )}
      aria-label={`Switch to ${language === "en" ? "French" : "English"}`}
    >
      <Globe className="h-4 w-4" />
      <span>{language === "en" ? "Français" : "English"}</span>
    </button>
  );
}
