// src/components/workspaceManage/ManageSidebar.tsx
"use client";

import {
  Box,
  Typography,
  useTheme,
} from "@mui/material";
import type { ReactElement, ReactNode } from "react";
import { useRouter } from "next/navigation";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ViewQuiltOutlinedIcon from "@mui/icons-material/ViewQuiltOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

export type ManageSidebarNavKey =
  | "business-plan"
  | "canvas-models"
  | "pitch-deck"
  | "finance-forecasting"
  | "settings";

export type ManageSidebarProps = Readonly<{
  activeItem: ManageSidebarNavKey;
  onNavChange?: (key: ManageSidebarNavKey) => void;
}>;

export default function ManageSidebar({
  activeItem,
  onNavChange,
}: ManageSidebarProps): ReactElement {
  const theme = useTheme();
  const router = useRouter();

  const itemBaseStyles = {
    height: 64,
    px: 3,
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    borderRadius: 0,
  } as const;

  const handleNavClick = (key: ManageSidebarNavKey) => {
    if (key === "business-plan") {
      router.push("/workspaces/[workspaceId]/manage/business-plan");
    } else if (key === "canvas-models") {
      router.push("/workspaces/[workspaceId]/manage/canvas-models");
    } else if (key === "pitch-deck") {
      router.push("/workspaces/[workspaceId]/manage/pitch-deck");
    } else if (key === "finance-forecasting") {
      router.push("/workspaces/[workspaceId]/manage/finance-forecasting");
    }
  };

  const makeItem = (
    key: ManageSidebarNavKey,
    label: string,
    icon: ReactNode,
  ): ReactNode => {
    const isActive = activeItem === key;

    return (
      <Box
        key={key}
        onClick={() => handleNavClick(key)}
        sx={{
          ...itemBaseStyles,
          color: isActive
            ? theme.palette.primary.main
            : theme.palette.text.secondary,
          borderLeft: isActive
            ? "3px solid #4C6AD2"
            : "3px solid transparent",
          bgcolor: isActive ? "rgba(76,106,210,0.06)" : "transparent",
          "&:hover": {
            bgcolor: isActive
              ? "rgba(76,106,210,0.08)"
              : "rgba(15,23,42,0.02)",
          },
        }}
      >
        <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>{icon}</Box>
        <Typography sx={{ fontSize: 15, fontWeight: 500 }}>{label}</Typography>
      </Box>
    );
  };

  const handleBackClick = () => {
    router.push("/?tab=my-workspaces");
  };

  return (
    <Box
      component="aside"
      sx={{
        width: 260,
        minHeight: "100vh",
        borderRight: "1px solid rgba(226,232,240,1)",
        bgcolor: "#FBFCFF",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          height: 72,
          px: 3,
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid rgba(226,232,240,1)",
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            mr: 1.5,
            background:
              "radial-gradient(circle at 0% 0%, #8CC2FF 0%, #4C6AD2 45%, #7F54D9 100%)",
          }}
        />
        <Typography
          sx={{ fontWeight: 700, fontSize: 18, letterSpacing: 0.1 }}
        >
          Silicon Plan
        </Typography>
      </Box>

      {/* Back row */}
      <Box
        sx={{
          height: 56,
          px: 3,
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid rgba(226,232,240,1)",
        }}
      >
        <Box
          onClick={handleBackClick}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            color: theme.palette.text.secondary,
          }}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 500 }}>Back</Typography>
        </Box>
      </Box>

      {/* Nav section */}
      <Box sx={{ flex: 1, pt: 2 }}>
        <Box sx={{ px: 3, pb: 1 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: "#9CA3AF",
            }}
          >
            AI Documents
          </Typography>
        </Box>

        {makeItem(
          "business-plan",
          "Business Plan",
          <DescriptionOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
        {makeItem(
          "canvas-models",
          "Canvas Models",
          <ViewQuiltOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
        {makeItem(
          "pitch-deck",
          "Pitch Deck",
          <SlideshowOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
        {makeItem(
          "finance-forecasting",
          "Finance forecasting",
          <ShowChartOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
      </Box>

      {/* Settings bottom row */}
      <Box
        sx={{
          borderTop: "1px solid rgba(226,232,240,1)",
          py: 1.5,
          mb: 1,
        }}
      >
        <Box
          onClick={() => handleNavClick("settings")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            cursor: "pointer",
            color:
              activeItem === "settings"
                ? theme.palette.primary.main
                : theme.palette.text.secondary,
          }}
        >
          <SettingsOutlinedIcon sx={{ fontSize: 22 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 500 }}>
            Settings
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
