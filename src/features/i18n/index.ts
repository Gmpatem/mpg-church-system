export { I18nProvider, useI18n, useLanguageSwitcher } from "./I18nProvider";
export type { Translations, Language } from "./I18nProvider";
export { en } from "./en";
export { fr } from "./fr";
export { updateUserPreferredLanguage } from "./actions";

// Note: Server-only utilities (resolveLocale, getChurchDefaultLanguage) 
// must be imported directly from "@/features/i18n/locale"
