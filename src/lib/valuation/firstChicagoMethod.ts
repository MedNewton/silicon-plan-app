// src/lib/valuation/firstChicagoMethod.ts
// Pure function: First Chicago Model (scenario-weighted valuation).
//
// Reference (premoney.pdf page 26):
//   For each scenario (Optimistic, Realistic, Pessimistic):
//     adjustedEbitda = baseEbitda * marketCaptureFactor
//     terminalValue  = adjustedEbitda * discountedMultiple
//     presentValue   = terminalValue / (1 + IRR)^5
//     weightedValue  = presentValue * probability
//   Final = sum of weightedValues

import type { FirstChicagoResult, FirstChicagoScenarioResult } from "@/types/valuation";

export type FirstChicagoScenarioInput = {
  name: string;
  marketCapture: number;  // e.g. 1.50 for 150% (optimistic)
  probability: number;    // e.g. 0.40 for 40%
};

export type FirstChicagoInput = {
  scenarios: FirstChicagoScenarioInput[];
  baseEbitda: number;            // Year 5 EBITDA from projections
  discountedMultiple: number;    // EV/EBITDA after startup discount
  irr: number;                   // desired IRR for discounting
  investmentYears: number;       // typically 5
};

export function calculateFirstChicago(
  input: FirstChicagoInput,
): FirstChicagoResult {
  const {
    scenarios: scenarioInputs,
    baseEbitda,
    discountedMultiple,
    irr,
    investmentYears,
  } = input;

  const scenarios: FirstChicagoScenarioResult[] = scenarioInputs.map(
    (scenario) => {
      const adjustedEbitda = baseEbitda * scenario.marketCapture;
      const terminalValue = adjustedEbitda * discountedMultiple;
      const presentValue =
        terminalValue / Math.pow(1 + irr, investmentYears);
      const weightedValue = presentValue * scenario.probability;

      return {
        name: scenario.name,
        marketCapture: scenario.marketCapture,
        probability: scenario.probability,
        terminalValue,
        presentValue,
        weightedValue,
      };
    },
  );

  const finalWeightedValue = scenarios.reduce(
    (sum, s) => sum + s.weightedValue,
    0,
  );

  return {
    irr,
    discountedMultiple,
    scenarios,
    finalWeightedValue,
  };
}
