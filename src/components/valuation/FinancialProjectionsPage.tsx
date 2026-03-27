// src/components/valuation/FinancialProjectionsPage.tsx
"use client";

import { useState, useCallback, type FC } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import MoneyOffOutlinedIcon from "@mui/icons-material/MoneyOffOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import { useFinancialProjections } from "./FinancialProjectionsContext";
import IndustryVerification from "./inputs/IndustryVerification";
import RevenueTable from "./inputs/RevenueTable";
import CostTable from "./inputs/CostTable";
import IncomeStatementPreview from "./inputs/IncomeStatementPreview";
import BalanceSheetTable from "./inputs/BalanceSheetTable";
import ValuationParamsForm from "./inputs/ValuationParamsForm";
import ValuationResultsPanel from "./ValuationResultsPanel";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type {
  FinancialProjectionData,
  RevenueLineItem,
  CostLineItem,
  BalanceSheet,
  ValuationInputs,
  IndustryClassification,
} from "@/types/financialProjections";

const ACTIVE_COLOR = "#4C6AD2";

const sectionHeaderSx = {
  fontSize: 14,
  fontWeight: 700,
  color: "#374151",
} as const;

const sectionDescSx = {
  fontSize: 12,
  color: "#6B7280",
  mt: 0.3,
} as const;

const accordionSx = {
  border: "1px solid #E5E7EB",
  borderRadius: "12px !important",
  boxShadow: "none",
  "&:before": { display: "none" },
  "&.Mui-expanded": { margin: 0 },
  overflow: "hidden",
} as const;

type SectionKey =
  | "industry"
  | "revenue"
  | "costs"
  | "income"
  | "balance"
  | "params"
  | "results";

