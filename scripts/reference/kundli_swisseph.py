"""
Offline reference generator for verifying the JS sidereal chart engine
(src/services/panchang/kundli.ts) against Swiss Ephemeris (Lahiri ayanamsha).

Not shipped -- pyswisseph is AGPL, used offline only, mirrors the existing
scripts/reference/ pattern documented in docs/PANCHANG_PLAN.md.

Usage:
  venv_astro\\Scripts\\python.exe scripts\\reference\\kundli_swisseph.py
"""
import json
import swisseph as swe

swe.set_sid_mode(swe.SIDM_LAHIRI)

BODIES = {
    "sun": swe.SUN,
    "moon": swe.MOON,
    "mars": swe.MARS,
    "mercury": swe.MERCURY,
    "jupiter": swe.JUPITER,
    "venus": swe.VENUS,
    "saturn": swe.SATURN,
    "rahu_mean": swe.MEAN_NODE,
    "rahu_true": swe.TRUE_NODE,
}


def jd_ut(y, mo, d, h, mi, utc_offset_hours):
    frac_hour = h + mi / 60.0 - utc_offset_hours
    return swe.julday(y, mo, d, frac_hour)


def ayanamsha(jd):
    return swe.get_ayanamsa_ut(jd)


def sidereal_positions(jd):
    out = {}
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL
    for name, body in BODIES.items():
        (lon, lat, dist, *_rest), _ret = swe.calc_ut(jd, body, flags)
        out[name] = round(lon, 6)
    return out


def ascendant(jd, lat, lon):
    # 'W' whole sign not needed; Placidus cusps unused, only asc/mc returned.
    cusps, ascmc = swe.houses_ex(jd, lat, lon, b'P', flags=swe.FLG_SIDEREAL)
    return round(ascmc[0], 6)


def case(name, y, mo, d, h, mi, utc_offset, lat, lon):
    jd = jd_ut(y, mo, d, h, mi, utc_offset)
    return {
        "case": name,
        "jd_ut": jd,
        "ayanamsha": round(ayanamsha(jd), 6),
        "positions": sidereal_positions(jd),
        "ascendant": ascendant(jd, lat, lon),
    }


cases = [
    case("birth_delhi_1990", 1990, 5, 15, 14, 30, 5.5, 28.6139, 77.2090),
    case("birth_mumbai_2000", 2000, 1, 1, 6, 0, 5.5, 19.0760, 72.8777),
    case("birth_chennai_1985_night", 1985, 11, 3, 23, 45, 5.5, 13.0827, 80.2707),
    # A few ayanamsha-only points to check the JS polynomial over a spread of years.
]

ayanamsha_series = []
for y in [1950, 1970, 1990, 2000, 2010, 2020, 2026, 2040, 2060]:
    jd = swe.julday(y, 1, 1, 0.0)
    ayanamsha_series.append({"year": y, "jd_ut": jd, "ayanamsha": round(ayanamsha(jd), 6)})

print(json.dumps({"cases": cases, "ayanamsha_series": ayanamsha_series}, indent=2))
