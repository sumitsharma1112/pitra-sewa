import { describe, expect, it } from "vitest";
import { aparahna, pickObservanceDay, pitruPakshaTithi, tithiAtInstant, InconsistentDataError } from "../rules";
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

describe("pickObservanceDay", () => {
  it("settles a Tithi that covers Aparahna on one day only", () => {
    // Target 18 runs 20th 09:00 → 21st 11:00: covers 20th Aparahna fully, not the 21st.
    const days = [
      day("2026-09-19", 16, "2026-09-19", "08:00"),
      day("2026-09-20", 17, "2026-09-20", "09:00"),
      day("2026-09-21", 18, "2026-09-21", "11:00"),
      day("2026-09-22", 19, "2026-09-22", "12:00"),
    ];
    const p = pickObservanceDay(18, days);
    expect(p.kind).toBe("single");
    if (p.kind !== "incomplete") expect(p.options[0]).toMatchObject({ date: "2026-09-20", coverageMinutes: 144 });
  });

  it("returns both days when it touches two Aparahnas", () => {
    // Target 18 runs 20th 14:00 → 21st 14:00.
    const days = [
      day("2026-09-20", 17, "2026-09-20", "14:00"),
      day("2026-09-21", 18, "2026-09-21", "14:00"),
      day("2026-09-22", 19, "2026-09-22", "13:00"),
    ];
    const p = pickObservanceDay(18, days);
    expect(p.kind).toBe("two-days");
    if (p.kind !== "incomplete") expect(p.options.map((o) => o.date)).toEqual(["2026-09-20", "2026-09-21"]);
  });

  it("reports when no Aparahna is covered", () => {
    // Target 18 runs 20th 16:00 → 21st 13:00 (between the two windows).
    const days = [
      day("2026-09-20", 17, "2026-09-20", "16:00"),
      day("2026-09-21", 18, "2026-09-21", "13:00"),
      day("2026-09-22", 19, "2026-09-22", "12:00"),
    ];
    expect(pickObservanceDay(18, days).kind).toBe("none");
  });

  it("detects a Kshaya Shraddha Tithi", () => {
    const days = [
      day("2026-09-20", 17, "2026-09-20", "08:00"),
      day("2026-09-21", 17, "2026-09-21", "07:00"), // hypothetical run where 18 is skipped
      day("2026-09-22", 19, "2026-09-22", "09:00"),
    ];
    const p = pickObservanceDay(18, days);
    expect(p.kind).toBe("kshaya");
  });

  it("asks for more data when the start is not visible", () => {
    const days = [day("2026-09-21", 18, "2026-09-21", "14:00"), day("2026-09-22", 19, "2026-09-22", "13:00")];
    expect(pickObservanceDay(18, days).kind).toBe("incomplete");
  });
});
