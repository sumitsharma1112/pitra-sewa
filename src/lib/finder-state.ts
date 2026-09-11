import type { FinderErrorCode, FinderField } from "@/lib/validation/date-finder";
import type { CalculationOutcome, MonthSystem } from "@/services/panchang/types";

export interface FinderSummary {
  name?: string;
  deathDate: string;
  deathTime?: string;
  deathPlace: { name: string; state: string };
  observancePlace: { name: string; state: string };
  year: number;
  monthSystem: MonthSystem;
  notes?: string;
}

/** Raw form values echoed back so the form can be refilled. */
export type FinderValues = Record<string, string>;

export type FinderState =
  | { status: "idle"; values?: FinderValues }
  | { status: "invalid"; errors: Partial<Record<FinderField, FinderErrorCode>>; values: FinderValues }
  | { status: "rate-limited"; values: FinderValues }
  | {
      status: "done";
      reference: string;
      generatedAt: string;
      summary: FinderSummary;
      outcome: CalculationOutcome;
      synthetic: boolean;
      values: FinderValues;
    };
