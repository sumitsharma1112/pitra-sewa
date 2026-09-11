import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, LOCALE_COOKIE } from "@/i18n/config";

/**
 * Every page lives under /hi or /en. Requests without a locale are
 * redirected: the language last viewed (cookie) wins, otherwise Hindi.
 * Accept-Language is deliberately not used — most phones in India report
 * English even when the family prefers to read Hindi.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;

  if (hasLocale(first)) {
    if (saved === first) return;
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return response;
  }

  const locale = hasLocale(saved) ? saved : defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API routes and any file with an extension (icons, robots.txt…).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
