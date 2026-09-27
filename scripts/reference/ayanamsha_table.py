"""Generates src/data/ayanamsha-lahiri.json: monthly Lahiri ayanamsha, 1900-2060.
Not shipped as source -- pyswisseph is AGPL, used offline only (see PANCHANG_PLAN.md).
Mirrors the existing scripts/reference/sankranti.py pattern.
"""
import json
import swisseph as swe

swe.set_sid_mode(swe.SIDM_LAHIRI)

points = []
for year in range(1900, 2061):
    for month in range(1, 13):
        jd = swe.julday(year, month, 1, 0.0)
        points.append([jd, round(swe.get_ayanamsa_ut(jd), 6)])

with open("src/data/ayanamsha-lahiri.json", "w", encoding="utf-8") as f:
    json.dump({"note": "Lahiri ayanamsha (degrees), monthly, JD(UT) 1900-2060, via Swiss Ephemeris offline (scripts/reference/ayanamsha_table.py). Linear-interpolate between points.", "points": points}, f)

print(f"wrote {len(points)} points")
