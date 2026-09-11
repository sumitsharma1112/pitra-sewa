"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, localeMeta, type Locale } from "@/i18n/config";

/** Swaps the locale segment of the current path. The proxy remembers the choice. */
type Props = { current: Locale; label: string; compact?: boolean };

export function LanguageSwitcher({ current, label, compact = false }: Props) {
  const pathname = usePathname() ?? `/${current}`;
  const rest = pathname.replace(/^\/(hi|en)(?=\/|$)/, "");

  // Narrow screens: a single link to the other language keeps the header uncluttered.
  if (compact) {
    const other = locales.find((l) => l !== current) ?? current;
    return (
      <nav aria-label={label}>
        <Link
          href={`/${other}${rest}`}
          hrefLang={localeMeta[other].htmlLang}
          lang={localeMeta[other].htmlLang}
          className="flex min-h-12 items-center rounded-lg border border-line bg-paper px-3 text-base font-medium text-maroon"
        >
          {localeMeta[other].label}
        </Link>
      </nav>
    );
  }

  return (
    <nav aria-label={label}>
      <ul className="flex items-center rounded-lg border border-line bg-paper p-1 text-base">
        {locales.map((locale) => {
          const active = locale === current;
          return (
            <li key={locale}>
              <Link
                href={`/${locale}${rest}`}
                hrefLang={localeMeta[locale].htmlLang}
                lang={localeMeta[locale].htmlLang}
                aria-current={active ? "true" : undefined}
                className={`flex min-h-10 items-center rounded-md px-3 font-medium leading-none transition-colors ${
                  active ? "bg-maroon text-ivory" : "text-charcoal hover:bg-sand"
                }`}
              >
                {localeMeta[locale].label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
