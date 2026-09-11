/**
 * In-process astronomy for the Shraddha engine — no API key, no network.
 *
 * - Sun/Moon positions and events: astronomy-engine (MIT, ±1′ accuracy).
 *   Tithi changes agree with Swiss Ephemeris (via jyotisha) within ~40 s.
 * - Sunrise/sunset: centre of the Sun's disc at the geometric horizon, no
 *   refraction — the same convention as jyotisha (matches to the second).
 * - Lunar month names: from a precomputed table of sidereal (Lahiri) solar
 *   ingresses, 1900–2060 (src/data/sankranti-lahiri.json, generated offline by
 *   scripts/reference/sankranti.py).
 */
import * as A from "astronomy-engine";
import sankrantiData from "@/data/sankranti-lahiri.json";
import { AMANTA_MONTHS, type LunarMonth, type Place } from "./types";

const DAY = 86_400_000;
const INGRESS = (sankrantiData as unknown as { ingress: [number, number][] }).ingress;

export class OutOfRangeError extends Error {
  constructor(message = "date outside the supported range") {
    super(message);
    this.name = "OutOfRangeError";
  }
}

const search = (longitude: number, from: Date, limitDays: number): Date => {
  const t = A.SearchMoonPhase(((longitude % 360) + 360) % 360, from, limitDays);
  if (!t) throw new OutOfRangeError("moon phase search failed");
  return t.date;
};

/** Tithi index 1–30 prevailing at an instant (Moon–Sun elongation / 12°). */
export function tithiIndexAt(t: Date): number {
  return Math.min(30, Math.floor(A.MoonPhase(t) / 12) + 1);
}

/** The Tithi prevailing at `t`, with its start and end. */
export function tithiSpanAt(t: Date): { index: number; start: Date; end: Date } {
  const index = tithiIndexAt(t);
  const start = search((index - 1) * 12, new Date(t.getTime() - 2 * DAY), 3);
  const end = search(index * 12, t, 3);
  return { index, start, end };
}

/** Local midnight (as an instant) of a civil date at a place. */
export function localMidnight(date: string, place: Place): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - place.utcOffsetMinutes * 60_000);
}

/** Civil date (yyyy-mm-dd) of an instant at a place. */
export function localDate(t: Date, place: Place): string {
  return new Date(t.getTime() + place.utcOffsetMinutes * 60_000).toISOString().slice(0, 10);
}

export function sunTimes(date: string, place: Place): { sunrise: Date; sunset: Date } {
  const obs = new A.Observer(place.lat, place.lng, 0);
  const rise = A.SearchAltitude(A.Body.Sun, obs, +1, localMidnight(date, place), 1, 0);
  if (!rise) throw new OutOfRangeError("no sunrise");
  const set = A.SearchAltitude(A.Body.Sun, obs, -1, rise.date, 1, 0);
  if (!set) throw new OutOfRangeError("no sunset");
  return { sunrise: rise.date, sunset: set.date };
}

/** The new moons bracketing `t`: [start, end). */
export function lunation(t: Date): { start: Date; end: Date } {
  let start = search(0, new Date(t.getTime() - 30 * DAY), 31);
  let end = search(0, new Date(start.getTime() + DAY), 31);
  while (end <= t) {
    start = end;
    end = search(0, new Date(start.getTime() + DAY), 31);
  }
  return { start, end };
}

const ingressBetween = (a: Date, b: Date) => INGRESS.filter(([ms]) => ms >= a.getTime() && ms < b.getTime());

/**
 * Amanta lunar month at `t`: named after the solar sign the Sun enters during
 * it (Mesha → Chaitra … Kanya → Bhadrapada). A lunation with no ingress is
 * Adhik and takes the next month's name.
 */
export function lunarMonthAt(t: Date): { amanta: LunarMonth; isAdhik: boolean } {
  if (t.getTime() < INGRESS[0][0] + 40 * DAY || t.getTime() > INGRESS[INGRESS.length - 1][0] - 40 * DAY) {
    throw new OutOfRangeError();
  }
  const { start, end } = lunation(t);
  const inside = ingressBetween(start, end);
  if (inside.length >= 1) return { amanta: AMANTA_MONTHS[inside[0][1]], isAdhik: false };
  const next = INGRESS.find(([ms]) => ms >= end.getTime());
  if (!next) throw new OutOfRangeError();
  return { amanta: AMANTA_MONTHS[next[1]], isAdhik: true };
}

/**
 * Pitru Paksha of a year: the Krishna paksha of (Nija) Amanta Bhadrapada — the
 * lunation containing the Sun's entry into sidereal Kanya.
 */
export function pitruPaksha(year: number): { lunationStart: Date; fullMoon: Date; amavasya: Date; adhikNearby: boolean } {
  const kanya = INGRESS.find(([ms, rashi]) => rashi === 5 && new Date(ms + 330 * 60_000).getUTCFullYear() === year);
  if (!kanya) throw new OutOfRangeError();
  const { start, end } = lunation(new Date(kanya[0]));
  const fullMoon = search(180, start, 30);
  // Flag if the previous lunation was Adhik (Adhik Bhadrapada years).
  const previous = lunation(new Date(start.getTime() - DAY));
  const adhikNearby = ingressBetween(previous.start, previous.end).length === 0;
  return { lunationStart: start, fullMoon, amavasya: end, adhikNearby };
}

/** Start and end of Tithi `index` (15–30) in a given Pitru Paksha. */
export function pitruPakshaTithiSpan(pp: ReturnType<typeof pitruPaksha>, index: number): { start: Date; end: Date } {
  if (index === 15) return { start: search(168, pp.lunationStart, 30), end: pp.fullMoon };
  if (index < 16 || index > 30) throw new RangeError("Pitru Paksha Tithi must be 15–30");
  const start = index === 16 ? pp.fullMoon : search((index - 1) * 12, pp.fullMoon, 16);
  const end = index === 30 ? pp.amavasya : search(index * 12, start, 3);
  return { start, end };
}
