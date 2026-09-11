"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { calculateShraddhaAction } from "@/app/[locale]/shraddha-date-finder/actions";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { FinderState, FinderValues } from "@/lib/finder-state";
import type { PlaceOption } from "@/lib/place-search";
import type { FinderField } from "@/lib/validation/date-finder";
import { FieldError, FieldHint, FieldLabel } from "./FieldLabel";
import { PlaceCombobox } from "./PlaceCombobox";
import { ResultView, type ContactInfo } from "./ResultView";

type Props = {
  locale: Locale;
  fd: Dictionary["finderPage"];
  years: number[];
  currentYear: number;
  contact: ContactInfo;
  bookHref: string;
};

const placeFrom = (id?: string, meta?: string): PlaceOption | null => {
  if (!id || !meta) return null;
  const [name, state] = meta.split("|");
  return name ? { id, name, state: state ?? "" } : null;
};

const ORDER: FinderField[] = ["name", "deathDate", "deathTime", "deathPlaceId", "kind", "monthSystem", "year", "observancePlaceId", "notes"];
const fieldAnchor: Record<FinderField, string> = {
  name: "f-name",
  deathDate: "f-death-day",
  deathTime: "f-death-time",
  deathPlaceId: "f-death-place",
  kind: "f-kind-pitru",
  monthSystem: "f-system",
  year: "f-year",
  observancePlaceId: "f-obs-place",
  notes: "f-notes",
};

export function DateFinder({ locale, fd, years, currentYear, contact, bookHref }: Props) {
  const [state, action, pending] = useActionState<FinderState, FormData>(calculateShraddhaAction, { status: "idle" });
  const [showForm, setShowForm] = useState(true);
  const [lastState, setLastState] = useState(state);
  const summaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);

  if (state !== lastState) {
    setLastState(state);
    if (state.status === "done") setShowForm(false);
  }

  useEffect(() => {
    if (state.status === "invalid" || state.status === "rate-limited") summaryRef.current?.focus();
    if (state.status === "done" && !showForm) {
      resultRef.current?.focus();
      resultRef.current?.scrollIntoView({ block: "start" });
    }
  }, [state, showForm]);

  if (state.status === "done" && !showForm) {
    return (
      <ResultView
        ref={resultRef}
        state={state}
        locale={locale}
        fd={fd}
        contact={contact}
        bookHref={bookHref}
        onAgain={() => setShowForm(true)}
      />
    );
  }

  const v: FinderValues = state.values ?? {};
  const errors = state.status === "invalid" ? state.errors : {};
  const formKey = state.status === "idle" ? "initial" : JSON.stringify(v);

  return (
    <FinderForm
      key={formKey}
      locale={locale}
      fd={fd}
      years={years}
      currentYear={currentYear}
      values={v}
      errors={errors}
      rateLimited={state.status === "rate-limited"}
      pending={pending}
      action={action}
      summaryRef={summaryRef}
    />
  );
}

type FormProps = {
  locale: Locale;
  fd: Dictionary["finderPage"];
  years: number[];
  currentYear: number;
  values: FinderValues;
  errors: Partial<Record<FinderField, string>>;
  rateLimited: boolean;
  pending: boolean;
  action: (fd: FormData) => void;
  summaryRef: React.RefObject<HTMLDivElement | null>;
};

