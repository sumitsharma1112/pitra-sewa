/**
 * Navamsha Panchang API (https://www.navamsha.in/apis/panchang) — used as the
 * independent second source for the death Tithi.
 *
 * Documented: GET https://api.navamsha.in/api/v1/panchang/daily with
 * date, latitude, longitude, timezone and header X-API-Key; response includes
 * tithi {name: "Shukla Paksha, Chaturthi", ends_at} and sunrise.
 * No lunar month is documented, so this provider cannot drive the Pitru Paksha search.
 */
import { z } from "zod";
import { toTithiIndex } from "../tithi";
import type { DayPanchang, PanchangProvider, Place } from "../types";
import { fetchJson, ProviderError } from "./errors";

const URL_DAILY = "https://api.navamsha.in/api/v1/panchang/daily";
const REVALIDATE_SECONDS = 60 * 60 * 24 * 30;
const isoTime = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "bad time");

const schema = z.object({
  sunrise: isoTime,
  sunset: isoTime.optional(),
  tithi: z.object({ name: z.string(), ends_at: isoTime }),
});

export class NavamshaProvider implements PanchangProvider {
  readonly id = "navamsha";
  readonly label = "Navamsha (navamsha.in)";
  readonly url = "https://www.navamsha.in";

  constructor(private readonly apiKey: string) {}

  async getDay(date: string, place: Place): Promise<DayPanchang> {
    const params = new URLSearchParams({
      date,
      latitude: place.lat.toFixed(3),
      longitude: place.lng.toFixed(3),
      timezone: String(place.utcOffsetMinutes / 60),
    });
    const json = await fetchJson(`${URL_DAILY}?${params}`, {
      headers: { "X-API-Key": this.apiKey, Accept: "application/json" },
      cache: "force-cache",
      next: { revalidate: REVALIDATE_SECONDS, tags: ["panchang", "panchang:navamsha"] },
    });
    // Some APIs wrap payloads in { data: … }.
    const body = (json && typeof json === "object" && "data" in json ? (json as { data: unknown }).data : json) as unknown;
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ProviderError("invalid-response", "daily shape changed");
    const index = toTithiIndex({ name: parsed.data.tithi.name });
    if (!index) throw new ProviderError("invalid-response", "could not read tithi");
    return {
      date,
      sunrise: new Date(parsed.data.sunrise),
      // Sunset is not needed from the second source (it only checks the death Tithi).
      sunset: new Date(parsed.data.sunset ?? parsed.data.sunrise),
      tithi: { index, endsAt: new Date(parsed.data.tithi.ends_at) },
    };
  }
}
