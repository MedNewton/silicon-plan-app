// src/lib/sectorMapping.ts
/**
 * CORE-008: Damodaran <-> Onboarding Sector Mapping Layer
 * 
 * This module provides the mapping service between:
 * - Onboarding sectors (user-facing macro categories)
 * - ATECO codes (Italian industry classification)
 * - Damodaran industries (for startup valuation multiples)
 * 
 * Data source: CSV files in src/assets/ATECO-DAMODARAN/
 */

import type {
  OnboardingSector,
  SectorMapping,
  DamodaranIndustry,
  Ateco2Digit,
  AtecoMacro,
  SectorResolution,
  AtecoSearchResult,
} from '@/types/sectors';

// ========== RAW DATA PARSED FROM CSV FILES ==========

/**
 * ATECO Macro Categories
 * Source: ATECO_macros.csv
 */
const ATECO_MACROS: AtecoMacro[] = [
  { code: 'A', name: 'Agriculture', digitCodes: ['01', '02', '03'] },
  {
    code: 'C',
    name: 'Manufacturing',
    digitCodes: [
      '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
      '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
      '30', '31', '32', '33',
    ],
  },
  { code: 'F', name: 'Construction', digitCodes: ['41', '42', '43'] },
  { code: 'G', name: 'Trade & Commerce', digitCodes: ['46', '47'] },
  { code: 'H', name: 'Transportation', digitCodes: ['49', '50', '51', '52', '53'] },
  { code: 'I', name: 'Accommodation & Food Services', digitCodes: ['55', '56'] },
  { code: 'K', name: 'Information & Communication (ICT)', digitCodes: ['61', '62', '63'] },
  { code: 'M', name: 'Real Estate', digitCodes: ['68'] },
  { code: 'O', name: 'Professional & Support Services', digitCodes: ['77', '78', '79', '80', '81', '82'] },
  { code: 'R', name: 'Healthcare', digitCodes: ['86', '87', '88'] },
];

/**
 * ATECO 2-Digit Code Descriptions
 * Specific industry descriptions for each code
 */
const ATECO_CODE_DESCRIPTIONS: Record<string, string> = {
  '01': 'Crop and animal production, hunting',
  '02': 'Forestry and logging',
  '03': 'Fishing and aquaculture',
  '10': 'Food products',
  '11': 'Beverages',
  '12': 'Tobacco products',
  '13': 'Textiles',
  '14': 'Wearing apparel',
  '15': 'Leather and related products',
  '16': 'Wood and wood products',
  '17': 'Paper and paper products',
  '18': 'Printing and reproduction',
  '19': 'Coke and refined petroleum',
  '20': 'Chemicals and chemical products',
  '21': 'Pharmaceuticals',
  '22': 'Rubber and plastic products',
  '23': 'Non-metallic mineral products',
  '24': 'Basic metals',
  '25': 'Fabricated metal products',
  '26': 'Computer, electronic, optical products',
  '27': 'Electrical equipment',
  '28': 'Machinery and equipment',
  '29': 'Motor vehicles, trailers',
  '30': 'Other transport equipment',
  '31': 'Furniture',
  '32': 'Other manufacturing',
  '33': 'Repair and installation of machinery',
  '41': 'Construction of buildings',
  '42': 'Civil engineering',
  '43': 'Specialized construction activities',
  '46': 'Wholesale trade',
  '47': 'Retail trade',
  '49': 'Land transport and pipelines',
  '50': 'Water transport',
  '51': 'Air transport',
  '52': 'Warehousing and support activities',
  '53': 'Postal and courier activities',
  '55': 'Accommodation',
  '56': 'Food and beverage service',
  '61': 'Telecommunications',
  '62': 'Computer programming and consultancy',
  '63': 'Information service activities',
  '68': 'Real estate activities',
  '77': 'Rental and leasing activities',
  '78': 'Employment activities',
  '79': 'Travel agency and tour operator',
  '80': 'Security and investigation',
  '81': 'Services to buildings and landscape',
  '82': 'Office administrative and support',
  '86': 'Human health activities',
  '87': 'Residential care activities',
  '88': 'Social work activities',
};

/**
 * ATECO 2-Digit Codes with descriptions
 * Source: ATECO_2digit_list.csv + manual descriptions
 */
