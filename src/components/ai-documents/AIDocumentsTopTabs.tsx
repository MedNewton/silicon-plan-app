// src/components/ai-documents/AIDocumentsTopTabs.tsx
"use client";

import { Box, Button, Stack, useTheme } from "@mui/material";
import type { ReactElement } from "react";

import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export type ActiveTab = "create" | "myWorkspaces";

export type AIDocumentsTopTabsProps = Readonly<{
  activeTab: ActiveTab;
  workspaceCount: number;
  onTabChange: (tab: ActiveTab) => void;
}>;

export default function AIDocumentsTopTabs({
  activeTab,
  workspaceCount,
  onTabChange,
}: AIDocumentsTopTabsProps): ReactElement {
  const theme = useTheme();
  const { t } = useLanguage();

  const tabBaseStyles = {
    display: "inline-flex",
    alignItems: "center",
    gap: 1,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    fontWeight: 600,
    fontSize: 13,
    px: 2,
    pb: 1.2,
    borderRadius: 0,
    borderBottomWidth: 2,
    borderBottomStyle: "solid",
    borderColor: "transparent",
    bgcolor: "transparent",
    boxShadow: "none",
    "&:hover": {
      bgcolor: "transparent",
    },
  };

  return (
    <Box
      sx={{
        width: "100%",
        borderBottom: "1px solid rgba(226,232,240,1)",
        display: "flex",
        justifyContent: "center",
        pt: 3,
        pb: 1,
        bgcolor: "#FFFFFF",
      }}
    >
      <Stack
        direction="row"
        spacing={6}
        alignItems="flex-end"
        justifyContent="center"
      >
        <Button
          disableRipple
          onClick={() => onTabChange("create")}
          sx={{
            ...tabBaseStyles,
            color:
              activeTab === "create"
                ? theme.palette.text.secondary
                : theme.palette.text.primary,
            borderColor: activeTab === "create" ? "#4C6AD2" : "transparent",
          }}
        >
          <AddCircleOutlineRoundedIcon sx={{ fontSize: 20, mr: 0.5 }} />
          {t("topTabs.create")}
        </Button>

        <Button
          disableRipple
          onClick={() => onTabChange("myWorkspaces")}
          sx={{
            ...tabBaseStyles,
            color:
              activeTab === "myWorkspaces"
                ? theme.palette.text.secondary
                : theme.palette.text.primary,
            borderColor:
              activeTab === "myWorkspaces" ? "#4C6AD2" : "transparent",
          }}
        >
          <BusinessCenterOutlinedIcon sx={{ fontSize: 20, mr: 0.5 }} />
          {t("topTabs.myWorkspacesWithCount", { count: workspaceCount })}
        </Button>
      </Stack>
    </Box>
  );
}
