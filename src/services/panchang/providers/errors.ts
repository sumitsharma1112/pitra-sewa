import type { ProviderErrorKind } from "../types";

export class ProviderError extends Error {
  constructor(
    readonly kind: ProviderErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/** Server-side fetch with a timeout and normalised errors. Never logs the key. */
export async function fetchJson(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<unknown> {
  const { timeoutMs = 8000, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(url, { ...rest, signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    const name = (e as Error)?.name;
    throw new ProviderError(name === "TimeoutError" || name === "AbortError" ? "timeout" : "unavailable", "network error");
  }
  if (res.status === 401 || res.status === 403) throw new ProviderError("auth", `HTTP ${res.status}`);
  if (res.status === 429) throw new ProviderError("rate-limited", "HTTP 429");
  if (!res.ok) throw new ProviderError("unavailable", `HTTP ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw new ProviderError("invalid-response", "response was not JSON");
  }
}
