/**
 * Locale configuration shared by the proxy (edge) and the app.
 * Keep this file free of Node-only imports so the proxy can use it.
 */
export const locales = ["hi", "en"] as const;
export type Locale = (typeof locales)[number];

/** Hindi-first: the primary audience reads Devanagari, even when the phone UI is set to English. */
export const defaultLocale: Locale = "hi";

/** Remembers an explicit choice made with the language switcher. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const hasLocale = (value: string | undefined): value is Locale =>
  !!value && (locales as readonly string[]).includes(value);

export const localeMeta: Record<Locale, { label: string; htmlLang: string; ogLocale: string }> = {
  hi: { label: "हिंदी", htmlLang: "hi", ogLocale: "hi_IN" },
  en: { label: "English", htmlLang: "en", ogLocale: "en_IN" },
};
