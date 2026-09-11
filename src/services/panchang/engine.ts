/**
 * One Shraddha date calculation, fully in-process (no API key needed):
 *   1. Tithi at the moment of death (astronomy-engine), with its boundaries.
 *   2. Shraddha Tithi for Pitru Paksha (same number in the Krishna paksha).
 *   3. That Tithi's span inside Pitru Paksha of the chosen year.
 *   4. The Aparahna rule (jyotisha tie-break) at the observance place.
 * Optional: an external API (ShubhAI / Navamsha) cross-checks the death Tithi.
 * Every uncertainty becomes a reason code; blocking reasons → "needs-verification".
 */
import {
  localDate,
  localMidnight,
  lunarMonthAt,
  OutOfRangeError,
  pitruPaksha,
  pitruPakshaTithiSpan,
  sunTimes,
  tithiIndexAt,
  tithiSpanAt,
} from "./astro";
import { getCrossCheck, type CrossCheck } from "./providers";
import { ProviderError } from "./providers/errors";
import {
  BOUNDARY_MARGIN_MINUTES,
  InconsistentDataError,
  isCloseCall,
  pickObservance,
  pitruPakshaTithi,
  RULES_VERSION,
  tithiAtInstant,
  type DayWindow,
} from "./rules";
import { addDays } from "./dates";
import { nextTithi, numberInPaksha } from "./tithi";
import type { CalculationInput, CalculationOutcome, Observance, PanchangProvider, Place, ReasonCode, ShraddhaResult } from "./types";

type Reason = ShraddhaResult["reasons"][number];
const MINUTE = 60_000;
export const ENGINE_LABEL = "astronomy-engine (MIT) · Lahiri · jyotisha rules";

/** Local wall-clock time at a place → UTC instant. */
export function localToInstant(date: string, time: string, place: Place): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - place.utcOffsetMinutes * MINUTE);
}

/** Death Tithi: exact when the time is known; all Tithis of that civil day otherwise. */
export function deathTithi(input: Pick<CalculationInput, "deathDate" | "deathTime" | "deathPlace">) {
  if (input.deathTime) {
    const t = localToInstant(input.deathDate, input.deathTime, input.deathPlace);
    const span = tithiSpanAt(t);
    const minutes = Math.min(t.getTime() - span.start.getTime(), span.end.getTime() - t.getTime()) / MINUTE;
    return { candidates: [span.index], instant: t, minutesFromBoundary: minutes };
  }
  const from = localMidnight(input.deathDate, input.deathPlace);
  const to = localMidnight(addDays(input.deathDate, 1), input.deathPlace);
  const candidates = [tithiIndexAt(from)];
  let end = tithiSpanAt(from).end;
  while (end < to && candidates.length < 3) {
    candidates.push(nextTithi(candidates[candidates.length - 1]));
    end = tithiSpanAt(new Date(end.getTime() + MINUTE)).end;
  }
  return { candidates, instant: new Date((from.getTime() + to.getTime()) / 2), minutesFromBoundary: Infinity };
}

/** Consecutive days around a span, with sunrise/sunset at the place. */
function daysAround(span: { start: Date; end: Date }, place: Place): DayWindow[] {
  const first = addDays(localDate(span.start, place), -1);
  const last = addDays(localDate(span.end, place), 1);
  const days: DayWindow[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) days.push({ date: d, ...sunTimes(d, place) });
  return days;
}

/** Shraddha day in Pitru Paksha of `year` for a death Tithi. */
export function pitruPakshaDay(deathTithiIndex: number, year: number, place: Place) {
  const shraddhaTithi = pitruPakshaTithi(deathTithiIndex);
  const pp = pitruPaksha(year);
  const span = pitruPakshaTithiSpan(pp, shraddhaTithi);
  const days = daysAround(span, place);
  const pick = pickObservance(span, days);
  return { shraddhaTithi, observance: pick as Observance, closeCall: isCloseCall(span, days), adhikNearby: pp.adhikNearby };
}

