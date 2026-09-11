import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../fonts";
import "../globals.css";
import { MobileCtaBar } from "@/components/layout/MobileCtaBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { hasLocale, localeMeta, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { href } from "@/i18n/routes";
import { getSiteUrl } from "@/lib/site-config";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#FBF7F0",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    metadataBase: getSiteUrl(),
    title: { default: dict.meta.title, template: `%s | ${dict.meta.siteName}` },
    description: dict.meta.description,
    applicationName: "Pitra Sewa",
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <html lang={localeMeta[locale].htmlLang}>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only z-[60] rounded-lg bg-maroon px-4 py-3 text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {dict.a11y.skip}
        </a>
        <SiteHeader locale={locale} dict={dict} />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter locale={locale} dict={dict} />
        <MobileCtaBar
          label={dict.a11y.quickActions}
          primary={{ href: href(locale, "dateFinder"), label: dict.cta.findTithiShort }}
          secondary={{ href: href(locale, "bookSewa"), label: dict.cta.bookSewaShort }}
        />
      </body>
    </html>
  );
}
