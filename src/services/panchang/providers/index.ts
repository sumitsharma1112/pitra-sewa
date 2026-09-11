/**
 * Provider configuration from server-only environment variables.
 * API keys are read here and nowhere else; nothing in this folder is
 * imported by client components.
 */
import type { PanchangProvider } from "../types";
import { NavamshaProvider } from "./navamsha";
import { ShubhProvider } from "./shubh";
import { SyntheticProvider } from "./synthetic";

export interface ProviderSet {
  primary: PanchangProvider;
  secondary?: PanchangProvider;
  /** True once the fixture check (scripts/verify-panchang.mjs) has passed and the operator set PANCHANG_RESULTS_VERIFIED. */
  verified: boolean;
  synthetic: boolean;
}

const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);

export function getProviders(): ProviderSet | null {
  // Local UI testing only. Refused on Vercel and in production builds.
  if (
    process.env.PANCHANG_PROVIDER === "synthetic" &&
    process.env.NODE_ENV !== "production" &&
    process.env.VERCEL !== "1"
  ) {
    return {
      primary: new SyntheticProvider({ epoch: new Date(Date.UTC(2026, 8, 11, 3, 0)), firstMonth: 5 }),
      verified: false,
      synthetic: true,
    };
  }

  const shubh = clean(process.env.SHUBH_API_KEY);
  if (!shubh) return null;
  const navamsha = clean(process.env.NAVAMSHA_API_KEY);
  return {
    primary: new ShubhProvider(shubh),
    secondary: navamsha ? new NavamshaProvider(navamsha) : undefined,
    verified: process.env.PANCHANG_RESULTS_VERIFIED === "true",
    synthetic: false,
  };
}