const ATECO_2DIGIT_LIST: Ateco2Digit[] = ATECO_MACROS.flatMap((macro) =>
  macro.digitCodes.map((code) => ({
    code,
    macroCode: macro.code,
    macroName: macro.name,
    description: ATECO_CODE_DESCRIPTIONS[code] ?? macro.name,
  }))
);

/**
 * Damodaran Industries List
 * Source: Damodaran_industries.csv
 */
const DAMODARAN_INDUSTRIES: DamodaranIndustry[] = [
  'Advertising',
  'Aerospace/Defense',
  'Air Transport',
  'Apparel',
  'Auto & Truck',
  'Auto Parts',
  'Bank (Money Center)',
  'Banks (Regional)',
  'Beverage (Alcoholic)',
  'Beverage (Soft)',
  'Broadcasting',
  'Brokerage & Investment Banking',
  'Building Materials',
  'Business & Consumer Services',
  'Cable TV',
  'Chemical (Basic)',
  'Chemical (Diversified)',
  'Chemical (Specialty)',
  'Coal & Related Energy',
  'Computer Services',
  'Computers/Peripherals',
  'Construction Supplies',
  'Diversified',
  'Drugs (Biotechnology)',
  'Drugs (Pharmaceutical)',
  'Education',
  'Electrical Equipment',
  'Electronics (Consumer & Office)',
  'Electronics (General)',
  'Engineering/Construction',
  'Entertainment',
  'Environmental & Waste Services',
  'Farming/Agriculture',
  'Financial Svcs. (Non-bank & Insurance)',
  'Food Processing',
  'Food Wholesalers',
  'Furn/Home Furnishings',
  'Green & Renewable Energy',
  'Healthcare Products',
  'Healthcare Support Services',
  'Heathcare Information and Technology',
  'Homebuilding',
  'Hospitals/Healthcare Facilities',
  'Hotel/Gaming',
  'Household Products',
  'Information Services',
  'Insurance (General)',
  'Insurance (Life)',
  'Insurance (Prop/Cas.)',
  'Investments & Asset Management',
  'Machinery',
  'Metals & Mining',
  'Office Equipment & Services',
  'Oil/Gas (Integrated)',
  'Oil/Gas (Production and Exploration)',
  'Oil/Gas Distribution',
  'Oilfield Svcs/Equip.',
  'Packaging & Container',
  'Paper/Forest Products',
  'Power',
  'Precious Metals',
  'Publishing & Newspapers',
  'R.E.I.T.',
  'Real Estate (Development)',
  'Real Estate (General/Diversified)',
  'Real Estate (Operations & Services)',
  'Recreation',
  'Reinsurance',
  'Restaurant/Dining',
  'Retail (Automotive)',
  'Retail (Building Supply)',
  'Retail (Distributors)',
  'Retail (General)',
  'Retail (Grocery and Food)',
  'Retail (REITs)',
  'Retail (Special Lines)',
  'Rubber& Tires',
  'Semiconductor',
  'Semiconductor Equip',
  'Shipbuilding & Marine',
  'Shoe',
  'Software (Entertainment)',
  'Software (Internet)',
  'Software (System & Application)',
  'Steel',
  'Telecom (Wireless)',
  'Telecom. Equipment',
  'Telecom. Services',
  'Tobacco',
  'Transportation',
  'Transportation (Railroads)',
  'Trucking',
  'Utility (General)',
  'Utility (Water)',
];

/**
 * Complete Sector Mapping
 * Source: Mapping.csv
 */
