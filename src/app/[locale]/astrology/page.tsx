import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KundliForm } from "@/components/astrology/KundliForm";
import { Container } from "@/components/ui/Container";
import { hasLocale, localeMeta, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { routes } from "@/i18n/routes";
import { todayInIndia } from "@/lib/validation/kundli";

export async function generateMetadata({ params }: PageProps<"/[locale]/astrology">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const ap = (await getDictionary(locale)).astrologyPage;
  const path = routes.astrology;
  return {
    title: ap.metaTitle,
    description: ap.metaDescription,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])), "x-default": `/hi${path}` },
    },
    openGraph: { title: ap.metaTitle, description: ap.metaDescription, locale: localeMeta[locale].ogLocale },
  };
}

export default async function AstrologyPage({ params }: PageProps<"/[locale]/astrology">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const ap = dict.astrologyPage;

  return (
    <Container className="py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="no-print">
          <h1 className="text-h1">{ap.heading}</h1>
          <p className="mt-5 text-lead">{ap.intro}</p>
          <p className="mt-6 rounded-xl border-l-4 border-gold bg-paper p-4 text-base text-muted">{ap.disclaimer}</p>
        </header>
        <div className="mt-10">
          <KundliForm locale={locale} dict={dict} currentYear={Number(todayInIndia().slice(0, 4))} />
        </div>
      </div>
    </Container>
  );
}
