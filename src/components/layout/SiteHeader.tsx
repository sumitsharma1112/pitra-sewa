import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { href, mainNav } from "@/i18n/routes";
import { DesktopNav } from "./DesktopNav";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNav } from "./MobileNav";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const items = mainNav.map((key) => ({ href: href(locale, key), label: dict.nav[key] }));

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ivory print:static">
      <div className="mx-auto flex h-[4.75rem] w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
        <Link href={href(locale, "home")} aria-label={dict.a11y.homeLink} className="shrink-0 rounded-md">
          <Logo name={dict.brand.name} latinName={dict.brand.latinName} />
        </Link>

        <DesktopNav items={items} label={dict.a11y.mainNav} />

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher current={locale} label={dict.a11y.languageNav} />
          </div>
          <div className="sm:hidden">
            <LanguageSwitcher current={locale} label={dict.a11y.languageNav} compact />
          </div>
          <ButtonLink href={href(locale, "dateFinder")} className="whitespace-nowrap max-xl:hidden">
            {dict.cta.headerFindTithi}
          </ButtonLink>
          <MobileNav
            items={items}
            labels={{ open: dict.a11y.menuOpen, close: dict.a11y.menuClose, nav: dict.a11y.mainNav }}
            actions={
              <>
                <ButtonLink href={href(locale, "dateFinder")}>{dict.cta.findTithi}</ButtonLink>
                <ButtonLink href={href(locale, "bookSewa")} variant="secondary">
                  {dict.cta.bookSewa}
                </ButtonLink>
              </>
            }
            footer={<LanguageSwitcher current={locale} label={dict.a11y.languageNav} />}
          />
        </div>
      </div>
    </header>
  );
}