const SECTOR_MAPPINGS: SectorMapping[] = [
  {
    onboardingSector: 'Software / SaaS / IT',
    atecoMacroPrimary: 'K',
    atecoMacroPrimaryName: 'ICT',
    suggestedAtecoCodes: ['61', '62', '63'],
    damodaranMapping: {
      industry1: 'Software (System & Application)',
      industry2: 'Software (Internet)',
      industry3: 'Information Services',
      weight1: 70,
      weight2: 20,
      weight3: 10,
      notes: 'Se marketplace/abbonamenti web-first, aumenta peso su Software (Internet).',
    },
  },
  {
    onboardingSector: 'IT Services / IT Consulting / System Integrator',
    atecoMacroPrimary: 'K',
    atecoMacroPrimaryName: 'ICT',
    suggestedAtecoCodes: ['62', '63', '61'],
    damodaranMapping: {
      industry1: 'Computer Services',
      industry2: 'Information Services',
      industry3: 'Telecom. Services',
      weight1: 70,
      weight2: 20,
      weight3: 10,
      notes: 'Per MSP/outsourcing IT: Computer Services è spesso il comparabile più diretto.',
    },
  },
  {
    onboardingSector: 'E-commerce / Retail / Marketplace',
    atecoMacroPrimary: 'G',
    atecoMacroPrimaryName: 'Commercio',
    suggestedAtecoCodes: ['47', '46'],
    damodaranMapping: {
      industry1: 'Retail (General)',
      industry2: 'Retail (Special Lines)',
      industry3: 'Retail (Distributors)',
      weight1: 60,
      weight2: 25,
      weight3: 15,
      notes: 'Se food/grocery: usa Retail (Grocery and Food) come alternativa.',
    },
  },
  {
    onboardingSector: 'FinTech / Financial Services / Payments / InsurTech',
    atecoMacroPrimary: 'K',
    atecoMacroPrimaryName: 'ICT',
    suggestedAtecoCodes: ['61', '62', '63'],
    damodaranMapping: {
      industry1: 'Financial Svcs. (Non-bank & Insurance)',
      industry2: 'Investments & Asset Management',
      industry3: 'Brokerage & Investment Banking',
      weight1: 60,
      weight2: 25,
      weight3: 15,
      notes: 'Se è fintech SOFTWARE puro, valuta anche Software (System & Application) come comparabile.',
    },
  },
  {
    onboardingSector: 'Health / MedTech / Pharma / Wellness',
    atecoMacroPrimary: 'R',
    atecoMacroPrimaryName: 'Sanità',
    atecoMacroSecondary: 'C',
    atecoMacroSecondaryName: 'Manifattura',
    suggestedAtecoCodes: ['86', '87', '88', '21'],
    damodaranMapping: {
      industry1: 'Healthcare Products',
      industry2: 'Heathcare Information and Technology',
      industry3: 'Drugs (Pharmaceutical)',
      weight1: 55,
      weight2: 30,
      weight3: 15,
      notes: 'Se cliniche/strutture: considera Hospitals/Healthcare Facilities; se biotech: Drugs (Biotechnology).',
    },
  },
  {
    onboardingSector: 'Education / Training / HR Tech',
    atecoMacroPrimary: 'O',
    atecoMacroPrimaryName: 'Supporto',
    atecoMacroSecondary: 'K',
    atecoMacroSecondaryName: 'ICT',
    suggestedAtecoCodes: ['78', '82', '62'],
    damodaranMapping: {
      industry1: 'Education',
      industry2: 'Business & Consumer Services',
      industry3: 'Computer Services',
      weight1: 60,
      weight2: 25,
      weight3: 15,
      notes: 'Se HR software: aumenta peso su Computer Services / Software.',
    },
  },
  {
    onboardingSector: 'Media / Publishing / Advertising / Creator economy',
    atecoMacroPrimary: 'K',
    atecoMacroPrimaryName: 'ICT',
    atecoMacroSecondary: 'C',
    atecoMacroSecondaryName: 'Manifattura',
    suggestedAtecoCodes: ['63', '62', '18'],
    damodaranMapping: {
      industry1: 'Advertising',
      industry2: 'Publishing & Newspapers',
      industry3: 'Entertainment',
      weight1: 50,
      weight2: 25,
      weight3: 25,
      notes: 'Se broadcaster: usa Broadcasting; se media digitale: Advertising + Entertainment.',
    },
  },
  {
    onboardingSector: 'Tourism / Hospitality / Food Service',
    atecoMacroPrimary: 'I',
    atecoMacroPrimaryName: 'Alloggio/Ristorazione',
    atecoMacroSecondary: 'O',
    atecoMacroSecondaryName: 'Supporto',
    suggestedAtecoCodes: ['55', '56', '79'],
    damodaranMapping: {
      industry1: 'Hotel/Gaming',
      industry2: 'Restaurant/Dining',
      industry3: 'Recreation',
      weight1: 45,
      weight2: 35,
      weight3: 20,
      notes: 'Per tour operator/booking: aumenta peso su Business & Consumer Services o Travel-related (79).',
    },
  },
  {
    onboardingSector: 'Transport / Logistics / Mobility',
    atecoMacroPrimary: 'H',
    atecoMacroPrimaryName: 'Trasporti',
    suggestedAtecoCodes: ['49', '50', '51', '52', '53'],
    damodaranMapping: {
      industry1: 'Transportation',
      industry2: 'Trucking',
      industry3: 'Air Transport',
      weight1: 55,
      weight2: 25,
      weight3: 20,
      notes: 'Se ferroviario: Transportation (Railroads); se mare: Shipbuilding & Marine.',
    },
  },
  {
    onboardingSector: 'Manufacturing / Industry / Mechanics',
    atecoMacroPrimary: 'C',
    atecoMacroPrimaryName: 'Manifattura',
    suggestedAtecoCodes: ['24', '25', '28', '33', '27', '26'],
    damodaranMapping: {
      industry1: 'Machinery',
      industry2: 'Electrical Equipment',
      industry3: 'Metals & Mining',
      weight1: 50,
      weight2: 30,
      weight3: 20,
      notes: 'Se elettronica: Electronics (General); se acciaio: Steel.',
    },
  },
  {
    onboardingSector: 'Agri-food / Agriculture / Food Production',
    atecoMacroPrimary: 'C',
    atecoMacroPrimaryName: 'Manifattura',
    atecoMacroSecondary: 'A',
    atecoMacroSecondaryName: 'Agricoltura',
    suggestedAtecoCodes: ['10', '11', '12', '01', '02', '03'],
    damodaranMapping: {
      industry1: 'Food Processing',
      industry2: 'Farming/Agriculture',
      industry3: 'Beverage (Soft)',
      weight1: 55,
      weight2: 25,
      weight3: 20,
      notes: 'Per alcolici: Beverage (Alcoholic); per wholesaler: Food Wholesalers.',
    },
  },
  {
    onboardingSector: 'Energy / Utilities / Cleantech',
    atecoMacroPrimary: 'C',
    atecoMacroPrimaryName: 'Manifattura',
    suggestedAtecoCodes: ['19'],
    damodaranMapping: {
      industry1: 'Green & Renewable Energy',
      industry2: 'Power',
      industry3: 'Utility (General)',
      weight1: 50,
      weight2: 25,
      weight3: 25,
      notes: 'Se oil&gas: usa Oil/Gas (Production and Exploration) / (Integrated).',
    },
  },
  {
    onboardingSector: 'Construction / Real Estate',
    atecoMacroPrimary: 'F',
    atecoMacroPrimaryName: 'Costruzioni',
    atecoMacroSecondary: 'M',
    atecoMacroSecondaryName: 'Immobili',
    suggestedAtecoCodes: ['41', '42', '43', '68'],
    damodaranMapping: {
      industry1: 'Engineering/Construction',
      industry2: 'Real Estate (General/Diversified)',
      industry3: 'Homebuilding',
      weight1: 45,
      weight2: 35,
      weight3: 20,
      notes: 'Se immobiliare puro: aumenta peso su Real Estate e/o R.E.I.T. a seconda del modello.',
    },
  },
  {
    onboardingSector: 'Professional Services (advisory, legal, accounting)',
    atecoMacroPrimary: 'O',
    atecoMacroPrimaryName: 'Supporto',
    atecoMacroSecondary: 'K',
    atecoMacroSecondaryName: 'ICT',
    suggestedAtecoCodes: ['82', '62'],
    damodaranMapping: {
      industry1: 'Business & Consumer Services',
      industry2: 'Office Equipment & Services',
      industry3: 'Information Services',
      weight1: 60,
      weight2: 25,
      weight3: 15,
      notes: 'Advisory/consulenza: spesso Business & Consumer Services è il comparabile più coerente.',
    },
  },
  {
    onboardingSector: 'Business Services (facility, outsourcing, etc.)',
    atecoMacroPrimary: 'O',
    atecoMacroPrimaryName: 'Supporto',
    suggestedAtecoCodes: ['77', '78', '79', '80', '81', '82'],
    damodaranMapping: {
      industry1: 'Business & Consumer Services',
      industry2: 'Environmental & Waste Services',
      industry3: 'Office Equipment & Services',
      weight1: 60,
      weight2: 25,
      weight3: 15,
      notes: 'Se facility/cleaning: aumenta Environmental & Waste Services.',
    },
  },
  {
    onboardingSector: 'Other (with description)',
    atecoMacroPrimary: 'O',
    atecoMacroPrimaryName: 'Supporto',
    suggestedAtecoCodes: [],
    damodaranMapping: {
      industry1: 'Business & Consumer Services',
      industry2: 'Diversified',
      industry3: 'Information Services',
      weight1: 50,
      weight2: 30,
      weight3: 20,
      notes: 'Obbliga una descrizione e (opzionale) ATECO per migliorare la mappatura.',
    },
  },
];