function FinderForm({ locale, fd, years, currentYear, values: v, errors, rateLimited, pending, action, summaryRef }: FormProps) {
  const f = fd.fields;
  const alt = locale === "hi" ? "en" : "hi";
  const [deathPlace, setDeathPlace] = useState<PlaceOption | null>(placeFrom(v.deathPlaceId, v.deathPlaceLabel));
  const [obsPlace, setObsPlace] = useState<PlaceOption | null>(placeFrom(v.observancePlaceId, v.observancePlaceLabel));
  const [samePlace, setSamePlace] = useState(v.samePlace === "on");
  const [timeUnknown, setTimeUnknown] = useState(v.timeUnknown === "on");
  const effectiveObs = samePlace ? deathPlace : obsPlace;

  const err = (field: FinderField) => (errors[field] ? fd.errors[errors[field] as keyof typeof fd.errors] : undefined);
  const describe = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(" ") || undefined;
  const errorList = ORDER.filter((k) => errors[k]);

  const deathYears = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);

  return (
    <form action={action} noValidate aria-busy={pending} className="space-y-10">
      {(errorList.length > 0 || rateLimited) && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-2xl border-2 border-danger bg-paper p-5 outline-none sm:p-6">
          {rateLimited ? (
            <p className="font-medium text-danger">{fd.rateLimited}</p>
          ) : (
            <>
              <p className="font-semibold text-danger">{fd.errorsTitle}</p>
              <ul className="mt-2 space-y-1">
                {errorList.map((k) => (
                  <li key={k}>
                    <a href={`#${fieldAnchor[k]}`} className="text-charcoal underline underline-offset-4">
                      {err(k)}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* 1. The departed */}
      <fieldset className="finder-card">
        <legend className="finder-legend">{fd.sections.departed}</legend>

        <div>
          <FieldLabel htmlFor="f-name" label={f.name.label} alt={f.name.alt} altLang={alt} />
          <input id="f-name" name="name" type="text" maxLength={80} defaultValue={v.name} aria-describedby="h-name" className="field-input" autoComplete="off" />
          <FieldHint id="h-name">{f.name.hint}</FieldHint>
        </div>

        <fieldset aria-describedby={describe("h-date", errors.deathDate && "e-date")}>
          <FieldLabel as="legend" label={f.deathDate.label} alt={f.deathDate.alt} altLang={alt} />
          <div className="grid grid-cols-[1fr_1.6fr_1.3fr] gap-2 sm:gap-3">
            <select id="f-death-day" name="deathDay" defaultValue={v.deathDay ?? ""} aria-label={f.day} aria-invalid={!!errors.deathDate || undefined} className="field-input">
              <option value="">{f.day}</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <select name="deathMonth" defaultValue={v.deathMonth ?? ""} aria-label={f.month} aria-invalid={!!errors.deathDate || undefined} className="field-input">
              <option value="">{f.month}</option>
              {fd.monthNames.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select name="deathYear" defaultValue={v.deathYear ?? ""} aria-label={f.yearPart} aria-invalid={!!errors.deathDate || undefined} className="field-input">
              <option value="">{f.yearPart}</option>
              {deathYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <FieldHint id="h-date">{f.deathDate.hint}</FieldHint>
          <FieldError id="e-date">{err("deathDate")}</FieldError>
        </fieldset>

        <div>
          <FieldLabel htmlFor="f-death-time" label={f.deathTime.label} alt={f.deathTime.alt} altLang={alt} />
          <input
            id="f-death-time"
            name="deathTime"
            type="time"
            defaultValue={v.deathTime}
            disabled={timeUnknown}
            aria-describedby={describe("h-time", errors.deathTime && "e-time")}
            aria-invalid={!!errors.deathTime || undefined}
            className="field-input max-w-xs disabled:opacity-50"
          />
          <label className="mt-3 flex min-h-12 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="timeUnknown"
              checked={timeUnknown}
              onChange={(e) => setTimeUnknown(e.target.checked)}
              className="h-6 w-6 accent-maroon"
            />
            <span>{f.timeUnknown}</span>
          </label>
          <FieldHint id="h-time">{f.deathTime.hint}</FieldHint>
          <FieldError id="e-time">{err("deathTime")}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor="f-death-place" label={f.deathPlace.label} alt={f.deathPlace.alt} altLang={alt} />
          <PlaceCombobox
            id="f-death-place"
            locale={locale}
            value={deathPlace}
            onChange={setDeathPlace}
            describedBy={describe("h-dplace", errors.deathPlaceId && "e-dplace")}
            invalid={!!errors.deathPlaceId}
            texts={fd.combobox}
          />
          <input type="hidden" name="deathPlaceId" value={deathPlace?.id ?? ""} />
          <input type="hidden" name="deathPlaceLabel" value={deathPlace ? `${deathPlace.name}|${deathPlace.state}` : ""} />
          <FieldHint id="h-dplace">{f.deathPlace.hint}</FieldHint>
          <FieldError id="e-dplace">{err("deathPlaceId")}</FieldError>
        </div>
      </fieldset>

      {/* 2. The Shraddha */}
      <fieldset className="finder-card">
        <legend className="finder-legend">{fd.sections.shraddha}</legend>

        <fieldset aria-describedby={errors.kind ? "e-kind" : undefined}>
          <FieldLabel as="legend" label={f.kind.label} alt={f.kind.alt} altLang={alt} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="choice-card">
              <input id="f-kind-pitru" type="radio" name="kind" value="pitru-paksha" defaultChecked={(v.kind ?? "pitru-paksha") === "pitru-paksha"} className="mt-1 h-6 w-6 shrink-0 accent-maroon" />
              <span>
                <span className="block font-semibold">{f.kindPitru}</span>
                <span className="block text-base text-muted">{f.kindPitruHint}</span>
              </span>
            </label>
            <label className="choice-card opacity-60">
              <input type="radio" name="kind" value="varshik" disabled className="mt-1 h-6 w-6 shrink-0" />
              <span>
                <span className="block font-semibold">{f.kindVarshik}</span>
                <span className="block text-base text-muted">{f.kindVarshikHint}</span>
              </span>
            </label>
          </div>
          <FieldError id="e-kind">{err("kind")}</FieldError>
        </fieldset>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="f-year" label={f.year.label} alt={f.year.alt} altLang={alt} />
            <select id="f-year" name="year" defaultValue={v.year ?? String(years[0])} aria-invalid={!!errors.year || undefined} aria-describedby={errors.year ? "e-year" : undefined} className="field-input">
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <FieldError id="e-year">{err("year")}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="f-system" label={f.monthSystem.label} alt={f.monthSystem.alt} altLang={alt} />
            <select id="f-system" name="monthSystem" defaultValue={v.monthSystem ?? "purnimanta"} aria-describedby="h-system" className="field-input">
              <option value="purnimanta">{f.purnimanta}</option>
              <option value="amanta">{f.amanta}</option>
            </select>
            <FieldHint id="h-system">{f.monthSystem.hint}</FieldHint>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="f-obs-place" label={f.observancePlace.label} alt={f.observancePlace.alt} altLang={alt} />
          <label className="mb-3 flex min-h-12 cursor-pointer items-center gap-3">
            <input type="checkbox" name="samePlace" checked={samePlace} onChange={(e) => setSamePlace(e.target.checked)} className="h-6 w-6 accent-maroon" />
            <span>{f.samePlace}</span>
          </label>
          <PlaceCombobox
            id="f-obs-place"
            locale={locale}
            value={effectiveObs}
            onChange={setObsPlace}
            disabled={samePlace}
            describedBy={describe("h-oplace", errors.observancePlaceId && "e-oplace")}
            invalid={!!errors.observancePlaceId}
            texts={fd.combobox}
          />
          <input type="hidden" name="observancePlaceId" value={effectiveObs?.id ?? ""} />
          <input type="hidden" name="observancePlaceLabel" value={effectiveObs ? `${effectiveObs.name}|${effectiveObs.state}` : ""} />
          <FieldHint id="h-oplace">{f.observancePlace.hint}</FieldHint>
          <FieldError id="e-oplace">{err("observancePlaceId")}</FieldError>
        </div>
      </fieldset>

      {/* 3. Family tradition */}
      <fieldset className="finder-card">
        <legend className="finder-legend">{fd.sections.family}</legend>
        <div>
          <FieldLabel htmlFor="f-notes" label={f.notes.label} alt={f.notes.alt} altLang={alt} />
          <textarea id="f-notes" name="notes" rows={3} maxLength={1000} defaultValue={v.notes} aria-describedby={describe("h-notes", errors.notes && "e-notes")} className="field-input min-h-28 py-3" />
          <FieldHint id="h-notes">{f.notes.hint}</FieldHint>
          <FieldError id="e-notes">{err("notes")}</FieldError>
        </div>
      </fieldset>

      <div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-maroon px-8 text-xl font-semibold text-ivory transition-colors hover:bg-maroon-hover disabled:cursor-wait disabled:opacity-80 sm:w-auto"
        >
          {pending && <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-ivory/40 border-t-ivory motion-reduce:animate-none" />}
          {pending ? fd.submitting : fd.submit}
        </button>
        <p aria-live="polite" className="sr-only">
          {pending ? fd.submitting : ""}
        </p>
        <p className="mt-4 text-base text-muted">{fd.privacy}</p>
      </div>
    </form>
  );
}
