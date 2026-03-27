// src/components/valuation/inputs/IndustryVerification.tsx
"use client";

import { useState, useEffect, useCallback, type FC } from "react";
import {
  Autocomplete,
  Box,
  CircularProgress,
  FormControl,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import type { IndustryClassification } from "@/types/financialProjections";
import { STAGE_FACTORS } from "@/lib/valuation";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type Props = {
  workspaceId: string;
  classification: IndustryClassification | null;
  onChange: (ic: IndustryClassification) => void;
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

const stageOptions = Object.keys(STAGE_FACTORS);

type AtecoResult = {
  code: string;
  macroCode: string;
  macroName: string;
  description: string;
  displayLabel: string;
};

const IndustryVerification: FC<Props> = ({
  workspaceId,
  classification,
  onChange,
}) => {
  const { t, locale } = useLanguage();
  const [damodaranIndustries, setDamodaranIndustries] = useState<string[]>([]);
  const [atecoResults, setAtecoResults] = useState<AtecoResult[]>([]);
  const [atecoQuery, setAtecoQuery] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  // Load Damodaran industries
  useEffect(() => {
    fetch("/api/sectors/damodaran")
      .then((r) => r.json())
      .then((data: { industries: string[] }) => setDamodaranIndustries(data.industries))
      .catch(() => {});
  }, []);

  // Search ATECO codes
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetch(`/api/sectors/ateco/search?q=${encodeURIComponent(atecoQuery)}`)
        .then((r) => r.json())
        .then((data: { results: AtecoResult[] }) => setAtecoResults(data.results))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timeout);
  }, [atecoQuery]);

  // Auto-detect on mount from workspace profile
  const autoDetect = useCallback(async () => {
    if (classification) return; // Already have classification

    setIsAutoDetecting(true);
    try {
      const profileRes = await fetch(
        `/api/workspaces/${workspaceId}/business-profile`,
      );
      if (!profileRes.ok) return;

      const profile = (await profileRes.json()) as {
        industry?: string;
        company_stage?: string;
        raw_form_data?: Record<string, unknown>;
      };

      const sector =
        (profile.raw_form_data?.industryOption as string) ||
        profile.industry ||
        "";
      const stage = profile.company_stage || "Early Stage";

      if (!sector) return;

      const resolveRes = await fetch(
        `/api/workspaces/${workspaceId}/financial-projections/resolve-industry`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onboardingSector: sector,
            companyStage: stage,
          }),
        },
      );

      if (!resolveRes.ok) return;

      const ic = (await resolveRes.json()) as IndustryClassification;
      onChange(ic);
    } catch {
      // Silent — user can manually set it
    } finally {
      setIsAutoDetecting(false);
    }
  }, [workspaceId, classification, onChange]);

  useEffect(() => {
    void autoDetect();
  }, [autoDetect]);

  // Resolve manually when Damodaran industry or stage changes
  const resolveIndustry = async (
    damodaranIndustry: string,
    stage: string,
    sector: string,
    atecoCode: string,
  ) => {
    setIsResolving(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/financial-projections/resolve-industry`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onboardingSector: sector || "Technology",
            companyStage: stage,
            atecoCode: atecoCode || undefined,
          }),
        },
      );
      if (res.ok) {
        const ic = (await res.json()) as IndustryClassification;
        // If user explicitly chose a Damodaran industry, override
        if (damodaranIndustry && damodaranIndustry !== ic.damodaranIndustry) {
          onChange({
            ...ic,
            damodaranIndustry,
            isManualOverride: true,
          });
        } else {
          onChange(ic);
        }
      }
    } catch {
      // Silent
    } finally {
      setIsResolving(false);
    }
  };

  if (isAutoDetecting) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 3 }}>
        <CircularProgress size={20} sx={{ color: "#4C6AD2" }} />
        <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
          {locale === "it"
            ? "Rilevamento automatico del settore..."
            : "Auto-detecting industry..."}
        </Typography>
      </Box>
    );
  }

  const ic = classification;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Grid container spacing={2.5}>
        {/* Sector (read-only if auto-detected) */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography sx={labelSx}>{t("financials.sector")}</Typography>
          <TextField
            size="small"
            fullWidth
            value={ic?.onboardingSector ?? ""}
            onChange={(e) => {
              if (ic) onChange({ ...ic, onboardingSector: e.target.value });
            }}
            sx={fieldSx}
          />
        </Grid>

        {/* Company Stage */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography sx={labelSx}>{t("financials.companyStage")}</Typography>
          <FormControl fullWidth size="small">
            <Select
              value={ic?.companyStage ?? "Early Stage"}
              onChange={(e) => {
                const stage = e.target.value;
                if (ic) {
                  void resolveIndustry(
                    ic.damodaranIndustry,
                    stage,
                    ic.onboardingSector,
                    ic.atecoCode,
                  );
                }
              }}
              sx={{ ...fieldSx, borderRadius: 2 }}
            >
              {stageOptions.map((s) => (
                <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* ATECO Code */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography sx={labelSx}>{t("financials.atecoCode")}</Typography>
          <Autocomplete
            freeSolo
            size="small"
            options={atecoResults}
            getOptionLabel={(opt) =>
              typeof opt === "string" ? opt : opt.displayLabel
            }
            inputValue={atecoQuery || ic?.atecoCode || ""}
            onInputChange={(_, val) => setAtecoQuery(val)}
            onChange={(_, val) => {
              if (val && typeof val !== "string" && ic) {
                const code = val.code;
                onChange({ ...ic, atecoCode: code });
                void resolveIndustry(
                  ic.damodaranIndustry,
                  ic.companyStage,
                  ic.onboardingSector,
                  code,
                );
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={
                  locale === "it"
                    ? "Cerca codice ATECO..."
                    : "Search ATECO code..."
                }
                sx={fieldSx}
              />
            )}
          />
        </Grid>

        {/* Damodaran Industry */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography sx={labelSx}>{t("financials.damodaranIndustry")}</Typography>
          <Autocomplete
            size="small"
            options={damodaranIndustries}
            value={ic?.damodaranIndustry ?? null}
            onChange={(_, val) => {
              if (val && ic) {
                onChange({
                  ...ic,
                  damodaranIndustry: val,
                  isManualOverride: true,
                });
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={
                  locale === "it"
                    ? "Seleziona settore Damodaran..."
                    : "Select Damodaran industry..."
                }
                sx={fieldSx}
              />
            )}
          />
        </Grid>
      </Grid>

      {/* Multiples display */}
      {ic && (
        <Box
          sx={{
            display: "flex",
            gap: 3,
            p: 2,
            bgcolor: "#F3F4FB",
            borderRadius: 2,
            border: "1px solid #E5E7EB",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 11, color: "#6B7280", mb: 0.3 }}>
              {t("financials.baseMultiple")}
            </Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#374151" }}>
              {ic.baseMultiple.toFixed(1)}x
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, color: "#6B7280", mb: 0.3 }}>
              {t("financials.adjustedMultiple")}
            </Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#4C6AD2" }}>
              {ic.adjustedMultiple.toFixed(1)}x
            </Typography>
          </Box>
          {isResolving && (
            <CircularProgress size={16} sx={{ color: "#4C6AD2", alignSelf: "center" }} />
          )}
        </Box>
      )}
    </Box>
  );
};

export default IndustryVerification;
