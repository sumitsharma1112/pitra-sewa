/**
 * In-process Vedic birth chart (Kundli) and annual (Varshphal) chart.
 *
 * Computes planetary positions only -- no yoga naming, no dasha, no
 * predictive interpretation of any kind. That line is deliberate: see the
 * "Non-negotiable rules" in CLAUDE.md (no invented facts, no guaranteed
 * spiritual results).
 *
 * - Sidereal (Lahiri) longitudes: astronomy-engine's geocentric apparent
 *   ecliptic-of-date position for each body, minus a precomputed Lahiri
 *   ayanamsha looked up from src/data/ayanamsha-lahiri.json (monthly,
 *   1900-2060, generated offline via Swiss Ephemeris --
 *   scripts/reference/ayanamsha_table.py -- linearly interpolated; the
 *   table changes by under a thousandth of a degree between points, so
 *   interpolation error is negligible).
 * - Rahu: mean lunar node (Meeus, "Astronomical Algorithms" ch. 47). Ketu is
 *   always exactly opposite. Both are always shown as retrograde, which is
 *   the standard convention for the mean node (it always regresses).
 * - Ascendant (Lagna): the standard RAMC / obliquity / geographic-latitude
 *   formula, sidereal.
 * - Houses: whole-sign (Bhava = sign count from Lagna) -- the least disputed
 *   Vedic house system, and the only one that needs no cusp computation.
 * - Varshphal: the instant the Sun returns to the exact sidereal longitude
 *   it held at birth, in the requested year (a sidereal solar return).
 *
 * Verified against Swiss Ephemeris (Lahiri, offline only, AGPL --
 * scripts/reference/kundli_swisseph.py, not shipped -- same pattern as the
 * Pitru Paksha engine's sankranti table) for varied dates, times and
 * latitudes: every planet and the ascendant agree within about 16
 * arcseconds, inside astronomy-engine's documented ±1' accuracy.
 *
 * Also computed, as fixed classical rules rather than interpretation:
 * - Naisargika Maitri (natural planetary friendship): the standard 7x7
 *   friend/neutral/enemy table for the 7 classical grahas (see Brihat
 *   Parashara Hora Shastra; identical across every mainstream Jyotish
 *   reference, including its well-known asymmetries, e.g. Moon regards
 *   Mercury as a friend but Mercury regards Moon as an enemy). Shown here
 *   as each graha's relation to the Lagna lord -- a fixed rule applied to
 *   this chart's own Ascendant, not a prediction.
 * - Graha drishti (aspects): the standard Parashari rule -- every graha
 *   aspects the 7th house from itself; Mars also aspects the 4th and 8th;
 *   Jupiter the 5th and 9th; Saturn the 3rd and 10th. Rahu/Ketu are given
 *   only the universal 7th-house aspect here, since the extra aspects
 *   some modern software assigns them are not classically universal.
 * These are deterministic geometry and a fixed lookup table -- not
 * "fal" (results/interpretation), which this module still does not
 * generate; see the disclaimer on the astrology page itself.
 */
import * as A from "astronomy-engine";
import ayanamshaTable from "@/data/ayanamsha-lahiri.json";
import { OutOfRangeError } from "./astro";
import type { Place } from "./types";

const points = ayanamshaTable.points as [number, number][];

function julianDayUT(date: Date): number {
  return date.getTime() / 86_400_000 + 2440587.5;
}

/** Lahiri ayanamsha (degrees) at `date`, linearly interpolated from the table. */
export function ayanamsha(date: Date): number {
  const jd = julianDayUT(date);
  if (jd <= points[0][0] || jd >= points[points.length - 1][0]) throw new OutOfRangeError();
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid][0] <= jd) lo = mid;
    else hi = mid;
  }
  const [jd0, a0] = points[lo];
  const [jd1, a1] = points[hi];
  return a0 + ((a1 - a0) * (jd - jd0)) / (jd1 - jd0);
}

