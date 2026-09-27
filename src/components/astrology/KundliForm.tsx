"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { calculateKundliAction } from "@/app/[locale]/astrology/actions";
import { FieldError, FieldHint, FieldLabel } from "@/components/finder/FieldLabel";
import { PlaceCombobox } from "@/components/finder/PlaceCombobox";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { KundliState, KundliValues } from "@/lib/kundli-state";
import type { PlaceOption } from "@/lib/place-search";
import type { KundliField } from "@/lib/validation/kundli";
import { ChartResult } from "./ChartResult";

type Props = { locale: Locale; dict: Dictionary; currentYear: number };

const placeFrom = (id?: string, meta?: string): PlaceOption | null => {
  if (!id || !meta) return null;
  const [name, state] = meta.split("|");
  return name ? { id, name, state: state ?? "" } : null;
};

const ORDER: KundliField[] = ["name", "birthDate", "birthTime", "birthPlaceId", "varshphalYear"];
const fieldAnchor: Record<KundliField, string> = {
  name: "k-name",
  birthDate: "k-birth-day",
  birthTime: "k-birth-time",
  birthPlaceId: "k-birth-place",
  varshphalYear: "k-varshphal-year",
};

export function KundliForm({ locale, dict, currentYear }: Props) {
  const ap = dict.astrologyPage;
  const [state, action, pending] = useActionState<KundliState, FormData>(calculateKundliAction, { status: "idle" });
  const [showForm, setShowForm] = useState(true);
  const [lastState, setLastState] = useState(state);
  const summaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);

  if (state !== lastState) {
    setLastState(state);
    if (state.status === "done") setShowForm(false);
  }

  useEffect(() => {
    if (state.status === "invalid" || state.status === "rate-limited" || state.status === "out-of-range") summaryRef.current?.focus();
    if (state.status === "done" && !showForm) {
      resultRef.current?.focus();
      resultRef.current?.scrollIntoView({ block: "start" });
    }
  }, [state, showForm]);

  if (state.status === "done" && !showForm) {
    return <ChartResult ref={resultRef} state={state} locale={locale} dict={dict} onAgain={() => setShowForm(true)} />;
  }

  const v: KundliValues = state.values ?? {};
  const errors = state.status === "invalid" ? state.errors : {};
  const alt = locale === "hi" ? "en" : "hi";
  const f = ap.fields;

  const err = (field: KundliField) => (errors[field] ? ap.errors[errors[field]!] : undefined);
  const describe = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(" ") || undefined;
  const errorList = ORDER.filter((k) => errors[k]);
  const birthYears = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);

  return (
    <KundliFormFields
      key={state.status === "idle" ? "initial" : JSON.stringify(v)}
      locale={locale}
      ap={ap}
      fd={dict.finderPage}
      alt={alt}
      f={f}
      v={v}
      err={err}
      errors={errors}
      errorList={errorList}
      describe={describe}
      birthYears={birthYears}
      currentYear={currentYear}
      rateLimited={state.status === "rate-limited"}
      outOfRange={state.status === "out-of-range"}
      pending={pending}
      action={action}
      summaryRef={summaryRef}
    />
  );
}

type FieldsProps = {
  locale: Locale;
  ap: Dictionary["astrologyPage"];
  fd: Dictionary["finderPage"];
  alt: string;
  f: Dictionary["astrologyPage"]["fields"];
  v: KundliValues;
  err: (field: KundliField) => string | undefined;
  errors: Partial<Record<KundliField, string>>;
  errorList: KundliField[];
  describe: (...ids: (string | false | undefined)[]) => string | undefined;
  birthYears: number[];
  currentYear: number;
  rateLimited: boolean;
  outOfRange: boolean;
  pending: boolean;
  action: (fd: FormData) => void;
  summaryRef: React.RefObject<HTMLDivElement | null>;
};

