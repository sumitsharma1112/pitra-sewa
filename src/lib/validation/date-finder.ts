import { z } from "zod";

/** Error codes, translated in the dictionary (finderPage.errors). */
export type FinderErrorCode =
  | "required"
  | "invalidDate"
  | "futureDate"
  | "tooOld"
  | "timeOrUnknown"
  | "invalidTime"
  | "placeRequired"
  | "varshikSoon"
  | "yearRange"
  | "yearBeforeDeath"
  | "tooLong";

export const finderFields = [
  "name",
  "deathDate",
  "deathTime",
  "deathPlaceId",
  "kind",
  "monthSystem",
  "year",
  "observancePlaceId",
  "notes",
] as const;
export type FinderField = (typeof finderFields)[number];

export const MIN_DEATH_YEAR = 1900;

/** Today's date in India (yyyy-mm-dd). */
export const todayInIndia = (now = new Date()) => new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);

export const yearOptions = (now = new Date()) => {
  const y = Number(todayInIndia(now).slice(0, 4));
  return [y, y + 1, y + 2];
};

const isRealDate = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

const pad = (n: number) => String(n).padStart(2, "0");

export interface FinderInput {
  name?: string;
  deathDate: string;
  deathTime?: string;
  deathPlaceId: string;
  kind: "pitru-paksha";
  monthSystem: "purnimanta" | "amanta";
  year: number;
  observancePlaceId: string;
  notes?: string;
}

const raw = z.object({
  name: z.string().trim().max(80, "tooLong").optional(),
  deathDay: z.string().trim(),
  deathMonth: z.string().trim(),
  deathYear: z.string().trim(),
  deathTime: z.string().trim().optional(),
  timeUnknown: z.string().optional(),
  deathPlaceId: z.string().trim(),
  kind: z.string().trim(),
  monthSystem: z.string().trim(),
  year: z.string().trim(),
  observancePlaceId: z.string().trim(),
  notes: z.string().trim().max(1000, "tooLong").optional(),
});

export type ValidationResult =
  | { ok: true; data: FinderInput }
  | { ok: false; errors: Partial<Record<FinderField, FinderErrorCode>> };

/**
 * Validates the Date Finder form. `placeExists` is injected so this module
 * stays free of the city list and is easy to test.
 */
export function validateFinder(
  form: Record<string, string | undefined>,
  placeExists: (id: string) => boolean,
  now = new Date(),
): ValidationResult {
  const parsed = raw.safeParse(form);
  const errors: Partial<Record<FinderField, FinderErrorCode>> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as FinderField;
      if (finderFields.includes(field)) errors[field] = issue.message === "tooLong" ? "tooLong" : "required";
    }
    if (Object.keys(errors).length) return { ok: false, errors };
    return { ok: false, errors: { deathDate: "required" } };
  }
  const f = parsed.data;

  // Date of death
  let deathDate = "";
  const [d, m, y] = [Number(f.deathDay), Number(f.deathMonth), Number(f.deathYear)];
  if (!f.deathDay || !f.deathMonth || !f.deathYear) errors.deathDate = "required";
  else if (!isRealDate(y, m, d)) errors.deathDate = "invalidDate";
  else if (y < MIN_DEATH_YEAR) errors.deathDate = "tooOld";
  else {
    deathDate = `${y}-${pad(m)}-${pad(d)}`;
    if (deathDate > todayInIndia(now)) errors.deathDate = "futureDate";
  }

  // Time of death — a time, or an explicit "not known"
  const unknown = f.timeUnknown === "on" || f.timeUnknown === "true";
  let deathTime: string | undefined;
  if (!unknown) {
    if (!f.deathTime) errors.deathTime = "timeOrUnknown";
    else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(f.deathTime)) errors.deathTime = "invalidTime";
    else deathTime = f.deathTime;
  }

  if (!f.deathPlaceId || !placeExists(f.deathPlaceId)) errors.deathPlaceId = "placeRequired";
  if (!f.observancePlaceId || !placeExists(f.observancePlaceId)) errors.observancePlaceId = "placeRequired";

  if (f.kind === "varshik") errors.kind = "varshikSoon";
  else if (f.kind !== "pitru-paksha") errors.kind = "required";

  if (f.monthSystem !== "purnimanta" && f.monthSystem !== "amanta") errors.monthSystem = "required";

  const year = Number(f.year);
  if (!yearOptions(now).includes(year)) errors.year = "yearRange";
  else if (deathDate && year < Number(deathDate.slice(0, 4))) errors.year = "yearBeforeDeath";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      name: f.name || undefined,
      deathDate,
      deathTime,
      deathPlaceId: f.deathPlaceId,
      kind: "pitru-paksha",
      monthSystem: f.monthSystem as "purnimanta" | "amanta",
      year,
      observancePlaceId: f.observancePlaceId,
      notes: f.notes || undefined,
    },
  };
}
