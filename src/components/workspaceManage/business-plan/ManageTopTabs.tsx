// src/components/workspaceManage/ManageTopTabs.tsx
"use client";

import type { FC } from "react";
import { Box, Button, Stack } from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

export type ManageTopTab = "plan" | "download";

export type ManageTopTabsProps = Readonly<{
  activeTab: ManageTopTab;
  onTabChange: (tab: ManageTopTab) => void;
}>;

const ACTIVE_COLOR = "#4C6AD2";   // main blue
const INACTIVE_COLOR = "#6B7280"; // muted grey-blue

const ManageTopTabs: FC<ManageTopTabsProps> = ({ activeTab, onTabChange }) => {
  const isPlanActive = activeTab === "plan";
  const isDownloadActive = activeTab === "download";

  return (
    <Box
      sx={{
        borderBottom: "1px solid #E5E7EB",
        bgcolor: "#FFFFFF",
        px: 4,
        py: 1.25,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Stack direction="row" spacing={5} alignItems="stretch">
        {/* PLAN */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            borderBottom: isPlanActive
              ? `2px solid ${ACTIVE_COLOR}`
              : "2px solid transparent",
            pb: 0.5,
          }}
        >
          <Button
            disableRipple
            onClick={() => onTabChange("plan")}
            startIcon={
              <DescriptionOutlinedIcon
                sx={{
                  fontSize: 20,
                  color: isPlanActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                }}
              />
            }
            sx={{
              textTransform: "none",
              fontSize: 14,
              fontWeight: isPlanActive ? 700 : 600,
              px: 0,
              minWidth: "auto",
              color: isPlanActive ? ACTIVE_COLOR : INACTIVE_COLOR,
              bgcolor: "transparent",
              "&:hover": {
                bgcolor: "transparent",
              },
            }}
          >
            PLAN
          </Button>
        </Box>

        {/* DOWNLOAD */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            borderBottom: isDownloadActive
              ? `2px solid ${ACTIVE_COLOR}`
              : "2px solid transparent",
            pb: 0.5,
          }}
        >
          <Button
            disableRipple
            onClick={() => onTabChange("download")}
            startIcon={
              <DownloadOutlinedIcon
                sx={{
                  fontSize: 20,
                  color: isDownloadActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                }}
              />
            }
            sx={{
              textTransform: "none",
              fontSize: 14,
              fontWeight: isDownloadActive ? 700 : 600,
              px: 0,
              minWidth: "auto",
              color: isDownloadActive ? ACTIVE_COLOR : INACTIVE_COLOR,
              bgcolor: "transparent",
              "&:hover": {
                bgcolor: "transparent",
              },
            }}
          >
            DOWNLOAD
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default ManageTopTabs;
