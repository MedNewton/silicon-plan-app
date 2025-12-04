// src/components/workspaceManage/business-plan/ManageBusinessPlanContentArea.tsx
"use client";

import type { FC } from "react";
import { Box, IconButton, Typography } from "@mui/material";

import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";
import RedoOutlinedIcon from "@mui/icons-material/RedoOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import ManageAiTabs, { type ManageAiTab } from "./ManageAiTabs";
import type { ManageTopTab } from "./ManageTopTabs";

export type ManageBusinessPlanContentAreaProps = Readonly<{
  activeTopTab: ManageTopTab; // layout is the same; only right ActionArea changes
  activeAiTab: ManageAiTab;
  onAiTabChange: (tab: ManageAiTab) => void;
}>;

const ManageBusinessPlanContentArea: FC<
  ManageBusinessPlanContentAreaProps
> = ({ activeTopTab: _activeTopTab, activeAiTab, onAiTabChange }) => {
  const renderChatColumn = () => (
    <Box
      sx={{
        width: 360,
        borderRight: "1px solid #E5E7EB",
        bgcolor: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        minHeight: 0,
      }}
    >
      {/* ManageAiTabs now owns its own scroll + bottom input */}
      <ManageAiTabs activeTab={activeAiTab} onTabChange={onAiTabChange} />
    </Box>
  );

  const renderPreview = () => (
    <Box
      sx={{

        height: "100%",
        maxHeight: "100% !important",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        bgcolor: "#F3F4FB",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          justifyContent: "center",
          overflowY: "auto",
          px: 4,
          py: 3,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 720,
            borderRadius: 3,
            border: "1px solid #E5E7EB",
            bgcolor: "#FFFFFF",
            px: 4,
            py: 3.2,
            display: "flex",
            flexDirection: "column",
            gap: 2.2,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 700,
                color: "#111827",
                mb: 1.2,
              }}
            >
              Executive Summary
            </Typography>
            <Box
              sx={{
                height: 2,
                borderRadius: 999,
                bgcolor: "#D3DDF5",
              }}
            />
          </Box>

          <Box>
            <Typography
              sx={{ fontSize: 16, fontWeight: 600, color: "#111827", mb: 1.2 }}
            >
              Business Overview
            </Typography>

            <Box
              sx={{
                borderRadius: 2,
                border: "1px solid #E5E7EB",
                bgcolor: "#F9FAFF",
                px: 2.5,
                py: 2,
                mb: 1.5,
              }}
            >
              <Typography
                sx={{ fontSize: 13.5, color: "#4B5563", lineHeight: 1.7 }}
              >
                John &amp; Sons (J&amp;S) Barbing Salon is a standard and
                licensed barbing salon that will be located in a richly
                populated neighborhood in West Palm Beach, Florida – the United
                States of America. We chose to open our barbing salon in this
                city because of the need for the services of a standard barbing
                salon in the neighborhood. John and Sons Barbing Salon offers
                services such as cutting hair for both males and females,
                dressing hair for both males and females, grooming hair for both
                males and females, dying / coloring hair for both males and
                females and styling and shaving hair for both males and females.
              </Typography>

              <Box
                sx={{
                  mt: 1.8,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                }}
              >
                <IconButton size="small">
                  <UndoOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton size="small">
                  <RedoOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton size="small">
                  <LinkOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton size="small">
                  <ContentCopyOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton size="small">
                  <EditOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>

            <Typography
              sx={{ fontSize: 13.5, color: "#4B5563", lineHeight: 1.7 }}
            >
              John &amp; Sons (J&amp;S) Barbing Salon is a standard and licensed
              barbing salon that will be located in a richly populated
              neighborhood in West Palm Beach, Florida – the United States of
              America. We chose to open our barbing salon in this city because
              of the need for the services of a standard barbing salon in the
              neighborhood.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        minHeight: 0,
      }}
    >
      {renderChatColumn()}
      {renderPreview()}
    </Box>
  );
};

export default ManageBusinessPlanContentArea;
