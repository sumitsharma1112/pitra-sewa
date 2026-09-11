"""Sidereal (Lahiri) solar ingress instants, 1900–2060, via Swiss Ephemeris (offline data generation only)."""
import json, swisseph as swe
swe.set_sid_mode(swe.SIDM_LAHIRI)
def lon(jd): return swe.calc_ut(jd, swe.SUN, swe.FLG_SIDEREAL | swe.FLG_MOSEPH)[0][0]
start = swe.julday(1899, 12, 1); end = swe.julday(2061, 1, 31)
out = []; jd = start; prev = lon(jd)
while jd < end:
    nxt = jd + 1; l = lon(nxt)
    if int(l // 30) != int(prev // 30):
        target = (int(l // 30) * 30) % 360; lo, hi = jd, nxt
        for _ in range(40):
            mid = (lo + hi) / 2; lm = lon(mid)
            d = ((lm - target + 180) % 360) - 180
            if d < 0: lo = mid
            else: hi = mid
        out.append([round((hi - 2440587.5) * 86400000), int(target // 30)])
    jd, prev = nxt, l
json.dump({"source": "Swiss Ephemeris (Moshier), Lahiri ayanamsha", "ingress": out}, open("/tmp/sankranti.json", "w"))
print(len(out), out[:2])
