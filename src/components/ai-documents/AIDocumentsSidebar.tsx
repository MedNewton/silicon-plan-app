// src/components/ai-documents/AIDocumentsSideBar.tsx
"use client";

import {
  Box,
  Typography,
  useTheme,
} from "@mui/material";
import type { ReactElement, ReactNode } from "react";
import { useClerk } from "@clerk/nextjs";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

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
      <Box
        key={key}
        onClick={() => onNavChange(key)}
        sx={{
          ...itemBaseStyles,
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
        <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>{icon}</Box>
        <Typography sx={{ fontSize: 15, fontWeight: 500 }}>{label}</Typography>
      </Box>
    );
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
          sx={{ fontWeight: 700, fontSize: 18, letterSpacing: 0.1 }}
        >
          Silicon Plan
        </Typography>
      </Box>

      <Box sx={{ flex: 1, pt: 2 }}>
        {makeItem(
          "ai-documents",
          "AI Documents",
          <DescriptionOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
        {makeItem(
          "consultants",
          "Consultants",
          <PersonOutlineOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
        {makeItem(
          "bookings",
          "My Bookings",
          <BookmarkBorderOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
        {makeItem(
          "session-history",
          "Session History",
          <HistoryOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
        {makeItem(
          "learning",
          "Learning",
          <MenuBookOutlinedIcon sx={{ fontSize: 22 }} />,
        )}
      </Box>

      <Box
        sx={{
          borderTop: "1px solid rgba(226,232,240,1)",
          py: 1.5,
          mb: 1,
        }}
      >
        <Box
          onClick={handleSignOut}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            cursor: "pointer",
            color: theme.palette.text.secondary,
            "&:hover": {
              color: "#DC2626",
            },
          }}
        >
          <LogoutOutlinedIcon sx={{ fontSize: 22 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 500 }}>
            Sign Out
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
