/**
 * LIVE accuracy check against the real Panchang API. Skipped unless a key is set:
 *
 *   SHUBH_API_KEY=… npx vitest run src/services/panchang/__tests__/live-fixtures.test.ts
 *
 * Expected dates are from widely published Pitru Paksha calendars for New Delhi.
 * Before setting PANCHANG_RESULTS_VERIFIED=true in Vercel, an Acharya should
 * review this list against a printed Panchang and extend it (see docs/PANCHANG_PLAN.md).
 */
import { describe, expect, it, vi } from "vitest";
import { ShubhProvider } from "../providers/shubh";
import { pickObservanceDay } from "../rules";
import { seekTithi } from "../seek";
import type { Place } from "../types";

const key = process.env.SHUBH_API_KEY;
const newDelhi: Place = { id: "1261481", name: "New Delhi", state: "07", lat: 28.636, lng: 77.224, utcOffsetMinutes: 330 };

const fixtures = [
  { year: 2023, tithi: 30, label: "Sarva Pitru Amavasya", expected: "2023-10-14" },
  { year: 2024, tithi: 30, label: "Sarva Pitru Amavasya", expected: "2024-10-02" },
  { year: 2025, tithi: 30, label: "Sarva Pitru Amavasya", expected: "2025-09-21" },
  { year: 2023, tithi: 15, label: "Purnima Shraddha", expected: "2023-09-29" },
  { year: 2024, tithi: 15, label: "Purnima Shraddha", expected: "2024-09-17" },
  { year: 2025, tithi: 15, label: "Purnima Shraddha", expected: "2025-09-07" },
];

describe.skipIf(!key)("live Pitru Paksha fixtures (ShubhAI)", () => {
  // Node's fetch does not implement Next.js cache options; strip them for this run.
  const realFetch = globalThis.fetch;
  vi.stubGlobal("fetch", (url: string, init: RequestInit & { next?: unknown } = {}) => {
    const { next, cache, ...rest } = init;
    void next;
    void cache;
    return realFetch(url, rest);
  });
  const provider = new ShubhProvider(key ?? "");

  it.each(fixtures)("$year $label → $expected", async ({ year, tithi, expected }) => {
    const found = await seekTithi(provider, newDelhi, `${year}-09-15`, "bhadrapada", tithi);
    const pick = pickObservanceDay(tithi, found.days);
    expect(pick.kind).not.toBe("incomplete");
    if (pick.kind === "incomplete") return;
    expect(pick.options.map((o) => o.date)).toContain(expected);
  }, 60_000);
});
