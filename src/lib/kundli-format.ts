/** Display helpers for the astrology chart calculator (client-safe). */
import type { Dictionary } from "@/i18n/dictionaries";
import { GRAHAS, NAKSHATRAS, RASHIS, type Graha, type Nakshatra, type Rashi, type Relation } from "@/services/panchang/kundli";

type AP = Dictionary["astrologyPage"];

export const grahaLabel = (graha: Graha, ap: AP): string => ap.grahas[graha];
export const rashiLabel = (rashi: Rashi, ap: AP): string => ap.rashis[RASHIS.indexOf(rashi)];
export const nakshatraLabel = (nakshatra: Nakshatra, ap: AP): string => ap.nakshatras[NAKSHATRAS.indexOf(nakshatra)];
export const relationLabel = (relation: Relation | undefined, ap: AP): string => (relation ? ap.result.relations[relation] : ap.result.noAspect);

/** "15° 23'" from a 0-30 degree-in-rashi value. */
export function degreeMinute(degreeInRashi: number): string {
  const deg = Math.floor(degreeInRashi);
  const min = Math.round((degreeInRashi - deg) * 60);
  return min === 60 ? `${deg + 1}° 00'` : `${deg}° ${String(min).padStart(2, "0")}'`;
}

export const grahaOrder = GRAHAS;
