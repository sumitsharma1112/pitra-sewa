import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { href, legalNav, mainNav } from "@/i18n/routes";
import { getContactConfig, hasAnyContact, whatsappLink } from "@/lib/site-config";

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const contact = getContactConfig();
  const year = new Date().getFullYear();
  const linkClass = "text-on-dark underline-offset-4 hover:text-ivory hover:underline";

  return (
    <footer className="bg-maroon-deep pb-28 text-on-dark xl:pb-0 print:hidden">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Logo tone="dark" name={dict.brand.name} latinName={dict.brand.latinName} />
          <p lang="hi" className="mt-6 font-display text-2xl leading-snug text-gold-light">
            {dict.brand.tagline}
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed">{dict.footer.description}</p>
        </div>

        <nav aria-label={dict.a11y.footerNav} className="grid gap-10 sm:grid-cols-3 lg:col-span-7">
          <div>
            <h2 className="font-sans text-base font-semibold text-gold-light">{dict.footer.pagesTitle}</h2>
            <ul className="mt-4 space-y-2.5 text-base">
              {mainNav.map((key) => (
                <li key={key}>
                  <Link href={href(locale, key)} className={linkClass}>
                    {dict.nav[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-sans text-base font-semibold text-gold-light">{dict.footer.legalTitle}</h2>
            <ul className="mt-4 space-y-2.5 text-base">
              {legalNav.map((key) => (
                <li key={key}>
                  <Link href={href(locale, key)} className={linkClass}>
                    {dict.nav[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-sans text-base font-semibold text-gold-light">{dict.footer.contactTitle}</h2>
            {hasAnyContact(contact) ? (
              <ul className="mt-4 space-y-2.5 text-base">
                {contact.phone && (
                  <li>
                    <span className="sr-only">{dict.footer.phone}: </span>
                    <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className={linkClass}>
                      {contact.phone}
                    </a>
                  </li>
                )}
                {contact.email && (
                  <li>
                    <span className="sr-only">{dict.footer.email}: </span>
                    <a href={`mailto:${contact.email}`} className={`${linkClass} break-all`}>
                      {contact.email}
                    </a>
                  </li>
                )}
                {contact.whatsappDigits && (
                  <li>
                    <a
                      href={whatsappLink(contact.whatsappDigits, dict.whatsapp.message)}
                      className={linkClass}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {dict.footer.whatsapp}
                    </a>
                  </li>
                )}
                {contact.address && (
                  <li>
                    <span className="sr-only">{dict.footer.address}: </span>
                    {contact.address}
                  </li>
                )}
              </ul>
            ) : (
              <p className="mt-4 text-base">
                {dict.footer.contactPending}{" "}
                <Link href={href(locale, "contact")} className="text-ivory underline underline-offset-4">
                  {dict.nav.contact}
                </Link>
              </p>
            )}
          </div>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
          <p className="max-w-4xl text-[0.95rem] leading-relaxed">{dict.footer.disclaimer}</p>
          <p className="mt-4 text-[0.95rem]">
            © {year} {dict.brand.latinName}. {dict.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
