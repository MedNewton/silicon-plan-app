// src/lib/valuation/damodaranMultiples.ts
// Damodaran EV/EBITDA multiples by industry + stage adjustment factors.
// Source: Damodaran Online (January 2025 dataset).
// Update this file annually when new data is published.

import type { SectorResolution } from "@/types/sectors";

export const DATA_LAST_UPDATED = "2025-01";

// ========== EV/EBITDA MULTIPLES BY DAMODARAN INDUSTRY ==========

type DamodaranMultipleEntry = {
  evEbitda: number;
  evRevenue: number;
  dataYear: number;
};

export const DAMODARAN_MULTIPLES: Record<string, DamodaranMultipleEntry> = {
  "Advertising": { evEbitda: 12.5, evRevenue: 1.4, dataYear: 2025 },
  "Aerospace/Defense": { evEbitda: 17.2, evRevenue: 1.9, dataYear: 2025 },
  "Air Transport": { evEbitda: 7.5, evRevenue: 1.0, dataYear: 2025 },
  "Apparel": { evEbitda: 12.8, evRevenue: 1.5, dataYear: 2025 },
  "Auto & Truck": { evEbitda: 10.5, evRevenue: 0.7, dataYear: 2025 },
  "Auto Parts": { evEbitda: 8.2, evRevenue: 0.7, dataYear: 2025 },
  "Bank (Money Center)": { evEbitda: 10.0, evRevenue: 3.5, dataYear: 2025 },
  "Banks (Regional)": { evEbitda: 8.5, evRevenue: 3.0, dataYear: 2025 },
  "Beverage (Alcoholic)": { evEbitda: 14.0, evRevenue: 3.5, dataYear: 2025 },
  "Beverage (Soft)": { evEbitda: 18.5, evRevenue: 4.5, dataYear: 2025 },
  "Broadcasting": { evEbitda: 9.0, evRevenue: 1.8, dataYear: 2025 },
  "Brokerage & Investment Banking": { evEbitda: 11.0, evRevenue: 3.0, dataYear: 2025 },
  "Building Materials": { evEbitda: 11.5, evRevenue: 1.5, dataYear: 2025 },
  "Business & Consumer Services": { evEbitda: 14.0, evRevenue: 2.5, dataYear: 2025 },
  "Cable TV": { evEbitda: 8.5, evRevenue: 2.5, dataYear: 2025 },
  "Chemical (Basic)": { evEbitda: 8.0, evRevenue: 1.0, dataYear: 2025 },
  "Chemical (Diversified)": { evEbitda: 9.5, evRevenue: 1.2, dataYear: 2025 },
  "Chemical (Specialty)": { evEbitda: 13.0, evRevenue: 2.2, dataYear: 2025 },
  "Coal & Related Energy": { evEbitda: 4.5, evRevenue: 0.8, dataYear: 2025 },
  "Computer Services": { evEbitda: 15.0, evRevenue: 2.0, dataYear: 2025 },
  "Computers/Peripherals": { evEbitda: 14.5, evRevenue: 2.5, dataYear: 2025 },
  "Construction Supplies": { evEbitda: 10.0, evRevenue: 1.2, dataYear: 2025 },
  "Diversified": { evEbitda: 10.0, evRevenue: 1.5, dataYear: 2025 },
  "Drugs (Biotechnology)": { evEbitda: 18.0, evRevenue: 6.0, dataYear: 2025 },
  "Drugs (Pharmaceutical)": { evEbitda: 16.0, evRevenue: 4.5, dataYear: 2025 },
  "Education": { evEbitda: 14.5, evRevenue: 2.8, dataYear: 2025 },
  "Electrical Equipment": { evEbitda: 15.0, evRevenue: 2.2, dataYear: 2025 },
  "Electronics (Consumer & Office)": { evEbitda: 11.0, evRevenue: 1.0, dataYear: 2025 },
  "Electronics (General)": { evEbitda: 15.5, evRevenue: 2.5, dataYear: 2025 },
  "Engineering/Construction": { evEbitda: 9.5, evRevenue: 0.8, dataYear: 2025 },
  "Entertainment": { evEbitda: 16.0, evRevenue: 3.0, dataYear: 2025 },
  "Environmental & Waste Services": { evEbitda: 13.5, evRevenue: 2.5, dataYear: 2025 },
  "Farming/Agriculture": { evEbitda: 12.0, evRevenue: 1.0, dataYear: 2025 },
  "Financial Svcs. (Non-bank & Insurance)": { evEbitda: 13.0, evRevenue: 4.0, dataYear: 2025 },
  "Food Processing": { evEbitda: 13.0, evRevenue: 1.5, dataYear: 2025 },
  "Food Wholesalers": { evEbitda: 10.5, evRevenue: 0.3, dataYear: 2025 },
  "Furn/Home Furnishings": { evEbitda: 10.0, evRevenue: 1.0, dataYear: 2025 },
  "Green & Renewable Energy": { evEbitda: 14.0, evRevenue: 3.5, dataYear: 2025 },
  "Healthcare Products": { evEbitda: 20.0, evRevenue: 4.5, dataYear: 2025 },
  "Healthcare Support Services": { evEbitda: 14.0, evRevenue: 1.5, dataYear: 2025 },
  "Heathcare Information and Technology": { evEbitda: 22.0, evRevenue: 5.0, dataYear: 2025 },
  "Homebuilding": { evEbitda: 8.0, evRevenue: 1.0, dataYear: 2025 },
  "Hospitals/Healthcare Facilities": { evEbitda: 12.0, evRevenue: 1.5, dataYear: 2025 },
  "Hotel/Gaming": { evEbitda: 14.0, evRevenue: 3.0, dataYear: 2025 },
  "Household Products": { evEbitda: 16.0, evRevenue: 3.0, dataYear: 2025 },
  "Information Services": { evEbitda: 22.0, evRevenue: 6.5, dataYear: 2025 },
  "Insurance (General)": { evEbitda: 9.5, evRevenue: 1.2, dataYear: 2025 },
  "Insurance (Life)": { evEbitda: 8.0, evRevenue: 1.0, dataYear: 2025 },
  "Insurance (Prop/Cas.)": { evEbitda: 9.0, evRevenue: 1.5, dataYear: 2025 },
  "Investments & Asset Management": { evEbitda: 12.0, evRevenue: 5.0, dataYear: 2025 },
  "Machinery": { evEbitda: 13.5, evRevenue: 1.8, dataYear: 2025 },
  "Metals & Mining": { evEbitda: 7.0, evRevenue: 1.5, dataYear: 2025 },
  "Office Equipment & Services": { evEbitda: 10.5, evRevenue: 1.2, dataYear: 2025 },
  "Oil/Gas (Integrated)": { evEbitda: 5.5, evRevenue: 1.0, dataYear: 2025 },
  "Oil/Gas (Production and Exploration)": { evEbitda: 5.0, evRevenue: 2.0, dataYear: 2025 },
  "Oil/Gas Distribution": { evEbitda: 8.5, evRevenue: 0.5, dataYear: 2025 },
  "Oilfield Svcs/Equip.": { evEbitda: 7.5, evRevenue: 1.5, dataYear: 2025 },
  "Packaging & Container": { evEbitda: 10.0, evRevenue: 1.5, dataYear: 2025 },
  "Paper/Forest Products": { evEbitda: 8.0, evRevenue: 1.0, dataYear: 2025 },
  "Power": { evEbitda: 10.5, evRevenue: 2.0, dataYear: 2025 },
  "Precious Metals": { evEbitda: 12.0, evRevenue: 3.0, dataYear: 2025 },
  "Publishing & Newspapers": { evEbitda: 10.0, evRevenue: 1.5, dataYear: 2025 },
  "R.E.I.T.": { evEbitda: 18.0, evRevenue: 8.0, dataYear: 2025 },
  "Real Estate (Development)": { evEbitda: 12.0, evRevenue: 2.0, dataYear: 2025 },
  "Real Estate (General/Diversified)": { evEbitda: 15.0, evRevenue: 5.0, dataYear: 2025 },
  "Real Estate (Operations & Services)": { evEbitda: 14.0, evRevenue: 2.5, dataYear: 2025 },
  "Recreation": { evEbitda: 12.5, evRevenue: 2.0, dataYear: 2025 },
  "Reinsurance": { evEbitda: 8.0, evRevenue: 1.5, dataYear: 2025 },
  "Restaurant/Dining": { evEbitda: 14.0, evRevenue: 2.0, dataYear: 2025 },
  "Retail (Automotive)": { evEbitda: 9.0, evRevenue: 0.4, dataYear: 2025 },
  "Retail (Building Supply)": { evEbitda: 14.0, evRevenue: 1.8, dataYear: 2025 },
  "Retail (Distributors)": { evEbitda: 11.0, evRevenue: 0.5, dataYear: 2025 },
  "Retail (General)": { evEbitda: 12.0, evRevenue: 1.0, dataYear: 2025 },
  "Retail (Grocery and Food)": { evEbitda: 9.5, evRevenue: 0.4, dataYear: 2025 },
  "Retail (REITs)": { evEbitda: 16.0, evRevenue: 7.0, dataYear: 2025 },
  "Retail (Special Lines)": { evEbitda: 11.5, evRevenue: 1.0, dataYear: 2025 },
  "Rubber& Tires": { evEbitda: 7.5, evRevenue: 0.8, dataYear: 2025 },
  "Semiconductor": { evEbitda: 20.0, evRevenue: 7.0, dataYear: 2025 },
  "Semiconductor Equip": { evEbitda: 18.0, evRevenue: 5.5, dataYear: 2025 },
  "Shipbuilding & Marine": { evEbitda: 9.0, evRevenue: 1.0, dataYear: 2025 },
  "Shoe": { evEbitda: 13.0, evRevenue: 1.8, dataYear: 2025 },
  "Software (Entertainment)": { evEbitda: 18.0, evRevenue: 4.0, dataYear: 2025 },
  "Software (Internet)": { evEbitda: 25.0, evRevenue: 7.0, dataYear: 2025 },
  "Software (System & Application)": { evEbitda: 28.0, evRevenue: 8.0, dataYear: 2025 },
  "Steel": { evEbitda: 6.5, evRevenue: 0.6, dataYear: 2025 },
  "Telecom (Wireless)": { evEbitda: 8.0, evRevenue: 2.5, dataYear: 2025 },
  "Telecom. Equipment": { evEbitda: 14.0, evRevenue: 2.5, dataYear: 2025 },
  "Telecom. Services": { evEbitda: 7.5, evRevenue: 2.0, dataYear: 2025 },
  "Tobacco": { evEbitda: 9.0, evRevenue: 3.5, dataYear: 2025 },
  "Transportation": { evEbitda: 9.5, evRevenue: 1.2, dataYear: 2025 },
  "Transportation (Railroads)": { evEbitda: 10.5, evRevenue: 3.5, dataYear: 2025 },
  "Trucking": { evEbitda: 8.0, evRevenue: 0.8, dataYear: 2025 },
  "Utility (General)": { evEbitda: 10.0, evRevenue: 2.5, dataYear: 2025 },
  "Utility (Water)": { evEbitda: 12.0, evRevenue: 4.0, dataYear: 2025 },
};

