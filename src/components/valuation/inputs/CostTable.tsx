// src/components/valuation/inputs/CostTable.tsx
"use client";

import type { FC } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { CostLineItem, FiveYearValues } from "@/types/financialProjections";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type Props = {
  rows: CostLineItem[];
  yearLabels: [string, string, string, string, string];
  onChange: (rows: CostLineItem[]) => void;
};

const cellSx = {
  px: 1,
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

const CostTable: FC<Props> = ({ rows, yearLabels, onChange }) => {
  const { t } = useLanguage();

  const handleLabelChange = (idx: number, label: string) => {
    const next = [...rows];
    next[idx] = { ...next[idx]!, label };
    onChange(next);
  };

  const handleTypeToggle = (idx: number) => {
    const next = [...rows];
    const current = next[idx]!;
    next[idx] = { ...current, type: current.type === "fixed" ? "variable" : "fixed" };
    onChange(next);
  };

  const handleValueChange = (rowIdx: number, yearIdx: number, raw: string) => {
    const num = raw === "" ? 0 : parseFloat(raw.replace(/,/g, ""));
    if (isNaN(num)) return;
    const next = [...rows];
    const values = [...next[rowIdx]!.values] as unknown as FiveYearValues;
    values[yearIdx] = num;
    next[rowIdx] = { ...next[rowIdx]!, values };
    onChange(next);
  };

  const addRow = () => {
    onChange([...rows, { label: "", type: "fixed", values: [0, 0, 0, 0, 0] }]);
  };

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, i) => i !== idx));
  };

  const totals: FiveYearValues = [0, 0, 0, 0, 0];
  for (const row of rows) {
    for (let y = 0; y < 5; y++) {
      totals[y] = totals[y]! + row.values[y]!;
    }
  }

  return (
    <Box>
      <TableContainer
        sx={{
          border: "1px solid #E5E7EB",
          borderRadius: 2,
          overflow: "auto",
        }}
      >
        <Table size="small" sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#F9FAFB" }}>
              <TableCell sx={{ ...cellSx, fontWeight: 600, minWidth: 150, color: "#4B5563" }}>
                {t("financials.label")}
              </TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 600, minWidth: 80, color: "#4B5563" }} align="center">
                {t("financials.type")}
              </TableCell>
              {yearLabels.map((y) => (
                <TableCell
                  key={y}
                  align="right"
                  sx={{ ...cellSx, fontWeight: 600, minWidth: 110, color: "#4B5563" }}
                >
                  {y}
                </TableCell>
              ))}
              <TableCell sx={{ ...cellSx, width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rIdx) => (
              <TableRow key={rIdx} sx={{ "&:hover": { bgcolor: "#FAFBFF" } }}>
                <TableCell sx={cellSx}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder={`${t("financials.label")} ${rIdx + 1}`}
                    value={row.label}
                    onChange={(e) => handleLabelChange(rIdx, e.target.value)}
                    sx={{
                      ...inputSx,
                      "& .MuiInputBase-input": {
                        ...inputSx["& .MuiInputBase-input"],
                        textAlign: "left",
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={cellSx} align="center">
                  <Chip
                    label={row.type === "fixed" ? t("financials.fixed") : t("financials.variable")}
                    size="small"
                    onClick={() => handleTypeToggle(rIdx)}
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      height: 24,
                      cursor: "pointer",
                      bgcolor: row.type === "fixed" ? "#EEF2FF" : "#FEF3C7",
                      color: row.type === "fixed" ? "#4C6AD2" : "#92400E",
                      "&:hover": {
                        bgcolor: row.type === "fixed" ? "#DBE4FF" : "#FDE68A",
                      },
                    }}
                  />
                </TableCell>
                {row.values.map((val, yIdx) => (
                  <TableCell key={yIdx} align="right" sx={cellSx}>
                    <TextField
                      size="small"
                      fullWidth
                      value={val === 0 ? "" : val.toLocaleString("en-US")}
                      onChange={(e) =>
                        handleValueChange(rIdx, yIdx, e.target.value)
                      }
                      placeholder="0"
                      sx={inputSx}
                    />
                  </TableCell>
                ))}
                <TableCell sx={cellSx} align="center">
                  <IconButton
                    size="small"
                    onClick={() => removeRow(rIdx)}
                    disabled={rows.length <= 1}
                    sx={{ color: "#9CA3AF", "&:hover": { color: "#EF4444" } }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {/* TOTAL ROW */}
            <TableRow sx={{ bgcolor: "#F3F4FB" }}>
              <TableCell sx={{ ...cellSx, fontWeight: 700, color: "#4C6AD2" }}>
                {t("financials.total")}
              </TableCell>
              <TableCell sx={cellSx} />
              {totals.map((val, yIdx) => (
                <TableCell
                  key={yIdx}
                  align="right"
                  sx={{ ...cellSx, fontWeight: 700, color: "#4C6AD2" }}
                >
                  {val.toLocaleString("en-US")}
                </TableCell>
              ))}
              <TableCell sx={cellSx} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        size="small"
        startIcon={<AddIcon sx={{ fontSize: 16 }} />}
        onClick={addRow}
        sx={{
          mt: 1.5,
          textTransform: "none",
          fontSize: 13,
          fontWeight: 600,
          color: "#4C6AD2",
          "&:hover": { bgcolor: "rgba(76,106,210,0.06)" },
        }}
      >
        {t("financials.addRow")}
      </Button>
    </Box>
  );
};

export default CostTable;
