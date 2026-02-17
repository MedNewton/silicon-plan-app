"use client";

import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { AppLocale } from "@/lib/i18n/locales";

export default function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();

  const handleChange = (_event: React.MouseEvent<HTMLElement>, next: AppLocale | null) => {
    if (!next) return;
    setLocale(next);
  };

  return (
    <Box>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 600,
          color: "#6B7280",
          mb: 0.8,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {t("language.label")}
      </Typography>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={locale}
        onChange={handleChange}
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: 1.5,
          border: "1px solid rgba(203,213,225,1)",
          "& .MuiToggleButton-root": {
            textTransform: "none",
            fontSize: 12,
            fontWeight: 700,
            px: 1.4,
            py: 0.45,
            border: "none",
            color: "#64748B",
            "&.Mui-selected": {
              color: "#1E3A8A",
              bgcolor: "rgba(76,106,210,0.14)",
            },
            "&.Mui-selected:hover": {
              bgcolor: "rgba(76,106,210,0.2)",
            },
          },
        }}
      >
        <ToggleButton value="en">{t("language.english")}</ToggleButton>
        <ToggleButton value="it">{t("language.italian")}</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
