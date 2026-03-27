// src/components/valuation/inputs/ValuationParamsForm.tsx
"use client";

import type { FC } from "react";
import {
  Box,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { ValuationInputs, FiveYearValues } from "@/types/financialProjections";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type Props = {
  inputs: ValuationInputs;
  yearLabels: [string, string, string, string, string];
  onChange: (inputs: ValuationInputs) => void;
};

const labelSx = {
  fontSize: 13,
  fontWeight: 600,
  color: "#4B5563",
  mb: 0.5,
} as const;

const fieldSx = {
  "& .MuiInputBase-input": { fontSize: 13, py: 0.8 },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" },
} as const;

const cellSx = {
  px: 1,
  py: 0.75,
  fontSize: 13,
  borderColor: "#E5E7EB",
} as const;

const inputCellSx = {
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

// Parse percentage string to decimal (e.g., "55" -> 0.55)
const pctToDec = (raw: string): number | null => {
  const num = parseFloat(raw);
  if (isNaN(num)) return null;
  return num / 100;
};

// Parse currency string to number
const parseCurrency = (raw: string): number | null => {
  const num = parseFloat(raw.replace(/,/g, ""));
  if (isNaN(num)) return null;
  return num;
};

const ValuationParamsForm: FC<Props> = ({ inputs, yearLabels, onChange }) => {
  const { t } = useLanguage();

  const update = (partial: Partial<ValuationInputs>) => {
    onChange({ ...inputs, ...partial });
  };

  const handleArrayChange = (
    field: "capex" | "depreciation" | "irrSchedule",
    yearIdx: number,
    raw: string,
  ) => {
    const arr = [...inputs[field]] as unknown as FiveYearValues;
    if (field === "irrSchedule") {
      const dec = pctToDec(raw);
      if (dec === null) return;
      arr[yearIdx] = dec;
    } else {
      const num = parseCurrency(raw);
      if (num === null) return;
      arr[yearIdx] = num;
    }
    update({ [field]: arr });
  };

  const handleScenarioChange = (
    scenario: "optimistic" | "realistic" | "pessimistic",
    field: "marketCapture" | "probability",
    raw: string,
  ) => {
    const dec = pctToDec(raw);
    if (dec === null) return;
    update({
      scenarios: {
        ...inputs.scenarios,
        [scenario]: { ...inputs.scenarios[scenario], [field]: dec },
      },
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* SINGLE-VALUE PARAMS */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography sx={labelSx}>{t("financials.investmentAmount")}</Typography>
          <TextField
            size="small"
            fullWidth
            value={inputs.investmentAmount === 0 ? "" : inputs.investmentAmount.toLocaleString("en-US")}
            onChange={(e) => {
              const n = parseCurrency(e.target.value);
              if (n !== null) update({ investmentAmount: n });
            }}
            placeholder="500,000"
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography sx={labelSx}>{t("financials.discountRate")}</Typography>
          <TextField
            size="small"
            fullWidth
            value={inputs.discountRate === 0 ? "" : (inputs.discountRate * 100).toFixed(1)}
            onChange={(e) => {
              const d = pctToDec(e.target.value);
              if (d !== null) update({ discountRate: d });
            }}
            placeholder="10"
            InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: "#9CA3AF", ml: 0.5 }}>%</Typography> }}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography sx={labelSx}>{t("financials.terminalGrowth")}</Typography>
          <TextField
            size="small"
            fullWidth
            value={inputs.terminalGrowthRate === 0 ? "" : (inputs.terminalGrowthRate * 100).toFixed(1)}
            onChange={(e) => {
              const d = pctToDec(e.target.value);
              if (d !== null) update({ terminalGrowthRate: d });
            }}
            placeholder="2.5"
            InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: "#9CA3AF", ml: 0.5 }}>%</Typography> }}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography sx={labelSx}>{t("financials.taxRate")}</Typography>
          <TextField
            size="small"
            fullWidth
            value={inputs.taxRate === 0 ? "" : (inputs.taxRate * 100).toFixed(2)}
            onChange={(e) => {
              const d = pctToDec(e.target.value);
              if (d !== null) update({ taxRate: d });
            }}
            placeholder="28.97"
            InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: "#9CA3AF", ml: 0.5 }}>%</Typography> }}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography sx={labelSx}>{t("financials.roe")}</Typography>
          <TextField
            size="small"
            fullWidth
            value={inputs.roe === 0 ? "" : (inputs.roe * 100).toFixed(1)}
            onChange={(e) => {
              const d = pctToDec(e.target.value);
              if (d !== null) update({ roe: d });
            }}
            placeholder="15"
            InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: "#9CA3AF", ml: 0.5 }}>%</Typography> }}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography sx={labelSx}>{t("financials.roi")}</Typography>
          <TextField
            size="small"
            fullWidth
            value={inputs.roi === 0 ? "" : (inputs.roi * 100).toFixed(1)}
            onChange={(e) => {
              const d = pctToDec(e.target.value);
              if (d !== null) update({ roi: d });
            }}
            placeholder="5"
            InputProps={{ endAdornment: <Typography sx={{ fontSize: 12, color: "#9CA3AF", ml: 0.5 }}>%</Typography> }}
            sx={fieldSx}
          />
        </Grid>
      </Grid>

      <Divider sx={{ borderColor: "#E5E7EB" }} />

      {/* CAPEX / DEPRECIATION / IRR per year */}
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151", mb: 1.5 }}>
          {t("financials.irrSchedule")} / CAPEX / {t("financials.label")}
        </Typography>
        <TableContainer
          sx={{ border: "1px solid #E5E7EB", borderRadius: 2, overflow: "auto" }}
        >
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell sx={{ ...cellSx, fontWeight: 600, minWidth: 130, color: "#4B5563" }} />
                {yearLabels.map((y) => (
                  <TableCell
                    key={y}
                    align="right"
                    sx={{ ...cellSx, fontWeight: 600, minWidth: 100, color: "#4B5563" }}
                  >
                    {y}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* IRR */}
              <TableRow>
                <TableCell sx={{ ...cellSx, fontWeight: 600, color: "#374151" }}>
                  IRR (%)
                </TableCell>
                {inputs.irrSchedule.map((val, yIdx) => (
                  <TableCell key={yIdx} align="right" sx={cellSx}>
                    <TextField
                      size="small"
                      fullWidth
                      value={val === 0 ? "" : (val * 100).toFixed(0)}
                      onChange={(e) => handleArrayChange("irrSchedule", yIdx, e.target.value)}
                      placeholder="0"
                      sx={inputCellSx}
                    />
                  </TableCell>
                ))}
              </TableRow>
              {/* CAPEX */}
              <TableRow>
                <TableCell sx={{ ...cellSx, fontWeight: 600, color: "#374151" }}>
                  CAPEX
                </TableCell>
                {inputs.capex.map((val, yIdx) => (
                  <TableCell key={yIdx} align="right" sx={cellSx}>
                    <TextField
                      size="small"
                      fullWidth
                      value={val === 0 ? "" : val.toLocaleString("en-US")}
                      onChange={(e) => handleArrayChange("capex", yIdx, e.target.value)}
                      placeholder="0"
                      sx={inputCellSx}
                    />
                  </TableCell>
                ))}
              </TableRow>
              {/* Depreciation */}
              <TableRow>
                <TableCell sx={{ ...cellSx, fontWeight: 600, color: "#374151" }}>
                  Depreciation
                </TableCell>
                {inputs.depreciation.map((val, yIdx) => (
                  <TableCell key={yIdx} align="right" sx={cellSx}>
                    <TextField
                      size="small"
                      fullWidth
                      value={val === 0 ? "" : val.toLocaleString("en-US")}
                      onChange={(e) => handleArrayChange("depreciation", yIdx, e.target.value)}
                      placeholder="0"
                      sx={inputCellSx}
                    />
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider sx={{ borderColor: "#E5E7EB" }} />

      {/* FIRST CHICAGO SCENARIOS */}
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151", mb: 1.5 }}>
          {t("financials.scenarios")}
        </Typography>
        <TableContainer
          sx={{ border: "1px solid #E5E7EB", borderRadius: 2, overflow: "auto" }}
        >
          <Table size="small" sx={{ minWidth: 400 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell sx={{ ...cellSx, fontWeight: 600, color: "#4B5563", minWidth: 130 }}>
                  Scenario
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ ...cellSx, fontWeight: 600, color: "#4B5563", minWidth: 130 }}
                >
                  {t("financials.marketCapture")} (%)
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ ...cellSx, fontWeight: 600, color: "#4B5563", minWidth: 130 }}
                >
                  {t("financials.probability")} (%)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(["optimistic", "realistic", "pessimistic"] as const).map((sc) => (
                <TableRow key={sc} sx={{ "&:hover": { bgcolor: "#FAFBFF" } }}>
                  <TableCell sx={{ ...cellSx, fontWeight: 600, color: "#374151", textTransform: "capitalize" }}>
                    {t(`financials.${sc}`)}
                  </TableCell>
                  <TableCell align="right" sx={cellSx}>
                    <TextField
                      size="small"
                      fullWidth
                      value={
                        inputs.scenarios[sc].marketCapture === 0
                          ? ""
                          : (inputs.scenarios[sc].marketCapture * 100).toFixed(0)
                      }
                      onChange={(e) => handleScenarioChange(sc, "marketCapture", e.target.value)}
                      placeholder="100"
                      sx={inputCellSx}
                    />
                  </TableCell>
                  <TableCell align="right" sx={cellSx}>
                    <TextField
                      size="small"
                      fullWidth
                      value={
                        inputs.scenarios[sc].probability === 0
                          ? ""
                          : (inputs.scenarios[sc].probability * 100).toFixed(0)
                      }
                      onChange={(e) => handleScenarioChange(sc, "probability", e.target.value)}
                      placeholder="33"
                      sx={inputCellSx}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default ValuationParamsForm;
