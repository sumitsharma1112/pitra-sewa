# Shraddha date engine

Status: **implemented** against documented provider APIs; **not yet live-verified**.
Every result is labelled "priest confirmation needed" until the live fixture test
passes and `PANCHANG_RESULTS_VERIFIED=true` is set.

## 0. Provider decision (Sept 2026)

Four free APIs were evaluated from their documentation (ShubhAI, Navamsha,
Tantrakulam, GrahaAPI). None offers Shraddha/Pitru Paksha calculation, so the
Shraddha rules live in our code (`src/services/panchang/rules.ts`) on top of plain
Panchang data.

- **Primary: ShubhAI** — free for commercial use (attribution), Tithi with end time,
  Amanta lunar month with Adhik detection, sunrise/sunset, 60 req/min.
- **Second source: Navamsha** — free tier (launch; may change), Tithi + end time; used
  only to cross-check the death Tithi.
- Tantrakulam — strongest rule awareness, but its free tier is non-commercial; the
  Commercial licence (₹4,999/yr) is the upgrade path.
- GrahaAPI — both month systems documented, but terms and response fields could not be verified.

Code: `providers/shubh.ts`, `providers/navamsha.ts`. Keys are read only in
`providers/index.ts` (server). Responses are cached 30 days (a day's Panchang never
changes). Unknown response shapes are rejected, never guessed.

## 0.1 Going live — checklist

1. Add `SHUBH_API_KEY` (and optionally `NAVAMSHA_API_KEY`) in Vercel → Environment Variables; redeploy.
2. Run the live fixtures: `SHUBH_API_KEY=… npx vitest run src/services/panchang/__tests__/live-fixtures.test.ts`.
3. An Acharya reviews ~20 results (normal, near-boundary, time unknown, Purnima,
   Chaturdashi, Adhik years) against a printed Panchang; add them as fixtures.
4. Write the rule document for two-day / no-Aparahna / Kshaya cases → bump `RULES_VERSION`.
5. Only then set `PANCHANG_RESULTS_VERIFIED=true`.

## 1. Two different questions families ask

| | Pitru Paksha (Mahalaya) Shraddha | Varshik Shraddha (annual / Barsi) |
|---|---|---|
| Which Tithi | Same Tithi *number* as the death Tithi, Shukla or Krishna | Same Tithi, same paksha |
| Which month | Always within Pitru Paksha | The lunar month of death |
| Adhik Maas matters | Rarely | Often (needs Acharya rule) |

The brief treats these as one thing. The finder will ask which one the family wants and
label the result accordingly. **v1 ships Pitru Paksha Shraddha only**; the data model
already supports Varshik.

## 2. Astronomy source

**Primary: [`astronomy-engine`](https://github.com/cosinekitty/astronomy)** (MIT, v2.1.x)

- Pure TypeScript/JavaScript, no native build — runs on Vercel serverless as-is.
- Gives apparent geocentric Sun and Moon longitudes and sunrise/sunset for any place.
- Stated accuracy ≈ ±1 arcminute. The Moon gains on the Sun by ~0.5′ per minute of time,
  so this is roughly ±2 minutes on a Tithi boundary. The engine treats anything within a
  safety margin (start: ±10 minutes) as "needs verification" rather than guessing.

**Cross-check only: Swiss Ephemeris** — higher precision, but dual-licensed AGPL /
paid commercial. AGPL's network clause would oblige us to publish the site's source, so
it is used only in offline tooling to generate test fixtures, never in the live site.

**Cross-check: a commercial Panchang API** (to be evaluated, e.g. Prokerala) and printed
Panchang tables. Not the primary engine: cost, rate limits during Pitru Paksha peak, and
its rules are a black box we cannot explain to families.

## 3. The calculations

1. **Tithi** = the Moon–Sun elongation divided into 30 parts of 12°. Tithi at a given
   instant is the same everywhere on Earth; ayanamsha cancels out.
2. **Where location matters:** converting the local clock time of death to an instant
   (IANA time-zone database, which includes historical offsets), and the day-based
   windows on the observance day (sunrise, sunset, Aparahna).
3. **Lunar month and Adhik Maas** need *sidereal* solar longitude: tropical longitude
   minus the **Lahiri (Chitrapaksha) ayanamsha**, the Indian national standard. The
   ayanamsha is taken from a published definition and tested against published values —
   not derived by us. A lunar month with no solar sign-change (Sankranti) is Adhik; a
   month with two (Kshaya Maas, very rare) is detected and flagged.
4. **Purnimanta vs Amanta** only changes month *names* for the Krishna paksha; both are
   computed from the same new-moon boundaries. v1 default: Purnimanta (North India).
5. **Death Tithi:** the Tithi prevailing at the moment of death (convention setting;
   some families use the sunrise Tithi — this is configurable per convention).
   If the time of death is unknown and the Tithi changed that day → both candidates are
   shown and the result is marked *needs verification*.
6. **Observance day:** Shraddha follows the Tithi prevailing in **Aparahna** — the fourth
   of five equal parts of daytime (sunrise→sunset) at the place of observance — not the
   sunrise Tithi used for most festivals.
   - Tithi covers Aparahna on exactly one day → that day.
   - Covers it on two days, or on neither (Kshaya/Vriddhi cases) → the tie-break comes
     from a **written rule document reviewed by an Acharya**, versioned as
     `rulesVersion`. Until that document exists, both candidate days are shown and the
     result is *needs verification*.
7. **Pitru Paksha window** for the selected year: the Krishna paksha after Bhadrapada
   Purnima, ending on Sarva Pitru Amavasya.

## 4. Traditions shown as information, never silently applied

Customs such as Chaturdashi being kept for untimely deaths, Navami for mothers in many
families, Purnima-death Shraddha on Bhadrapada Purnima or Amavasya, and Sarva Pitru
Amavasya when the Tithi is unknown vary by family. The result page explains them in
plain language; the family and their priest decide.

## 5. Result statuses

- `calculated` — rules fully covered, no boundary within the safety margin.
- `needs-verification` — any edge case above; the family sees why, plus a
  "Ask for verification" button that creates a request in the admin dashboard.
- `unsupported` — outside what v1 can answer honestly (e.g. another convention).

Every result stores the engine name/version, convention and rule version
(see `ShraddhaCalculation` in `prisma/schema.prisma`).

## 6. Location input (v1)

A curated list of Indian cities with coordinates and `Asia/Kolkata` (built from GeoNames,
CC BY 4.0) — no paid geocoder needed. International places come later.

## 7. Tests that gate launch

- ≥ 50 fixtures cross-checked against two independent sources, including Kshaya and
  Vriddhi Tithi days, Adhik Maas years, deaths near a Tithi boundary, near midnight, and
  outside India.
- CI fails if any fixture changes. The rule document and fixtures are reviewed by an
  Acharya before the calculator is switched on.
