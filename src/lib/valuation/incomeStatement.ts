// src/lib/valuation/incomeStatement.ts
// Pure function: computes a 5-year Income Statement (Conto Economico)
// from revenue lines, cost lines, depreciation, and tax rate.

import type {
  FiveYearValues,
  RevenueLineItem,
  CostLineItem,
  IncomeStatement,
} from "@/types/financialProjections";

/**
 * Sum an array of line items into a single FiveYearValues total.
 */
function sumLines(lines: { values: FiveYearValues }[]): FiveYearValues {
  const totals: FiveYearValues = [0, 0, 0, 0, 0];
  for (const line of lines) {
    for (let i = 0; i < 5; i++) {
      totals[i] = totals[i]! + line.values[i]!;
    }
  }
  return totals;
}

/**
 * Compute a full 5-year Income Statement from structured inputs.
 *
 * Revenue       = sum of all revenue line items
 * Total Costs   = sum of all cost line items
 * EBITDA        = Revenue - Total Costs
 * EBIT          = EBITDA - Depreciation
 * Taxes         = max(0, EBIT * taxRate)
 * Net Income    = EBIT - Taxes
 */
export function computeIncomeStatement(
  revenueLines: RevenueLineItem[],
  costLines: CostLineItem[],
  depreciation: FiveYearValues,
  taxRate: number,
): IncomeStatement {
  const revenue = sumLines(revenueLines);
  const totalCosts = sumLines(costLines);

  const ebitda: FiveYearValues = [0, 0, 0, 0, 0];
  const ebit: FiveYearValues = [0, 0, 0, 0, 0];
  const taxes: FiveYearValues = [0, 0, 0, 0, 0];
  const netIncome: FiveYearValues = [0, 0, 0, 0, 0];

  for (let i = 0; i < 5; i++) {
    ebitda[i] = revenue[i]! - totalCosts[i]!;
    ebit[i] = ebitda[i]! - depreciation[i]!;
    taxes[i] = Math.max(0, ebit[i]! * taxRate);
    netIncome[i] = ebit[i]! - taxes[i]!;
  }

  return {
    revenue,
    totalCosts,
    ebitda,
    depreciation,
    ebit,
    taxes,
    netIncome,
  };
}
