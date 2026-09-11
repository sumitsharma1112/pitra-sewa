/**
 * Builds src/data/places-in.json — the city list for the Date Finder.
 *
 * Source: GeoNames "cities1000" via the `all-the-cities` package
 * (GeoNames data is CC BY 4.0: https://www.geonames.org/).
 * Kept: Indian places with population ≥ 50,000, plus every state/UT capital and
 * district headquarters. Coordinates are rounded to 3 decimals (~100 m), which is
 * far finer than sunrise needs (~50 km ≈ 1–2 minutes of sunrise difference).
 *
 * Run: npm run build:places
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const cities = require("all-the-cities");

// Friendlier spellings for names GeoNames stores in older or scholarly forms.
const renames = {
  "Dehra Dun": "Dehradun",
  Cochin: "Kochi",
  Bhubaneshwar: "Bhubaneswar",
  Mysore: "Mysuru",
  "Navi Mumbai": "Navi Mumbai",
  Gurgaon: "Gurugram",
  Calicut: "Kozhikode",
  Trivandrum: "Thiruvananthapuram",
  Benares: "Varanasi",
  Allahabad: "Prayagraj",
};

const ascii = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/[`'’]/g, "").trim();

const keep = cities
  .filter((c) => c.country === "IN")
  .filter((c) => c.population >= 50000 || c.featureCode === "PPLA" || c.featureCode === "PPLA2")
  .map((c) => {
    const base = ascii(c.name);
    return {
      id: String(c.cityId),
      name: renames[base] ?? base,
      state: c.adminCode,
      lat: Math.round(c.loc.coordinates[1] * 1000) / 1000,
      lng: Math.round(c.loc.coordinates[0] * 1000) / 1000,
      pop: c.population,
    };
  })
  .sort((a, b) => b.pop - a.pop)
  // Population is only used for ordering (bigger places first in search results).
  .map((p) => {
    const { pop, ...place } = p;
    void pop;
    return place;
  });

writeFileSync(new URL("../src/data/places-in.json", import.meta.url), JSON.stringify(keep) + "\n");
console.log(`Wrote ${keep.length} places`);
