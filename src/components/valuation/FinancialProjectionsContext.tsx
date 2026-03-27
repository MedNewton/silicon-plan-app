// src/components/valuation/FinancialProjectionsContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type FC,
  type ReactNode,
} from "react";
import { toast } from "react-toastify";
import type {
  FinancialProjectionData,
  IndustryClassification,
} from "@/types/financialProjections";
import type { FullValuationResults } from "@/types/valuation";
import { useLanguage } from "@/components/i18n/LanguageProvider";

// ========== DEFAULT DATA ==========

const currentYear = new Date().getFullYear();
const defaultYearLabels: [string, string, string, string, string] = [
  String(currentYear + 1),
  String(currentYear + 2),
  String(currentYear + 3),
  String(currentYear + 4),
  String(currentYear + 5),
];

export const EMPTY_FINANCIAL_DATA: FinancialProjectionData = {
  schemaVersion: 1,
  revenueLines: [{ label: "", values: [0, 0, 0, 0, 0] }],
  costLines: [{ label: "", type: "fixed", values: [0, 0, 0, 0, 0] }],
  balanceSheet: {
    totalAssets: [0, 0, 0, 0, 0],
    equity: [0, 0, 0, 0, 0],
    debt: [0, 0, 0, 0, 0],
    investedCapital: [0, 0, 0, 0, 0],
  },
  valuationInputs: {
    investmentAmount: 500000,
    discountRate: 0.1,
    terminalGrowthRate: 0.025,
    taxRate: 0.2897,
    capex: [0, 0, 0, 0, 0],
    depreciation: [0, 0, 0, 0, 0],
    irrSchedule: [0.55, 0.45, 0.35, 0.25, 0.15],
    roe: 0.15,
    roi: 0.05,
    scenarios: {
      optimistic: { marketCapture: 1.5, probability: 0.3 },
      realistic: { marketCapture: 1.0, probability: 0.4 },
      pessimistic: { marketCapture: 0.5, probability: 0.3 },
    },
  },
  yearLabels: defaultYearLabels,
};

// ========== CONTEXT TYPE ==========

type FinancialProjectionsContextValue = {
  workspaceId: string;

  financialData: FinancialProjectionData;
  industryClassification: IndustryClassification | null;
  valuationResults: FullValuationResults | null;

  isLoading: boolean;
  isSaving: boolean;
  isCalculating: boolean;
  isGeneratingReport: boolean;

  setFinancialData: (data: FinancialProjectionData) => void;
  setIndustryClassification: (ic: IndustryClassification | null) => void;

  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  calculateValuation: () => Promise<void>;
  generateReport: () => Promise<void>;
};

const FinancialProjectionsContext =
  createContext<FinancialProjectionsContextValue | null>(null);

// ========== HOOK ==========

export function useFinancialProjections(): FinancialProjectionsContextValue {
  const ctx = useContext(FinancialProjectionsContext);
  if (!ctx) {
    throw new Error(
      "useFinancialProjections must be used within a FinancialProjectionsProvider",
    );
  }
  return ctx;
}

// ========== PROVIDER ==========

type ProviderProps = {
  workspaceId: string;
  children: ReactNode;
};

export const FinancialProjectionsProvider: FC<ProviderProps> = ({
  workspaceId,
  children,
}) => {
  const { t, locale } = useLanguage();

  const [financialData, setFinancialData] =
    useState<FinancialProjectionData>(EMPTY_FINANCIAL_DATA);
  const [industryClassification, setIndustryClassification] =
    useState<IndustryClassification | null>(null);
  const [valuationResults, setValuationResults] =
    useState<FullValuationResults | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // -------- LOAD --------
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/financial-projections`,
      );
      if (!res.ok) throw new Error("Failed to load financial data");

      const json = (await res.json()) as {
        financialData: FinancialProjectionData | null;
        industryClassification: IndustryClassification | null;
        valuationResults: FullValuationResults | null;
      };

      if (json.financialData) {
        setFinancialData(json.financialData);
      }
      if (json.industryClassification) {
        setIndustryClassification(json.industryClassification);
      }
      if (json.valuationResults) {
        setValuationResults(json.valuationResults);
      }
    } catch {
      // First load — no data yet is fine, just use defaults
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // -------- SAVE --------
  const saveData = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/financial-projections`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            financialData,
            industryClassification,
            runValuation: false,
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to save");
      toast.success(t("financials.saved"));
    } catch {
      toast.error("Failed to save financial data");
    } finally {
      setIsSaving(false);
    }
  }, [workspaceId, financialData, industryClassification, t]);

  // -------- CALCULATE VALUATION --------
  const calculateValuation = useCallback(async () => {
    if (!industryClassification) {
      toast.error("Please set the industry classification first.");
      return;
    }
    setIsCalculating(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/financial-projections`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            financialData,
            industryClassification,
            runValuation: true,
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to calculate");

      const json = (await res.json()) as {
        financialData: FinancialProjectionData;
        industryClassification: IndustryClassification;
        valuationResults: FullValuationResults | null;
      };

      if (json.valuationResults) {
        setValuationResults(json.valuationResults);
      }
      toast.success(t("financials.calculated"));
    } catch {
      toast.error("Failed to calculate valuation");
    } finally {
      setIsCalculating(false);
    }
  }, [workspaceId, financialData, industryClassification, t]);

  // -------- GENERATE REPORT --------
  const generateReport = useCallback(async () => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/business-plan/generate-valuation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale }),
        },
      );
      if (!res.ok) throw new Error("Failed to generate report");
      toast.success(t("financials.reportGenerated"));
    } catch {
      toast.error("Failed to generate valuation report");
    } finally {
      setIsGeneratingReport(false);
    }
  }, [workspaceId, locale, t]);

  return (
    <FinancialProjectionsContext.Provider
      value={{
        workspaceId,
        financialData,
        industryClassification,
        valuationResults,
        isLoading,
        isSaving,
        isCalculating,
        isGeneratingReport,
        setFinancialData,
        setIndustryClassification,
        loadData,
        saveData,
        calculateValuation,
        generateReport,
      }}
    >
      {children}
    </FinancialProjectionsContext.Provider>
  );
};
