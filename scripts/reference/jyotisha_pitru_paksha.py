"""Reference Pitru Paksha Shraddha days from jyotisha (MIT) for one city-year."""
import sys, json, logging
logging.disable(logging.CRITICAL)
from jyotisha.panchaanga.spatio_temporal import annual, City
name, lat, lng, year = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), int(sys.argv[4])
def dms(x):
    d=int(abs(x)); m=(abs(x)-d)*60; s=(m-int(m))*60
    return f"{'-' if x<0 else ''}{d}:{int(m):02d}:{s:05.2f}"
city = City(name, dms(lat), dms(lng), "Asia/Kolkata")
p = annual.get_panchaanga_for_civil_year(city=city, year=year, allow_precomputed=False)
p.update_festival_details(compute_shraaddha_tithis=True)
days = {}
for dp in p.daily_panchaangas_sorted():
    d = dp.date; ds = f"{d.year}-{d.month:02d}-{d.day:02d}"
    if f"{year}-08-20" <= ds <= f"{year}-10-25" and dp.lunar_date.month.index == 6:
        days[ds] = list(dp.lunar_shraaddha_tithi or [])
json.dump({"city": name, "lat": lat, "lng": lng, "year": year, "days": days}, sys.stdout)
