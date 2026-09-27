"use client";

import type { Ref } from "react";
import { indianStates } from "@/data/states-in";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, formatDate } from "@/lib/finder-format";
import { degreeMinute, grahaLabel, grahaOrder, nakshatraLabel, rashiLabel } from "@/lib/kundli-format";
import type { KundliState } from "@/lib/kundli-state";
import type { Chart } from "@/services/panchang/kundli";
import { PrintButton } from "@/components/finder/PrintButton";

type Done = Extract<KundliState, { status: "done" }>;

type Props = {
  ref?: Ref<HTMLHeadingElement>;
  state: Done;
  locale: Locale;
  dict: Dictionary;
  onAgain: () => void;
};

const btn = "inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-lg font-semibold leading-tight transition-colors";

function ChartTable({ title, chart, ap }: { title: string; chart: Chart; ap: Dictionary["astrologyPage"] }) {
  const r = ap.result;
  const anyBoundary = chart.ascendant.nearBoundary || chart.positions.some((p) => p.nearBoundary);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper">
      <div className="bg-maroon px-6 py-4 text-ivory">
        <h3 className="font-display text-xl">{title}</h3>
        <p className="mt-1 text-base text-gold-light">
          {r.ascendant}: {rashiLabel(chart.ascendant.rashi, ap)} {degreeMinute(chart.ascendant.degreeInRashi)}
          {chart.ascendant.nearBoundary ? " •" : ""}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left">
          <thead>
            <tr className="border-b border-line text-base text-muted">
              <th scope="col" className="px-4 py-3 font-medium">
                {r.columns.graha}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {r.columns.rashi}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {r.columns.degree}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {r.columns.nakshatra}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {r.columns.pada}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {r.columns.house}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {r.columns.retrograde}
              </th>
            </tr>
          </thead>
          <tbody>
            {grahaOrder.map((graha) => {
              const p = chart.positions.find((x) => x.graha === graha)!;
              return (
                <tr key={graha} className="border-b border-dashed border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-charcoal">{grahaLabel(graha, ap)}</td>
                  <td className="px-4 py-3">{rashiLabel(p.rashi, ap)}</td>
                  <td className="px-4 py-3">
                    {degreeMinute(p.degreeInRashi)}
                    {p.nearBoundary ? " •" : ""}
                  </td>
                  <td className="px-4 py-3">{nakshatraLabel(p.nakshatra, ap)}</td>
                  <td className="px-4 py-3">{p.pada}</td>
                  <td className="px-4 py-3">{p.house}</td>
                  <td className="px-4 py-3">{p.retrograde ? r.retrograde : r.direct}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {anyBoundary && <p className="border-t border-line bg-ivory px-6 py-4 text-base leading-relaxed text-muted">{r.boundaryNote}</p>}
    </div>
  );
}

export function ChartResult({ ref, state, locale, dict, onAgain }: Props) {
  const ap = dict.astrologyPage;
  const r = ap.result;
  const { summary, birth, varshphal } = state;
  const place = (p: { name: string; state: string }) => `${p.name}, ${indianStates[p.state]?.[locale] ?? ""}`;

  return (
    <div className="space-y-8">
      <div className="no-print">
        <h2 ref={ref} tabIndex={-1} className="text-h2 outline-none">
          {summary.name || r.birthChartTitle}
        </h2>
        <p className="mt-2 text-lead">
          {formatDate(summary.birthDate, locale)} · {summary.birthTime} · {place(summary.birthPlace)}
        </p>
      </div>

      <ChartTable title={r.birthChartTitle} chart={birth} ap={ap} />
      <ChartTable title={fill(r.varshphalTitle, { year: summary.varshphalYear })} chart={varshphal} ap={ap} />

      <p className="max-w-2xl border-l-2 border-gold pl-4 text-base text-muted">{ap.disclaimer}</p>

      <div className="no-print flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onAgain} className={`${btn} border-2 border-maroon text-maroon hover:bg-sand`}>
          {r.again}
        </button>
        <PrintButton label={r.print} className={`${btn} bg-maroon text-ivory hover:bg-maroon-hover`} />
      </div>
    </div>
  );
}
