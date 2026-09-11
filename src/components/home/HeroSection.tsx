import { DiyaNiche } from "@/components/brand/DiyaNiche";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { href } from "@/i18n/routes";

export function HeroSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { hero, brand, cta } = dict;
  return (
    <section aria-labelledby="hero-heading">
      <Container className="grid items-center gap-8 pb-16 pt-8 sm:pt-12 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-14">
        <div className="lg:col-span-7">
          <h1 id="hero-heading" lang="hi" className="max-w-[12ch] text-h1 sm:max-w-none">
            {brand.tagline}
          </h1>
          <p lang="en" className="mt-4 max-w-xl font-display text-[1.3rem] italic leading-snug text-gold-ink sm:text-2xl">
            {hero.subtitleEn}
          </p>
          <p className="mt-8 max-w-[36rem] text-lead">{hero.lead}</p>
          <p className="mt-3 max-w-[36rem] text-muted">{hero.body}</p>

          <div id="hero-actions" className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={href(locale, "dateFinder")}>{cta.findTithi}</ButtonLink>
            <ButtonLink href={href(locale, "bookSewa")} variant="secondary">
              {cta.bookSewa}
            </ButtonLink>
          </div>

          <p className="mt-10 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span aria-hidden="true" className="h-px w-10 self-center bg-gold" />
            <span lang="hi" className="font-display text-xl text-maroon">
              {brand.taglineAlt}
            </span>
            {hero.trustNote && <span className="text-base text-muted">{hero.trustNote}</span>}
          </p>
        </div>

        <div className="-order-1 flex justify-start lg:order-none lg:col-span-5 lg:justify-center">
          <DiyaNiche className="h-auto w-36 sm:w-48 lg:w-full lg:max-w-[25rem]" />
        </div>
      </Container>
    </section>
  );
}