const FinancialProjectionsPage: FC = () => {
  const { t } = useLanguage();
  const {
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
    saveData,
    calculateValuation,
    generateReport,
  } = useFinancialProjections();

  const [expanded, setExpanded] = useState<SectionKey | false>("industry");

  const handleAccordion =
    (panel: SectionKey) => (_: unknown, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  // Updaters that produce new FinancialProjectionData
  const updateField = useCallback(
    <K extends keyof FinancialProjectionData>(
      key: K,
      value: FinancialProjectionData[K],
    ) => {
      setFinancialData({ ...financialData, [key]: value });
    },
    [financialData, setFinancialData],
  );

  const updateValuationInputs = useCallback(
    (vi: ValuationInputs) => {
      setFinancialData({ ...financialData, valuationInputs: vi });
    },
    [financialData, setFinancialData],
  );

  const updateBalanceSheet = useCallback(
    (bs: BalanceSheet) => {
      setFinancialData({ ...financialData, balanceSheet: bs });
    },
    [financialData, setFinancialData],
  );

  const handleIndustryChange = useCallback(
    (ic: IndustryClassification) => {
      setIndustryClassification(ic);
    },
    [setIndustryClassification],
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={32} sx={{ color: ACTIVE_COLOR }} />
      </Box>
    );
  }

  const sections: {
    key: SectionKey;
    icon: React.ReactNode;
    titleKey: string;
    descKey: string;
  }[] = [
    {
      key: "industry",
      icon: <CategoryOutlinedIcon sx={{ fontSize: 20, color: ACTIVE_COLOR }} />,
      titleKey: "financials.industry",
      descKey: "financials.industryDesc",
    },
    {
      key: "revenue",
      icon: <TrendingUpOutlinedIcon sx={{ fontSize: 20, color: ACTIVE_COLOR }} />,
      titleKey: "financials.revenue",
      descKey: "financials.revenueDesc",
    },
    {
      key: "costs",
      icon: <MoneyOffOutlinedIcon sx={{ fontSize: 20, color: ACTIVE_COLOR }} />,
      titleKey: "financials.costs",
      descKey: "financials.costsDesc",
    },
    {
      key: "income",
      icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 20, color: ACTIVE_COLOR }} />,
      titleKey: "financials.incomeStatement",
      descKey: "financials.incomeStatementDesc",
    },
    {
      key: "balance",
      icon: <AccountBalanceOutlinedIcon sx={{ fontSize: 20, color: ACTIVE_COLOR }} />,
      titleKey: "financials.balanceSheet",
      descKey: "financials.balanceSheetDesc",
    },
    {
      key: "params",
      icon: <TuneOutlinedIcon sx={{ fontSize: 20, color: ACTIVE_COLOR }} />,
      titleKey: "financials.valuationParams",
      descKey: "financials.valuationParamsDesc",
    },
  ];

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* SCROLLABLE CONTENT */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 4,
          py: 3,
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {/* TITLE */}
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 700,
            color: "#111827",
            mb: 0.5,
          }}
        >
          {t("financials.title")}
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#6B7280", mb: 3 }}>
          {t("financials.noData").replace(
            "No financial data yet. Start by filling in your revenue projections.",
            "",
          ) || t("financials.noData")}
        </Typography>

        {/* ACCORDION SECTIONS */}
        <Stack spacing={2}>
          {sections.map((sec) => (
            <Accordion
              key={sec.key}
              expanded={expanded === sec.key}
              onChange={handleAccordion(sec.key)}
              sx={accordionSx}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: "#9CA3AF" }} />}
                sx={{
                  px: 2.5,
                  py: 0.5,
                  "&.Mui-expanded": { minHeight: 56 },
                  "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1.5 },
                }}
              >
                {sec.icon}
                <Box>
                  <Typography sx={sectionHeaderSx}>{t(sec.titleKey as Parameters<typeof t>[0])}</Typography>
                  <Typography sx={sectionDescSx}>{t(sec.descKey as Parameters<typeof t>[0])}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                {sec.key === "industry" && (
                  <IndustryVerification
                    workspaceId={workspaceId}
                    classification={industryClassification}
                    onChange={handleIndustryChange}
                  />
                )}
                {sec.key === "revenue" && (
                  <RevenueTable
                    rows={financialData.revenueLines}
                    yearLabels={financialData.yearLabels}
                    onChange={(rows: RevenueLineItem[]) =>
                      updateField("revenueLines", rows)
                    }
                  />
                )}
                {sec.key === "costs" && (
                  <CostTable
                    rows={financialData.costLines}
                    yearLabels={financialData.yearLabels}
                    onChange={(rows: CostLineItem[]) =>
                      updateField("costLines", rows)
                    }
                  />
                )}
                {sec.key === "income" && (
                  <IncomeStatementPreview
                    revenueLines={financialData.revenueLines}
                    costLines={financialData.costLines}
                    depreciation={financialData.valuationInputs.depreciation}
                    taxRate={financialData.valuationInputs.taxRate}
                    yearLabels={financialData.yearLabels}
                  />
                )}
                {sec.key === "balance" && (
                  <BalanceSheetTable
                    balanceSheet={financialData.balanceSheet}
                    yearLabels={financialData.yearLabels}
                    onChange={updateBalanceSheet}
                  />
                )}
                {sec.key === "params" && (
                  <ValuationParamsForm
                    inputs={financialData.valuationInputs}
                    yearLabels={financialData.yearLabels}
                    onChange={updateValuationInputs}
                  />
                )}
              </AccordionDetails>
            </Accordion>
          ))}

          {/* RESULTS SECTION (shown after calculation) */}
          {valuationResults && (
            <Accordion
              expanded={expanded === "results"}
              onChange={handleAccordion("results")}
              sx={accordionSx}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: "#9CA3AF" }} />}
                sx={{
                  px: 2.5,
                  py: 0.5,
                  bgcolor: "#F3F4FB",
                  "&.Mui-expanded": { minHeight: 56 },
                  "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1.5 },
                }}
              >
                <AssessmentOutlinedIcon sx={{ fontSize: 20, color: ACTIVE_COLOR }} />
                <Box>
                  <Typography sx={sectionHeaderSx}>{t("financials.results")}</Typography>
                  <Typography sx={sectionDescSx}>{t("financials.resultsDesc")}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <ValuationResultsPanel results={valuationResults} />
              </AccordionDetails>
            </Accordion>
          )}
        </Stack>
      </Box>

      {/* BOTTOM ACTION BAR */}
      <Divider sx={{ borderColor: "#E5E7EB" }} />
      <Box
        sx={{
          px: 4,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1.5,
          bgcolor: "#FFFFFF",
          flexShrink: 0,
        }}
      >
        {/* SAVE */}
        <Button
          variant="outlined"
          onClick={saveData}
          disabled={isSaving}
          startIcon={
            isSaving ? (
              <CircularProgress size={14} sx={{ color: "#9CA3AF" }} />
            ) : (
              <SaveOutlinedIcon sx={{ fontSize: 16 }} />
            )
          }
          sx={{
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            borderColor: "#D3DDF5",
            color: ACTIVE_COLOR,
            borderRadius: 2,
            px: 2.5,
            py: 0.75,
            "&:hover": {
              bgcolor: "rgba(76,106,210,0.04)",
              borderColor: ACTIVE_COLOR,
            },
          }}
        >
          {isSaving ? t("financials.saving") : t("financials.save")}
        </Button>

        {/* CALCULATE */}
        <Button
          variant="outlined"
          onClick={calculateValuation}
          disabled={isCalculating || !industryClassification}
          startIcon={
            isCalculating ? (
              <CircularProgress size={14} sx={{ color: "#9CA3AF" }} />
            ) : (
              <CalculateOutlinedIcon sx={{ fontSize: 16 }} />
            )
          }
          sx={{
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            borderColor: "#D3DDF5",
            color: ACTIVE_COLOR,
            borderRadius: 2,
            px: 2.5,
            py: 0.75,
            "&:hover": {
              bgcolor: "rgba(76,106,210,0.04)",
              borderColor: ACTIVE_COLOR,
            },
          }}
        >
          {isCalculating ? t("financials.calculating") : t("financials.calculate")}
        </Button>

        {/* GENERATE REPORT */}
        <Button
          variant="contained"
          onClick={generateReport}
          disabled={isGeneratingReport || !valuationResults}
          startIcon={
            isGeneratingReport ? (
              <CircularProgress size={14} sx={{ color: "#FFFFFF" }} />
            ) : (
              <DescriptionOutlinedIcon sx={{ fontSize: 16 }} />
            )
          }
          sx={{
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 2,
            px: 2.5,
            py: 0.75,
            background: `linear-gradient(90deg, ${ACTIVE_COLOR} 0%, #7B4FD6 100%)`,
            boxShadow: "none",
            "&:hover": {
              background: `linear-gradient(90deg, #3B5BC0 0%, #6A3EC5 100%)`,
              boxShadow: "none",
            },
            "&.Mui-disabled": {
              background: "#E5E7EB",
              color: "#9CA3AF",
            },
          }}
        >
          {isGeneratingReport
            ? t("financials.generating")
            : t("financials.generateReport")}
        </Button>
      </Box>
    </Box>
  );
};

export default FinancialProjectionsPage;
