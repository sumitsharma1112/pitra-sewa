import "server-only";
import placesData from "@/data/places-in.json";
import type { Place } from "@/services/panchang/types";

export type PlaceRecord = { id: string; name: string; state: string; lat: number; lng: number };

const IST_OFFSET_MINUTES = 330; // v1 covers India only; no daylight saving.
const byId = new Map((placesData as PlaceRecord[]).map((p) => [p.id, p]));

export function getPlace(id: string | undefined | null): Place | undefined {
  if (!id) return undefined;
  const p = byId.get(id);
  return p ? { ...p, utcOffsetMinutes: IST_OFFSET_MINUTES } : undefined;
}
