// src/components/valuation/ValuationResultsPanel.tsx
"use client";

import type { FC } from "react";
import {
  Box,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { FullValuationResults } from "@/types/valuation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import BarChart from "./charts/BarChart";
import LineChart from "./charts/LineChart";
import SensitivityMatrix from "./charts/SensitivityMatrix";
import { CHART_COLORS } from "@/lib/valuation/charts/chartUtils";

type Props = {
  results: FullValuationResults;
};

const ACTIVE_COLOR = "#4C6AD2";

const cellSx = {
  px: 1.5,
  py: 1,
  fontSize: 13,
  borderColor: "#E5E7EB",
} as const;

const fmt = (v: number) =>
  v.toLocaleString("en-US", { maximumFractionDigits: 0 });

const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

const ValuationResultsPanel: FC<Props> = ({ results }) => {
  const { t } = useLanguage();
  const { vc, dcf, firstChicago, eva, summary } = results;

  return (
    <Stack spacing={3}>
      {/* ========== SUMMARY ========== */}
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#374151", mb: 1.5 }}>
          {t("financials.summary")}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 2,
          }}
        >
          {[
            { label: t("financials.vcMethod"), value: summary.vcValue },
            { label: t("financials.dcfMethod"), value: summary.dcfValue },
            { label: t("financials.firstChicago"), value: summary.firstChicagoValue },
            { label: t("financials.evaMethod"), value: summary.evaValue },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                p: 2,
                bgcolor: "#F9FAFB",
                borderRadius: 2,
                border: "1px solid #E5E7EB",
              }}
            >
              <Typography sx={{ fontSize: 11, color: "#6B7280", mb: 0.5 }}>
                {item.label}
              </Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#374151" }}>
                {fmt(item.value)}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Min / Max / Avg */}
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "#F3F4FB",
            borderRadius: 2,
            border: "1px solid #D3DDF5",
            display: "flex",
            gap: 4,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 11, color: "#6B7280" }}>
              {t("financials.minValue")}
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: ACTIVE_COLOR }}>
              {fmt(summary.min)}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, color: "#6B7280" }}>
              {t("financials.maxValue")}
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: ACTIVE_COLOR }}>
              {fmt(summary.max)}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, color: "#6B7280" }}>
              {t("financials.average")}
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: ACTIVE_COLOR }}>
              {fmt(summary.average)}
            </Typography>
          </Box>
        </Box>

        {/* Summary comparison chart */}
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center", overflow: "auto" }}>
          <BarChart
            data={[
              { label: "VC", value: summary.vcValue, color: CHART_COLORS.primary },
              { label: "DCF", value: summary.dcfValue, color: CHART_COLORS.rose },
              { label: "1st Chicago", value: summary.firstChicagoValue, color: CHART_COLORS.green },
              { label: "EVA", value: summary.evaValue, color: CHART_COLORS.secondary },
            ]}
            title="Pre-Money Valuation Comparison"
          />
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#E5E7EB" }} />

      {/* ========== VC METHOD ========== */}
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#374151", mb: 1 }}>
          {t("financials.vcMethod")}
        </Typography>
        <Box sx={{ display: "flex", gap: 3, mb: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography sx={{ fontSize: 11, color: "#6B7280" }}>EV at Exit</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>
              {fmt(vc.evAtExit)}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, color: "#6B7280" }}>Discounted Multiple</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>
              {vc.discountedMultiple.toFixed(1)}x
            </Typography>
          </Box>
        </Box>

        <TableContainer
          sx={{ border: "1px solid #E5E7EB", borderRadius: 2, overflow: "auto" }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell sx={{ ...cellSx, fontWeight: 600, color: "#4B5563" }}>Year</TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontWeight: 600, color: "#4B5563" }}>IRR</TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontWeight: 600, color: "#4B5563" }}>Post-Money</TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontWeight: 600, color: "#4B5563" }}>Pre-Money</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vc.annualResults.map((r) => (
                <TableRow key={r.year}>
                  <TableCell sx={cellSx}>{r.year}</TableCell>
                  <TableCell align="right" sx={cellSx}>{fmtPct(r.irr)}</TableCell>
                  <TableCell align="right" sx={cellSx}>{fmt(r.postMoney)}</TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontWeight: 600, color: ACTIVE_COLOR }}>
                    {fmt(r.preMoney)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* VC Pre-Money progression chart */}
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center", overflow: "auto" }}>
          <BarChart
            data={vc.annualResults.map((r) => ({
              label: `Y${r.year}`,
              value: r.preMoney,
            }))}
            title="Pre-Money by Year (VC Method)"
            height={260}
          />
        </Box>

        {/* Sensitivity Matrix */}
        {vc.sensitivityMatrix && (
          <Box sx={{ mt: 2, overflow: "auto" }}>
            <SensitivityMatrix
              rowLabels={vc.sensitivityMatrix.irrValues}
              colLabels={vc.sensitivityMatrix.multipleValues}
              grid={vc.sensitivityMatrix.grid}
              title="Sensitivity Analysis (IRR x Multiple)"
            />
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: "#E5E7EB" }} />

      {/* ========== DCF METHOD ========== */}
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#374151", mb: 1 }}>
          {t("financials.dcfMethod")}
        </Typography>
        <Box sx={{ display: "flex", gap: 3, mb: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography sx={{ fontSize: 11, color: "#6B7280" }}>DCF Value</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: ACTIVE_COLOR }}>
              {fmt(dcf.dcfValue)}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, color: "#6B7280" }}>Terminal Value</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>
              {fmt(dcf.terminalValue)}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, color: "#6B7280" }}>WACC</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>
              {fmtPct(dcf.discountRate)}
            </Typography>
          </Box>
        </Box>

        <TableContainer
          sx={{ border: "1px solid #E5E7EB", borderRadius: 2, overflow: "auto" }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell sx={{ ...cellSx, fontWeight: 600, color: "#4B5563" }} />
                {dcf.fcf.map((_, i) => (
                  <TableCell key={i} align="right" sx={{ ...cellSx, fontWeight: 600, color: "#4B5563" }}>
                    Year {i + 1}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { label: "EBIT", data: dcf.ebit },
                { label: "Taxes", data: dcf.taxes },
                { label: "Depreciation", data: dcf.depreciation },
                { label: "CAPEX", data: dcf.capex },
                { label: "FCF", data: dcf.fcf },
              ].map((row) => (
                <TableRow
                  key={row.label}
                  sx={{
                    bgcolor: row.label === "FCF" ? "#F3F4FB" : "transparent",
                  }}
                >
                  <TableCell
                    sx={{
                      ...cellSx,
                      fontWeight: row.label === "FCF" ? 700 : 400,
                      color: row.label === "FCF" ? ACTIVE_COLOR : "#374151",
                    }}
                  >
                    {row.label}
                  </TableCell>
                  {row.data.map((val, i) => (
                    <TableCell
                      key={i}
                      align="right"
                      sx={{
                        ...cellSx,
                        fontWeight: row.label === "FCF" ? 600 : 400,
                        color: val < 0 ? "#DC2626" : row.label === "FCF" ? ACTIVE_COLOR : "#374151",
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

        {/* FCF line chart */}
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center", overflow: "auto" }}>
          <LineChart
            series={[
              { label: "EBIT", values: [...dcf.ebit], color: CHART_COLORS.slate },
              { label: "FCF", values: [...dcf.fcf], color: CHART_COLORS.primary },
            ]}
            xLabels={dcf.fcf.map((_, i) => `Y${i + 1}`)}
            title="EBIT vs Free Cash Flow"
            height={280}
          />
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#E5E7EB" }} />

      {/* ========== FIRST CHICAGO ========== */}
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#374151", mb: 1 }}>
          {t("financials.firstChicago")}
        </Typography>
        <TableContainer
          sx={{ border: "1px solid #E5E7EB", borderRadius: 2, overflow: "auto" }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell sx={{ ...cellSx, fontWeight: 600, color: "#4B5563" }}>Scenario</TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontWeight: 600, color: "#4B5563" }}>Market Capture</TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontWeight: 600, color: "#4B5563" }}>Probability</TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontWeight: 600, color: "#4B5563" }}>Terminal Value</TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontWeight: 600, color: "#4B5563" }}>Present Value</TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontWeight: 600, color: "#4B5563" }}>Weighted</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {firstChicago.scenarios.map((s) => (
                <TableRow key={s.name}>
                  <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{s.name}</TableCell>
                  <TableCell align="right" sx={cellSx}>{fmtPct(s.marketCapture)}</TableCell>
                  <TableCell align="right" sx={cellSx}>{fmtPct(s.probability)}</TableCell>
                  <TableCell align="right" sx={cellSx}>{fmt(s.terminalValue)}</TableCell>
                  <TableCell align="right" sx={cellSx}>{fmt(s.presentValue)}</TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontWeight: 600, color: ACTIVE_COLOR }}>
                    {fmt(s.weightedValue)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: "#F3F4FB" }}>
                <TableCell colSpan={5} sx={{ ...cellSx, fontWeight: 700, color: ACTIVE_COLOR }}>
                  Weighted Total
                </TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontWeight: 700, color: ACTIVE_COLOR }}>
                  {fmt(firstChicago.finalWeightedValue)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider sx={{ borderColor: "#E5E7EB" }} />

      {/* ========== EVA METHOD ========== */}
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#374151", mb: 1 }}>
          {t("financials.evaMethod")}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 1.5,
          }}
        >
          {[
            { label: "NOPAT", value: fmt(eva.nopat) },
            { label: "Invested Capital", value: fmt(eva.investedCapital) },
            { label: "WACC", value: fmtPct(eva.wacc) },
            { label: "ROE", value: fmtPct(eva.roe) },
            { label: "ROI", value: fmtPct(eva.roi) },
            { label: "EVA", value: fmt(eva.eva), highlight: true },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                p: 1.5,
                bgcolor: item.highlight ? "#F3F4FB" : "#F9FAFB",
                borderRadius: 2,
                border: `1px solid ${item.highlight ? "#D3DDF5" : "#E5E7EB"}`,
              }}
            >
              <Typography sx={{ fontSize: 11, color: "#6B7280" }}>
                {item.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: item.highlight ? ACTIVE_COLOR : "#374151",
                }}
              >
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Stack>
  );
};

export default ValuationResultsPanel;
