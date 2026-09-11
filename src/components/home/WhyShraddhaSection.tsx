import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { href } from "@/i18n/routes";

export function WhyShraddhaSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { why, cta } = dict;
  return (
    <section aria-labelledby="why-heading" className="border-t border-line">
      <Container className="py-20 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <h2 id="why-heading" className="text-h2">
              {why.heading}
            </h2>
            <p className="mt-5 text-lead">{why.intro}</p>

            <div className="mt-10 space-y-8">
              <div>
                <h3 className="text-h3">{why.whatTitle}</h3>
                <p className="mt-2">{why.whatBody}</p>
              </div>
              <div>
                <h3 className="text-h3">{why.pakshaTitle}</h3>
                <p className="mt-2">{why.pakshaBody}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <h3 className="text-h3">{why.valuesTitle}</h3>
            <dl className="mt-5 divide-y divide-line border-y border-line">
              {why.values.map((v) => (
                <div key={v.term} className="grid grid-cols-[7rem_1fr] gap-x-5 py-5 sm:grid-cols-[9rem_1fr]">
                  <dt>
                    <span lang="hi" className="block font-display text-[1.75rem] leading-tight text-maroon">
                      {v.term}
                    </span>
                    {v.label && <span className="mt-0.5 block text-base text-gold-ink">{v.label}</span>}
                  </dt>
                  <dd className="self-center">{v.meaning}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="text-h3">{why.bhojanTitle}</h3>
                <p className="mt-2">{why.bhojanBody}</p>
              </div>
              <div>
                <h3 className="text-h3">{why.todayTitle}</h3>
                <p className="mt-2">{why.todayBody}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 rounded-2xl border border-line bg-paper p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl text-muted">{why.note}</p>
          <ButtonLink href={href(locale, "whatIsShraddha")} variant="secondary" className="shrink-0">
            {cta.learnShraddha}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
