"use client";

import type { Ref } from "react";
import { indianStates } from "@/data/states-in";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, formatDate } from "@/lib/finder-format";
import { degreeMinute, grahaLabel, grahaOrder, nakshatraLabel, rashiLabel, relationLabel } from "@/lib/kundli-format";
import type { KundliState } from "@/lib/kundli-state";
import type { Chart } from "@/services/panchang/kundli";
import { PrintButton } from "@/components/finder/PrintButton";

type Done = Extract<KundliState, { status: "done" }>;
type AP = Dictionary["astrologyPage"];

type Props = {
  ref?: Ref<HTMLHeadingElement>;
  state: Done;
  locale: Locale;
  dict: Dictionary;
  onAgain: () => void;
};

const btn = "inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-lg font-semibold leading-tight transition-colors";

/** Plain-text summary of a chart's computed positions, for the "ask an AI" link -- real data only. */
function chartRowsText(chart: Chart, ap: AP): string {
  const r = ap.result;
  return grahaOrder
    .map((graha) => {
      const p = chart.positions.find((x) => x.graha === graha)!;
      const aspects = p.aspects.length ? p.aspects.map((g) => grahaLabel(g, ap)).join(", ") : r.noAspect;
      return `${grahaLabel(graha, ap)}: ${rashiLabel(p.rashi, ap)} ${degreeMinute(p.degreeInRashi)}, ${r.columns.nakshatra} ${nakshatraLabel(p.nakshatra, ap)} ${p.pada}, ${r.columns.house} ${p.house}, ${r.columns.relation}: ${relationLabel(p.relationToLagnaLord, ap)}, ${r.columns.aspects}: ${aspects}, ${p.retrograde ? r.retrograde : r.direct}`;
    })
    .join("\n");
}

function AskAiButton({ chart, ap }: { chart: Chart; ap: AP }) {
  const ascendantText = `${rashiLabel(chart.ascendant.rashi, ap)} ${degreeMinute(chart.ascendant.degreeInRashi)}`;
  const prompt = fill(ap.result.askAiPrompt, { ascendant: ascendantText, rows: chartRowsText(chart, ap) });
  const url = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`${btn} border-2 border-maroon text-maroon hover:bg-sand`}>
      {ap.result.askAi}
    </a>
  );
}

function ChartTable({ title, chart, ap, askAi }: { title: string; chart: Chart; ap: AP; askAi?: boolean }) {
  const r = ap.result;
  const anyBoundary = chart.ascendant.nearBoundary || chart.positions.some((p) => p.nearBoundary);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper">
      <div className="bg-maroon px-6 py-4 text-ivory">
        <h3 className="font-display text-xl">{title}</h3>
        <p className="mt-1 text-base text-gold-light">
          {r.ascendant}: {rashiLabel(chart.ascendant.rashi, ap)} {degreeMinute(chart.ascendant.degreeInRashi)}
          {chart.ascendant.nearBoundary ? " •" : ""}
          {fill(r.lordSuffix, { lord: grahaLabel(chart.ascendant.lord, ap) })}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left">
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
                {r.columns.relation}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {r.columns.aspects}
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
                  <td className="px-4 py-3">{relationLabel(p.relationToLagnaLord, ap)}</td>
                  <td className="px-4 py-3">{p.aspects.length ? p.aspects.map((g) => grahaLabel(g, ap)).join(", ") : r.noAspect}</td>
                  <td className="px-4 py-3">{p.retrograde ? r.retrograde : r.direct}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 border-t border-line bg-ivory px-6 py-4 text-base leading-relaxed text-muted">
        {anyBoundary && <p>{r.boundaryNote}</p>}
        <p>{r.relationNote}</p>
        {askAi && (
          <div className="no-print pt-1">
            <AskAiButton chart={chart} ap={ap} />
          </div>
        )}
      </div>
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
      <ChartTable title={fill(r.varshphalTitle, { year: summary.varshphalYear })} chart={varshphal} ap={ap} askAi />

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
