// src/components/valuation/inputs/IncomeStatementPreview.tsx
"use client";

import { useMemo, type FC } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import type {
  RevenueLineItem,
  CostLineItem,
  FiveYearValues,
  IncomeStatement,
} from "@/types/financialProjections";
import { computeIncomeStatement } from "@/lib/valuation";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type Props = {
  revenueLines: RevenueLineItem[];
  costLines: CostLineItem[];
  depreciation: FiveYearValues;
  taxRate: number;
  yearLabels: [string, string, string, string, string];
};

const cellSx = {
  px: 1.5,
  py: 1,
  fontSize: 13,
  borderColor: "#E5E7EB",
} as const;

const fmt = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 0 });

type RowDef = {
  labelKey: string;
  field: keyof IncomeStatement;
  bold?: boolean;
  highlight?: boolean;
};

const ROWS: RowDef[] = [
  { labelKey: "Revenue", field: "revenue", bold: true },
  { labelKey: "Total Costs", field: "totalCosts" },
  { labelKey: "EBITDA", field: "ebitda", bold: true, highlight: true },
  { labelKey: "Depreciation", field: "depreciation" },
  { labelKey: "EBIT", field: "ebit", bold: true },
  { labelKey: "Taxes", field: "taxes" },
  { labelKey: "Net Income", field: "netIncome", bold: true, highlight: true },
];

const IncomeStatementPreview: FC<Props> = ({
  revenueLines,
  costLines,
  depreciation,
  taxRate,
  yearLabels,
}) => {
  const { locale } = useLanguage();

  const is = useMemo(
    () => computeIncomeStatement(revenueLines, costLines, depreciation, taxRate),
    [revenueLines, costLines, depreciation, taxRate],
  );

  const rowLabels: Record<string, string> =
    locale === "it"
      ? {
          Revenue: "Ricavi",
          "Total Costs": "Costi Totali",
          EBITDA: "EBITDA",
          Depreciation: "Ammortamenti",
          EBIT: "EBIT",
          Taxes: "Imposte",
          "Net Income": "Utile Netto",
        }
      : {
          Revenue: "Revenue",
          "Total Costs": "Total Costs",
          EBITDA: "EBITDA",
          Depreciation: "Depreciation",
          EBIT: "EBIT",
          Taxes: "Taxes",
          "Net Income": "Net Income",
        };

  return (
    <Box>
      <TableContainer
        sx={{
          border: "1px solid #E5E7EB",
          borderRadius: 2,
          overflow: "auto",
        }}
      >
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#F9FAFB" }}>
              <TableCell
                sx={{ ...cellSx, fontWeight: 600, minWidth: 160, color: "#4B5563" }}
              />
              {yearLabels.map((y) => (
                <TableCell
                  key={y}
                  align="right"
                  sx={{ ...cellSx, fontWeight: 600, minWidth: 110, color: "#4B5563" }}
                >
                  {y}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {ROWS.map((row) => (
              <TableRow
                key={row.field}
                sx={{
                  bgcolor: row.highlight ? "#F3F4FB" : "transparent",
                }}
              >
                <TableCell
                  sx={{
                    ...cellSx,
                    fontWeight: row.bold ? 700 : 400,
                    color: row.highlight ? "#4C6AD2" : "#374151",
                  }}
                >
                  {rowLabels[row.labelKey]}
                </TableCell>
                {is[row.field].map((val, yIdx) => (
                  <TableCell
                    key={yIdx}
                    align="right"
                    sx={{
                      ...cellSx,
                      fontWeight: row.bold ? 600 : 400,
                      color: val < 0 ? "#DC2626" : row.highlight ? "#4C6AD2" : "#374151",
                    }}
                  >
                    {fmt(val)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default IncomeStatementPreview;
