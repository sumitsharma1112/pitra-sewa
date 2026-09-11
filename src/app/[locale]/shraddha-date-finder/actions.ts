"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import type { FinderState, FinderValues } from "@/lib/finder-state";
import { getPlace } from "@/lib/places";
import { allow } from "@/lib/rate-limit";
import { validateFinder } from "@/lib/validation/date-finder";
import { calculateShraddha } from "@/services/panchang/engine";
import { getProviders } from "@/services/panchang/providers";

const FIELDS = [
  "name",
  "deathDay",
  "deathMonth",
  "deathYear",
  "deathTime",
  "timeUnknown",
  "deathPlaceId",
  "deathPlaceLabel",
  "kind",
  "monthSystem",
  "year",
  "samePlace",
  "observancePlaceId",
  "observancePlaceLabel",
  "notes",
];

const reference = () =>
  "PS-" +
  Array.from(randomBytes(6), (b) => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[b % 31])
    .join("")
    .replace(/(.{3})/, "$1-");

/**
 * Server action for the Date Finder. Runs only on the server: the Panchang
 * API keys never reach the browser. Nothing submitted here is stored.
 */
export async function calculateShraddhaAction(_prev: FinderState, formData: FormData): Promise<FinderState> {
  const values: FinderValues = {};
  for (const f of FIELDS) {
    const v = formData.get(f);
    if (typeof v === "string") values[f] = v.slice(0, 2000);
  }
  if (values.samePlace === "on") values.observancePlaceId = values.deathPlaceId ?? "";

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  if (!allow(`finder:${ip}`)) return { status: "rate-limited", values };

  const checked = validateFinder(values, (id) => Boolean(getPlace(id)));
  if (!checked.ok) return { status: "invalid", errors: checked.errors, values };

  const input = checked.data;
  const deathPlace = getPlace(input.deathPlaceId)!;
  const observancePlace = getPlace(input.observancePlaceId)!;
  const providers = getProviders();

  const outcome = await calculateShraddha(
    {
      deathDate: input.deathDate,
      deathTime: input.deathTime,
      deathPlace,
      observancePlace,
      year: input.year,
      kind: input.kind,
      monthSystem: input.monthSystem,
    },
    providers,
  );

  return {
    status: "done",
    reference: reference(),
    generatedAt: new Date().toISOString(),
    summary: {
      name: input.name,
      deathDate: input.deathDate,
      deathTime: input.deathTime,
      deathPlace: { name: deathPlace.name, state: deathPlace.state },
      observancePlace: { name: observancePlace.name, state: observancePlace.state },
      year: input.year,
      monthSystem: input.monthSystem,
      notes: input.notes,
    },
    outcome,
    synthetic: Boolean(providers?.synthetic),
    values,
  };
}
