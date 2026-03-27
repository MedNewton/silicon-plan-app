// src/types/financialProjections.ts
// Structured financial data types for the Pre-Money Valuation module.

/** 5-year projection array (Year 1 through Year 5) */
export type FiveYearValues = [number, number, number, number, number];

// ========== REVENUE & COSTS ==========

export type RevenueLineItem = {
  label: string;
  values: FiveYearValues;
};

export type CostLineItem = {
  label: string;
  type: "fixed" | "variable";
  values: FiveYearValues;
};

// ========== INCOME STATEMENT (Conto Economico) ==========

export type IncomeStatement = {
  revenue: FiveYearValues;
  totalCosts: FiveYearValues;
  ebitda: FiveYearValues;
  depreciation: FiveYearValues;
  ebit: FiveYearValues;
  taxes: FiveYearValues;
  netIncome: FiveYearValues;
};

// ========== BALANCE SHEET (Stato Patrimoniale) ==========

export type BalanceSheet = {
  totalAssets: FiveYearValues;
  equity: FiveYearValues;
  debt: FiveYearValues;
  investedCapital: FiveYearValues;
};

// ========== VALUATION INPUT PARAMETERS ==========

export type ScenarioParams = {
  marketCapture: number;  // e.g. 1.50 for 150%
  probability: number;    // e.g. 0.40 for 40%
};

export type ValuationInputs = {
  investmentAmount: number;
  discountRate: number;         // WACC, e.g. 0.10 for 10%
  terminalGrowthRate: number;   // e.g. 0.25 for 25%
  taxRate: number;              // e.g. 0.2897 for 28.97%
  capex: FiveYearValues;
  depreciation: FiveYearValues;
  irrSchedule: FiveYearValues;  // per-year expected IRR, e.g. [0.55, 0.45, 0.35, 0.25, 0.15]
  roe: number;                  // e.g. 0.15 for 15%
  roi: number;                  // e.g. 0.05 for 5%
  scenarios: {
    optimistic: ScenarioParams;
    realistic: ScenarioParams;
    pessimistic: ScenarioParams;
  };
};

// ========== TOP-LEVEL PROJECTION DATA (stored in DB JSONB) ==========

export type FinancialProjectionData = {
  schemaVersion: 1;
  revenueLines: RevenueLineItem[];
  costLines: CostLineItem[];
  balanceSheet: BalanceSheet;
  valuationInputs: ValuationInputs;
  yearLabels: [string, string, string, string, string]; // e.g. ["2026","2027","2028","2029","2030"]
};

// ========== INDUSTRY CLASSIFICATION (stored in DB JSONB) ==========

export type IndustryClassification = {
  onboardingSector: string;
  atecoCode: string;
  damodaranIndustry: string;
  baseMultiple: number;         // raw EV/EBITDA from Damodaran table
  adjustedMultiple: number;     // after stage factor adjustment
  companyStage: string;
  isManualOverride: boolean;
};
