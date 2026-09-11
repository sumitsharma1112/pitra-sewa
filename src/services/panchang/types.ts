/**
 * Shared types for the Shraddha date engine.
 *
 * Tithi index convention used everywhere in this codebase:
 *   1–15  = Shukla Pratipada … Purnima (15)
 *   16–30 = Krishna Pratipada … Amavasya (30)
 */

export const AMANTA_MONTHS = [
  "chaitra",
  "vaishakha",
  "jyeshtha",
  "ashadha",
  "shravana",
  "bhadrapada",
  "ashwin",
  "kartika",
  "margashirsha",
  "pausha",
  "magha",
  "phalguna",
] as const;
export type LunarMonth = (typeof AMANTA_MONTHS)[number];

export type MonthSystem = "purnimanta" | "amanta";
export type Paksha = "shukla" | "krishna";

/** Where something happened or will happen. v1 covers India only (IST, no DST). */
export interface Place {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  /** Minutes east of UTC. India: 330. */
  utcOffsetMinutes: number;
}

/** One civil day of Panchang at a place, as reported by a provider. */
export interface DayPanchang {
  /** Local civil date, yyyy-mm-dd. */
  date: string;
  sunrise: Date;
  sunset: Date;
  /** The Tithi prevailing at sunrise, and when it ends. */
  tithi: { index: number; endsAt: Date };
  /** Amanta lunar month at sunrise, when the provider reports it. */
  month?: { amanta: LunarMonth; isAdhik: boolean };
}

export interface PanchangProvider {
  readonly id: string;
  /** Shown to families as the data source (attribution). */
  readonly label: string;
  readonly url: string;
  getDay(date: string, place: Place): Promise<DayPanchang>;
}

export type ShraddhaKind = "pitru-paksha" | "varshik";

/** Why a result needs a priest's confirmation. Each code has a translated explanation. */
export type ReasonCode =
  | "time-unknown"
  | "near-boundary"
  | "kshaya-death"
  | "sources-disagree"
  | "secondary-failed"
  | "two-days"
  | "no-aparahna"
  | "kshaya-shraddha"
  | "adhik-maas"
  | "purnima"
  | "chaturdashi"
  | "first-year"
  | "old-clock"
  | "engine-preliminary";

export interface CalculationInput {
  deathDate: string; // yyyy-mm-dd, local to deathPlace
  deathTime?: string; // HH:MM, local; undefined when unknown
  deathPlace: Place;
  observancePlace: Place;
  year: number;
  kind: ShraddhaKind;
  monthSystem: MonthSystem;
}

export interface ObservanceOption {
  date: string;
  sunrise: Date;
  sunset: Date;
  aparahna: { start: Date; end: Date };
  /** Minutes of the Aparahna window covered by the Shraddha Tithi. */
  coverageMinutes: number;
}

export interface Observance {
  kind: "single" | "two-days" | "none" | "kshaya";
  options: ObservanceOption[];
}

export interface ShraddhaResult {
  confidence: "calculated" | "needs-verification";
  reasons: { code: ReasonCode; minutes?: number }[];
  death: {
    /** One Tithi, or two candidates when it cannot be settled. */
    tithiCandidates: number[];
    month?: { amanta: LunarMonth; isAdhik: boolean };
  };
  /** The Tithi on which the Shraddha falls (index 1–30). */
  shraddhaTithi: number;
  observance: Observance;
  /** When the death Tithi is uncertain: the Shraddha for each other possible Tithi. */
  alternatives: { deathTithi: number; shraddhaTithi: number; observance: Observance }[];
  sources: { primary: { label: string; url: string }; secondary?: { label: string; url: string } };
  rulesVersion: string;
}

export type CalculationOutcome =
  | { status: "result"; result: ShraddhaResult }
  | { status: "not-configured" }
  | { status: "service-error"; error: ProviderErrorKind }
  | { status: "unsupported"; reason: "varshik" | "not-found" };

export type ProviderErrorKind = "rate-limited" | "timeout" | "unavailable" | "invalid-response" | "auth";
