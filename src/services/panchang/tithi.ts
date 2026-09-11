import { AMANTA_MONTHS, type LunarMonth, type MonthSystem, type Paksha } from "./types";

/** Next Tithi index (30 → 1). */
export const nextTithi = (i: number) => (i % 30) + 1;
export const prevTithi = (i: number) => ((i + 28) % 30) + 1;
/** Forward distance from one Tithi index to another, 0–29. */
export const tithiDistance = (from: number, to: number) => (((to - from) % 30) + 30) % 30;
export const pakshaOf = (i: number): Paksha => (i <= 15 ? "shukla" : "krishna");
/** Position within the paksha, 1–15. */
export const numberInPaksha = (i: number) => ((i - 1) % 15) + 1;

const TITHI_KEYS = [
  ["prat", "pad", "prath", "padyam"],
  ["dvit", "dwit", "vidiya", "dooj", "duj"],
  ["trit", "trut", "teej", "tij"],
  ["chaturth", "chauth", "chavith"],
  ["panch"],
  ["shash", "sasht", "sast", "chhath"],
  ["sapt"],
  ["asht", "atham"],
  ["nav", "nom"],
  ["dash", "dasa", "dasam"],
  ["ekad", "egyaras", "gyaras"],
  ["dvad", "dwad", "baras"],
  ["trayod", "triyod", "trayo", "teras"],
  ["chaturd", "chaudas"],
] as const;

const clean = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

/** Parse a Tithi name (any common spelling) to its number in the paksha, or 15/30 for full/new moon. */
export function parseTithiName(raw: string): { n?: number; fullMoon?: boolean; newMoon?: boolean } {
  const s = clean(raw);
  if (/(purnima|poornima|pournami|purnam|punam)/.test(s)) return { n: 15, fullMoon: true };
  if (/(amavas|amavasya|amavasai)/.test(s)) return { n: 15, newMoon: true };
  // Match whole words by prefix ("Shukla Paksha, Chaturthi" → "chaturthi"), checking the
  // longer compounds first so "chaturdashi" is not read as "chaturthi".
  const words = raw.split(/[^\p{L}]+/u).map(clean).filter(Boolean);
  const order = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
  for (const word of words) {
    for (const i of order) {
      if (TITHI_KEYS[i].some((key) => word.startsWith(key))) return { n: i + 1 };
    }
  }
  return {};
}

export function parsePaksha(raw: string | undefined): Paksha | undefined {
  if (!raw) return undefined;
  const s = clean(raw);
  if (s.includes("shukl") || s.includes("sukl") || s.includes("bright")) return "shukla";
  if (s.includes("krishn") || s.includes("krsn") || s.includes("dark")) return "krishna";
  return undefined;
}

/**
 * Convert a provider's (number, paksha, name) into our 1–30 index.
 * Providers differ: some number Krishna tithis 1–15, others 16–30. The name is
 * used as a cross-check; an inconsistent combination returns undefined.
 */
export function toTithiIndex(input: { number?: number; paksha?: string; name?: string }): number | undefined {
  const parsed = input.name ? parseTithiName(input.name) : {};
  if (parsed.fullMoon) return 15;
  if (parsed.newMoon) return 30;

  let paksha = parsePaksha(input.paksha) ?? (input.name ? parsePaksha(input.name) : undefined);
  let n: number | undefined;
  if (typeof input.number === "number" && Number.isInteger(input.number)) {
    if (input.number >= 16 && input.number <= 30) {
      if (paksha === "shukla") return undefined;
      paksha = "krishna";
      n = input.number - 15;
    } else if (input.number >= 1 && input.number <= 15) {
      n = input.number;
    }
  }
  if (parsed.n !== undefined) {
    if (n !== undefined && n !== parsed.n) return undefined;
    n = parsed.n;
  }
  if (n === undefined || !paksha) return undefined;
  if (n === 15) return paksha === "shukla" ? 15 : 30;
  return paksha === "shukla" ? n : n + 15;
}

const MONTH_KEYS: Record<LunarMonth, string[]> = {
  chaitra: ["chait"],
  vaishakha: ["vais", "vaish", "baisakh", "vaisakh"],
  jyeshtha: ["jyes", "jyesh", "jeth", "jyais"],
  ashadha: ["ashad", "asad", "ashadh", "aashad"],
  shravana: ["shrav", "srav", "sawan", "savan", "sravan"],
  bhadrapada: ["bhadra", "bhadr", "bhado", "bhadon"],
  ashwin: ["ashvin", "ashwin", "asvin", "asvayuj", "ashvayuj", "kwar", "kuar"],
  kartika: ["kart"],
  margashirsha: ["marga", "margash", "agrahay", "aghan", "mrigashir"],
  pausha: ["paus", "posh", "push"],
  magha: ["magh"],
  phalguna: ["phalg", "falg", "phagun"],
};

export function parseMonthName(raw: string | undefined): LunarMonth | undefined {
  if (!raw) return undefined;
  // Ignore qualifier words: "Adhika Shravana", "Nija Ashwin", "Bhadrapada Maas".
  const skip = new Set(["adhik", "adhika", "nija", "mala", "maas", "masa", "month"]);
  const words = raw.split(/[^\p{L}]+/u).map(clean).filter((w) => w && !skip.has(w));
  for (const word of words) {
    for (const month of AMANTA_MONTHS) {
      if (MONTH_KEYS[month].some((k) => word.startsWith(k))) return month;
    }
  }
  return undefined;
}

export const monthIndex = (m: LunarMonth) => AMANTA_MONTHS.indexOf(m);

/**
 * Month name under the chosen system for a day in a given Amanta month.
 * Purnimanta months end at Purnima, so its Krishna paksha carries the next month's name.
 */
export function monthName(amanta: LunarMonth, paksha: Paksha, system: MonthSystem): LunarMonth {
  if (system === "amanta" || paksha === "shukla") return amanta;
  return AMANTA_MONTHS[(monthIndex(amanta) + 1) % 12];
}
