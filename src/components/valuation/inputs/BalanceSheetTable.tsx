// src/components/valuation/inputs/BalanceSheetTable.tsx
"use client";

import type { FC } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import type { BalanceSheet, FiveYearValues } from "@/types/financialProjections";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type Props = {
  balanceSheet: BalanceSheet;
  yearLabels: [string, string, string, string, string];
  onChange: (bs: BalanceSheet) => void;
};

const cellSx = {
  px: 1.5,
  py: 0.75,
  fontSize: 13,
  borderColor: "#E5E7EB",
} as const;

const inputSx = {
  "& .MuiInputBase-input": {
    fontSize: 13,
    px: 1,
    py: 0.6,
    textAlign: "right",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#E5E7EB",
  },
} as const;

type FieldKey = keyof BalanceSheet;

const FIELDS: { key: FieldKey; enLabel: string; itLabel: string }[] = [
  { key: "totalAssets", enLabel: "Total Assets", itLabel: "Totale Attivo" },
  { key: "equity", enLabel: "Equity", itLabel: "Patrimonio Netto" },
  { key: "debt", enLabel: "Debt", itLabel: "Debiti" },
  { key: "investedCapital", enLabel: "Invested Capital", itLabel: "Capitale Investito" },
];

const BalanceSheetTable: FC<Props> = ({ balanceSheet, yearLabels, onChange }) => {
  const { locale } = useLanguage();

  const handleChange = (field: FieldKey, yearIdx: number, raw: string) => {
    const num = raw === "" ? 0 : parseFloat(raw.replace(/,/g, ""));
    if (isNaN(num)) return;
    const values = [...balanceSheet[field]] as unknown as FiveYearValues;
    values[yearIdx] = num;
    onChange({ ...balanceSheet, [field]: values });
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
                sx={{ ...cellSx, fontWeight: 600, minWidth: 170, color: "#4B5563" }}
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
            {FIELDS.map((f) => (
              <TableRow key={f.key} sx={{ "&:hover": { bgcolor: "#FAFBFF" } }}>
                <TableCell sx={{ ...cellSx, fontWeight: 600, color: "#374151" }}>
                  {locale === "it" ? f.itLabel : f.enLabel}
                </TableCell>
                {balanceSheet[f.key].map((val, yIdx) => (
                  <TableCell key={yIdx} align="right" sx={cellSx}>
                    <TextField
                      size="small"
                      fullWidth
                      value={val === 0 ? "" : val.toLocaleString("en-US")}
                      onChange={(e) => handleChange(f.key, yIdx, e.target.value)}
                      placeholder="0"
                      sx={inputSx}
                    />
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

export default BalanceSheetTable;
