// src/components/workspaceManage/ManageSidebar.tsx
"use client";

import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useState, type ReactElement, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ViewQuiltOutlinedIcon from "@mui/icons-material/ViewQuiltOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import LanguageToggle from "@/components/i18n/LanguageToggle";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export type ManageSidebarNavKey =
  | "business-plan"
  | "canvas-models"
  | "pitch-deck"
  | "finance-forecasting"
  | "settings";

export type ManageSidebarProps = Readonly<{
  workspaceId: string;
  activeItem: ManageSidebarNavKey;
  onNavChange?: (key: ManageSidebarNavKey) => void;
}>;

export default function ManageSidebar({
  workspaceId,
  activeItem,
  onNavChange: _onNavChange,
}: ManageSidebarProps): ReactElement {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

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
      router.push(`/workspaces/${workspaceId}/manage/business-plan`);
    } else if (key === "canvas-models") {
      router.push(`/workspaces/${workspaceId}/manage/canvas-models`);
    } else if (key === "pitch-deck") {
      router.push(`/workspaces/${workspaceId}/manage/pitch-deck`);
    } else if (key === "finance-forecasting") {
      router.push(`/workspaces/${workspaceId}/manage/finance-forecasting`);
    }
  };

  const makeItem = (
    key: ManageSidebarNavKey,
    label: string,
    icon: ReactNode,
  ): ReactNode => {
    const isActive = activeItem === key;

    return (
      <Tooltip title={collapsed ? label : ""} placement="right" key={key}>
        <Box
          onClick={() => handleNavClick(key)}
          sx={{
            ...itemBaseStyles,
            justifyContent: collapsed ? "center" : "flex-start",
            px: collapsed ? 0 : 3,
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
          <Box sx={{ mr: collapsed ? 0 : 1, display: "flex", alignItems: "center" }}>{icon}</Box>
          {!collapsed && <Typography sx={{ fontSize: 15, fontWeight: 500, whiteSpace: "nowrap" }}>{label}</Typography>}
        </Box>
      </Tooltip>
    );
  };

  const handleBackClick = () => {
    router.push("/?tab=my-workspaces");
  };

  return (
    <Box
      component="aside"
      sx={{
        width: collapsed ? 72 : 260,
        minWidth: collapsed ? 72 : 260,
        minHeight: "100vh",
        borderRight: "1px solid rgba(226,232,240,1)",
        bgcolor: "#FBFCFF",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease, min-width 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          height: 72,
          px: collapsed ? 0 : 3,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid rgba(226,232,240,1)",
        }}
      >
        {collapsed ? (
          <IconButton onClick={() => setCollapsed(false)} size="small" sx={{ color: "text.secondary" }}>
            <MenuOpenIcon sx={{ transform: "scaleX(-1)" }} />
          </IconButton>
        ) : (
          <>
            <Box
              component="img"
              src="/logo.png"
              alt="Silicon Plan"
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                mr: 1.5,
                objectFit: "cover",
              }}
            />
            <Typography
              sx={{ fontWeight: 700, fontSize: 18, letterSpacing: 0.1, whiteSpace: "nowrap", flex: 1 }}
            >
              Silicon Plan
            </Typography>
            <IconButton onClick={() => setCollapsed(true)} size="small" sx={{ color: "text.secondary" }}>
              <MenuOpenIcon />
            </IconButton>
          </>
        )}
      </Box>

      {/* Back row */}
      <Box
        sx={{
          height: 56,
          px: collapsed ? 0 : 3,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid rgba(226,232,240,1)",
        }}
      >
        <Tooltip title={collapsed ? t("sidebar.back") : ""} placement="right">
          <Box
            onClick={handleBackClick}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: collapsed ? 0 : 1,
              cursor: "pointer",
              color: theme.palette.text.secondary,
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
            {!collapsed && (
              <Typography sx={{ fontSize: 15, fontWeight: 500, whiteSpace: "nowrap" }}>
                {t("sidebar.back")}
              </Typography>
            )}
          </Box>
        </Tooltip>
      </Box>

      {/* Nav section */}
      <Box sx={{ flex: 1, pt: 2 }}>
        {!collapsed && (
          <Box sx={{ px: 3, pb: 1 }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: "#9CA3AF",
              }}
            >
              {t("sidebar.manageSectionTitle")}
            </Typography>
          </Box>
        )}

        {makeItem(
          "business-plan",
          t("sidebar.businessPlan"),
          <DescriptionOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
        {makeItem(
          "canvas-models",
          t("sidebar.canvasModels"),
          <ViewQuiltOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
        {makeItem(
          "pitch-deck",
          t("sidebar.pitchDeck"),
          <SlideshowOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
        {makeItem(
          "finance-forecasting",
          t("sidebar.financeForecasting"),
          <ShowChartOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
      </Box>

      {/* Settings bottom row */}
      <Box
        sx={{
          borderTop: "1px solid rgba(226,232,240,1)",
          px: collapsed ? 0 : 3,
          py: 1.8,
          mb: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: collapsed ? "center" : "flex-start",
          gap: 1.6,
        }}
      >
        {!collapsed && <LanguageToggle />}
        <Tooltip title={collapsed ? t("sidebar.settings") : ""} placement="right">
          <Box
            onClick={() => handleNavClick("settings")}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? 0 : 1.5,
              cursor: "pointer",
              color:
                activeItem === "settings"
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
            }}
          >
            <SettingsOutlinedIcon sx={{ fontSize: 22 }} />
            {!collapsed && (
              <Typography sx={{ fontSize: 15, fontWeight: 500 }}>
                {t("sidebar.settings")}
              </Typography>
            )}
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
}