const norm360 = (x: number) => ((x % 360) + 360) % 360;

export const GRAHAS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"] as const;
export type Graha = (typeof GRAHAS)[number];

export const RASHIS = [
  "mesha",
  "vrishabha",
  "mithuna",
  "karka",
  "simha",
  "kanya",
  "tula",
  "vrischika",
  "dhanu",
  "makara",
  "kumbha",
  "meena",
] as const;
export type Rashi = (typeof RASHIS)[number];

export const NAKSHATRAS = [
  "ashwini",
  "bharani",
  "krittika",
  "rohini",
  "mrigashira",
  "ardra",
  "punarvasu",
  "pushya",
  "ashlesha",
  "magha",
  "purvaPhalguni",
  "uttaraPhalguni",
  "hasta",
  "chitra",
  "swati",
  "vishakha",
  "anuradha",
  "jyeshtha",
  "mula",
  "purvaAshadha",
  "uttaraAshadha",
  "shravana",
  "dhanishta",
  "shatabhisha",
  "purvaBhadrapada",
  "uttaraBhadrapada",
  "revati",
] as const;
export type Nakshatra = (typeof NAKSHATRAS)[number];

/** Which graha rules each rashi (classical Vedic rulerships). */
export const RASHI_LORD: Record<Rashi, Graha> = {
  mesha: "mars",
  vrishabha: "venus",
  mithuna: "mercury",
  karka: "moon",
  simha: "sun",
  kanya: "mercury",
  tula: "venus",
  vrischika: "mars",
  dhanu: "jupiter",
  makara: "saturn",
  kumbha: "saturn",
  meena: "jupiter",
};

export type Relation = "self" | "friend" | "neutral" | "enemy";

/** Naisargika Maitri: the classical 7x7 natural-friendship table (see module doc comment). Not defined for Rahu/Ketu. */
const NATURAL_FRIENDSHIP: Partial<Record<Graha, Partial<Record<Graha, Relation>>>> = {
  sun: { moon: "friend", mars: "friend", jupiter: "friend", mercury: "neutral", venus: "enemy", saturn: "enemy" },
  moon: { sun: "friend", mercury: "friend", mars: "neutral", jupiter: "neutral", venus: "neutral", saturn: "neutral" },
  mars: { sun: "friend", moon: "friend", jupiter: "friend", venus: "neutral", saturn: "neutral", mercury: "enemy" },
  mercury: { sun: "friend", venus: "friend", mars: "neutral", jupiter: "neutral", saturn: "neutral", moon: "enemy" },
  jupiter: { sun: "friend", moon: "friend", mars: "friend", saturn: "neutral", mercury: "enemy", venus: "enemy" },
  venus: { mercury: "friend", saturn: "friend", mars: "neutral", jupiter: "neutral", sun: "enemy", moon: "enemy" },
  saturn: { mercury: "friend", venus: "friend", jupiter: "neutral", sun: "enemy", moon: "enemy", mars: "enemy" },
};

/** `a`'s natural relation to `b` (fixed classical table; not chart-specific). Undefined when either is Rahu/Ketu. */
export function naturalRelation(a: Graha, b: Graha): Relation | undefined {
  if (a === b) return "self";
  return NATURAL_FRIENDSHIP[a]?.[b];
}

/** Houses (1-12, relative offsets) a graha in `houseOfGraha` aspects, by the standard Parashari rule. */
export function aspectedHouses(graha: Graha, houseOfGraha: number): number[] {
  const offsets = graha === "mars" ? [4, 7, 8] : graha === "jupiter" ? [5, 7, 9] : graha === "saturn" ? [3, 7, 10] : [7];
  return offsets.map((o) => (((houseOfGraha - 1 + (o - 1)) % 12) + 12) % 12).map((i) => i + 1);
}