// ========== PUBLIC API ==========

/**
 * Get all available onboarding sectors
 */
export function getOnboardingSectors(): OnboardingSector[] {
  return SECTOR_MAPPINGS.map((m) => m.onboardingSector);
}

/**
 * Get all Damodaran industries
 */
export function getDamodaranIndustries(): DamodaranIndustry[] {
  return [...DAMODARAN_INDUSTRIES];
}

/**
 * Export Damodaran industry names as a constant array for use in dropdowns
 */
export const DAMODARAN_INDUSTRY_NAMES: readonly string[] = DAMODARAN_INDUSTRIES;

/**
 * Get all ATECO 2-digit codes
 */
export function getAteco2DigitCodes(): Ateco2Digit[] {
  return [...ATECO_2DIGIT_LIST];
}

/**
 * Get ATECO macro categories
 */
export function getAtecoMacros(): AtecoMacro[] {
  return [...ATECO_MACROS];
}

/**
 * Search ATECO codes by code, macro name, or description
 */
export function searchAtecoCodes(query: string): AtecoSearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return [];
  }

  return ATECO_2DIGIT_LIST
    .filter((ateco) => {
      const codeMatch = ateco.code.includes(normalizedQuery);
      const nameMatch = ateco.macroName.toLowerCase().includes(normalizedQuery);
      const descMatch = ateco.description.toLowerCase().includes(normalizedQuery);
      return codeMatch || nameMatch || descMatch;
    })
    .map((ateco) => ({
      code: ateco.code,
      macroCode: ateco.macroCode,
      macroName: ateco.macroName,
      description: ateco.description,
      displayLabel: `${ateco.code} - ${ateco.description}`,
    }))
    .slice(0, 20); // Limit results
}

