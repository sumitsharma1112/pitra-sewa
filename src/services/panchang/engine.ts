/**
 * Orchestrates one Shraddha date calculation:
 *   1. Death Tithi at the moment of death (primary source, cross-checked by the secondary).
 *   2. Shraddha Tithi for Pitru Paksha (same number in the Krishna paksha).
 *   3. Find that Tithi in Amanta Bhadrapada of the chosen year at the observance place.
 *   4. Pick the day whose Aparahna it covers.
 * Every uncertainty becomes a reason code; any reason → "needs-verification".
 */
import { getProviders, type ProviderSet } from "./providers";
import { ProviderError } from "./providers/errors";
import {
  BOUNDARY_MARGIN_MINUTES,
  InconsistentDataError,
  pickObservanceDay,
  pitruPakshaTithi,
  RULES_VERSION,
  tithiAtInstant,
} from "./rules";
import { addDays, seekTithi, TithiNotFoundError } from "./seek";
import { nextTithi, numberInPaksha } from "./tithi";
import type {
  CalculationInput,
  CalculationOutcome,
  DayPanchang,
  PanchangProvider,
  Place,
  ReasonCode,
  ShraddhaResult,
} from "./types";

type Reason = ShraddhaResult["reasons"][number];

/** Local wall-clock time at a place → UTC instant. */
export function localToInstant(date: string, time: string, place: Place): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - place.utcOffsetMinutes * 60_000);
}

interface DeathTithi {
  candidates: number[];
  day: DayPanchang;
  reasons: Reason[];
}

async function deathTithiFrom(provider: PanchangProvider, input: CalculationInput): Promise<DeathTithi> {
  const { deathDate, deathPlace } = input;
  const today = await provider.getDay(deathDate, deathPlace);

  if (!input.deathTime) {
    // Without a time, every Tithi between this sunrise and the next is possible.
    const next = await provider.getDay(addDays(deathDate, 1), deathPlace);
    const candidates = [today.tithi.index];
    for (let i = today.tithi.index; i !== next.tithi.index && candidates.length < 3; ) {
      i = nextTithi(i);
      candidates.push(i);
    }
    return { candidates, day: today, reasons: candidates.length > 1 ? [{ code: "time-unknown" }] : [] };
  }

  const t = localToInstant(deathDate, input.deathTime, deathPlace);
  // Before sunrise, the Panchang day is still the previous one.
  const [day, next, prev] =
    t < today.sunrise
      ? await Promise.all([
          provider.getDay(addDays(deathDate, -1), deathPlace),
          Promise.resolve(today),
          provider.getDay(addDays(deathDate, -2), deathPlace),
        ])
      : await Promise.all([
          Promise.resolve(today),
          provider.getDay(addDays(deathDate, 1), deathPlace),
          provider.getDay(addDays(deathDate, -1), deathPlace),
        ]);

  const at = tithiAtInstant(t, day, next, prev);
  if (at.kind === "ambiguous") return { candidates: at.candidates, day, reasons: [{ code: "kshaya-death" }] };
  const reasons: Reason[] =
    at.minutesFromBoundary < BOUNDARY_MARGIN_MINUTES
      ? [{ code: "near-boundary", minutes: Math.max(0, Math.round(at.minutesFromBoundary)) }]
      : [];
  return { candidates: [at.index], day, reasons };
}

const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x));

export async function calculateShraddha(
  input: CalculationInput,
  providers: ProviderSet | null = getProviders(),
): Promise<CalculationOutcome> {
  if (input.kind !== "pitru-paksha") return { status: "unsupported", reason: "varshik" };
  if (!providers) return { status: "not-configured" };
  const { primary, secondary } = providers;

  try {
    const death = await deathTithiFrom(primary, input);
    const reasons: Reason[] = [...death.reasons];

    if (secondary) {
      try {
        const check = await deathTithiFrom(secondary, input);
        if (!sameSet(check.candidates, death.candidates)) reasons.push({ code: "sources-disagree" });
      } catch {
        reasons.push({ code: "secondary-failed" });
      }
    }

    // Find the Shraddha day for each possible death Tithi (usually just one).
    const computed = [];
    for (const deathTithi of death.candidates) {
      const shraddhaTithi = pitruPakshaTithi(deathTithi);
      const found = await seekTithi(primary, input.observancePlace, `${input.year}-09-15`, "bhadrapada", shraddhaTithi);
      if (found.sawAdhik) reasons.push({ code: "adhik-maas" });
      const pick = pickObservanceDay(shraddhaTithi, found.days);
      if (pick.kind === "incomplete") return { status: "service-error", error: "invalid-response" };
      computed.push({ deathTithi, shraddhaTithi, observance: { kind: pick.kind, options: pick.options } });
    }
    const [main, ...alternatives] = computed;
    const { shraddhaTithi } = main;
    const pick = main.observance;
    if (death.day.month?.isAdhik) reasons.push({ code: "adhik-maas" });
    if (main.deathTithi === 15) reasons.push({ code: "purnima" });
    if (numberInPaksha(main.deathTithi) === 14) reasons.push({ code: "chaturdashi" });
    if (pick.kind === "two-days") reasons.push({ code: "two-days" });
    if (pick.kind === "none") reasons.push({ code: "no-aparahna" });
    if (pick.kind === "kshaya") reasons.push({ code: "kshaya-shraddha" });

    const firstOption = pick.options[0];
    if (firstOption) {
      const days = (Date.parse(firstOption.date) - Date.parse(input.deathDate)) / 86_400_000;
      if (days < 365) reasons.push({ code: "first-year" });
    }
    if (Number(input.deathDate.slice(0, 4)) < 1956 && input.deathTime) reasons.push({ code: "old-clock" });
    if (!providers.verified) reasons.push({ code: "engine-preliminary" });

    const blocking = reasons.some((r) => !INFO_ONLY.has(r.code));
    const result: ShraddhaResult = {
      confidence: blocking ? "needs-verification" : "calculated",
      reasons: dedupe(reasons),
      death: { tithiCandidates: death.candidates, month: death.day.month },
      shraddhaTithi,
      observance: pick,
      alternatives,
      sources: {
        primary: { label: primary.label, url: primary.url },
        secondary: secondary ? { label: secondary.label, url: secondary.url } : undefined,
      },
      rulesVersion: RULES_VERSION,
    };
    return { status: "result", result };
  } catch (e) {
    if (e instanceof ProviderError) return { status: "service-error", error: e.kind };
    if (e instanceof TithiNotFoundError) return { status: "unsupported", reason: "not-found" };
    if (e instanceof InconsistentDataError) return { status: "service-error", error: "invalid-response" };
    throw e;
  }
}

/** Reasons that inform but do not by themselves make the date uncertain. */
const INFO_ONLY = new Set<ReasonCode>(["first-year"]);

function dedupe(reasons: Reason[]): Reason[] {
  const seen = new Set<string>();
  return reasons.filter((r) => (seen.has(r.code) ? false : (seen.add(r.code), true)));
}