const bodyOf: Partial<Record<Graha, A.Body>> = {
  mars: A.Body.Mars,
  mercury: A.Body.Mercury,
  jupiter: A.Body.Jupiter,
  venus: A.Body.Venus,
  saturn: A.Body.Saturn,
};

/** Geocentric apparent ecliptic-of-date longitude (tropical), before ayanamsha. */
function tropicalLongitude(graha: "sun" | "moon" | "mars" | "mercury" | "jupiter" | "venus" | "saturn", date: Date): number {
  if (graha === "sun") return A.SunPosition(date).elon;
  if (graha === "moon") return A.EclipticGeoMoon(date).lon;
  return A.Ecliptic(A.GeoVector(bodyOf[graha]!, date, true)).elon;
}

/** Meeus, "Astronomical Algorithms" ch. 47: mean ascending node of the Moon's orbit (tropical). */
function meanNodeTropical(date: Date): number {
  const T = (julianDayUT(date) - 2451545.0) / 36525;
  const omega = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T ** 3 / 467441 - T ** 4 / 60616000;
  return norm360(omega);
}

function siderealLongitudeOf(graha: Graha, date: Date): number {
  const a = ayanamsha(date);
  if (graha === "rahu") return norm360(meanNodeTropical(date) - a);
  if (graha === "ketu") return norm360(meanNodeTropical(date) - a + 180);
  return norm360(tropicalLongitude(graha, date) - a);
}

/** True for the 5 classical planets that visibly go retrograde (not Sun/Moon). Rahu/Ketu are always retrograde by convention. */
function isRetrograde(graha: Graha, date: Date): boolean {
  if (graha === "sun" || graha === "moon") return false;
  if (graha === "rahu" || graha === "ketu") return true;
  const step = 6 * 3600_000; // 6 hours
  const before = tropicalLongitude(graha, new Date(date.getTime() - step));
  const after = tropicalLongitude(graha, new Date(date.getTime() + step));
  const diff = ((after - before + 540) % 360) - 180;
  return diff < 0;
}

function rashiOf(siderealLon: number): { rashi: Rashi; degreeInRashi: number; index: number } {
  const index = Math.floor(siderealLon / 30) % 12;
  return { rashi: RASHIS[index], degreeInRashi: siderealLon - index * 30, index };
}

function nakshatraOf(siderealLon: number): { nakshatra: Nakshatra; pada: 1 | 2 | 3 | 4 } {
  const span = 360 / 27;
  const index = Math.floor(siderealLon / span) % 27;
  const within = siderealLon - index * span;
  const pada = (Math.floor(within / (span / 4)) + 1) as 1 | 2 | 3 | 4;
  return { nakshatra: NAKSHATRAS[index], pada };
}

/** RAMC / obliquity / latitude formula for the sidereal Ascendant. */
function ascendantSidereal(date: Date, place: Place): number {
  const gstHours = A.SiderealTime(date);
  const lstDeg = norm360(gstHours * 15 + place.lng);
  const tilt = A.e_tilt(A.MakeTime(date));
  const eps = (tilt.tobl * Math.PI) / 180;
  const theta = (lstDeg * Math.PI) / 180;
  const phi = (place.lat * Math.PI) / 180;
  const y = Math.cos(theta);
  const x = -(Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(theta));
  const ascTropical = norm360((Math.atan2(y, x) * 180) / Math.PI);
  return norm360(ascTropical - ayanamsha(date));
}

/**
 * Measured worst case against Swiss Ephemeris (see module doc comment): about
 * 16" for a birth chart, up to ~0.52° for a Varshphal ascendant (the Sun's
 * slow motion amplifies astronomy-engine's small longitude offset into a
 * few minutes of search-instant timing). A position within this margin of a
 * rashi or nakshatra-pada cusp is flagged rather than silently trusted.
 */
const BOUNDARY_MARGIN_DEG = 1;

function nearCusp(degreeInSpan: number, spanSize: number): boolean {
  return degreeInSpan < BOUNDARY_MARGIN_DEG || spanSize - degreeInSpan < BOUNDARY_MARGIN_DEG;
}

