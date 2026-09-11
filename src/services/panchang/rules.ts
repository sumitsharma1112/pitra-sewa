/**
 * Pure Shraddha rules — no network, fully unit-tested.
 *
 * These encode the *documented* v1 conventions (see docs/PANCHANG_PLAN.md,
 * rules version below). Anything the written rules do not settle is returned
 * as an explicit ambiguity so the UI can ask for a priest's confirmation
 * instead of guessing.
 */
import { nextTithi, numberInPaksha, prevTithi, tithiDistance } from "./tithi";
import type { DayPanchang, ObservanceOption } from "./types";

export const RULES_VERSION = "pitru-paksha-v1-draft";
/** Results this close to a Tithi change are treated as uncertain. */
export const BOUNDARY_MARGIN_MINUTES = 10;

const MINUTE = 60_000;

export class InconsistentDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InconsistentDataError";
  }
}

export type TithiAtInstant =
  | { kind: "certain"; index: number; minutesFromBoundary: number }
  | { kind: "ambiguous"; candidates: number[]; reason: "kshaya" };

/**
 * The Tithi prevailing at instant `t`, given the Panchang day whose sunrise
 * precedes `t` and the following day. `prev` (optional) lets us measure how
 * close `t` is to the start of the Tithi.
 */
export function tithiAtInstant(
  t: Date,
  day: DayPanchang,
  next: DayPanchang,
  prev?: DayPanchang,
): TithiAtInstant {
  if (t < day.sunrise || t >= next.sunrise) {
    throw new InconsistentDataError("instant is outside the given Panchang day");
  }
  const a = day.tithi.index;
  const end = day.tithi.endsAt;

  if (t < end) {
    const toEnd = (end.getTime() - t.getTime()) / MINUTE;
    let fromStart = Infinity;
    if (prev && nextTithi(prev.tithi.index) === a && prev.tithi.endsAt <= t) {
      fromStart = (t.getTime() - prev.tithi.endsAt.getTime()) / MINUTE;
    }
    return { kind: "certain", index: a, minutesFromBoundary: Math.min(toEnd, fromStart) };
  }

  const b = next.tithi.index;
  const gap = tithiDistance(a, b);
  if (gap === 1) {
    return { kind: "certain", index: b, minutesFromBoundary: (t.getTime() - end.getTime()) / MINUTE };
  }
  if (gap === 2) {
    // A Kshaya Tithi (never at sunrise) sits between a and b; its end time is unknown.
    return { kind: "ambiguous", candidates: [nextTithi(a), b], reason: "kshaya" };
  }
  throw new InconsistentDataError(`unexpected Tithi sequence ${a} → ${b}`);
}

/** Aparahna: the fourth of five equal parts of daytime (sunrise → sunset). */
export function aparahna(day: Pick<DayPanchang, "sunrise" | "sunset">) {
  const start = day.sunrise.getTime();
  const len = day.sunset.getTime() - start;
  return { start: new Date(start + (3 * len) / 5), end: new Date(start + (4 * len) / 5) };
}

/**
 * Which Tithi the Pitru Paksha Shraddha falls on, from the death Tithi.
 * Same number in the paksha, taken in the Krishna paksha of Pitru Paksha.
 * Purnima is observed on Bhadrapada Purnima (index 15) by many families;
 * Amavasya on Sarva Pitru Amavasya (30).
 */
export function pitruPakshaTithi(deathTithi: number): number {
  if (deathTithi === 15) return 15;
  if (deathTithi === 30) return 30;
  return 15 + numberInPaksha(deathTithi);
}

type Span =
  | { kind: "normal"; start: Date; end: Date }
  | { kind: "kshaya"; dayIndex: number }
  | { kind: "incomplete" };

/** Start and end of the target Tithi from consecutive days of sunrise data. */
export function tithiSpan(target: number, days: DayPanchang[]): Span {
  for (let i = 0; i + 1 < days.length; i++) {
    const a = days[i].tithi.index;
    const b = days[i + 1].tithi.index;
    if (tithiDistance(a, b) === 2 && nextTithi(a) === target) return { kind: "kshaya", dayIndex: i };
  }
  const withTarget = days.map((d, i) => (d.tithi.index === target ? i : -1)).filter((i) => i >= 0);
  if (withTarget.length === 0) return { kind: "incomplete" };
  const first = withTarget[0];
  const last = withTarget[withTarget.length - 1];
  if (first === 0) return { kind: "incomplete" }; // cannot see when it started
  const before = days[first - 1];
  if (before.tithi.index !== prevTithi(target)) return { kind: "incomplete" };
  return { kind: "normal", start: before.tithi.endsAt, end: days[last].tithi.endsAt };
}

export type ObservancePick =
  | { kind: "single" | "two-days" | "none"; options: ObservanceOption[] }
  | { kind: "kshaya"; options: ObservanceOption[] }
  | { kind: "incomplete" };

const option = (day: DayPanchang, coverageMinutes: number): ObservanceOption => ({
  date: day.date,
  sunrise: day.sunrise,
  sunset: day.sunset,
  aparahna: aparahna(day),
  coverageMinutes,
});

/**
 * The Shraddha day: the day whose Aparahna the target Tithi covers
 * ("aparahna-vyapini"). One day → settled. Two days, none, or a Kshaya
 * Tithi → returned as such for priest confirmation.
 */
export function pickObservanceDay(target: number, days: DayPanchang[]): ObservancePick {
  const span = tithiSpan(target, days);
  if (span.kind === "incomplete") return { kind: "incomplete" };
  if (span.kind === "kshaya") return { kind: "kshaya", options: [option(days[span.dayIndex], 0)] };

  const covered = days
    .map((day) => {
      const w = aparahna(day);
      const overlap = Math.min(span.end.getTime(), w.end.getTime()) - Math.max(span.start.getTime(), w.start.getTime());
      return option(day, Math.max(0, Math.round(overlap / MINUTE)));
    })
    .filter((o) => o.coverageMinutes > 0);

  if (covered.length === 1) return { kind: "single", options: covered };
  if (covered.length >= 2) return { kind: "two-days", options: covered.slice(0, 2) };
  // Nowhere in Aparahna: offer the day on which the Tithi began, for the priest to decide.
  const startDay = [...days].reverse().find((d) => d.sunrise <= span.start) ?? days[0];
  return { kind: "none", options: [option(startDay, 0)] };
}
