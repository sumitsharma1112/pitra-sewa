"use server";

import { headers } from "next/headers";
import type { KundliState, KundliValues } from "@/lib/kundli-state";
import { getPlace } from "@/lib/places";
import { allow } from "@/lib/rate-limit";
import { validateKundli } from "@/lib/validation/kundli";
import { OutOfRangeError } from "@/services/panchang/astro";
import { birthChart, varshphalChart } from "@/services/panchang/kundli";
import type { Place } from "@/services/panchang/types";

const FIELDS = ["name", "birthDay", "birthMonth", "birthYear", "birthTime", "birthPlaceId", "birthPlaceLabel", "varshphalYear"];

function localToInstant(date: string, time: string, place: Place): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - place.utcOffsetMinutes * 60_000);
}

/**
 * Server action for the astrology chart calculator. Computes sidereal
 * planetary positions only -- see src/services/panchang/kundli.ts for what
 * this deliberately does not do (no yogas, no dasha, no predictions).
 * Nothing submitted is stored.
 */
export async function calculateKundliAction(_prev: KundliState, formData: FormData): Promise<KundliState> {
  const values: KundliValues = {};
  for (const f of FIELDS) {
    const v = formData.get(f);
    if (typeof v === "string") values[f] = v.slice(0, 2000);
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  if (!allow(`kundli:${ip}`)) return { status: "rate-limited", values };

  const checked = validateKundli(values, (id) => Boolean(getPlace(id)));
  if (!checked.ok) return { status: "invalid", errors: checked.errors, values };

  const input = checked.data;
  const birthPlace = getPlace(input.birthPlaceId)!;
  const instant = localToInstant(input.birthDate, input.birthTime, birthPlace);

  try {
    const birth = birthChart(instant, birthPlace);
    const varshphal = varshphalChart(instant, birthPlace, input.varshphalYear);
    return {
      status: "done",
      summary: {
        name: input.name,
        birthDate: input.birthDate,
        birthTime: input.birthTime,
        birthPlace: { name: birthPlace.name, state: birthPlace.state },
        varshphalYear: input.varshphalYear,
      },
      birth,
      varshphal,
      values,
    };
  } catch (e) {
    if (e instanceof OutOfRangeError) return { status: "out-of-range", values };
    throw e;
  }
}