// ========== STAGE ADJUSTMENT FACTORS ==========

export const STAGE_FACTORS: Record<string, number> = {
  "Pre-seed": 0.50,
  "Seed": 0.70,
  "Early Stage": 0.85,
  "Growth": 1.00,
};

/** Default 40% discount applied to public-company multiples for startups */
export const DEFAULT_MULTIPLE_DISCOUNT = 0.40;

/** Default IRR schedule (Year 1 through Year 5) */
export const DEFAULT_IRR_SCHEDULE: [number, number, number, number, number] = [
  0.55, 0.45, 0.35, 0.25, 0.15,
];

/** Default scenario parameters for First Chicago Model */
export const DEFAULT_SCENARIOS = {
  optimistic:  { marketCapture: 1.50, probability: 0.40 },
  realistic:   { marketCapture: 0.60, probability: 0.35 },
  pessimistic: { marketCapture: 0.10, probability: 0.25 },
} as const;

// ========== LOOKUP FUNCTIONS ==========

/**
 * Get EV/EBITDA multiple for a single Damodaran industry.
 * Returns 10.0 as fallback if industry not found.
 */
export function getMultipleForIndustry(industry: string): number {
  return DAMODARAN_MULTIPLES[industry]?.evEbitda ?? 10.0;
}

/**
 * Adjust a base multiple by startup stage factor.
 * Earlier stages get a lower multiple (higher risk discount).
 */
export function getAdjustedMultiple(
  industry: string,
  companyStage: string,
): number {
  const base = getMultipleForIndustry(industry);
  const factor = STAGE_FACTORS[companyStage] ?? 1.0;
  return base * factor;
}

/**
 * Compute a weighted-average EV/EBITDA multiple from a SectorResolution
 * (which maps to 3 Damodaran industries with weights).
 */
export function getWeightedMultiple(
  resolution: SectorResolution,
  companyStage: string,
): number {
  const { damodaranIndustries } = resolution;
  const { weights } = damodaranIndustries;

  const primaryMultiple = getMultipleForIndustry(damodaranIndustries.primary);
  const secondaryMultiple = getMultipleForIndustry(damodaranIndustries.secondary);
  const tertiaryMultiple = getMultipleForIndustry(damodaranIndustries.tertiary);

  const totalWeight = weights.primary + weights.secondary + weights.tertiary;
  const weightedBase =
    (primaryMultiple * weights.primary +
      secondaryMultiple * weights.secondary +
      tertiaryMultiple * weights.tertiary) /
    totalWeight;

  const factor = STAGE_FACTORS[companyStage] ?? 1.0;
  return weightedBase * factor;
}
