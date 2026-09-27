import { z } from "zod";

/** Error codes, translated in the dictionary (astrologyPage.errors). */
export type KundliErrorCode = "required" | "invalidDate" | "futureDate" | "tooOld" | "invalidTime" | "placeRequired" | "yearRange" | "tooLong";

export const kundliFields = ["name", "birthDate", "birthTime", "birthPlaceId", "varshphalYear"] as const;
export type KundliField = (typeof kundliFields)[number];

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2060;

export const todayInIndia = (now = new Date()) => new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);

const isRealDate = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

const pad = (n: number) => String(n).padStart(2, "0");

export interface KundliInput {
  name?: string;
  birthDate: string;
  birthTime: string;
  birthPlaceId: string;
  varshphalYear: number;
}

const raw = z.object({
  name: z.string().trim().max(80, "tooLong").optional(),
  birthDay: z.string().trim(),
  birthMonth: z.string().trim(),
  birthYear: z.string().trim(),
  birthTime: z.string().trim(),
  birthPlaceId: z.string().trim(),
  varshphalYear: z.string().trim(),
});

export type ValidationResult = { ok: true; data: KundliInput } | { ok: false; errors: Partial<Record<KundliField, KundliErrorCode>> };

export function validateKundli(
  form: Record<string, string | undefined>,
  placeExists: (id: string) => boolean,
  now = new Date(),
): ValidationResult {
  const parsed = raw.safeParse(form);
  const errors: Partial<Record<KundliField, KundliErrorCode>> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as KundliField;
      if (kundliFields.includes(field)) errors[field] = issue.message === "tooLong" ? "tooLong" : "required";
    }
    if (Object.keys(errors).length) return { ok: false, errors };
    return { ok: false, errors: { birthDate: "required" } };
  }
  const f = parsed.data;

  let birthDate = "";
  const [d, m, y] = [Number(f.birthDay), Number(f.birthMonth), Number(f.birthYear)];
  if (!f.birthDay || !f.birthMonth || !f.birthYear) errors.birthDate = "required";
  else if (!isRealDate(y, m, d)) errors.birthDate = "invalidDate";
  else if (y < MIN_YEAR || y > MAX_YEAR) errors.birthDate = "tooOld";
  else {
    birthDate = `${y}-${pad(m)}-${pad(d)}`;
    if (birthDate > todayInIndia(now)) errors.birthDate = "futureDate";
  }

  let birthTime = "";
  if (!f.birthTime) errors.birthTime = "required";
  else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(f.birthTime)) errors.birthTime = "invalidTime";
  else birthTime = f.birthTime;

  if (!f.birthPlaceId || !placeExists(f.birthPlaceId)) errors.birthPlaceId = "placeRequired";

  const varshphalYear = Number(f.varshphalYear);
  if (!f.varshphalYear || !Number.isInteger(varshphalYear) || varshphalYear < MIN_YEAR || varshphalYear > MAX_YEAR) {
    errors.varshphalYear = "yearRange";
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: { name: f.name || undefined, birthDate, birthTime, birthPlaceId: f.birthPlaceId, varshphalYear },
  };
}
