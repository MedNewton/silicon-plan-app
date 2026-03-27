// src/lib/valuation/index.ts
// Orchestrator: runs the full valuation pipeline from financial data.

import type {
  FinancialProjectionData,
  IndustryClassification,
  IncomeStatement,
} from "@/types/financialProjections";
import type { FullValuationResults } from "@/types/valuation";

import { computeIncomeStatement } from "./incomeStatement";
import { calculateVCMethod } from "./vcMethod";
import { calculateDCF } from "./dcfMethod";
import { calculateFirstChicago } from "./firstChicagoMethod";
import { calculateEVA } from "./evaMethod";
import { calculateValuationSummary } from "./summary";
import { DEFAULT_MULTIPLE_DISCOUNT } from "./damodaranMultiples";

// Re-export everything for convenient imports
export { computeIncomeStatement } from "./incomeStatement";
export { calculateVCMethod } from "./vcMethod";
export { calculateDCF } from "./dcfMethod";
export { calculateFirstChicago } from "./firstChicagoMethod";
export { calculateEVA } from "./evaMethod";
export { calculateValuationSummary } from "./summary";
export {
  DAMODARAN_MULTIPLES,
  STAGE_FACTORS,
  DEFAULT_MULTIPLE_DISCOUNT,
  DEFAULT_IRR_SCHEDULE,
  DEFAULT_SCENARIOS,
  getMultipleForIndustry,
  getAdjustedMultiple,
  getWeightedMultiple,
} from "./damodaranMultiples";

/**
 * Run the complete valuation pipeline.
 *
 * 1. Compute Income Statement from revenue/cost lines
 * 2. Run Venture Capital Method
 * 3. Run DCF Method
 * 4. Run First Chicago Model
 * 5. Run EVA Method
 * 6. Aggregate into summary
 */
export function runFullValuation(
  financialData: FinancialProjectionData,
  industryClassification: IndustryClassification,
): { incomeStatement: IncomeStatement; results: FullValuationResults } {
  const { revenueLines, costLines, balanceSheet, valuationInputs } =
    financialData;

  // Step 1: Compute Income Statement
  const incomeStatement = computeIncomeStatement(
    revenueLines,
    costLines,
    valuationInputs.depreciation,
    valuationInputs.taxRate,
  );

  const adjustedMultiple = industryClassification.adjustedMultiple;

  // Step 2: Venture Capital Method
  const vc = calculateVCMethod({
    revenueProjections: incomeStatement.revenue,
    ebitdaProjections: incomeStatement.ebitda,
    baseMultiple: adjustedMultiple,
    multipleDiscountFactor: DEFAULT_MULTIPLE_DISCOUNT,
    irrSchedule: valuationInputs.irrSchedule,
    investmentAmount: valuationInputs.investmentAmount,
  });

  // Step 3: DCF Method
  const dcf = calculateDCF({
    ebit: incomeStatement.ebit,
    taxes: incomeStatement.taxes,
    depreciation: valuationInputs.depreciation,
    capex: valuationInputs.capex,
    discountRate: valuationInputs.discountRate,
    terminalGrowthRate: valuationInputs.terminalGrowthRate,
  });

  // Step 4: First Chicago Model
  const discountedMultiple = adjustedMultiple * (1 - DEFAULT_MULTIPLE_DISCOUNT);
  const baseEbitda = incomeStatement.ebitda[4]; // Year 5 EBITDA

  const firstChicago = calculateFirstChicago({
    scenarios: [
      {
        name: "Ottimistico",
        marketCapture: valuationInputs.scenarios.optimistic.marketCapture,
        probability: valuationInputs.scenarios.optimistic.probability,
      },
      {
        name: "Realistico",
        marketCapture: valuationInputs.scenarios.realistic.marketCapture,
        probability: valuationInputs.scenarios.realistic.probability,
      },
      {
        name: "Pessimistico",
        marketCapture: valuationInputs.scenarios.pessimistic.marketCapture,
        probability: valuationInputs.scenarios.pessimistic.probability,
      },
    ],
    baseEbitda,
    discountedMultiple,
    irr: valuationInputs.discountRate,
    investmentYears: 5,
  });

  // Step 5: EVA Method
  // Use Year 5 values from balance sheet and income statement
  const eva = calculateEVA({
    roe: valuationInputs.roe,
    roi: valuationInputs.roi,
    taxRate: valuationInputs.taxRate,
    debt: balanceSheet.debt[4],
    equity: balanceSheet.equity[4],
    ebit: incomeStatement.ebit[4],
    investedCapital: balanceSheet.investedCapital[4],
    wacc: valuationInputs.discountRate,
  });

  // Step 6: Summary
  const summary = calculateValuationSummary(vc, dcf, firstChicago, eva);

  return {
    incomeStatement,
    results: { vc, dcf, firstChicago, eva, summary },
  };
}
