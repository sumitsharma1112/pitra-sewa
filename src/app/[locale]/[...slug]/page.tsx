import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { href, routeKeyFromSlug, routes, upcomingPages } from "@/i18n/routes";

/**
 * Placeholder for every planned route that is not built yet, so navigation
 * never leads to a broken link. When a real page is added as its own folder
 * (e.g. app/[locale]/sewa-options/page.tsx), it takes precedence over this
 * catch-all automatically.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    upcomingPages.map((key) => ({ locale, slug: [routes[key].slice(1)] })),
  );
}

export async function generateMetadata({ params }: PageProps<"/[locale]/[...slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const key = slug.length === 1 ? routeKeyFromSlug(slug[0]) : undefined;
  if (!hasLocale(locale) || !key) return {};
  const dict = await getDictionary(locale);
  return { title: dict.comingSoon.pages[key].title, robots: { index: false } };
}

export default async function UpcomingPage({ params }: PageProps<"/[locale]/[...slug]">) {
  const { locale, slug } = await params;
  const key = slug.length === 1 ? routeKeyFromSlug(slug[0]) : undefined;
  if (!hasLocale(locale) || !key) notFound();
  const dict = await getDictionary(locale);
  const page = dict.comingSoon.pages[key];

  return (
    <ComingSoon
      title={page.title}
      heading={dict.comingSoon.heading}
      summary={page.summary}
      back={{ href: href(locale, "home"), label: dict.comingSoon.back }}
    />
  );
}
