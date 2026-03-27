// src/types/valuation.ts
// Result types for the 4 valuation methodologies + summary.

import type { FiveYearValues } from "./financialProjections";

// ========== VENTURE CAPITAL METHOD ==========

export type VCMethodAnnualResult = {
  year: number;
  irr: number;
  postMoney: number;
  investment: number;
  preMoney: number;
};

export type VCSensitivityMatrix = {
  irrValues: number[];       // row headers (e.g. [0.15, 0.25, 0.35, 0.45, 0.55, 0.65])
  multipleValues: number[];  // column headers (e.g. [8, 12, 16, 20, 24])
  ebitExit: number;
  evExitByMultiple: number[];
  grid: number[][];          // [irr_row_idx][multiple_col_idx] = present value
};

export type VCMethodResult = {
  revenueProjections: FiveYearValues;
  ebitdaProjections: FiveYearValues;
  baseMultiple: number;
  discountedMultiple: number;
  evAtExit: number;
  annualResults: VCMethodAnnualResult[];
  sensitivityMatrix: VCSensitivityMatrix;
};

// ========== DCF METHOD ==========

export type DCFMethodResult = {
  ebit: FiveYearValues;
  taxes: FiveYearValues;
  depreciation: FiveYearValues;
  capex: FiveYearValues;
  fcf: FiveYearValues;
  terminalValue: number;
  dcfValue: number;
  discountRate: number;
  terminalGrowthRate: number;
};

// ========== FIRST CHICAGO MODEL ==========

export type FirstChicagoScenarioResult = {
  name: string;
  marketCapture: number;
  probability: number;
  terminalValue: number;
  presentValue: number;
  weightedValue: number;
};

export type FirstChicagoResult = {
  irr: number;
  discountedMultiple: number;
  scenarios: FirstChicagoScenarioResult[];
  finalWeightedValue: number;
};

// ========== EVA METHOD ==========

export type EVAMethodResult = {
  roe: number;
  roi: number;
  taxRate: number;
  debt: number;
  equity: number;
  wacc: number;
  nopat: number;
  investedCapital: number;
  eva: number;
};

// ========== SUMMARY ==========

export type ValuationSummary = {
  vcValue: number;           // Pre-Money Year 1 from VC method
  dcfValue: number;
  firstChicagoValue: number;
  evaValue: number;
  min: number;               // min of VC, DCF, First Chicago (EVA excluded)
  max: number;
  average: number;           // average of VC, DCF, First Chicago (EVA excluded)
};

// ========== FULL RESULTS AGGREGATE ==========

export type FullValuationResults = {
  vc: VCMethodResult;
  dcf: DCFMethodResult;
  firstChicago: FirstChicagoResult;
  eva: EVAMethodResult;
  summary: ValuationSummary;
};
