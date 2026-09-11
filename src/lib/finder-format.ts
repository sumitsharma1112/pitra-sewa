/** Display helpers for the Date Finder (client-safe). */
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { monthName, pakshaOf, numberInPaksha } from "@/services/panchang/tithi";
import { AMANTA_MONTHS, type LunarMonth, type MonthSystem } from "@/services/panchang/types";

type FD = Dictionary["finderPage"];

export function tithiLabel(index: number, fd: FD): string {
  if (index === 15) return fd.tithi.purnima;
  if (index === 30) return fd.tithi.amavasya;
  const paksha = pakshaOf(index) === "shukla" ? fd.tithi.shukla : fd.tithi.krishna;
  return `${paksha} ${fd.tithi.names[numberInPaksha(index) - 1]}`;
}

export function monthLabel(
  amanta: LunarMonth,
  isAdhik: boolean,
  tithiIndex: number,
  system: MonthSystem,
  fd: FD,
): string {
  const m = monthName(amanta, pakshaOf(tithiIndex), system);
  const name = fd.months[AMANTA_MONTHS.indexOf(m)];
  return `${isAdhik ? `${fd.adhik} ` : ""}${name} (${fd.systems[system]})`;
}

const intlLocale = (locale: Locale) => (locale === "hi" ? "hi-IN" : "en-IN");

/** yyyy-mm-dd → "गुरुवार, 1 अक्टूबर 2026" / "Thursday, 1 October 2026". */
export function formatDate(date: string, locale: Locale, withWeekday = true): string {
  const [y, m, d] = date.split("-").map(Number);
  const parts = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(Date.UTC(y, m - 1, d)));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const core = `${get("day")} ${get("month")} ${get("year")}`;
  return withWeekday ? `${get("weekday")}, ${core}` : core;
}

const hindiPeriod = (h: number) => (h >= 4 && h < 12 ? "सुबह" : h >= 12 && h < 16 ? "दोपहर" : h >= 16 && h < 20 ? "शाम" : "रात");

/** Wall-clock "HH:MM" → "सुबह 10:30" / "10:30 am". */
export function formatClock(hhmm: string, locale: Locale): string {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = ((h + 11) % 12) + 1;
  const mm = String(m).padStart(2, "0");
  return locale === "hi" ? `${hindiPeriod(h)} ${h12}:${mm}` : `${h12}:${mm} ${h < 12 ? "am" : "pm"}`;
}

/** An instant shown in IST. */
export function formatTime(instant: Date | string, locale: Locale): string {
  const t = new Date(new Date(instant).getTime() + 330 * 60_000);
  return formatClock(`${t.getUTCHours()}:${t.getUTCMinutes()}`, locale);
}

export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""));

/** Honorifics people often type themselves; removed so they are never doubled. */
const PREFIX = /^(?:स्व\.\s*|स्व\s+|स्वर्गीया?\s+|दिवंगत\s+|(?:the\s+)?late\.?\s+|lt\.\s*|swargiya\s+|sw\.\s*)/i;
const SUFFIX = /\s+(?:जी|ji)\.?$/i;

export function plainName(raw: string): string {
  let name = raw.trim().replace(/\s+/g, " ");
  for (let i = 0; i < 3 && PREFIX.test(name); i++) name = name.replace(PREFIX, "");
  return name.replace(SUFFIX, "").trim();
}

/**
 * The departed person's name with respect: "स्व. राम प्रसाद जी" in Hindi;
 * "Late Ram Prasad" (or "the late Ram Prasad" mid-sentence) in English.
 */
export function respectfulName(raw: string | undefined, locale: Locale, inline = false): string {
  const name = raw ? plainName(raw) : "";
  if (!name) return "";
  if (locale === "hi") return `स्व. ${name} जी`;
  return `${inline ? "the late" : "Late"} ${name}`;
}
