import { describe, expect, it } from "vitest";
import { calculateShraddha, localToInstant } from "../engine";
import { ProviderError } from "../providers/errors";
import { SyntheticProvider } from "../providers/synthetic";
import type { CalculationInput, PanchangProvider, Place } from "../types";

const jalandhar: Place = { id: "1", name: "Jalandhar", state: "23", lat: 31.326, lng: 75.576, utcOffsetMinutes: 330 };

// A made-up regular calendar where Bhadrapada (index 5) Shukla Pratipada begins 2026-09-11 03:00 UTC.
const synth = (shiftHours = 0) =>
  new SyntheticProvider({ epoch: new Date(Date.UTC(2026, 8, 11, 3 + shiftHours, 0)), firstMonth: 5 });

const base: CalculationInput = {
  deathDate: "2024-03-12",
  deathTime: "10:30",
  deathPlace: jalandhar,
  observancePlace: jalandhar,
  year: 2026,
  kind: "pitru-paksha",
  monthSystem: "purnimanta",
};

const set = (primary: PanchangProvider, extra: Partial<{ secondary: PanchangProvider; verified: boolean }> = {}) => ({
  primary,
  secondary: extra.secondary,
  verified: extra.verified ?? true,
  synthetic: true,
});

describe("calculateShraddha", () => {
  it("says so when no provider is configured", async () => {
    expect(await calculateShraddha(base, null)).toEqual({ status: "not-configured" });
  });

  it("does not attempt Varshik Shraddha in v1", async () => {
    expect(await calculateShraddha({ ...base, kind: "varshik" }, set(synth()))).toEqual({
      status: "unsupported",
      reason: "varshik",
    });
  });

  it("finds the same-number Tithi in Pitru Paksha and a day for it", async () => {
    const out = await calculateShraddha(base, set(synth()));
    expect(out.status).toBe("result");
    if (out.status !== "result") return;
    const { result } = out;
    const deathTithi = result.death.tithiCandidates[0];
    expect(result.death.tithiCandidates).toHaveLength(1);
    // Same number in the paksha, in the Krishna half (or Purnima/Amavasya as is).
    const n = ((deathTithi - 1) % 15) + 1;
    expect(result.shraddhaTithi).toBe(deathTithi === 15 || deathTithi === 30 ? deathTithi : 15 + n);
    expect(result.observance.options.length).toBeGreaterThan(0);
    expect(result.rulesVersion).toMatch(/pitru-paksha/);
  });

  it("marks every result preliminary until the provider check is signed off", async () => {
    const out = await calculateShraddha(base, set(synth(), { verified: false }));
    if (out.status !== "result") throw new Error("expected result");
    expect(out.result.confidence).toBe("needs-verification");
    expect(out.result.reasons.map((r) => r.code)).toContain("engine-preliminary");
  });

  it("lists possible Tithis when the time of death is unknown", async () => {
    const out = await calculateShraddha({ ...base, deathTime: undefined }, set(synth()));
    if (out.status !== "result") throw new Error("expected result");
    expect(out.result.death.tithiCandidates.length).toBeGreaterThanOrEqual(2);
    expect(out.result.reasons.map((r) => r.code)).toContain("time-unknown");
    expect(out.result.confidence).toBe("needs-verification");
    // A Shraddha day is worked out for every possible Tithi, not just the first.
    expect(out.result.alternatives).toHaveLength(out.result.death.tithiCandidates.length - 1);
    expect(out.result.alternatives[0].observance.options.length).toBeGreaterThan(0);
  });

  it("flags disagreement between the two sources", async () => {
    // Second source runs 12 hours apart, so the death Tithi differs.
    const out = await calculateShraddha(base, set(synth(), { secondary: synth(12) }));
    if (out.status !== "result") throw new Error("expected result");
    expect(out.result.reasons.map((r) => r.code)).toContain("sources-disagree");
  });

  it("agrees with an identical second source", async () => {
    const out = await calculateShraddha(base, set(synth(), { secondary: synth() }));
    if (out.status !== "result") throw new Error("expected result");
    expect(out.result.reasons.map((r) => r.code)).not.toContain("sources-disagree");
  });

  it("flags a failed second source", async () => {
    const failing: PanchangProvider = {
      id: "x",
      label: "x",
      url: "",
      getDay: async () => {
        throw new ProviderError("unavailable", "down");
      },
    };
    const out = await calculateShraddha(base, set(synth(), { secondary: failing }));
    if (out.status !== "result") throw new Error("expected result");
    expect(out.result.reasons.map((r) => r.code)).toContain("secondary-failed");
    expect(out.result.confidence).toBe("needs-verification");
  });

  it("turns provider failures into a service error, not a crash", async () => {
    const limited: PanchangProvider = {
      id: "x",
      label: "x",
      url: "",
      getDay: async () => {
        throw new ProviderError("rate-limited", "429");
      },
    };
    expect(await calculateShraddha(base, set(limited))).toEqual({ status: "service-error", error: "rate-limited" });
  });

  it("notes the first year after a death", async () => {
    const out = await calculateShraddha({ ...base, deathDate: "2026-02-01" }, set(synth()));
    if (out.status !== "result") throw new Error("expected result");
    expect(out.result.reasons.map((r) => r.code)).toContain("first-year");
  });
});

describe("localToInstant", () => {
  it("converts IST wall time to UTC", () => {
    expect(localToInstant("2024-03-12", "10:30", jalandhar).toISOString()).toBe("2024-03-12T05:00:00.000Z");
  });
});
