/**
 * Best-effort, per-instance limiter so the form cannot be used to drain the
 * Panchang API quota. (Stage 5 can move this to a shared store.)
 */
const hits = new Map<string, number[]>();

export function allow(key: string, limit = 12, windowMs = 60_000, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}
