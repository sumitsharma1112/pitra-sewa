import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { href } from "@/i18n/routes";
import { fill, formatDate } from "@/lib/finder-format";
import { currentOrNextPitruPaksha } from "@/services/panchang/astro";

/**
 * Pages here are statically generated, so this date range is fixed at build
 * time (redeploy to refresh) — acceptable since it only changes once a year.
 */
export function PitruPakshaPanel({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const window = currentOrNextPitruPaksha();
  if (!window) return null;

  const { pitruPakshaPanel: p, why, cta } = dict;
  const dateRange = fill(p.dateRange, {
    start: formatDate(window.start, locale, false),
    end: formatDate(window.end, locale, false),
  });

  return (
    <section aria-labelledby="pitru-paksha-heading" className="border-t border-line">
      <Container className="py-14 lg:py-20">
        <div className="flex flex-col gap-8 rounded-2xl border border-line bg-paper p-6 sm:p-8 md:flex-row md:items-start md:justify-between">
          <div className="md:max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-gold-ink">{p.eyebrow}</p>
            <h2 id="pitru-paksha-heading" className="mt-1 text-h2">
              {fill(p.heading, { year: window.year })}
            </h2>
            <p className="mt-3 font-display text-2xl text-maroon">{dateRange}</p>
            <p className="mt-5 text-lead">{why.pakshaBody}</p>
            <p className="mt-4 max-w-xl text-base text-muted">{p.note}</p>
            {window.adhikNearby && <p className="mt-3 max-w-xl text-base text-danger">{p.adhikNote}</p>}
          </div>
          <ButtonLink href={href(locale, "dateFinder")} className="shrink-0">
            {cta.findTithi}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