async function crossCheck(check: CrossCheck, input: CalculationInput, candidates: number[]): Promise<Reason | null> {
  try {
    const provider: PanchangProvider = check.provider;
    if (!input.deathTime) return null; // an unknown time is already flagged
    const t = localToInstant(input.deathDate, input.deathTime, input.deathPlace);
    let day = await provider.getDay(input.deathDate, input.deathPlace);
    let next: typeof day;
    if (t < day.sunrise) {
      next = day;
      day = await provider.getDay(addDays(input.deathDate, -1), input.deathPlace);
    } else {
      next = await provider.getDay(addDays(input.deathDate, 1), input.deathPlace);
    }
    const at = tithiAtInstant(t, day, next);
    const theirs = at.kind === "certain" ? [at.index] : at.candidates;
    return theirs.includes(candidates[0]) ? null : { code: "sources-disagree" };
  } catch (e) {
    if (e instanceof ProviderError || e instanceof InconsistentDataError) return { code: "secondary-failed" };
    throw e;
  }
}

/** Reasons that inform the family but do not make the date uncertain. */
const INFO_ONLY = new Set<ReasonCode>(["first-year", "two-days", "no-aparahna", "secondary-failed"]);

export async function calculateShraddha(
  input: CalculationInput,
  options: { crossCheck?: CrossCheck | null; requireReview?: boolean } = {},
): Promise<CalculationOutcome> {
  if (input.kind !== "pitru-paksha") return { status: "unsupported", reason: "varshik" };
  const check = options.crossCheck === undefined ? getCrossCheck() : options.crossCheck;
  const requireReview = options.requireReview ?? process.env.PANCHANG_REQUIRE_REVIEW === "true";

  try {
    const death = deathTithi(input);
    const reasons: Reason[] = [];
    if (death.candidates.length > 1) reasons.push({ code: "time-unknown" });
    if (death.minutesFromBoundary < BOUNDARY_MARGIN_MINUTES) {
      reasons.push({ code: "near-boundary", minutes: Math.max(0, Math.round(death.minutesFromBoundary)) });
    }
    const month = lunarMonthAt(death.instant);
    if (month.isAdhik) reasons.push({ code: "adhik-maas" });

    const computed = death.candidates.map((c) => ({ deathTithi: c, ...pitruPakshaDay(c, input.year, input.observancePlace) }));
    const [main, ...alternatives] = computed;

    if (main.adhikNearby) reasons.push({ code: "adhik-maas" });
    if (main.deathTithi === 15) reasons.push({ code: "purnima" });
    if (numberInPaksha(main.deathTithi) === 14) reasons.push({ code: "chaturdashi" });
    if (main.observance.kind === "two-days") reasons.push({ code: "two-days", date: main.observance.options[1].date });
    if (main.observance.kind === "none") reasons.push({ code: "no-aparahna" });
    if (main.closeCall) reasons.push({ code: "close-call" });

    const days = (Date.parse(main.observance.options[0].date) - Date.parse(input.deathDate)) / 86_400_000;
    if (days < 365) reasons.push({ code: "first-year" });
    if (Number(input.deathDate.slice(0, 4)) < 1956 && input.deathTime) reasons.push({ code: "old-clock" });

    if (check) {
      const r = await crossCheck(check, input, death.candidates);
      if (r) reasons.push(r);
    }
    if (requireReview) reasons.push({ code: "engine-preliminary" });

    const unique = reasons.filter((r, i) => reasons.findIndex((x) => x.code === r.code) === i);
    const result: ShraddhaResult = {
      confidence: unique.some((r) => !INFO_ONLY.has(r.code)) ? "needs-verification" : "calculated",
      reasons: unique,
      death: { tithiCandidates: death.candidates, month },
      shraddhaTithi: main.shraddhaTithi,
      observance: main.observance,
      alternatives: alternatives.map(({ deathTithi, shraddhaTithi, observance }) => ({ deathTithi, shraddhaTithi, observance })),
      sources: { engine: ENGINE_LABEL, crossCheck: check ? { label: check.provider.label, url: check.provider.url } : undefined },
      rulesVersion: RULES_VERSION,
    };
    return { status: "result", result };
  } catch (e) {
    if (e instanceof OutOfRangeError) return { status: "unsupported", reason: "out-of-range" };
    if (e instanceof InconsistentDataError) return { status: "service-error", error: "invalid-response" };
    throw e;
  }
}
