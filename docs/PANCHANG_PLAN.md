# Shraddha date engine

Status: **live, in-process, no API key.** Checked against jyotisha for 16 city-years
(6 cities, 2025–2028): 255 of 256 Pitru Paksha Shraddha days identical; the one
difference is a 7-minute near-tie, which the engine flags for priest confirmation.

## Sources

| Piece | Source | Licence |
|---|---|---|
| Sun/Moon positions, Tithi changes, new/full moons | [astronomy-engine](https://github.com/cosinekitty/astronomy) (runs in the app) | MIT |
| Sunrise/sunset | astronomy-engine, disc centre at geometric horizon, no refraction (jyotisha's convention; matches to the second) | MIT |
| Lunar month names, Adhik Maas | Table of sidereal (Lahiri) solar ingresses 1900–2060, `src/data/sankranti-lahiri.json`, generated offline by `scripts/reference/sankranti.py` (Swiss Ephemeris, used offline only — nothing AGPL ships in the app) | data |
| Shraddha day rule | Aparahna-vyapini with jyotisha's tie-break (`jyotisha/panchaanga/temporal/tithi.py`) | MIT |
| Reference results for tests | jyotisha, via `scripts/reference/jyotisha_pitru_paksha.py` | MIT |

Measured agreement with jyotisha (Swiss Ephemeris): Tithi changes within ~40 s;
sunrise/sunset identical.

## Rules (`src/services/panchang/rules.ts`, `engine.ts`) — version `pitru-paksha-v1`

1. **Death Tithi** = Moon–Sun elongation ÷ 12° at the moment of death (local time →
   UTC). Without a time: every Tithi that ran during that civil day (shown as options).
2. **Pitru Paksha Tithi** = same number in the Krishna paksha of Amanta Bhadrapada;
   Purnima → Bhadrapada Purnima; Amavasya → Sarva Pitru Amavasya.
3. **Pitru Paksha** = Krishna paksha of the lunation containing the Sun's entry into
   sidereal Kanya (so Nija Bhadrapada in Adhik years).
4. **Shraddha day** at the observance place, Aparahna = 4th fifth of daytime:
   - the one day whose Aparahna the Tithi covers;
   - two days → the larger covered share (tie → later day);
   - no Aparahna covered → the next Aparahna after the Tithi ends.
5. **Close call**: if shifting sunrise/sunset ±3 min or the Tithi ±1 min changes the
   day, the result is marked for priest confirmation.

## When a priest is asked to confirm (blocking reasons)

Time unknown · death within 10 min of a Tithi change · Adhik Maas involved ·
Purnima or Chaturdashi death (custom varies) · close call · optional external
cross-check disagrees · pre-1956 clock time · `PANCHANG_REQUIRE_REVIEW=true`.

Informational only: two-day rule applied, no-Aparahna rule applied, first year
after death, external cross-check unreachable.

## Optional external cross-check

If `SHUBH_API_KEY` (ShubhAI) or `NAVAMSHA_API_KEY` is set, the death Tithi is also
fetched from that API (server-side, cached 30 days) and compared.
Adapters: `providers/shubh.ts`, `providers/navamsha.ts`.

## Extending the checks

```bash
python -m venv venv && . venv/bin/activate
pip install pyswisseph==2.10.3.2 && git clone --recursive https://github.com/jyotisham/jyotisha && pip install -e jyotisha
python scripts/reference/jyotisha_pitru_paksha.py Pune 18.52 73.86 2027 > case.json
# append the case to src/services/panchang/__tests__/fixtures/pitru-paksha-jyotisha.json
```

Recommended before wide launch: an Acharya reviews a sample of results (normal,
time unknown, Purnima, Chaturdashi, Adhik years) against a printed Panchang.

## Earlier evaluation (Sept 2026)

Paid/free APIs (ShubhAI, Navamsha, Tantrakulam, GrahaAPI) offer no Shraddha logic;
open-source jyotisha does, but is Python and slow per city-year, so its rules were
reimplemented here on astronomy-engine and its output is used as the test oracle.
