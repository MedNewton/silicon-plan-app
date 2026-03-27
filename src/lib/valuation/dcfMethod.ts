// src/lib/valuation/dcfMethod.ts
// Pure function: Discounted Cash Flow (DCF) Method.
//
// Reference (premoney.pdf page 24):
//   FCF[i] = EBIT[i] - Taxes[i] + Depreciation[i] - CAPEX[i]
//   Terminal Value = FCF[4] * (1 + g) / (WACC - g)
//   DCF = sum(FCF[i] / (1+WACC)^(i+1)) + TV / (1+WACC)^5

import type { FiveYearValues } from "@/types/financialProjections";
import type { DCFMethodResult } from "@/types/valuation";

export type DCFMethodInput = {
  ebit: FiveYearValues;
  taxes: FiveYearValues;
  depreciation: FiveYearValues;
  capex: FiveYearValues;
  discountRate: number;       // WACC, e.g. 0.10
  terminalGrowthRate: number; // e.g. 0.25
};

export function calculateDCF(input: DCFMethodInput): DCFMethodResult {
  const {
    ebit,
    taxes,
    depreciation,
    capex,
    discountRate,
    terminalGrowthRate,
  } = input;

  // Compute Free Cash Flows for each year
  const fcf: FiveYearValues = [0, 0, 0, 0, 0];
  for (let i = 0; i < 5; i++) {
    fcf[i] = ebit[i]! - taxes[i]! + depreciation[i]! - capex[i]!;
  }

  // Terminal Value at end of Year 5
  // TV = FCF_5 * (1 + g) / (WACC - g)
  // Guard against division by zero or negative denominator
  const denominator = discountRate - terminalGrowthRate;
  const terminalValue =
    denominator > 0
      ? (fcf[4] * (1 + terminalGrowthRate)) / denominator
      : 0;

  // Discount FCFs and Terminal Value back to present
  let dcfValue = 0;
  for (let i = 0; i < 5; i++) {
    dcfValue += fcf[i]! / Math.pow(1 + discountRate, i + 1);
  }
  dcfValue += terminalValue / Math.pow(1 + discountRate, 5);

  return {
    ebit,
    taxes,
    depreciation,
    capex,
    fcf,
    terminalValue,
    dcfValue,
    discountRate,
    terminalGrowthRate,
  };
}
