import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { getDictionary } from "@/i18n/dictionaries";
import { hasLocale, defaultLocale } from "@/i18n/config";
import { locale as localeParam } from "next/root-params";

export default async function NotFound() {
  const raw = await localeParam();
  const locale = hasLocale(raw) ? raw : defaultLocale;
  const dict = await getDictionary(locale);
  return (
    <Container className="py-24">
      <h1 className="text-h1">{dict.notFound.title}</h1>
      <p className="mt-5 text-lead text-muted">{dict.notFound.body}</p>
      <ButtonLink href={`/${locale}`} className="mt-9">
        {dict.notFound.back}
      </ButtonLink>
    </Container>
  );
}
