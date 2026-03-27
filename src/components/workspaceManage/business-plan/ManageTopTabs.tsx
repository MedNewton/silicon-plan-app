// src/components/workspaceManage/ManageTopTabs.tsx
"use client";

import type { FC } from "react";
import { Box, Button, CircularProgress, Stack } from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export type ManageTopTab = "plan" | "financials" | "download";

export type ManageTopTabsProps = Readonly<{
  activeTab: ManageTopTab;
  onTabChange: (tab: ManageTopTab) => void;
  onAutoGenerate?: () => void;
  isGenerating?: boolean;
}>;

const ACTIVE_COLOR = "#4C6AD2";   // main blue
const INACTIVE_COLOR = "#6B7280"; // muted grey-blue

const ManageTopTabs: FC<ManageTopTabsProps> = ({
  activeTab,
  onTabChange,
  onAutoGenerate,
  isGenerating,
}) => {
  const isPlanActive = activeTab === "plan";
  const isFinancialsActive = activeTab === "financials";
  const isDownloadActive = activeTab === "download";
  const { t } = useLanguage();

  return (
    <Box
      sx={{
        borderBottom: "1px solid #E5E7EB",
        bgcolor: "#FFFFFF",
        px: 4,
        py: 1.25,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Stack direction="row" spacing={5} alignItems="stretch" sx={{ flex: 1, justifyContent: "center" }}>
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
            {t("topTabs.plan")}
          </Button>
        </Box>

        {/* FINANCIALS */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            borderBottom: isFinancialsActive
              ? `2px solid ${ACTIVE_COLOR}`
              : "2px solid transparent",
            pb: 0.5,
          }}
        >
          <Button
            disableRipple
            onClick={() => onTabChange("financials")}
            startIcon={
              <CalculateOutlinedIcon
                sx={{
                  fontSize: 20,
                  color: isFinancialsActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                }}
              />
            }
            sx={{
              textTransform: "none",
              fontSize: 14,
              fontWeight: isFinancialsActive ? 700 : 600,
              px: 0,
              minWidth: "auto",
              color: isFinancialsActive ? ACTIVE_COLOR : INACTIVE_COLOR,
              bgcolor: "transparent",
              "&:hover": {
                bgcolor: "transparent",
              },
            }}
          >
            {t("topTabs.financials")}
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
            {t("topTabs.download")}
          </Button>
        </Box>
      </Stack>

      {/* AUTO GENERATE BUTTON */}
      {onAutoGenerate && (
        <Button
          onClick={onAutoGenerate}
          disabled={isGenerating}
          startIcon={
            isGenerating ? (
              <CircularProgress size={16} sx={{ color: ACTIVE_COLOR }} />
            ) : (
              <AutoFixHighIcon sx={{ fontSize: 18 }} />
            )
          }
          sx={{
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            color: ACTIVE_COLOR,
            border: "1px solid #D3DDF5",
            borderRadius: 2,
            px: 2,
            py: 0.75,
            whiteSpace: "nowrap",
            "&:hover": {
              bgcolor: "rgba(76,106,210,0.04)",
              borderColor: ACTIVE_COLOR,
            },
            "&.Mui-disabled": {
              color: "#9CA3AF",
              borderColor: "#E5E7EB",
            },
          }}
        >
          {t("topTabs.autoGenerate")}
        </Button>
      )}
    </Box>
  );
};

export default ManageTopTabs;
