import { describe, expect, it } from "vitest";
import { aparahna, isCloseCall, pickObservance, pitruPakshaTithi, tithiAtInstant, InconsistentDataError } from "../rules";
import type { DayPanchang } from "../types";

// Helper: build a day in IST; times given as "HH:MM" on that date (IST = UTC+5:30).
const ist = (date: string, hhmm: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, h, mi) - 330 * 60_000);
};
const day = (date: string, index: number, endsDate: string, endsTime: string): DayPanchang => ({
  date,
  sunrise: ist(date, "06:00"),
  sunset: ist(date, "18:00"),
  tithi: { index, endsAt: ist(endsDate, endsTime) },
});

describe("tithiAtInstant", () => {
  const d1 = day("2026-09-20", 17, "2026-09-20", "14:00");
  const d2 = day("2026-09-21", 18, "2026-09-21", "13:00");

  it("returns the sunrise Tithi before it ends", () => {
    const r = tithiAtInstant(ist("2026-09-20", "10:00"), d1, d2);
    expect(r).toEqual({ kind: "certain", index: 17, minutesFromBoundary: 240 });
  });
  it("returns the next Tithi after the change", () => {
    const r = tithiAtInstant(ist("2026-09-20", "20:00"), d1, d2);
    expect(r).toMatchObject({ kind: "certain", index: 18 });
  });
  it("reports closeness to the boundary", () => {
    const r = tithiAtInstant(ist("2026-09-20", "13:55"), d1, d2);
    expect(r).toMatchObject({ kind: "certain", index: 17, minutesFromBoundary: 5 });
  });
  it("flags a Kshaya Tithi instead of guessing", () => {
    const d2k = day("2026-09-21", 19, "2026-09-21", "10:00"); // 18 never at sunrise
    const r = tithiAtInstant(ist("2026-09-20", "20:00"), d1, d2k);
    expect(r).toEqual({ kind: "ambiguous", candidates: [18, 19], reason: "kshaya" });
  });
  it("wraps Amavasya → Pratipada", () => {
    const a = day("2026-10-10", 30, "2026-10-10", "09:00");
    const b = day("2026-10-11", 1, "2026-10-11", "08:00");
    expect(tithiAtInstant(ist("2026-10-10", "12:00"), a, b)).toMatchObject({ index: 1 });
  });
  it("rejects an instant outside the day", () => {
    expect(() => tithiAtInstant(ist("2026-09-21", "07:00"), d1, d2)).toThrow(InconsistentDataError);
  });
});

describe("aparahna", () => {
  it("is the 4th fifth of daytime", () => {
    const w = aparahna(day("2026-09-20", 1, "2026-09-20", "12:00"));
    expect(w.start).toEqual(ist("2026-09-20", "13:12"));
    expect(w.end).toEqual(ist("2026-09-20", "15:36"));
  });
});

describe("pitruPakshaTithi", () => {
  it.each([
    [2, 17], // Shukla Dwitiya → Krishna Dwitiya
    [17, 17],
    [14, 29],
    [29, 29],
    [15, 15], // Purnima → Bhadrapada Purnima
    [30, 30], // Amavasya → Sarva Pitru Amavasya
  ])("%i → %i", (death, shraddha) => {
    expect(pitruPakshaTithi(death)).toBe(shraddha);
  });
});

describe("pickObservance (Aparahna rule, jyotisha tie-break)", () => {
  // Days with sunrise 06:00, sunset 18:00 IST → Aparahna 13:12–15:36.
  const days = ["2026-09-19", "2026-09-20", "2026-09-21", "2026-09-22"].map((date) => ({
    date,
    sunrise: ist(date, "06:00"),
    sunset: ist(date, "18:00"),
  }));
  const span = (s: [string, string], e: [string, string]) => ({ start: ist(...s), end: ist(...e) });

  it("takes the one day whose Aparahna the Tithi covers", () => {
    const p = pickObservance(span(["2026-09-20", "09:00"], ["2026-09-21", "11:00"]), days);
    expect(p.kind).toBe("single");
    expect(p.options[0]).toMatchObject({ date: "2026-09-20", coverageMinutes: 144 });
  });

  it("chooses the day with the larger share when two days are touched", () => {
    // Covers 20th 14:00–15:36 (96 min) and 21st 13:12–14:30 (78 min) → 20th.
    const p = pickObservance(span(["2026-09-20", "14:00"], ["2026-09-21", "14:30"]), days);
    expect(p.kind).toBe("two-days");
    expect(p.options.map((o) => o.date)).toEqual(["2026-09-20", "2026-09-21"]);
  });

  it("gives a tie to the later day", () => {
    // 72 min on each day.
    const p = pickObservance(span(["2026-09-20", "14:24"], ["2026-09-21", "14:24"]), days);
    expect(p.options[0].date).toBe("2026-09-21");
  });

  it("uses the next Aparahna when none is covered", () => {
    const p = pickObservance(span(["2026-09-20", "16:00"], ["2026-09-21", "13:00"]), days);
    expect(p).toMatchObject({ kind: "none", options: [{ date: "2026-09-21", coverageMinutes: 0 }] });
  });

  it("flags decisions that a few minutes could flip", () => {
    expect(isCloseCall(span(["2026-09-20", "14:23"], ["2026-09-21", "14:25"]), days)).toBe(true);
    expect(isCloseCall(span(["2026-09-20", "09:00"], ["2026-09-21", "11:00"]), days)).toBe(false);
  });

  it("refuses when the given days do not reach the next Aparahna", () => {
    expect(() => pickObservance(span(["2026-09-22", "16:00"], ["2026-09-23", "13:00"]), days)).toThrow(InconsistentDataError);
  });
});
