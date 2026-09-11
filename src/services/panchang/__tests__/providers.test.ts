import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderError } from "../providers/errors";
import { NavamshaProvider } from "../providers/navamsha";
import { ShubhProvider } from "../providers/shubh";
import type { Place } from "../types";

const delhi: Place = { id: "1273294", name: "Delhi", state: "07", lat: 28.652, lng: 77.231, utcOffsetMinutes: 330 };

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("ShubhProvider", () => {
  // Shape from the published example on shubh.live/developers, plus sunset.
  const documented = {
    date: "2026-06-26",
    tz: "Asia/Kolkata",
    sunrise: "2026-06-26T05:25:00+05:30",
    sunset: "2026-06-26T19:22:00+05:30",
    tithi: { name: "Dwadashi", number: 12, paksha: "Shukla", endsAt: "2026-06-26T22:23:20+05:30" },
    lunarMonth: { amanta: "Jyeshtha", isAdhika: false },
  };

  it("maps the documented response and sends the key only as a header", async () => {
    const fetchMock = vi.fn(async () => respond(documented));
    vi.stubGlobal("fetch", fetchMock);
    const day = await new ShubhProvider("sk_live_secret").getDay("2026-06-26", delhi);

    expect(day.tithi.index).toBe(12);
    expect(day.tithi.endsAt.toISOString()).toBe("2026-06-26T16:53:20.000Z");
    expect(day.month).toEqual({ amanta: "jyeshtha", isAdhik: false });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain("sk_live_secret");
    expect((init.headers as Record<string, string>)["X-API-Key"]).toBe("sk_live_secret");
  });

  it("falls back to /sun when the day has no sunset", async () => {
    const { sunset, ...noSunset } = documented;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respond(noSunset))
      .mockResolvedValueOnce(respond({ sunrise: documented.sunrise, sunset }));
    vi.stubGlobal("fetch", fetchMock);
    const day = await new ShubhProvider("k").getDay("2026-06-26", delhi);
    expect(day.sunset.toISOString()).toBe(new Date(sunset).toISOString());
    expect(String(fetchMock.mock.calls[1][0])).toContain("/sun?");
  });

  it("reports rate limiting and auth failures distinctly", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respond({}, 429)));
    await expect(new ShubhProvider("k").getDay("2026-06-26", delhi)).rejects.toMatchObject({ kind: "rate-limited" });
    vi.stubGlobal("fetch", vi.fn(async () => respond({}, 401)));
    await expect(new ShubhProvider("k").getDay("2026-06-26", delhi)).rejects.toMatchObject({ kind: "auth" });
  });

  it("refuses a changed response shape", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respond({ hello: "world" })));
    await expect(new ShubhProvider("k").getDay("2026-06-26", delhi)).rejects.toBeInstanceOf(ProviderError);
  });
});

describe("NavamshaProvider", () => {
  it("maps the documented daily response", async () => {
    const fetchMock = vi.fn(async () =>
      respond({
        date: "2026-06-19",
        tithi: { name: "Shukla Paksha, Chaturthi", ends_at: "2026-06-19T14:22:00+05:30" },
        sunrise: "2026-06-19T06:02:00+05:30",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const day = await new NavamshaProvider("k").getDay("2026-06-19", delhi);
    expect(day.tithi.index).toBe(4);
    const url = String((fetchMock.mock.calls[0] as unknown as [string])[0]);
    expect(url).toContain("timezone=5.5");
    expect(url).toContain("latitude=28.652");
  });
});
