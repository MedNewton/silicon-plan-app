// src/lib/valuation/summary.ts
// Aggregates results from all 4 valuation methods into a summary.
// EVA is displayed but excluded from the min/max/average calculation.

import type {
  VCMethodResult,
  DCFMethodResult,
  FirstChicagoResult,
  EVAMethodResult,
  ValuationSummary,
} from "@/types/valuation";

export function calculateValuationSummary(
  vc: VCMethodResult,
  dcf: DCFMethodResult,
  firstChicago: FirstChicagoResult,
  eva: EVAMethodResult,
): ValuationSummary {
  // VC value = Pre-Money of Year 1 (earliest/most conservative)
  const vcValue = vc.annualResults[0]?.preMoney ?? 0;
  const dcfValue = dcf.dcfValue;
  const firstChicagoValue = firstChicago.finalWeightedValue;
  const evaValue = eva.eva;

  // Min/Max/Average computed only from VC, DCF, First Chicago (EVA excluded)
  const threeValues = [vcValue, dcfValue, firstChicagoValue];
  const min = Math.min(...threeValues);
  const max = Math.max(...threeValues);
  const average = threeValues.reduce((a, b) => a + b, 0) / threeValues.length;

  return {
    vcValue,
    dcfValue,
    firstChicagoValue,
    evaValue,
    min,
    max,
    average,
  };
}
