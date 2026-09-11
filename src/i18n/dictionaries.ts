import type { Locale } from "./config";
import type hi from "./dictionaries/hi.json";

/**
 * Server-only dictionary loader (Next.js i18n guide pattern).
 * The Hindi file is the source of truth for the shape; TypeScript fails the
 * build if the English file is missing a key.
 */
export type Dictionary = typeof hi;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  hi: () => import("./dictionaries/hi.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

export const getDictionary = (locale: Locale) => dictionaries[locale]();
