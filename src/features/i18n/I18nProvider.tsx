"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { en } from "./en";
import { fr } from "./fr";

export type Language = "en" | "fr";
export type Translations = typeof en;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isLoading: boolean;
}

const translations = { en, fr };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Browser language detection
function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return "en";
  
  const browserLang = navigator.language?.toLowerCase() ?? "";
  
  // Check for French variants
  if (browserLang.startsWith("fr")) return "fr";
  
  // Default to English
  return "en";
}

// Get initial language from localStorage or browser
function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  
  const stored = localStorage.getItem("preferred_language") as Language | null;
  if (stored && (stored === "en" || stored === "fr")) {
    return stored;
  }
  
  return detectBrowserLanguage();
}

export function I18nProvider({
  children,
  defaultLanguage = "en",
  userPreferredLanguage,
  churchDefaultLanguage,
}: {
  children: React.ReactNode;
  defaultLanguage?: Language;
  userPreferredLanguage?: Language | null;
  churchDefaultLanguage?: Language | null;
}) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language on client side
  useEffect(() => {
    // Priority: user profile > localStorage > church default > browser > default
    let resolvedLanguage: Language = defaultLanguage;
    
    if (userPreferredLanguage && (userPreferredLanguage === "en" || userPreferredLanguage === "fr")) {
      resolvedLanguage = userPreferredLanguage;
    } else {
      const stored = localStorage.getItem("preferred_language") as Language | null;
      if (stored && (stored === "en" || stored === "fr")) {
        resolvedLanguage = stored;
      } else if (churchDefaultLanguage && (churchDefaultLanguage === "en" || churchDefaultLanguage === "fr")) {
        resolvedLanguage = churchDefaultLanguage;
      } else {
        resolvedLanguage = detectBrowserLanguage();
      }
    }
    
    setLanguageState(resolvedLanguage);
    setIsLoading(false);
  }, [defaultLanguage, userPreferredLanguage, churchDefaultLanguage]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_language", lang);
      // Also set a cookie for server-side awareness
      document.cookie = `preferred_language=${lang}; path=/; max-age=31536000`; // 1 year
    }
  }, []);

  const value = {
    language,
    setLanguage,
    t: translations[language],
    isLoading,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

// Hook for language switching with profile sync
export function useLanguageSwitcher() {
  const { language, setLanguage } = useI18n();
  
  const switchLanguage = useCallback((newLang: Language) => {
    setLanguage(newLang);
    
    // Note: Profile sync is handled separately via Server Action
    // This keeps the client-side hook lightweight
    return Promise.resolve();
  }, [setLanguage]);
  
  return {
    language,
    switchLanguage,
    isEnglish: language === "en",
    isFrench: language === "fr",
  };
}
