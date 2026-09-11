/**
 * Every public route in one place, so navigation, the sitemap and the
 * "being prepared" placeholders stay in sync. Paths are locale-less.
 */
export const routes = {
  home: "",
  dateFinder: "/shraddha-date-finder",
  whatIsShraddha: "/what-is-shraddha",
  brahminSewa: "/brahmin-sewa",
  sewaOptions: "/sewa-options",
  faqs: "/faqs",
  contact: "/contact",
  bookSewa: "/book-sewa",
  privacy: "/privacy-policy",
  terms: "/terms",
  disclaimer: "/disclaimer",
} as const;

export type RouteKey = keyof typeof routes;

/** Order of the main navigation (matches the brief). */
export const mainNav = [
  "home",
  "dateFinder",
  "whatIsShraddha",
  "brahminSewa",
  "sewaOptions",
  "faqs",
  "contact",
] as const satisfies readonly RouteKey[];

export const legalNav = ["privacy", "terms", "disclaimer"] as const satisfies readonly RouteKey[];

/** Pages that exist as routes but are built in a later stage. */
export const upcomingPages = [
  "dateFinder",
  "whatIsShraddha",
  "brahminSewa",
  "sewaOptions",
  "faqs",
  "contact",
  "bookSewa",
  "privacy",
  "terms",
  "disclaimer",
] as const satisfies readonly RouteKey[];
export type UpcomingPage = (typeof upcomingPages)[number];

export const href = (locale: string, key: RouteKey) => `/${locale}${routes[key]}`;

export const routeKeyFromSlug = (slug: string): UpcomingPage | undefined =>
  upcomingPages.find((key) => routes[key] === `/${slug}`);
