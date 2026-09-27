"""Reference Varshphal (sidereal solar return) instant + chart via Swiss Ephemeris,
for verifying src/services/panchang/kundli.ts. Not shipped (AGPL, offline only).
"""
import json
import swisseph as swe

swe.set_sid_mode(swe.SIDM_LAHIRI)

BODIES = {
    "sun": swe.SUN, "moon": swe.MOON, "mars": swe.MARS, "mercury": swe.MERCURY,
    "jupiter": swe.JUPITER, "venus": swe.VENUS, "saturn": swe.SATURN, "rahu_mean": swe.MEAN_NODE,
}
FLAGS = swe.FLG_SWIEPH | swe.FLG_SIDEREAL


def sun_sidereal(jd):
    (lon, *_r), _ret = swe.calc_ut(jd, swe.SUN, FLAGS)
    return lon


def find_solar_return(natal_sidereal, jd_guess):
    lo, hi = jd_guess - 3, jd_guess + 3
    for _ in range(60):
        mid = (lo + hi) / 2
        lon = sun_sidereal(mid)
        diff = ((lon - natal_sidereal + 540) % 360) - 180
        if abs(diff) < 1e-8:
            return mid
        if diff < 0:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


birth_jd = swe.julday(1990, 5, 15, 14.5 - 5.5)
natal = sun_sidereal(birth_jd)
anniv_2026 = swe.julday(2026, 5, 15, 0.0)
jd = find_solar_return(natal, anniv_2026)

positions = {}
for name, body in BODIES.items():
    (lon, *_r), _ret = swe.calc_ut(jd, body, FLAGS)
    positions[name] = round(lon, 6)

lat, lon_place = 28.6139, 77.2090
_cusps, ascmc = swe.houses_ex(jd, lat, lon_place, b'P', flags=swe.FLG_SIDEREAL)

print(json.dumps({
    "natal_sidereal_sun": round(natal, 6),
    "jd_ut": jd,
    "ayanamsha": round(swe.get_ayanamsa_ut(jd), 6),
    "positions": positions,
    "ascendant": round(ascmc[0], 6),
}, indent=2))