function KundliFormFields({
  locale,
  ap,
  fd,
  alt,
  f,
  v,
  err,
  errors,
  errorList,
  describe,
  birthYears,
  currentYear,
  rateLimited,
  outOfRange,
  pending,
  action,
  summaryRef,
}: FieldsProps) {
  const [birthPlace, setBirthPlace] = useState<PlaceOption | null>(placeFrom(v.birthPlaceId, v.birthPlaceLabel));

  return (
    <form action={action} noValidate aria-busy={pending} className="space-y-10">
      {(errorList.length > 0 || rateLimited || outOfRange) && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-2xl border-2 border-danger bg-paper p-5 outline-none sm:p-6">
          {rateLimited ? (
            <p className="font-medium text-danger">{ap.rateLimited}</p>
          ) : outOfRange ? (
            <p className="font-medium text-danger">{ap.outOfRange}</p>
          ) : (
            <>
              <p className="font-semibold text-danger">{ap.errorsTitle}</p>
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

      <fieldset className="finder-card">
        <legend className="finder-legend">{ap.sections.birth}</legend>

        <div>
          <FieldLabel htmlFor="k-name" label={f.name.label} alt={f.name.alt} altLang={alt} />
          <input id="k-name" name="name" type="text" maxLength={80} defaultValue={v.name} aria-describedby="kh-name" className="field-input" autoComplete="off" />
          <FieldHint id="kh-name">{f.name.hint}</FieldHint>
        </div>

        <fieldset aria-describedby={describe("kh-date", errors.birthDate && "ke-date")}>
          <FieldLabel as="legend" label={f.birthDate.label} alt={f.birthDate.alt} altLang={alt} />
          <div className="grid grid-cols-[1fr_1.6fr_1.3fr] gap-2 sm:gap-3">
            <select id="k-birth-day" name="birthDay" defaultValue={v.birthDay ?? ""} aria-label={fd.fields.day} aria-invalid={!!errors.birthDate || undefined} className="field-input">
              <option value="">{fd.fields.day}</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <select name="birthMonth" defaultValue={v.birthMonth ?? ""} aria-label={fd.fields.month} aria-invalid={!!errors.birthDate || undefined} className="field-input">
              <option value="">{fd.fields.month}</option>
              {fd.monthNames.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select name="birthYear" defaultValue={v.birthYear ?? ""} aria-label={fd.fields.yearPart} aria-invalid={!!errors.birthDate || undefined} className="field-input">
              <option value="">{fd.fields.yearPart}</option>
              {birthYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <FieldHint id="kh-date">{f.birthDate.hint}</FieldHint>
          <FieldError id="ke-date">{err("birthDate")}</FieldError>
        </fieldset>

        <div>
          <FieldLabel htmlFor="k-birth-time" label={f.birthTime.label} alt={f.birthTime.alt} altLang={alt} />
          <input
            id="k-birth-time"
            name="birthTime"
            type="time"
            defaultValue={v.birthTime}
            aria-describedby={describe("kh-time", errors.birthTime && "ke-time")}
            aria-invalid={!!errors.birthTime || undefined}
            className="field-input max-w-xs"
          />
          <FieldHint id="kh-time">{f.birthTime.hint}</FieldHint>
          <FieldError id="ke-time">{err("birthTime")}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor="k-birth-place" label={f.birthPlace.label} alt={f.birthPlace.alt} altLang={alt} />
          <PlaceCombobox
            id="k-birth-place"
            locale={locale}
            value={birthPlace}
            onChange={setBirthPlace}
            describedBy={describe("kh-place", errors.birthPlaceId && "ke-place")}
            invalid={!!errors.birthPlaceId}
            texts={fd.combobox}
          />
          <input type="hidden" name="birthPlaceId" value={birthPlace?.id ?? ""} />
          <input type="hidden" name="birthPlaceLabel" value={birthPlace ? `${birthPlace.name}|${birthPlace.state}` : ""} />
          <FieldHint id="kh-place">{f.birthPlace.hint}</FieldHint>
          <FieldError id="ke-place">{err("birthPlaceId")}</FieldError>
        </div>
      </fieldset>

      <fieldset className="finder-card">
        <legend className="finder-legend">{ap.sections.varshphal}</legend>
        <div>
          <FieldLabel htmlFor="k-varshphal-year" label={f.varshphalYear.label} alt={f.varshphalYear.alt} altLang={alt} />
          <input
            id="k-varshphal-year"
            name="varshphalYear"
            type="number"
            min={1900}
            max={2060}
            defaultValue={v.varshphalYear ?? String(currentYear)}
            aria-describedby={describe("kh-year", errors.varshphalYear && "ke-year")}
            aria-invalid={!!errors.varshphalYear || undefined}
            className="field-input max-w-xs"
          />
          <FieldHint id="kh-year">{f.varshphalYear.hint}</FieldHint>
          <FieldError id="ke-year">{err("varshphalYear")}</FieldError>
        </div>
      </fieldset>

      <div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-maroon px-8 text-xl font-semibold text-ivory transition-colors hover:bg-maroon-hover disabled:cursor-wait disabled:opacity-80 sm:w-auto"
        >
          {pending && <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-ivory/40 border-t-ivory motion-reduce:animate-none" />}
          {pending ? ap.submitting : ap.submit}
        </button>
        <p aria-live="polite" className="sr-only">
          {pending ? ap.submitting : ""}
        </p>
        <p className="mt-4 text-base text-muted">{ap.privacy}</p>
      </div>
    </form>
  );
}
