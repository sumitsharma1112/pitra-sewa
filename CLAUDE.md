@AGENTS.md

# Pitra Sewa — पितृ सेवा

A bilingual (Hindi/English) website that helps Hindu families remember departed loved
ones: it explains Shraddha and Pitru Paksha, finds a loved one's annual Shraddha Tithi,
and (from Stage 4) arranges Brahmin Sewa.

Taglines: **उनकी स्मृति में, श्रद्धा के साथ।** · **परंपरा वही, तरीका नया।**

The audience is Indian families on phones, often elderly, often grieving. Hindi is the
default language. Tone is respectful and calm — never a pushy commercial service.

## Non-negotiable rules

These are the owner's rules; do not relax them without being asked.

1. **Never invent a Panchang calculation.** The engine is astronomy (`astronomy-engine`)
   plus written rules, verified against jyotisha fixtures. If a date cannot be computed
   honestly, say so — never guess, never fall back on Gregorian arithmetic.
2. **Never show an unqualified Shraddha date.** Every result names the calendar
   convention and location used, and carries the priest-confirmation disclaimer.
3. **Uncertainty is surfaced, not hidden.** Any doubt (unknown time, near a Tithi
   boundary, Adhik Maas, close call…) becomes a reason code shown to the family and
   routes them to priest verification.
4. **Never invent real-world facts**: no made-up priests, temples, prices, phone
   numbers, reviews or certifications. Contact details come from env/admin settings and
   the UI hides what is not configured. Demo catalogue rows must be flagged (`isDemo`).
5. **A booking is never "Confirmed" until an organiser confirms it.** Default status is
   `PENDING`; only an admin action sets `CONFIRMED`.
6. **No scriptural quotations or guaranteed spiritual results.** Regional variation is
   always acknowledged ("customs differ by family and region").
7. **Respectful naming.** The departed are referred to as दिवंगत प्रियजन and their name
   is rendered `स्व. <name> जी` / `Late <name>` (`respectfulName()` in
   `src/lib/finder-format.ts`). Never address the reader as the subject of the Shraddha.
8. **Privacy.** Nothing the Date Finder collects is stored. API keys and contact details
   are server-only; never `NEXT_PUBLIC_`.

## Stack and commands

Next.js 16.3 (App Router, Turbopack) · TypeScript · Tailwind v4 · Vitest. Node ≥ 20.9.

```bash
npm ci
npx next typegen        # after a fresh clone: generates the PageProps/LayoutProps globals
npm run dev            # http://localhost:3000 → redirects to /hi
npm run build && npm start
npm test               # ~99 tests, incl. 256 Pitru Paksha days vs jyotisha fixtures
npm run lint
npm run build:places   # regenerate src/data/places-in.json from GeoNames
```

Before any commit: `npx tsc --noEmit && npm run lint && npm test && npm run build`.
(On a fresh clone `tsc` fails until `next typegen`, `next dev` or `next build` has run —
Next generates the route-aware `PageProps`/`LayoutProps` types.)

Deployment: pushing to `main` auto-deploys to the Vercel project `pitra-sewa`
(account `sumitsharma1112`). Pages are static, so **changing an env var needs a
redeploy**. Env vars are documented in `.env.example`; all are optional today.

## Layout

```
src/
  proxy.ts                    locale redirect (Next 16 "proxy" = former middleware)
  app/[locale]/               every page lives under /hi or /en
    layout.tsx page.tsx (home) not-found.tsx
    shraddha-date-finder/     page.tsx + actions.ts (server action)
    [...slug]/page.tsx        "being prepared" placeholders for unbuilt routes
  components/brand|layout|home|finder|ui
  i18n/                       config.ts · routes.ts · dictionaries/{hi,en}.json
  lib/                        places · place-search · finder-format · validation · rate-limit · site-config
  services/panchang/          astro.ts · rules.ts · engine.ts · tithi.ts · providers/
  data/                       places-in.json (955 cities) · sankranti-lahiri.json · states-in.ts
prisma/schema.prisma          Stage 4 draft (validated, not yet wired up)
docs/PANCHANG_PLAN.md         engine design, sources, licences, verification
docs/DATABASE.md              Stage 4 data model
docs/ROADMAP.md               what is done and what comes next
scripts/reference/            offline Python used to generate test fixtures (not shipped)
```

## Conventions

- **i18n**: no library. `hi.json` is the source of truth for the dictionary shape; the
  build fails if `en.json` misses a key. **All user-visible text goes in both
  dictionaries** — never hardcode a string in a component. Add new routes to
  `src/i18n/routes.ts` (and remove them from `upcomingPages` once real).
- **Locale default is Hindi.** `/` → last-viewed locale (cookie) or `/hi`. The phone's
  `Accept-Language` is deliberately ignored.
- **Design tokens** live in `src/app/globals.css` (`@theme`). Use them, not raw hex.
  `--color-gold` (#B38A4A) fails contrast as text — for gold *text* use
  `--color-gold-ink`. Body text is 18px, tap targets ≥ 48px.
- **Accessibility is part of "done"**: labels tied to inputs, visible focus, error
  summary with links, `prefers-reduced-motion` respected, no horizontal scroll at
  320/375/390/768/1280/1440px, keyboard-operable menus.
- **One deliberate animation only** (the diya flame). Don't add decorative motion.
- **Server/client split**: anything reading env or the Panchang engine stays server-side.
  `src/lib/places.ts` is `server-only`; the browser gets `place-search.ts` instead.
- **Tests**: pure logic in `src/services/panchang/__tests__` and `src/lib/**/__tests__`.
  Network is always mocked. Don't weaken the jyotisha fixture test — if a Shraddha day
  changes, either the rule changed on purpose (say so) or it's a bug.

## Panchang engine (read `docs/PANCHANG_PLAN.md` before touching)

- `astro.ts` — Tithi, sunrise/sunset (disc centre, no refraction), lunation, lunar month
  and Adhik Maas from the precomputed Lahiri Sankranti table (1900–2060), Pitru Paksha.
- `rules.ts` — Aparahna window, `pickObservance()` (Aparahna-vyapini with jyotisha's
  tie-break), `isCloseCall()`, `pitruPakshaTithi()`. Pure, no I/O, fully tested.
- `engine.ts` — orchestration, reason codes, optional external cross-check.
- `providers/` — optional ShubhAI / Navamsha adapters used **only** to cross-check the
  death Tithi. The site needs no API key.
- Bump `RULES_VERSION` in `rules.ts` whenever a rule changes.
- v1 scope: Pitru Paksha Shraddha, India (IST), 1900–2060. Varshik (Barsi) returns
  `unsupported` on purpose.

## Current state (2026-09-27)

Stages 1–3 are done and live. Stage 4 (Sewa pages, booking, database, admin) and
Stage 5 (SEO, legal pages, hardening) are next — see `docs/ROADMAP.md`.

Pages that don't exist yet resolve to a placeholder via `app/[locale]/[...slug]`;
creating a real folder for that route automatically takes precedence.
