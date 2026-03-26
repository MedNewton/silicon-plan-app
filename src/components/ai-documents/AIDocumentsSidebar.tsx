// src/components/ai-documents/AIDocumentsSideBar.tsx
"use client";

import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useState, type ReactElement, type ReactNode } from "react";
import { useClerk } from "@clerk/nextjs";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import LanguageToggle from "@/components/i18n/LanguageToggle";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export type NavKey =
  | "ai-documents"
  | "consultants"
  | "bookings"
  | "session-history"
  | "learning";

export type AIDocumentsSideBarProps = Readonly<{
  activeNav: NavKey;
  onNavChange: (key: NavKey) => void;
}>;

export default function AIDocumentsSideBar({
  activeNav,
  onNavChange,
}: AIDocumentsSideBarProps): ReactElement {
  const theme = useTheme();
  const { signOut } = useClerk();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = () => {
    void signOut({ redirectUrl: "/auth" });
  };

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

  const makeItem = (
    key: NavKey,
    label: string,
    icon: ReactNode,
  ): ReactNode => {
    const isActive = activeNav === key;
    return (
      <Tooltip title={collapsed ? label : ""} placement="right" key={key}>
        <Box
          onClick={() => onNavChange(key)}
          sx={{
            ...itemBaseStyles,
            justifyContent: collapsed ? "center" : "flex-start",
            px: collapsed ? 0 : 3,
            color: isActive
              ? theme.palette.primary.main
              : theme.palette.text.secondary,
            borderLeft: isActive ? "3px solid #4C6AD2" : "3px solid transparent",
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

      <Box sx={{ flex: 1, pt: 2 }}>
        {makeItem(
          "ai-documents",
          t("sidebar.aiDocuments"),
          <DescriptionOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
        {makeItem(
          "consultants",
          t("sidebar.consultants"),
          <PersonOutlineOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
        {makeItem(
          "bookings",
          t("sidebar.myBookings"),
          <BookmarkBorderOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
        {makeItem(
          "learning",
          t("sidebar.learning"),
          <MenuBookOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
      </Box>

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
        <Tooltip title={collapsed ? t("sidebar.signOut") : ""} placement="right">
          <Box
            onClick={handleSignOut}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? 0 : 1.5,
              cursor: "pointer",
              color: theme.palette.text.secondary,
              "&:hover": {
                color: "#DC2626",
              },
            }}
          >
            <LogoutOutlinedIcon sx={{ fontSize: 22 }} />
            {!collapsed && (
              <Typography sx={{ fontSize: 15, fontWeight: 500 }}>
                {t("sidebar.signOut")}
              </Typography>
            )}
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
}