export interface GrahaPosition {
  graha: Graha;
  siderealLongitude: number;
  rashi: Rashi;
  degreeInRashi: number;
  nakshatra: Nakshatra;
  pada: 1 | 2 | 3 | 4;
  house: number; // 1-12, whole-sign from Lagna
  retrograde: boolean;
  nearBoundary: boolean;
  /** This graha's fixed natural relation to the chart's Lagna lord. Undefined for Rahu/Ketu (not classically defined). */
  relationToLagnaLord?: Relation;
  /** Other grahas in this chart that this position aspects (graha drishti; see module doc comment). */
  aspects: Graha[];
}

export interface Chart {
  instant: Date;
  ayanamsha: number;
  ascendant: { siderealLongitude: number; rashi: Rashi; degreeInRashi: number; nearBoundary: boolean; lord: Graha };
  positions: GrahaPosition[];
}

function buildChart(date: Date, place: Place): Chart {
  const ascLon = ascendantSidereal(date, place);
  const lagna = rashiOf(ascLon);
  const lagnaLord = RASHI_LORD[lagna.rashi];

  const basics = GRAHAS.map((graha) => {
    const lon = siderealLongitudeOf(graha, date);
    const r = rashiOf(lon);
    const n = nakshatraOf(lon);
    const house = ((r.index - lagna.index + 12) % 12) + 1;
    return {
      graha,
      siderealLongitude: lon,
      rashi: r.rashi,
      degreeInRashi: r.degreeInRashi,
      nakshatra: n.nakshatra,
      pada: n.pada,
      house,
      retrograde: isRetrograde(graha, date),
      nearBoundary: nearCusp(r.degreeInRashi, 30) || nearCusp(((lon % (360 / 27)) + 360 / 27) % (360 / 27), 360 / 27),
      relationToLagnaLord: naturalRelation(graha, lagnaLord),
    };
  });

  const positions: GrahaPosition[] = basics.map((p) => ({
    ...p,
    aspects: aspectedHouses(p.graha, p.house)
      .flatMap((h) => basics.filter((other) => other.house === h && other.graha !== p.graha))
      .map((other) => other.graha),
  }));

  return {
    instant: date,
    ayanamsha: ayanamsha(date),
    ascendant: {
      siderealLongitude: ascLon,
      rashi: lagna.rashi,
      degreeInRashi: lagna.degreeInRashi,
      nearBoundary: nearCusp(lagna.degreeInRashi, 30),
      lord: lagnaLord,
    },
    positions,
  };
}

/** The birth chart (Janma Kundli). */
export function birthChart(birthInstant: Date, birthPlace: Place): Chart {
  return buildChart(birthInstant, birthPlace);
}

/**
 * The Varshphal (annual / solar return) chart: the instant the Sun returns to
 * its exact natal sidereal longitude in `year`, cast for `place`.
 */
export function varshphalChart(birthInstant: Date, birthPlace: Place, year: number, place: Place = birthPlace): Chart {
  const natalSidereal = siderealLongitudeOf("sun", birthInstant);
  const anchor = new Date(Date.UTC(year, birthInstant.getUTCMonth(), birthInstant.getUTCDate()));
  let instant = solarReturnNear(natalSidereal, anchor);
  // One refinement pass: the ayanamsha used for the search target shifts by
  // under a minute of arc between the anchor guess and the true instant, so
  // a second pass removes that (already tiny) error entirely.
  instant = solarReturnNear(natalSidereal, instant);
  return buildChart(instant, place);
}

function solarReturnNear(natalSidereal: number, near: Date): Date {
  const targetTropical = norm360(natalSidereal + ayanamsha(near));
  const found = A.SearchSunLongitude(targetTropical, new Date(near.getTime() - 20 * 86_400_000), 40);
  if (!found) throw new OutOfRangeError("solar return not found");
  return found.date;
}
