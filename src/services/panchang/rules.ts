/**
 * Pure Shraddha rules — no network, fully unit-tested.
 *
 * These encode the *documented* v1 conventions (see docs/PANCHANG_PLAN.md,
 * rules version below). Anything the written rules do not settle is returned
 * as an explicit ambiguity so the UI can ask for a priest's confirmation
 * instead of guessing.
 */
import { nextTithi, numberInPaksha, tithiDistance } from "./tithi";
import type { DayPanchang, ObservanceOption } from "./types";

export const RULES_VERSION = "pitru-paksha-v1 (aparahna-vyapini, jyotisha tie-break)";
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

export interface DayWindow {
  date: string;
  sunrise: Date;
  sunset: Date;
}

export type ObservancePick = {
  kind: "single" | "two-days" | "none";
  /** The chosen day first; for "two-days", the other day second. */
  options: ObservanceOption[];
};

const coverage = (span: { start: Date; end: Date }, day: DayWindow) => {
  const w = aparahna(day);
  const overlap = Math.min(span.end.getTime(), w.end.getTime()) - Math.max(span.start.getTime(), w.start.getTime());
  return Math.max(0, overlap);
};

const option = (day: DayWindow, ms: number): ObservanceOption => ({
  date: day.date,
  sunrise: day.sunrise,
  sunset: day.sunset,
  aparahna: aparahna(day),
  coverageMinutes: Math.round(ms / MINUTE),
});

/**
 * The Shraddha day for a Tithi span ("aparahna-vyapini"), following the rule
 * implemented in jyotisha (MIT, jyotisham/jyotisha — temporal/tithi.py):
 *  - the day whose Aparahna the Tithi covers;
 *  - if it covers the Aparahna of two consecutive days, the day with the
 *    larger covered share (a tie goes to the later day);
 *  - if it covers no Aparahna at all, the day of the next Aparahna after it ends.
 * `days` must be consecutive and include the day before the Tithi starts
 * through the day after it ends.
 */
export function pickObservance(span: { start: Date; end: Date }, days: DayWindow[]): ObservancePick {
  const covered = days
    .map((day) => ({ day, ms: coverage(span, day), len: aparahna(day).end.getTime() - aparahna(day).start.getTime() }))
    .filter((c) => c.ms > 0);

  if (covered.length === 1) return { kind: "single", options: [option(covered[0].day, covered[0].ms)] };
  if (covered.length >= 2) {
    const [a, b] = covered;
    const aWins = a.ms / a.len > b.ms / b.len;
    const [win, lose] = aWins ? [a, b] : [b, a];
    return { kind: "two-days", options: [option(win.day, win.ms), option(lose.day, lose.ms)] };
  }
  const next = days.find((d) => aparahna(d).start >= span.end);
  if (!next) throw new InconsistentDataError("no Aparahna after the Tithi within the given days");
  return { kind: "none", options: [option(next, 0)] };
}

/**
 * True when small timing uncertainties (±3 min in sunrise/sunset, ±1 min in the
 * Tithi change) could move the Shraddha to a different day.
 */
export function isCloseCall(span: { start: Date; end: Date }, days: DayWindow[]): boolean {
  const chosen = pickObservance(span, days).options[0].date;
  const shift = (d: Date, min: number) => new Date(d.getTime() + min * MINUTE);
  for (const dayShift of [-3, 3]) {
    for (const tithiShift of [-1, 1]) {
      const s = { start: shift(span.start, tithiShift), end: shift(span.end, tithiShift) };
      const d = days.map((x) => ({ ...x, sunrise: shift(x.sunrise, dayShift), sunset: shift(x.sunset, -dayShift) }));
      if (pickObservance(s, d).options[0].date !== chosen) return true;
    }
  }
  return false;
}
