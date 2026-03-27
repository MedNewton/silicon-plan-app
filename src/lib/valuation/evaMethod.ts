// src/lib/valuation/evaMethod.ts
// Pure function: Economic Value Added (EVA) Method.
//
// Reference (premoney.pdf page 27):
//   EVA = NOPAT - (Invested Capital * WACC)
//   where NOPAT = EBIT * (1 - Tax Rate)

import type { EVAMethodResult } from "@/types/valuation";

export type EVAMethodInput = {
  roe: number;              // e.g. 0.15 for 15%
  roi: number;              // e.g. 0.05 for 5%
  taxRate: number;          // e.g. 0.2897
  debt: number;             // total debt from balance sheet
  equity: number;           // equity value from balance sheet
  ebit: number;             // EBIT (typically Year 5 or latest positive year)
  investedCapital: number;  // total invested capital
  wacc: number;             // weighted average cost of capital
};

export function calculateEVA(input: EVAMethodInput): EVAMethodResult {
  const {
    roe,
    roi,
    taxRate,
    debt,
    equity,
    ebit,
    investedCapital,
    wacc,
  } = input;

  // NOPAT = EBIT * (1 - Tax Rate)
  const nopat = ebit * (1 - taxRate);

  // EVA = NOPAT - (Invested Capital * WACC)
  const eva = nopat - investedCapital * wacc;

  return {
    roe,
    roi,
    taxRate,
    debt,
    equity,
    wacc,
    nopat,
    investedCapital,
    eva,
  };
}
