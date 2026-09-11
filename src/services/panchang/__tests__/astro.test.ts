import { describe, expect, it } from "vitest";
import { lunarMonthAt, pitruPaksha, pitruPakshaTithiSpan, sunTimes, tithiIndexAt, tithiSpanAt } from "../astro";
import type { Place } from "../types";

const delhi: Place = { id: "1273294", name: "Delhi", state: "07", lat: 28.652, lng: 77.231, utcOffsetMinutes: 330 };
const ist = (s: string) => new Date(`${s}+05:30`);

describe("astronomy", () => {
  it("finds the Tithi around an instant", () => {
    const span = tithiSpanAt(ist("2025-09-21T12:00:00"));
    expect(span.index).toBe(30); // Sarva Pitru Amavasya
    expect(span.start < ist("2025-09-21T12:00:00") && span.end > ist("2025-09-21T12:00:00")).toBe(true);
    // New moon of 21 Sep 2025 was at 19:54 UTC (partial solar eclipse).
    expect(Math.abs(span.end.getTime() - Date.parse("2025-09-21T19:54:00Z"))).toBeLessThan(3 * 60_000);
  });

  it("gives Delhi sunrise within the usual range", () => {
    const { sunrise, sunset } = sunTimes("2025-09-21", delhi);
    expect(sunrise.toISOString().slice(0, 13)).toBe("2025-09-21T00");
    expect(sunset.getTime() - sunrise.getTime()).toBeGreaterThan(11.5 * 3600_000);
  });

  it("names lunar months, including Adhik Maas", () => {
    expect(lunarMonthAt(ist("2025-09-10T12:00:00"))).toEqual({ amanta: "bhadrapada", isAdhik: false });
    expect(lunarMonthAt(ist("2025-04-20T12:00:00"))).toEqual({ amanta: "chaitra", isAdhik: false });
    // 2026 has an Adhik Jyeshtha (mid-May to mid-June).
    expect(lunarMonthAt(ist("2026-06-01T12:00:00"))).toEqual({ amanta: "jyeshtha", isAdhik: true });
  });

  it("locates Pitru Paksha", () => {
    const pp = pitruPaksha(2025);
    expect(tithiIndexAt(new Date(pp.fullMoon.getTime() + 60_000))).toBe(16);
    const amavasya = pitruPakshaTithiSpan(pp, 30);
    expect(amavasya.end.toISOString().slice(0, 10)).toBe("2025-09-21");
  });
});
