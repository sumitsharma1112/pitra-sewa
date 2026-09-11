/**
 * ShubhAI Panchang API (https://shubh.live/developers).
 *
 * Documented: GET /api/v1/panchang?lat&lon&date with header X-API-Key, returning
 * sunrise, tithi {name, number, paksha, endsAt}, lunarMonth {amanta, isAdhika}.
 * Times are ISO-8601 with the location's offset. Free for personal and
 * commercial use; attribution "Powered by ShubhAI (shubh.live)".
 *
 * Fields not shown in the published example (e.g. sunset) are read defensively;
 * sunset falls back to the documented /api/v1/sun endpoint.
 */
import { z } from "zod";
import { parseMonthName, toTithiIndex } from "../tithi";
import type { DayPanchang, PanchangProvider, Place } from "../types";
import { fetchJson, ProviderError } from "./errors";

const BASE = "https://shubh.live/api/v1";
/** A day's Panchang at a place never changes — cache it for 30 days. */
const REVALIDATE_SECONDS = 60 * 60 * 24 * 30;

const isoTime = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "bad time");

const panchangSchema = z.object({
  date: z.string().optional(),
  sunrise: isoTime,
  sunset: isoTime.optional(),
  tithi: z.object({
    name: z.string().optional(),
    number: z.number().optional(),
    paksha: z.string().optional(),
    endsAt: isoTime,
  }),
  paksha: z.string().optional(),
  lunarMonth: z
    .object({ amanta: z.string(), isAdhika: z.boolean().optional() })
    .optional(),
});

const sunSchema = z.object({ sunrise: isoTime.optional(), sunset: isoTime });

export class ShubhProvider implements PanchangProvider {
  readonly id = "shubh";
  readonly label = "ShubhAI (shubh.live)";
  readonly url = "https://shubh.live";

  constructor(private readonly apiKey: string) {}

  private async get(path: string, params: Record<string, string>) {
    const url = `${BASE}${path}?${new URLSearchParams(params)}`;
    return fetchJson(url, {
      headers: { "X-API-Key": this.apiKey, Accept: "application/json" },
      cache: "force-cache",
      next: { revalidate: REVALIDATE_SECONDS, tags: ["panchang", "panchang:shubh"] },
    });
  }

  async getDay(date: string, place: Place): Promise<DayPanchang> {
    const params = { lat: place.lat.toFixed(3), lon: place.lng.toFixed(3), date };
    const parsed = panchangSchema.safeParse(await this.get("/panchang", params));
    if (!parsed.success) throw new ProviderError("invalid-response", "panchang shape changed");
    const p = parsed.data;

    const index = toTithiIndex({ number: p.tithi.number, paksha: p.tithi.paksha ?? p.paksha, name: p.tithi.name });
    if (!index) throw new ProviderError("invalid-response", "could not read tithi");

    let sunset = p.sunset;
    if (!sunset) {
      const sun = sunSchema.safeParse(await this.get("/sun", params));
      if (!sun.success) throw new ProviderError("invalid-response", "sun shape changed");
      sunset = sun.data.sunset;
    }

    const amanta = parseMonthName(p.lunarMonth?.amanta);
    return {
      date,
      sunrise: new Date(p.sunrise),
      sunset: new Date(sunset),
      tithi: { index, endsAt: new Date(p.tithi.endsAt) },
      month: amanta ? { amanta, isAdhik: Boolean(p.lunarMonth?.isAdhika) } : undefined,
    };
  }
}
