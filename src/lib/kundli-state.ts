import type { KundliErrorCode, KundliField } from "@/lib/validation/kundli";
import type { Chart } from "@/services/panchang/kundli";

export interface KundliSummary {
  name?: string;
  birthDate: string;
  birthTime: string;
  birthPlace: { name: string; state: string };
  varshphalYear: number;
}

/** Raw form values echoed back so the form can be refilled. */
export type KundliValues = Record<string, string>;

export type KundliState =
  | { status: "idle"; values?: KundliValues }
  | { status: "invalid"; errors: Partial<Record<KundliField, KundliErrorCode>>; values: KundliValues }
  | { status: "rate-limited"; values: KundliValues }
  | { status: "out-of-range"; values: KundliValues }
  | { status: "done"; summary: KundliSummary; birth: Chart; varshphal: Chart; values: KundliValues };
