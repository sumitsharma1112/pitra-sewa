import { Container } from "@/components/ui/Container";
import type { Dictionary } from "@/i18n/dictionaries";

export function TraditionSection({ dict }: { dict: Dictionary }) {
  const { tradition } = dict;
  return (
    <section aria-labelledby="tradition-heading" className="bg-sand">
      <Container className="py-20 lg:py-28">
        <h2 id="tradition-heading" lang="hi" className="text-h2">
          {tradition.heading}
        </h2>
        {tradition.headingNote && <p className="mt-3 text-lead text-muted">{tradition.headingNote}</p>}

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="text-h3">{tradition.earlierTitle}</h3>
            <p className="mt-3 max-w-xl">{tradition.earlierBody}</p>
          </div>
          <div>
            <h3 className="text-h3">{tradition.todayTitle}</h3>
            <ul className="mt-3 max-w-xl space-y-2.5">
              {tradition.todayItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.72em] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-12 max-w-3xl font-display text-2xl leading-snug text-maroon">{tradition.closing}</p>

        <h3 className="sr-only">{tradition.stepsTitle}</h3>
        <ol className="mt-12 grid md:grid-cols-3 md:gap-8">
          {tradition.steps.map((step, i) => {
            const last = i === tradition.steps.length - 1;
            return (
              <li
                key={step.title}
                className={`relative flex gap-5 pb-10 md:block md:pb-0 ${
                  last
                    ? ""
                    : "after:absolute after:bottom-0 after:left-7 after:top-16 after:w-px after:bg-gold/70 md:after:bottom-auto md:after:left-[4.5rem] md:after:right-[-1rem] md:after:top-7 md:after:h-px md:after:w-auto"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-ivory font-display text-2xl leading-none text-maroon"
                >
                  {step.num}
                </span>
                <div className="md:mt-6">
                  <h4 lang="hi" className="font-display text-h3 text-maroon">
                    {step.title}
                  </h4>
                  <p lang="en" className="text-base font-medium text-gold-ink">
                    {step.gloss}
                  </p>
                  <p className="mt-2 max-w-sm">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
