/** Client-safe city search over the bundled list (no network). */
export type PlaceOption = { id: string; name: string; state: string };

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Prefix matches first (list is already ordered by population), then substring matches. */
export function searchPlaces<T extends PlaceOption>(list: T[], query: string, limit = 8): T[] {
  const q = fold(query);
  if (q.length < 2) return [];
  const prefix: T[] = [];
  const inside: T[] = [];
  for (const p of list) {
    const name = fold(p.name);
    if (name.startsWith(q)) prefix.push(p);
    else if (name.includes(q)) inside.push(p);
    if (prefix.length >= limit) break;
  }
  return [...prefix, ...inside].slice(0, limit);
}
