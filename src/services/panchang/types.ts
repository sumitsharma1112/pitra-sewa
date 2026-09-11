/**
 * Contract for the Shraddha date engine (implemented in Stage 2–3).
 *
 * The UI and API routes depend only on these types, never on a specific
 * library or vendor, so the underlying Panchang source can be swapped or
 * cross-checked without touching the rest of the app.
 * See docs/PANCHANG_PLAN.md for the reasoning behind each field.
 */

export type MonthSystem = "purnimanta" | "amanta";
export type Paksha = "shukla" | "krishna";

/** What kind of Shraddha date the family is asking for. */
export type ShraddhaKind =
  /** Pitru Paksha (Mahalaya) Shraddha: same Tithi number, within Pitru Paksha. */
  | "pitru-paksha"
  /** Annual death anniversary (Varshik / Barsi): same Tithi, same lunar month. */
  | "varshik";

export interface ObservancePlace {
  label: string;
  latitude: number;
  longitude: number;
  /** IANA zone, e.g. "Asia/Kolkata". Needed for local sunrise and day boundaries. */
  timeZone: string;
}

export interface CalendarConvention {
  id: string; // e.g. "north-purnimanta-lahiri-v1"
  monthSystem: MonthSystem;
  ayanamsha: "lahiri";
  /** Which part of the day decides the Shraddha Tithi (e.g. Aparahna). */
  observanceRule: "aparahna-vyapini";
  /** Version of the written rule set that was reviewed by an Acharya. */
  rulesVersion: string;
}

export interface TithiInfo {
  /** 1–30: 1–15 Shukla Pratipada→Purnima, 16–30 Krishna Pratipada→Amavasya. */
  index: number;
  paksha: Paksha;
  /** Lunar month name under the convention's month system. */
  lunarMonth: string;
  isAdhikMaas: boolean;
  startsAt: Date;
  endsAt: Date;
}

export type CalculationStatus =
  | "calculated" // normal case, rules fully covered
  | "needs-verification" // an edge case (Kshaya/Vriddhi, Adhik Maas, missing time…)
  | "unsupported"; // input outside what the engine can answer honestly

export interface ShraddhaDateResult {
  status: CalculationStatus;
  kind: ShraddhaKind;
  convention: CalendarConvention;
  deathTithi: TithiInfo;
  /** Local calendar date of observance, ISO yyyy-mm-dd, if one could be determined. */
  observanceDate?: string;
  /** Plain-language reasons shown to the family when status is not "calculated". */
  notes: string[];
  engine: { name: string; version: string };
}

/** Low-level astronomy source (ephemeris or vetted API). */
export interface PanchangProvider {
  readonly name: string;
  readonly version: string;
  tithiAt(instant: Date, place: ObservancePlace, convention: CalendarConvention): Promise<TithiInfo>;
  sunTimes(localDate: string, place: ObservancePlace): Promise<{ sunrise: Date; sunset: Date }>;
}
