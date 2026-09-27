import { describe, expect, it } from "vitest";
import { birthChart, varshphalChart } from "../kundli";
import type { Place } from "../types";

const delhi: Place = { id: "delhi", name: "Delhi", state: "07", lat: 28.6139, lng: 77.209, utcOffsetMinutes: 330 };
const mumbai: Place = { id: "mumbai", name: "Mumbai", state: "16", lat: 19.076, lng: 72.8777, utcOffsetMinutes: 330 };
const chennai: Place = { id: "chennai", name: "Chennai", state: "20", lat: 13.0827, lng: 80.2707, utcOffsetMinutes: 330 };

const ist = (y: number, mo: number, d: number, h: number, mi: number) =>
  new Date(Date.UTC(y, mo - 1, d, h, mi) - 330 * 60_000);

/** Angular distance in degrees, shortest way around the circle. */
const angleDiff = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

/** Reference values from Swiss Ephemeris, Lahiri ayanamsha (scripts/reference/kundli_swisseph.py). */
function expectClose(actual: number, expected: number, toleranceDeg: number) {
  expect(angleDiff(actual, expected)).toBeLessThan(toleranceDeg);
}

describe("kundli: birth chart, verified against Swiss Ephemeris (Lahiri)", () => {
  it("Delhi, 15 May 1990, 14:30 IST", () => {
    const chart = birthChart(ist(1990, 5, 15, 14, 30), delhi);
    expect(chart.ayanamsha).toBeCloseTo(23.722546, 3);
    expectClose(chart.ascendant.siderealLongitude, 151.904621, 0.02);
    const expected: Record<string, number> = {
      sun: 30.549786,
      moon: 271.893544,
      mars: 324.51521,
      mercury: 14.302288,
      jupiter: 75.792251,
      venus: 348.949948,
      saturn: 271.525743,
      rahu: 287.619963,
    };
    for (const [graha, lon] of Object.entries(expected)) {
      const p = chart.positions.find((x) => x.graha === graha)!;
      expectClose(p.siderealLongitude, lon, 0.02);
    }
    const ketu = chart.positions.find((x) => x.graha === "ketu")!;
    expectClose(ketu.siderealLongitude, (287.619963 + 180) % 360, 0.02);
    expect(ketu.retrograde).toBe(true);
    expect(chart.positions.find((x) => x.graha === "sun")!.retrograde).toBe(false);
  });

  it("Mumbai, 1 Jan 2000, 06:00 IST", () => {
    const chart = birthChart(ist(2000, 1, 1, 6, 0), mumbai);
    expectClose(chart.ascendant.siderealLongitude, 238.641568, 0.02);
    expectClose(chart.positions.find((x) => x.graha === "sun")!.siderealLongitude, 256.027249, 0.02);
    expectClose(chart.positions.find((x) => x.graha === "moon")!.siderealLongitude, 193.69227, 0.02);
  });

  it("Chennai, 3 Nov 1985, 23:45 IST (night birth)", () => {
    const chart = birthChart(ist(1985, 11, 3, 23, 45), chennai);
    expectClose(chart.ascendant.siderealLongitude, 105.220908, 0.02);
    expectClose(chart.positions.find((x) => x.graha === "saturn")!.siderealLongitude, 214.778739, 0.02);
  });

  it("places each graha in a house counted whole-sign from the Lagna", () => {
    const chart = birthChart(ist(1990, 5, 15, 14, 30), delhi);
    const sun = chart.positions.find((x) => x.graha === "sun")!;
    // Sun's rashi is Vrishabha (index 1); Lagna is Kanya (index 5) for this chart.
    expect(chart.ascendant.rashi).toBe("kanya");
    expect(sun.rashi).toBe("vrishabha");
    expect(sun.house).toBe(9); // (1 - 5 + 12) % 12 + 1
  });
});

describe("kundli: Varshphal (sidereal solar return)", () => {
  it("Delhi 1990 birth, Varshphal 2026 matches Swiss Ephemeris' own solar-return search", () => {
    const chart = varshphalChart(ist(1990, 5, 15, 14, 30), delhi, 2026);
    // The Sun is, by construction, back at its exact natal sidereal degree.
    expectClose(chart.positions.find((x) => x.graha === "sun")!.siderealLongitude, 30.549786, 0.02);
    // Slow movers match tightly; the Ascendant amplifies the small Sun-model
    // difference between astronomy-engine and Swiss Ephemeris into a wider
    // (still sub-degree) margin -- see BOUNDARY_MARGIN_DEG in kundli.ts.
    expectClose(chart.positions.find((x) => x.graha === "saturn")!.siderealLongitude, 346.488169, 0.02);
    expectClose(chart.ascendant.siderealLongitude, 223.722999, 0.6);
  });

  it("rolls the instant forward to the requested year even from a birth-year anchor", () => {
    const chart = varshphalChart(ist(1990, 5, 15, 14, 30), delhi, 2026);
    expect(chart.instant.getUTCFullYear()).toBe(2026);
  });
});
