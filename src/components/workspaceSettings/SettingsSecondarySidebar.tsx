// src/components/workspaceSettings/SettingsSecondarySidebar.tsx
"use client";

import { Box, Stack, Typography, useTheme } from "@mui/material";
import type { ReactElement } from "react";

export type SettingsTab = "general" | "business" | "members" | "library";

export type SettingsSecondarySidebarProps = Readonly<{
  workspaceName: string;
  settingsTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}>;

export default function SettingsSecondarySidebar({
  workspaceName,
  settingsTab,
  onTabChange,
}: SettingsSecondarySidebarProps): ReactElement {
  const theme = useTheme();

  const itemStyles = {
    borderRadius: 2.5,
    border: "1px solid #E1E6F5",
    bgcolor: "#F9FAFF",
    px: 2.5,
    py: 1.7,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left" as const,
    "&:hover": {
      bgcolor: "#F1F4FF",
    },
  };

  const activeStyles = {
    borderColor: "#4C6AD2",
    bgcolor: "#EEF1FF",
  };

  const makeItem = (key: SettingsTab, label: string) => {
    const isActive = settingsTab === key;
    return (
      <Box
        key={key}
        onClick={() => onTabChange(key)}
        sx={{
          ...itemStyles,
          ...(isActive ? activeStyles : {}),
        }}
      >
        {label}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: 260,
        borderRight: "1px solid #E1E6F5",
        pr: 3,
        mr: 4,
        pt: 4,
      }}
    >
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 600,
          mb: 2.5,
        }}
      >
        Setup Business
      </Typography>

      <Typography
        sx={{
          fontSize: 13,
          color: theme.palette.text.secondary,
          mb: 1.5,
        }}
      >
        {workspaceName || "Workspace"}
      </Typography>

      <Stack direction="column" gap={1.5}>
        {makeItem("general", "General")}
        {makeItem("business", "Business activities")}
        {makeItem("members", "Members")}
        {makeItem("library", "AI Library")}
      </Stack>
    </Box>
  );
}
