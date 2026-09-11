# Pitra Sewa — पितृ सेवा

*उनकी स्मृति में, श्रद्धा के साथ।*

A bilingual (Hindi/English) website that helps families understand Shraddha, find a loved
one's Shraddha Tithi, and request Brahmin Sewa.

## Status

| Stage | Scope | State |
|---|---|---|
| 1 | Structure, design system, homepage, navigation, footer, Hindi/English | **Done** |
| 2 | Date Finder UI, validation, result + print layout | Next |
| 3 | Panchang engine, conventions, fixtures, priest verification | Planned — see `docs/PANCHANG_PLAN.md` |
| 4 | Sewa pages, booking, database, admin | Planned — see `docs/DATABASE.md` |
| 5 | SEO (sitemap, structured data), legal pages, hardening, deployment | Planned |

Pages not built yet show a clear "being prepared" page instead of a broken link.
**No Shraddha date is calculated anywhere yet** — by design.

## Run it

Requires Node.js 20.9+ (tested on 22).

```bash
npm install
cp .env.example .env.local   # fill in what you have; blanks are hidden on the site
npm run dev                  # http://localhost:3000 → redirects to /hi
npm run build && npm start   # production check
npm run lint
```

## Environment variables

| Variable | Used for | If empty |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical links, Open Graph | `http://localhost:3000` |
| `WHATSAPP_NUMBER` | WhatsApp link, digits with country code (`91…`) | WhatsApp link hidden |
| `CONTACT_PHONE`, `CONTACT_EMAIL`, `CONTACT_ADDRESS` | Footer contact | Hidden; "details coming soon" shown |

Pages are pre-rendered, so after changing these, **redeploy**. In Stage 4 they move to
the admin panel (`SiteSetting`).

## Structure

```
src/
  proxy.ts                 locale redirect (Next 16 "proxy", formerly middleware)
  app/[locale]/            every page lives under /hi or /en
    layout.tsx page.tsx not-found.tsx
    [...slug]/page.tsx     placeholders for planned routes (real pages override it)
  app/global-not-found.tsx  404 for URLs outside any route
  components/brand|layout|home|ui
  i18n/                    locales, route registry, hi.json + en.json
  lib/site-config.ts       contact details from env
  services/panchang/types.ts  engine contract for Stages 2–3
prisma/schema.prisma       draft schema (Stage 4)
docs/                      Panchang plan, database design
```

## Key decisions

- **Next.js 16.3 App Router, all pages static.** Fast on slow mobile networks; no server
  work per visit yet.
- **i18n without a library**, following the official Next.js guide: `/hi` and `/en` path
  segments + JSON dictionaries loaded on the server (no translation JS sent to phones).
  `hi.json` defines the shape; the build fails if `en.json` misses a key.
- **Hindi by default.** `/` goes to the language last viewed (cookie) or Hindi. The
  phone's language setting is ignored on purpose: most phones in India report English.
- **Fonts:** Tiro Devanagari Hindi (headings) + Mukta (body), SIL OFL, self-hosted via
  Fontsource — no third-party font requests, no build-time network dependency. Only
  Devanagari + Latin subsets load.
- **Accessible palette.** The brief's antique gold `#B38A4A` is 2.96:1 on ivory (fails
  WCAG), so it's used for lines and illustration only; gold text uses `#855F2A` (5.4:1).
  Body text 18px, 48px minimum tap targets, visible focus, skip link, reduced motion
  respected.
- **Original SVG artwork** (diya in a wall niche with marigolds) instead of stock photos:
  no licensing risk, tiny file size. Real photography can be added later.
- **Security headers** in `next.config.ts`; contact details are server-only env vars.

## Tested (Stage 1)

- `next build`, TypeScript and ESLint pass.
- No horizontal scroll at 320, 375, 390, 768, 1280, 1440px, Hindi and English.
- Header fits at 1280px in both languages; mobile menu opens/closes with keyboard,
  Escape returns focus; language switch keeps the current page and is remembered.
- Unknown URLs return 404.

## Deploy (Vercel)

1. Push to GitHub, import the repo in Vercel (framework auto-detected).
2. Add the environment variables above (Production + Preview).
3. Deploy, then set your domain and update `NEXT_PUBLIC_SITE_URL`.