/**
 * Get sector mapping for a given onboarding sector
 */
export function getSectorMapping(
  onboardingSector: OnboardingSector
): SectorMapping | null {
  return SECTOR_MAPPINGS.find((m) => m.onboardingSector === onboardingSector) ?? null;
}

/**
 * Resolve Damodaran industries for a given onboarding sector and optional ATECO code
 * This is the main function for CORE-008
 */
export function resolveSectorToDamodaran(
  onboardingSector: OnboardingSector,
  atecoCode?: string
): SectorResolution | null {
  const mapping = getSectorMapping(onboardingSector);
  
  if (!mapping) {
    return null;
  }

  // If ATECO code is provided, validate it matches the suggested codes
  const refinedMapping = mapping.damodaranMapping;
  
  if (atecoCode) {
    const isValidAteco = mapping.suggestedAtecoCodes.includes(atecoCode);
    
    // If ATECO doesn't match suggestions, we still use the base mapping
    // but could log a warning or adjust weights in the future
    if (!isValidAteco) {
      console.warn(
        `ATECO code ${atecoCode} not in suggested codes for ${onboardingSector}`
      );
    }
  }

  return {
    onboardingSector,
    atecoCode,
    damodaranIndustries: {
      primary: refinedMapping.industry1,
      secondary: refinedMapping.industry2,
      tertiary: refinedMapping.industry3,
      weights: {
        primary: refinedMapping.weight1,
        secondary: refinedMapping.weight2,
        tertiary: refinedMapping.weight3,
      },
    },
    disambiguationNotes: refinedMapping.notes,
  };
}

/**
 * Get suggested ATECO codes for an onboarding sector
 */
export function getSuggestedAtecoCodes(
  onboardingSector: OnboardingSector
): string[] {
  const mapping = getSectorMapping(onboardingSector);
  return mapping?.suggestedAtecoCodes ?? [];
}

/**
 * Get ATECO details by code
 */
export function getAtecoByCode(code: string): Ateco2Digit | null {
  return ATECO_2DIGIT_LIST.find((a) => a.code === code) ?? null;
}
