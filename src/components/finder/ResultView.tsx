"use client";

import Link from "next/link";
import type { Ref } from "react";
import { indianStates } from "@/data/states-in";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill, formatClock, formatDate, formatTime, monthLabel, tithiLabel } from "@/lib/finder-format";
import type { FinderState } from "@/lib/finder-state";
import type { ShraddhaResult } from "@/services/panchang/types";
import { PrintButton } from "./PrintButton";
import { VerificationPanel } from "./VerificationPanel";

export type ContactInfo = { whatsappDigits?: string; email?: string };
type Done = Extract<FinderState, { status: "done" }>;

type Props = {
  ref?: Ref<HTMLHeadingElement>;
  state: Done;
  locale: Locale;
  fd: Dictionary["finderPage"];
  contact: ContactInfo;
  bookHref: string;
  onAgain: () => void;
};

const btn = "inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-lg font-semibold leading-tight transition-colors";

export function ResultView({ ref, state, locale, fd, contact, bookHref, onAgain }: Props) {
  const r = fd.result;
  const { summary, outcome } = state;
  const result: ShraddhaResult | null = outcome.status === "result" ? outcome.result : null;
  const place = (p: { name: string; state: string }) => `${p.name}, ${indianStates[p.state]?.[locale] ?? ""}`;
  const or = (xs: string[]) => xs.join(r.or);

  const status =
    result?.confidence === "calculated"
      ? { tone: "ok", text: r.statusCalculated }
      : { tone: "verify", text: r.statusVerify };

  let problem: { title: string; body: string } | null = null;
  if (outcome.status === "not-configured") problem = { title: r.notConfiguredTitle, body: r.notConfiguredBody };
  else if (outcome.status === "service-error") problem = { title: r.serviceErrorTitle, body: r.serviceErrorBody };
  else if (outcome.status === "unsupported") problem = { title: r.notFoundTitle, body: r.notFoundBody };

  const dates = result?.observance.options ?? [];
  const deathTithiText = result ? or(result.death.tithiCandidates.map((i) => tithiLabel(i, fd))) : null;
  const month = result?.death.month;

  const inputRows: [string, string][] = [
    [r.rows.departed, summary.name || "—"],
    [r.rows.deathDate, formatDate(summary.deathDate, locale)],
    [r.rows.deathTime, summary.deathTime ? formatClock(summary.deathTime, locale) : r.unknown],
    [r.rows.deathPlace, place(summary.deathPlace)],
    [r.rows.kind, fd.fields.kindPitru],
    [r.rows.year, String(summary.year)],
    [r.rows.observancePlace, place(summary.observancePlace)],
    [r.rows.convention, fill(r.conventionValue, { system: fd.systems[summary.monthSystem] })],
  ];
  if (summary.notes) inputRows.push([r.rows.notes, summary.notes]);

  const calcRows: [string, string][] = result
    ? [
        [r.rows.deathTithi, deathTithiText!],
        ...(month
          ? ([[r.rows.lunarMonth, monthLabel(month.amanta, month.isAdhik, result.death.tithiCandidates[0], summary.monthSystem, fd)]] as [string, string][])
          : []),
        [r.rows.shraddhaTithi, tithiLabel(result.shraddhaTithi, fd)],
        ...dates.flatMap((o): [string, string][] => [
          [
            r.rows.sunrise + (dates.length > 1 ? ` · ${formatDate(o.date, locale, false)}` : ""),
            `${formatTime(o.sunrise, locale)} / ${formatTime(o.sunset, locale)}`,
          ],
          [
            r.rows.aparahna + (dates.length > 1 ? ` · ${formatDate(o.date, locale, false)}` : ""),
            `${formatTime(o.aparahna.start, locale)}${r.to}${formatTime(o.aparahna.end, locale)}` +
              (o.coverageMinutes > 0 && dates.length > 1 ? ` (${fill(r.coverage, { minutes: o.coverageMinutes })})` : ""),
          ],
        ]),
        [
          r.rows.sources,
          result.sources.primary.label + (result.sources.secondary ? ` · ${fill(r.crossChecked, { source: result.sources.secondary.label })}` : ""),
        ],
      ]
    : [];

  return (
    <section aria-labelledby="result-heading" className="space-y-8">
      {state.synthetic && (
        <p role="note" className="rounded-xl border-2 border-dashed border-danger bg-paper p-4 font-semibold text-danger">
          {fd.testData}
        </p>
      )}

      <div className="print-only mb-6 hidden items-center justify-between border-b border-line pb-4">
        <span className="font-display text-2xl text-maroon">पितृ सेवा · Pitra Sewa</span>
        <span className="text-base">
          {r.reference}: {state.reference}
        </span>
      </div>

      <div>
        <h2 id="result-heading" ref={ref} tabIndex={-1} className="text-h2 outline-none">
          {r.heading}
        </h2>
        {result && (
          <p
            className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-base font-semibold ${
              status.tone === "ok" ? "bg-[#E6EFE3] text-[#2F5A2B]" : "bg-[#F7E7D2] text-[#7A4210]"
            }`}
          >
            <span aria-hidden="true">{status.tone === "ok" ? "✓" : "!"}</span>
            {status.text}
          </p>
        )}
      </div>

      {problem && (
        <div role="status" className="rounded-2xl border border-line bg-paper p-6">
          <p className="text-xl font-semibold text-maroon">{problem.title}</p>
          <p className="mt-2">{problem.body}</p>
        </div>
      )}

      <article className="overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_24px_48px_-32px_rgba(74,22,32,0.45)] print:shadow-none">
        <header className="flex flex-wrap items-center justify-between gap-2 bg-maroon px-6 py-4 text-ivory print:border-b print:border-line print:bg-white print:text-maroon">
          <span className="font-display text-xl">{r.heading}</span>
          <span className="text-sm text-gold-light print:text-muted">
            {r.reference}: {state.reference}
          </span>
        </header>

        {result && result.alternatives.length > 0 && (
          <div className="border-b border-line px-6 py-6">
            <p className="text-base text-muted">{r.possibleDays}</p>
            <ul className="mt-3 space-y-4">
              {[
                { deathTithi: result.death.tithiCandidates[0], shraddhaTithi: result.shraddhaTithi, observance: result.observance },
                ...result.alternatives,
              ].map((c) => (
                <li key={c.deathTithi}>
                  <p className="text-base">{fill(r.ifTithi, { tithi: tithiLabel(c.deathTithi, fd) })}</p>
                  <p className="font-display text-2xl leading-snug text-maroon">
                    {or(c.observance.options.map((o) => formatDate(o.date, locale)))}
                  </p>
                  <p className="text-base text-muted">{tithiLabel(c.shraddhaTithi, fd)}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result && result.alternatives.length === 0 && dates.length > 0 && (
          <div className="border-b border-line px-6 py-6">
            <p className="text-base text-muted">{r.rows.shraddhaDate}</p>
            <p className="mt-1 font-display text-3xl leading-snug text-maroon sm:text-4xl">
              {or(dates.map((o) => formatDate(o.date, locale)))}
            </p>
            <p className="mt-2 text-lg">
              {tithiLabel(result.shraddhaTithi, fd)} · {fd.fields.kindPitru}
            </p>
          </div>
        )}

        <dl className="px-6">
          <SlipSection title={r.inputsTitle} rows={inputRows} />
          {calcRows.length > 0 && <SlipSection title={r.calcTitle} rows={calcRows} />}
        </dl>
      </article>

      {result && result.reasons.length > 0 && (
        <div className="rounded-2xl border-l-4 border-gold bg-paper p-6">
          <h3 className="font-sans text-lg font-semibold text-charcoal">{r.reasonsTitle}</h3>
          <ul className="mt-3 space-y-2">
            {result.reasons.map((reason) => (
              <li key={reason.code} className="flex gap-3">
                <span aria-hidden="true" className="mt-[0.72em] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
                <span>{fill(r.reasons[reason.code], { minutes: reason.minutes ?? "" })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-sans text-lg font-semibold text-charcoal">{r.traditionsTitle}</h3>
        <ul className="mt-3 space-y-2 text-muted">
          {r.traditions.map((t) => (
            <li key={t} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.72em] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="border-t border-line pt-6 text-base leading-relaxed text-muted">{r.disclaimer}</p>

      <div className="no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href={bookHref} className={`${btn} bg-maroon text-ivory hover:bg-maroon-hover`}>
          {r.actions.book}
        </Link>
        <PrintButton label={r.actions.print} className={`${btn} border-2 border-maroon text-maroon hover:bg-sand`} />
        <a href="#verify" className={`${btn} border-2 border-maroon text-maroon hover:bg-sand`}>
          {r.actions.verify}
        </a>
        <button type="button" onClick={onAgain} className={`${btn} text-maroon underline underline-offset-4`}>
          {r.actions.again}
        </button>
      </div>

      <VerificationPanel state={state} locale={locale} fd={fd} contact={contact} />

      <p className="print-only hidden text-sm text-muted">
        {fill(r.printFooter, { date: formatDate(state.generatedAt.slice(0, 10), locale, false) })}
      </p>
    </section>
  );
}

function SlipSection({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="py-4">
      <dt className="sr-only">{title}</dt>
      <p aria-hidden="true" className="pb-2 pt-1 text-sm font-semibold text-gold-ink">
        {title}
      </p>
      {rows.map(([k, val], i) => (
        <div key={k + i} className="slip-row flex flex-col gap-0.5 border-b border-dashed border-line py-3 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
          <dt className="text-base text-muted">{k}</dt>
          <dd className="font-medium text-charcoal sm:text-right">{val}</dd>
        </div>
      ))}
    </div>
  );
}
