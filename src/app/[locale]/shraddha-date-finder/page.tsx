import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DateFinder } from "@/components/finder/DateFinder";
import { Container } from "@/components/ui/Container";
import { hasLocale, localeMeta, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { href, routes } from "@/i18n/routes";
import { getContactConfig } from "@/lib/site-config";
import { todayInIndia, yearOptions } from "@/lib/validation/date-finder";
import { getProviders } from "@/services/panchang/providers";

export async function generateMetadata({ params }: PageProps<"/[locale]/shraddha-date-finder">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const fd = (await getDictionary(locale)).finderPage;
  const path = routes.dateFinder;
  return {
    title: fd.metaTitle,
    description: fd.metaDescription,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])), "x-default": `/hi${path}` },
    },
    openGraph: { title: fd.metaTitle, description: fd.metaDescription, locale: localeMeta[locale].ogLocale },
  };
}

export default async function DateFinderPage({ params }: PageProps<"/[locale]/shraddha-date-finder">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const fd = dict.finderPage;
  const providers = getProviders();
  const contact = getContactConfig();

  return (
    <Container className="py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="no-print">
          <h1 className="text-h1">{fd.heading}</h1>
          <p className="mt-5 text-lead">{fd.intro}</p>
          {!providers && <p className="mt-6 rounded-xl border-l-4 border-gold bg-paper p-4">{fd.notConfigured}</p>}
          {providers && !providers.verified && (
            <p className="mt-6 rounded-xl border-l-4 border-gold bg-paper p-4">{fd.preliminary}</p>
          )}
        </header>
        <div className="mt-10">
          <DateFinder
            locale={locale}
            fd={fd}
            years={yearOptions()}
            currentYear={Number(todayInIndia().slice(0, 4))}
            contact={{ whatsappDigits: contact.whatsappDigits, email: contact.email }}
            bookHref={href(locale, "bookSewa")}
          />
        </div>
      </div>
    </Container>
  );
}
