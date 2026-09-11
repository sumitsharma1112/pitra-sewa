import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { href } from "@/i18n/routes";

/** Calendar page with a crescent: the Tithi is a lunar day. */
function LunarCalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect x="4" y="6.5" width="24" height="21" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 12.5h24M10.5 4v5M21.5 4v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18.8 16.2a5 5 0 1 0 0 7.6 4 4 0 1 1 0-7.6Z" fill="currentColor" />
    </svg>
  );
}

export function DateFinderPreview({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { finder, cta } = dict;
  const rows = finder.sample.rows;
  return (
    <section aria-labelledby="finder-heading" className="border-t border-line">
      <Container className="py-20 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <h2 id="finder-heading" className="text-h2">
              {finder.heading}
            </h2>
            <p className="mt-5 text-lead">{finder.body}</p>

            <h3 className="mt-9 font-sans text-lg font-semibold text-charcoal">{finder.needTitle}</h3>
            <ul className="mt-3 space-y-2">
              {finder.needItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.72em] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <ButtonLink href={href(locale, "dateFinder")} className="mt-9">
              {cta.findTithi}
            </ButtonLink>
            <p className="mt-5 max-w-lg border-l-2 border-gold pl-4 text-base text-muted">{finder.status}</p>
          </div>

          <figure className="overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_24px_48px_-32px_rgba(74,22,32,0.45)] lg:col-span-5 lg:col-start-8">
            <div className="flex items-center justify-between gap-3 bg-maroon px-6 py-4 text-ivory">
              <span className="flex items-center gap-3">
                <LunarCalendarIcon className="h-7 w-7 text-gold-light" />
                <span className="font-display text-xl">{finder.sample.title}</span>
              </span>
              <span className="rounded-full border border-gold-light/70 px-3 py-0.5 text-sm text-gold-light">
                {finder.sample.label}
              </span>
            </div>
            <dl className="px-6">
              {rows.map((row, i) => (
                <div
                  key={row.k}
                  className={`flex items-baseline justify-between gap-6 py-3.5 ${
                    i < rows.length - 1 ? "border-b border-dashed border-line" : ""
                  }`}
                >
                  <dt className="text-base text-muted">{row.k}</dt>
                  <dd
                    className={`text-right ${
                      i === rows.length - 1 ? "text-base italic text-muted" : "font-medium text-charcoal"
                    }`}
                  >
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
            <figcaption className="border-t border-line bg-ivory px-6 py-4 text-[0.95rem] leading-relaxed text-muted">
              {finder.sample.footnote}
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
