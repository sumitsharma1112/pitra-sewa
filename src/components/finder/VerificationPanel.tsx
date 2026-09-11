"use client";

import { indianStates } from "@/data/states-in";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill, formatClock, formatDate, respectfulName, tithiLabel } from "@/lib/finder-format";
import type { FinderState } from "@/lib/finder-state";
import { PrintButton } from "./PrintButton";
import type { ContactInfo } from "./ResultView";

type Done = Extract<FinderState, { status: "done" }>;

/** Plain-text slip used for WhatsApp and email (the family sends it themselves). */
export function verificationMessage(state: Done, locale: Locale, fd: Dictionary["finderPage"]): string {
  const r = fd.result;
  const s = state.summary;
  const place = (p: { name: string; state: string }) => `${p.name}, ${indianStates[p.state]?.[locale] ?? ""}`;
  const lines = [
    fd.verify.messageIntro,
    `${r.reference}: ${state.reference}`,
    `${r.rows.departed}: ${respectfulName(s.name, locale) || "—"}`,
    `${r.rows.deathDate}: ${formatDate(s.deathDate, locale, false)}`,
    `${r.rows.deathTime}: ${s.deathTime ? formatClock(s.deathTime, locale) : r.unknown}`,
    `${r.rows.deathPlace}: ${place(s.deathPlace)}`,
    `${r.rows.year}: ${s.year} · ${fd.fields.kindPitru}`,
    `${r.rows.observancePlace}: ${place(s.observancePlace)}`,
    `${r.rows.convention}: ${fd.systems[s.monthSystem]}`,
  ];
  if (state.outcome.status === "result") {
    const res = state.outcome.result;
    lines.push(`${r.rows.deathTithi}: ${res.death.tithiCandidates.map((i) => tithiLabel(i, fd)).join(r.or)}`);
    lines.push(`${r.rows.shraddhaTithi}: ${tithiLabel(res.shraddhaTithi, fd)}`);
    lines.push(`${r.rows.shraddhaDate}: ${formatDate(res.observance.options[0].date, locale, false)}`);
    for (const alt of res.alternatives) {
      lines.push(
        `${fill(r.ifTithi, { tithi: tithiLabel(alt.deathTithi, fd) })}: ${formatDate(alt.observance.options[0].date, locale, false)}`,
      );
    }
    lines.push(`(${res.confidence === "calculated" ? r.statusCalculated : r.statusVerify})`);
  }
  if (s.notes) lines.push(`${r.rows.notes}: ${s.notes}`);
  return lines.join("\n");
}

export function VerificationPanel({ state, locale, fd, contact }: { state: Done; locale: Locale; fd: Dictionary["finderPage"]; contact: ContactInfo }) {
  const message = verificationMessage(state, locale, fd);
  const btn = "inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-lg font-semibold leading-tight";
  const hasContact = Boolean(contact.whatsappDigits || contact.email);

  return (
    <section id="verify" aria-labelledby="verify-heading" className="no-print scroll-mt-28 rounded-2xl bg-sand p-6 sm:p-8">
      <h3 id="verify-heading" className="text-h3">
        {fd.verify.title}
      </h3>
      <p className="mt-2 max-w-2xl">{hasContact ? fd.verify.body : fd.verify.noContact}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {contact.whatsappDigits && (
          <a
            href={`https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btn} bg-maroon text-ivory hover:bg-maroon-hover`}
          >
            {fd.verify.whatsapp}
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}?subject=${encodeURIComponent(fill(fd.verify.emailSubject, { reference: state.reference }))}&body=${encodeURIComponent(message)}`}
            className={`${btn} border-2 border-maroon text-maroon hover:bg-ivory`}
          >
            {fd.verify.email}
          </a>
        )}
        <PrintButton label={fd.result.actions.print} className={`${btn} border-2 border-maroon text-maroon hover:bg-ivory`} />
      </div>
    </section>
  );
}
