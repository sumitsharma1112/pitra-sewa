/**
 * Optional external cross-check of the death Tithi. The engine itself needs no
 * key; if SHUBH_API_KEY (or NAVAMSHA_API_KEY) is set, results are compared with
 * that service too. Keys are read here only (server).
 */
import type { PanchangProvider } from "../types";
import { NavamshaProvider } from "./navamsha";
import { ShubhProvider } from "./shubh";

export interface CrossCheck {
  provider: PanchangProvider;
}

const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);

export function getCrossCheck(): CrossCheck | null {
  const shubh = clean(process.env.SHUBH_API_KEY);
  if (shubh) return { provider: new ShubhProvider(shubh) };
  const navamsha = clean(process.env.NAVAMSHA_API_KEY);
  if (navamsha) return { provider: new NavamshaProvider(navamsha) };
  return null;
}
