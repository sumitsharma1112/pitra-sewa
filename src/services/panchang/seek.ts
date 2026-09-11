/**
 * Find the days around a given Tithi of a given Amanta month in a year,
 * using only provider data: read the Tithi on a guessed date, jump by the
 * remaining number of Tithis (mean length 29.53 / 30 days), repeat.
 * Usually converges in 2–4 requests; results are cached by the provider layer.
 */
import { monthIndex } from "./tithi";
import type { DayPanchang, LunarMonth, PanchangProvider, Place } from "./types";

const MEAN_TITHI_DAYS = 29.530589 / 30;
const MAX_STEPS = 10;

export class TithiNotFoundError extends Error {
  constructor() {
    super("target Tithi not found within the search budget");
    this.name = "TithiNotFoundError";
  }
}

export const addDays = (date: string, n: number) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

/** Tithis remaining from `day` to (month, index). Adhik months count as the month *before* their Nija month. */
function tithisUntil(day: DayPanchang, month: LunarMonth, index: number): number {
  if (!day.month) throw new Error("provider did not report the lunar month");
  let months = monthIndex(month) - monthIndex(day.month.amanta);
  if (months > 6) months -= 12;
  if (months < -6) months += 12;
  if (months === 0 && day.month.isAdhik) months = 1; // Adhik Bhadrapada precedes Nija Bhadrapada
  return months * 30 + (index - day.tithi.index);
}

export interface SeekResult {
  /** Consecutive days: two before the anchor through two after. */
  days: DayPanchang[];
  sawAdhik: boolean;
}

export async function seekTithi(
  provider: PanchangProvider,
  place: Place,
  startGuess: string,
  month: LunarMonth,
  index: number,
): Promise<SeekResult> {
  const cache = new Map<string, DayPanchang>();
  const get = async (date: string) => {
    let day = cache.get(date);
    if (!day) {
      day = await provider.getDay(date, place);
      cache.set(date, day);
    }
    return day;
  };

  let date = startGuess;
  let sawAdhik = false;
  for (let step = 0; step < MAX_STEPS; step++) {
    const day = await get(date);
    if (day.month?.isAdhik) sawAdhik = true;
    const remaining = tithisUntil(day, month, index);

    if (remaining === 0 || remaining === -1 || remaining === 1) {
      // Close: anchor on the day holding the target at sunrise, or the day before a Kshaya gap.
      let anchor = date;
      if (remaining !== 0) {
        const neighbour = addDays(date, remaining > 0 ? 1 : -1);
        const n = await get(neighbour);
        const nRemaining = tithisUntil(n, month, index);
        if (nRemaining === 0) anchor = neighbour;
        else if (remaining === 1 && nRemaining === -1) anchor = date; // Kshaya between date and neighbour
        else if (remaining === -1 && nRemaining === 1) anchor = neighbour;
        else {
          date = neighbour;
          continue;
        }
      }
      const dates = [-2, -1, 0, 1, 2].map((k) => addDays(anchor, k));
      const days = [];
      for (const d of dates) {
        const got = await get(d);
        if (got.month?.isAdhik) sawAdhik = true;
        days.push(got);
      }
      return { days, sawAdhik };
    }
    const jump = Math.round(remaining * MEAN_TITHI_DAYS);
    date = addDays(date, jump === 0 ? Math.sign(remaining) : jump);
  }
  throw new TithiNotFoundError();
}
