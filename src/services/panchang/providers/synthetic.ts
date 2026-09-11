/**
 * TEST-ONLY provider: a regular, made-up calendar (fixed Tithi length, fixed
 * sunrise/sunset, month advancing every 30 Tithis). It is NOT astronomy and
 * must never reach production — see providers/index.ts for the guard.
 */
import { AMANTA_MONTHS, type DayPanchang, type PanchangProvider, type Place } from "../types";

const DAY = 86_400_000;

export interface SyntheticOptions {
  /** Instant at which Tithi 1 of `firstMonth` begins. */
  epoch: Date;
  firstMonth?: number; // index into AMANTA_MONTHS
  tithiHours?: number; // mean ~23.62 h
  sunriseUtcHour?: number; // 00:30 UTC ≈ 06:00 IST
  dayLengthHours?: number;
}

export class SyntheticProvider implements PanchangProvider {
  readonly id = "synthetic";
  readonly label = "Synthetic test calendar";
  readonly url = "about:blank";
  constructor(private readonly o: SyntheticOptions) {}

  async getDay(date: string, _place: Place): Promise<DayPanchang> {
    void _place;
    const { epoch, firstMonth = 0, tithiHours = 23.62, sunriseUtcHour = 0.5, dayLengthHours = 12 } = this.o;
    const [y, m, d] = date.split("-").map(Number);
    const sunrise = new Date(Date.UTC(y, m - 1, d) + sunriseUtcHour * 3_600_000);
    const sunset = new Date(sunrise.getTime() + dayLengthHours * 3_600_000);
    const len = tithiHours * 3_600_000;
    const elapsed = Math.floor((sunrise.getTime() - epoch.getTime()) / len);
    const index = (((elapsed % 30) + 30) % 30) + 1;
    const endsAt = new Date(epoch.getTime() + (elapsed + 1) * len);
    const monthNo = Math.floor(elapsed / 30);
    const amanta = AMANTA_MONTHS[(((firstMonth + monthNo) % 12) + 12) % 12];
    return { date, sunrise, sunset, tithi: { index, endsAt }, month: { amanta, isAdhik: false } };
  }
}

export const syntheticDay = DAY;
