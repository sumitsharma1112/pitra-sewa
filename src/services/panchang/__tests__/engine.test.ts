import { describe, expect, it } from "vitest";
import { calculateShraddha, deathTithi, localToInstant, pitruPakshaDay } from "../engine";
import { ProviderError } from "../providers/errors";
import type { CalculationInput, DayPanchang, PanchangProvider, Place } from "../types";

const delhi: Place = { id: "1273294", name: "Delhi", state: "07", lat: 28.652, lng: 77.231, utcOffsetMinutes: 330 };

const base: CalculationInput = {
  deathDate: "2025-09-21", // Sarva Pitru Amavasya
  deathTime: "12:00",
  deathPlace: delhi,
  observancePlace: delhi,
  year: 2026,
  kind: "pitru-paksha",
  monthSystem: "purnimanta",
};
const opts = { crossCheck: null, requireReview: false } as const;

/** A fake second source that reports a fixed Tithi for every day. */
const fixedProvider = (index: number): PanchangProvider => ({
  id: "fake",
  label: "Fake",
  url: "",
  getDay: async (date: string): Promise<DayPanchang> => {
    const midnight = Date.parse(`${date}T00:00:00+05:30`);
    return {
      date,
      sunrise: new Date(midnight + 6 * 3600_000),
      sunset: new Date(midnight + 18 * 3600_000),
      tithi: { index, endsAt: new Date(midnight + 30 * 3600_000) },
    };
  },
});

describe("calculateShraddha", () => {
  it("finds Sarva Pitru Amavasya for an Amavasya death", async () => {
    const out = await calculateShraddha(base, opts);
    if (out.status !== "result") throw new Error(out.status);
    expect(out.result.death.tithiCandidates).toEqual([30]);
    expect(out.result.shraddhaTithi).toBe(30);
    expect(out.result.death.month).toEqual({ amanta: "bhadrapada", isAdhik: false });
    // Same day jyotisha gives for Delhi 2026 (see fixtures).
    expect(out.result.observance.options[0].date).toBe(pitruPakshaDay(30, 2026, delhi).observance.options[0].date);
    expect(out.result.sources.engine).toMatch(/astronomy-engine/);
  });

  it("marks a clean case as calculated", async () => {
    const out = await calculateShraddha(base, opts);
    if (out.status !== "result") throw new Error(out.status);
    expect(out.result.confidence).toBe("calculated");
  });

  it("gives a Shraddha day for every possible Tithi when the time is unknown", async () => {
    const out = await calculateShraddha({ ...base, deathTime: undefined }, opts);
    if (out.status !== "result") throw new Error(out.status);
    expect(out.result.death.tithiCandidates.length).toBeGreaterThanOrEqual(2);
    expect(out.result.alternatives).toHaveLength(out.result.death.tithiCandidates.length - 1);
    expect(out.result.confidence).toBe("needs-verification");
  });

  it("flags a death minutes from a Tithi change", async () => {
    // Amavasya of 21 Sep 2025 ended at 19:54 UTC = 01:24 IST on the 22nd.
    const out = await calculateShraddha({ ...base, deathDate: "2025-09-22", deathTime: "01:20" }, opts);
    if (out.status !== "result") throw new Error(out.status);
    expect(out.result.reasons.map((r) => r.code)).toContain("near-boundary");
  });

  it("notes Chaturdashi and Purnima customs", async () => {
    const chaturdashi = await calculateShraddha({ ...base, deathDate: "2025-09-20", deathTime: "12:00" }, opts);
    if (chaturdashi.status !== "result") throw new Error();
    expect(chaturdashi.result.reasons.map((r) => r.code)).toContain("chaturdashi");
    const purnima = await calculateShraddha({ ...base, deathDate: "2025-09-07", deathTime: "12:00" }, opts);
    if (purnima.status !== "result") throw new Error();
    expect(purnima.result.shraddhaTithi).toBe(15);
    expect(purnima.result.reasons.map((r) => r.code)).toContain("purnima");
  });

  it("flags disagreement with an external cross-check", async () => {
    const out = await calculateShraddha(base, { crossCheck: { provider: fixedProvider(5) }, requireReview: false });
    if (out.status !== "result") throw new Error();
    expect(out.result.reasons.map((r) => r.code)).toContain("sources-disagree");
    expect(out.result.confidence).toBe("needs-verification");
  });

  it("accepts an agreeing cross-check", async () => {
    const out = await calculateShraddha(base, { crossCheck: { provider: fixedProvider(30) }, requireReview: false });
    if (out.status !== "result") throw new Error();
    expect(out.result.reasons.map((r) => r.code)).not.toContain("sources-disagree");
    expect(out.result.sources.crossCheck?.label).toBe("Fake");
  });

  it("only notes a failed cross-check", async () => {
    const failing: PanchangProvider = {
      ...fixedProvider(30),
      getDay: async () => {
        throw new ProviderError("unavailable", "down");
      },
    };
    const out = await calculateShraddha(base, { crossCheck: { provider: failing }, requireReview: false });
    if (out.status !== "result") throw new Error();
    expect(out.result.reasons.map((r) => r.code)).toContain("secondary-failed");
    expect(out.result.confidence).toBe("calculated");
  });

  it("can force every result to review", async () => {
    const out = await calculateShraddha(base, { crossCheck: null, requireReview: true });
    if (out.status !== "result") throw new Error();
    expect(out.result.confidence).toBe("needs-verification");
  });

  it("does not attempt Varshik Shraddha yet", async () => {
    expect(await calculateShraddha({ ...base, kind: "varshik" }, opts)).toEqual({ status: "unsupported", reason: "varshik" });
  });

  it("refuses years outside the table", async () => {
    expect(await calculateShraddha({ ...base, year: 2075 }, opts)).toEqual({ status: "unsupported", reason: "out-of-range" });
  });
});

describe("deathTithi", () => {
  it("converts IST wall time", () => {
    expect(localToInstant("2024-03-12", "10:30", delhi).toISOString()).toBe("2024-03-12T05:00:00.000Z");
  });
  it("is exact when the time is known", () => {
    expect(deathTithi({ deathDate: "2025-09-21", deathTime: "12:00", deathPlace: delhi }).candidates).toEqual([30]);
  });
});
