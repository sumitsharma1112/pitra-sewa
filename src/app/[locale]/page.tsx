import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DateFinderPreview } from "@/components/home/DateFinderPreview";
import { HeroSection } from "@/components/home/HeroSection";
import { TraditionSection } from "@/components/home/TraditionSection";
import { WhyShraddhaSection } from "@/components/home/WhyShraddhaSection";
import { hasLocale, localeMeta, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: { absolute: dict.meta.title },
    description: dict.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: { ...Object.fromEntries(locales.map((l) => [l, `/${l}`])), "x-default": "/hi" },
    },
    openGraph: {
      type: "website",
      siteName: dict.meta.siteName,
      title: dict.meta.title,
      description: dict.meta.description,
      locale: localeMeta[locale].ogLocale,
      url: `/${locale}`,
    },
  };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <>
      <HeroSection locale={locale} dict={dict} />
      <WhyShraddhaSection locale={locale} dict={dict} />
      <TraditionSection dict={dict} />
      <DateFinderPreview locale={locale} dict={dict} />
    </>
  );
}
