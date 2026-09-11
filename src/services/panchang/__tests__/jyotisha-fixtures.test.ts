/**
 * Our in-process engine vs. jyotisha (an established open-source Panchanga,
 * Swiss Ephemeris based) for Pitru Paksha across cities and years.
 * Every Pitru Paksha Shraddha Tithi (Purnima + Krishna 1–15) must land on the
 * same civil day — or, where the two engines' few-second differences decide a
 * near-tie, our result must be flagged "close-call" (sent for priest
 * confirmation). Regenerate/extend fixtures with scripts/reference/.
 */
import { describe, expect, it } from "vitest";
import { pitruPakshaDay } from "../engine";
import type { Place } from "../types";
import data from "./fixtures/pitru-paksha-jyotisha.json";

type Case = { city: string; lat: number; lng: number; year: number; days: Record<string, number[]> };
const cases = (data as unknown as { cases: Case[] }).cases;

const flagged: string[] = [];

describe("Pitru Paksha Shraddha days match jyotisha", () => {
  it("has fixtures", () => expect(cases.length).toBeGreaterThanOrEqual(8));

  for (const c of cases) {
    const place: Place = { id: c.city, name: c.city, state: "", lat: c.lat, lng: c.lng, utcOffsetMinutes: 330 };
    // Invert jyotisha's day → tithis map, keeping the Purnima and Krishna paksha (15–30).
    const expected = new Map<number, string>();
    for (const [date, tithis] of Object.entries(c.days)) for (const t of tithis) if (t >= 15) expected.set(t, date);

    it(`${c.city} ${c.year}: all ${expected.size} Shraddha Tithis`, () => {
      expect(expected.size).toBeGreaterThanOrEqual(15);
      const mismatches: string[] = [];
      for (const [tithi, date] of expected) {
        const ours = pitruPakshaDay(tithi, c.year, place);
        const day = ours.observance.options[0].date;
        if (day !== date && !ours.closeCall) mismatches.push(`tithi ${tithi}: jyotisha ${date}, ours ${day}`);
        if (day !== date && ours.closeCall) flagged.push(`${c.city} ${c.year} tithi ${tithi}`);
      }
      expect(mismatches).toEqual([]);
    });
  }

  it("differs only rarely, and then always flagged", () => {
    // Currently 1 of 256: Jalandhar 2028 Krishna Ekadashi (7 min of Aparahna on each day).
    expect(flagged.length).toBeLessThanOrEqual(3);
  });
});
