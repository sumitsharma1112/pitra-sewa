# Roadmap and handover

Written 2026-09-27, when the project moved to Claude Code for further work.
Read `CLAUDE.md` first (rules and conventions), then this file.

## Done

| Stage | Scope |
|---|---|
| 1 | Project structure, design system, homepage, header/footer, Hindi↔English, placeholders for unbuilt routes |
| 2 | Shraddha Date Finder: form, validation, result slip, print/PDF layout, priest-verification panel |
| 3 | In-process Panchang engine (no API key), reason codes, optional external cross-check, jyotisha fixtures |

Live: the Vercel project `pitra-sewa` auto-deploys from `main`.
Verified: `tsc`, `eslint`, `npm test` (~99 tests), `next build` all pass; no horizontal
scroll at 320/375/390/768/1280/1440 px in both languages; 255 of 256 Pitru Paksha days
match jyotisha, and the one difference is a 7-minute near-tie that the engine flags.

## Next — Stage 4: Sewa, booking, database, admin

Order matters: content pages first (they need no database), then the data layer.

1. **`/what-is-shraddha`** — educational page. Content already exists in condensed form
   in the homepage `why` dictionary block; expand it, keep the regional-variation note.
2. **`/brahmin-sewa`** — the five-step process (choose → share details → organiser checks
   availability → service arranged → confirmation). No claim of confirmation up front.
3. **`/sewa-options`** — four cards (Brahmin Bhojan, Brahmin Sewa, Temple Sewa, Custom
   Sewa). Until the database exists, seed from a typed file and **label demo data**.
4. **Database** — `prisma/schema.prisma` is a validated draft; see `docs/DATABASE.md`.
   Pick Postgres (Neon or Supabase both fit Vercel), add `DATABASE_URL`, run the first
   migration, then move `SewaOption`/`ServiceLocation` reads onto it.
5. **`/book-sewa`** — booking request form. Reuse the Date Finder patterns: server
   action, zod validation with translated error codes, bilingual labels, error summary.
   On submit: store, generate a non-sequential reference (`PS-…`), show a confirmation
   page, status `PENDING`. Email notification only if configured.
6. **`/admin`** — auth (argon2id hashes, roles Owner/Admin/Coordinator), bookings list
   with search/filter/status changes writing `BookingEvent`, catalogue and contact
   settings, calculation logs. Admin routes must be protected in `src/proxy.ts` too.

When a real page replaces a placeholder, remove its key from `upcomingPages` in
`src/i18n/routes.ts` and drop the `comingSoon.pages.<key>` dictionary entries.

## Then — Stage 5

- SEO: `sitemap.ts`, `robots.ts`, per-page canonical + `hreflang` (the home and finder
  pages already do this), JSON-LD, translated metadata.
- Legal: `/privacy-policy`, `/terms`, `/disclaimer` — the religious disclaimer text is
  already in the dictionaries (`footer.disclaimer`).
- Hardening: CSP header, rate limits on every form (`src/lib/rate-limit.ts` is
  per-instance only — move to a shared store), data retention for calculation logs.
- Accessibility and performance pass; Lighthouse on a real phone.

## Open decisions for the owner

- **Acharya review of the engine.** Recommended before promoting the finder widely: have
  a qualified Acharya check ~20 results (normal, unknown time, Purnima, Chaturdashi,
  Adhik years) against a printed Panchang. Setting `PANCHANG_REQUIRE_REVIEW=true` marks
  every result "priest confirmation needed" in the meantime.
- **Varshik (Barsi) Shraddha.** Deliberately unsupported in v1. Adding it means: same
  Tithi in the same lunar month, and an Adhik Maas rule an Acharya must write down.
- **Vercel URL** still contains the old team name; a custom domain is planned once the
  site is operational.
- **Contact details** (`CONTACT_PHONE`, `CONTACT_EMAIL`, `WHATSAPP_NUMBER`) are unset, so
  the footer and the WhatsApp verification button stay hidden. They move to admin
  settings (`SiteSetting`) in Stage 4.

## Gotchas

- Pages are statically generated, so **env changes need a redeploy**, not just a save.
- `src/data/sankranti-lahiri.json` bounds the engine to 1900–2060; outside that it
  returns `unsupported`. Regenerate with `scripts/reference/sankranti.py` if needed.
- The Python scripts in `scripts/reference/` are for generating test fixtures offline.
  They depend on Swiss Ephemeris (AGPL) and must never be shipped or called at runtime.
- `next dev` rewrites the block in `AGENTS.md`; commit that change with your work.
- The city list is GeoNames-derived (CC BY 4.0) — keep the attribution in
  `scripts/build-places.mjs` if you regenerate it.
