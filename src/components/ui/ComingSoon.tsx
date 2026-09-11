import { DiyaMark } from "@/components/brand/DiyaMark";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";

type Props = {
  title: string;
  heading: string;
  summary: string;
  back: { href: string; label: string };
};

/** Honest placeholder for routes that are planned but not built yet. */
export function ComingSoon({ title, heading, summary, back }: Props) {
  return (
    <Container className="py-20 lg:py-28">
      <div className="max-w-2xl">
        <DiyaMark className="h-14 w-14" />
        <h1 className="mt-6 text-h1">{title}</h1>
        <p className="mt-6 text-lead text-maroon">{heading}</p>
        <p className="mt-3 text-muted">{summary}</p>
        <ButtonLink href={back.href} variant="secondary" className="mt-9">
          {back.label}
        </ButtonLink>
      </div>
    </Container>
  );
}
