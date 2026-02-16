// src/types/sectors.ts

/**
 * ATECO (Italian industry classification) types
 */
export type AtecoMacroCode = 'A' | 'C' | 'F' | 'G' | 'H' | 'I' | 'K' | 'M' | 'O' | 'R';

export type AtecoMacro = {
  code: AtecoMacroCode;
  name: string;
  digitCodes: string[];
};

export type Ateco2Digit = {
  code: string; // e.g., "62"
  macroCode: AtecoMacroCode;
  macroName: string;
  description: string; // e.g., "Computer programming and consultancy"
};

/**
 * Damodaran industry types (for valuation multiples)
 */
export type DamodaranIndustry = string; // e.g., "Software (System & Application)"

/**
 * Onboarding sector (user-facing macro sectors)
 */
export type OnboardingSector =
  | 'Software / SaaS / IT'
  | 'IT Services / IT Consulting / System Integrator'
  | 'E-commerce / Retail / Marketplace'
  | 'FinTech / Financial Services / Payments / InsurTech'
  | 'Health / MedTech / Pharma / Wellness'
  | 'Education / Training / HR Tech'
  | 'Media / Publishing / Advertising / Creator economy'
  | 'Tourism / Hospitality / Food Service'
  | 'Transport / Logistics / Mobility'
  | 'Manufacturing / Industry / Mechanics'
  | 'Agri-food / Agriculture / Food Production'
  | 'Energy / Utilities / Cleantech'
  | 'Construction / Real Estate'
  | 'Professional Services (advisory, legal, accounting)'
  | 'Business Services (facility, outsourcing, etc.)'
  | 'Other (with description)';

/**
 * Weighted Damodaran industry mapping
 */
export type DamodaranMapping = {
  industry1: DamodaranIndustry;
  industry2: DamodaranIndustry;
  industry3: DamodaranIndustry;
  weight1: number; // percentage (e.g., 70)
  weight2: number;
  weight3: number;
  notes?: string; // disambiguation rules
};

/**
 * Complete sector mapping entry
 */
export type SectorMapping = {
  onboardingSector: OnboardingSector;
  atecoMacroPrimary: AtecoMacroCode;
  atecoMacroPrimaryName: string;
  atecoMacroSecondary?: AtecoMacroCode;
  atecoMacroSecondaryName?: string;
  suggestedAtecoCodes: string[]; // 2-digit codes
  damodaranMapping: DamodaranMapping;
};

/**
 * ATECO search result
 */
export type AtecoSearchResult = {
  code: string;
  macroCode: AtecoMacroCode;
  macroName: string;
  description: string;
  displayLabel: string; // e.g., "62 - Computer programming and consultancy"
};

/**
 * Sector resolution result (for business profile)
 */
export type SectorResolution = {
  onboardingSector: OnboardingSector;
  atecoCode?: string;
  damodaranIndustries: {
    primary: DamodaranIndustry;
    secondary: DamodaranIndustry;
    tertiary: DamodaranIndustry;
    weights: {
      primary: number;
      secondary: number;
      tertiary: number;
    };
  };
  disambiguationNotes?: string;
};
