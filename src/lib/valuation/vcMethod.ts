// src/lib/valuation/vcMethod.ts
// Pure function: Venture Capital Method valuation.
//
// Reference (premoney.pdf page 21):
//   discountedMultiple = baseMultiple * (1 - discountFactor)
//   EV at exit = EBITDA[Year5] * discountedMultiple
//   Post-Money[n] = EV / (1 + IRR[n])^(5-n)
//   Pre-Money[n] = Post-Money[n] - Investment

import type { FiveYearValues } from "@/types/financialProjections";
import type { VCMethodResult, VCSensitivityMatrix } from "@/types/valuation";

export type VCMethodInput = {
  revenueProjections: FiveYearValues;
  ebitdaProjections: FiveYearValues;
  baseMultiple: number;          // EV/EBITDA multiple before discount
  multipleDiscountFactor: number; // e.g. 0.40 for 40% discount
  irrSchedule: FiveYearValues;   // per-year expected IRR
  investmentAmount: number;
};

export function calculateVCMethod(input: VCMethodInput): VCMethodResult {
  const {
    revenueProjections,
    ebitdaProjections,
    baseMultiple,
    multipleDiscountFactor,
    irrSchedule,
    investmentAmount,
  } = input;

  const discountedMultiple = baseMultiple * (1 - multipleDiscountFactor);
  const ebitdaExit = ebitdaProjections[4]; // Year 5
  const evAtExit = ebitdaExit * discountedMultiple;

  // Annual progression: discount EV back to present for each year
  const annualResults = irrSchedule.map((irr, i) => {
    const yearsToExit = 5 - i;
    const postMoney = evAtExit / Math.pow(1 + irr, yearsToExit);
    const preMoney = postMoney - investmentAmount;
    return {
      year: i + 1,
      irr,
      postMoney,
      investment: investmentAmount,
      preMoney,
    };
  });

  // Sensitivity matrix: vary EV/EBIT multiple and IRR
  const sensitivityMatrix = buildSensitivityMatrix(
    ebitdaExit,
    investmentAmount,
  );

  return {
    revenueProjections,
    ebitdaProjections,
    baseMultiple,
    discountedMultiple,
    evAtExit,
    annualResults,
    sensitivityMatrix,
  };
}

/**
 * Build sensitivity analysis grid.
 * Rows = IRR values, Columns = EV/EBIT multiples.
 * Each cell = Present Value of EV discounted at that IRR over 5 years.
 */
function buildSensitivityMatrix(
  ebitExit: number,
  _investmentAmount: number,
): VCSensitivityMatrix {
  const irrValues = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65];
  const multipleValues = [8, 12, 16, 20, 24];

  const evExitByMultiple = multipleValues.map((m) => ebitExit * m);

  const grid: number[][] = irrValues.map((irr) =>
    multipleValues.map((multiple) => {
      const ev = ebitExit * multiple;
      return ev / Math.pow(1 + irr, 5);
    }),
  );

  return {
    irrValues,
    multipleValues,
    ebitExit,
    evExitByMultiple,
    grid,
  };
}
