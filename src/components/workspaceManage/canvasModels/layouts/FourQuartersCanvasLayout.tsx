"use client";

import type { FC } from "react";
import { Box, Typography } from "@mui/material";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import GppMaybeOutlinedIcon from "@mui/icons-material/GppMaybeOutlined";
import CanvasSection, { type CanvasSectionItem, type AiSuggestion } from "../CanvasSection";
import type { CanvasSectionsData } from "@/types/workspaces";

export type FourQuartersCanvasLayoutProps = Readonly<{
  sectionsData?: CanvasSectionsData;
  onAddItem?: (sectionId: string) => (item: Omit<CanvasSectionItem, "id">) => void;
  onUpdateItem?: (sectionId: string) => (item: CanvasSectionItem) => void;
  onDeleteItem?: (sectionId: string) => (itemId: string) => void;
  onGenerateAI?: (sectionId: string) => () => void;
  aiSuggestions?: Record<string, AiSuggestion[]>;
  loadingAISections?: string[];
  onDismissAISuggestions?: (sectionId: string) => void;
}>;

const QUARTERS = [
  { id: "q1", label: "Q1", color: "#6366F1" },
  { id: "q2", label: "Q2", color: "#8B5CF6" },
  { id: "q3", label: "Q3", color: "#EC4899" },
  { id: "q4", label: "Q4", color: "#3B82F6" },
];

const FourQuartersCanvasLayout: FC<FourQuartersCanvasLayoutProps> = ({
  sectionsData = {},
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onGenerateAI,
  aiSuggestions = {},
  loadingAISections = [],
  onDismissAISuggestions,
}) => {
  const getItems = (sectionId: string): CanvasSectionItem[] => {
    return sectionsData[sectionId] ?? [];
  };

  const handleAddItem = (sectionId: string) => (item: Omit<CanvasSectionItem, "id">) => {
    onAddItem?.(sectionId)(item);
  };

  const handleUpdateItem = (sectionId: string) => (item: CanvasSectionItem) => {
    onUpdateItem?.(sectionId)(item);
  };

  const handleDeleteItem = (sectionId: string) => (itemId: string) => {
    onDeleteItem?.(sectionId)(itemId);
  };

  const handleGenerateAI = (sectionId: string) => () => {
    onGenerateAI?.(sectionId)();
  };

  const getAISuggestions = (sectionId: string): AiSuggestion[] => {
    return aiSuggestions[sectionId] ?? [];
  };

  const isLoadingAI = (sectionId: string): boolean => {
    return loadingAISections.includes(sectionId);
  };

  const handleDismissAI = (sectionId: string) => () => {
    onDismissAISuggestions?.(sectionId);
  };

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: 2,
        border: "1px solid #D1D5DB",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Quarter columns */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
      >
        {QUARTERS.map((quarter, index) => (
          <Box
            key={quarter.id}
            sx={{
              borderRight: index < 3 ? "1px solid #D1D5DB" : "none",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Quarter header */}
            <Box
              sx={{
                bgcolor: `${quarter.color}12`,
                px: 2,
                py: 1.5,
                borderBottom: "1px solid #D1D5DB",
                borderTop: `3px solid ${quarter.color}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: quarter.color,
                  textAlign: "center",
                  letterSpacing: "0.05em",
                }}
              >
                {quarter.label}
              </Typography>
            </Box>

            {/* Objectives */}
            <Box sx={{ borderBottom: "1px solid #D1D5DB" }}>
              <CanvasSection
                title="Objectives"
                placeholder="What are the key objectives for this quarter?"
                icon={<FlagOutlinedIcon />}
                accentColor={quarter.color}
                items={getItems(`${quarter.id}-objectives`)}
                onAddItem={handleAddItem(`${quarter.id}-objectives`)}
                onUpdateItem={handleUpdateItem(`${quarter.id}-objectives`)}
                onDeleteItem={handleDeleteItem(`${quarter.id}-objectives`)}
                onGenerateAI={handleGenerateAI(`${quarter.id}-objectives`)}
                aiSuggestions={getAISuggestions(`${quarter.id}-objectives`)}
                isLoadingAI={isLoadingAI(`${quarter.id}-objectives`)}
                onDismissAISuggestions={handleDismissAI(`${quarter.id}-objectives`)}
              />
            </Box>

            {/* Milestones */}
            <Box sx={{ borderBottom: "1px solid #D1D5DB" }}>
              <CanvasSection
                title="Milestones"
                placeholder="What milestones need to be achieved?"
                icon={<EmojiEventsOutlinedIcon />}
                accentColor={quarter.color}
                items={getItems(`${quarter.id}-milestones`)}
                onAddItem={handleAddItem(`${quarter.id}-milestones`)}
                onUpdateItem={handleUpdateItem(`${quarter.id}-milestones`)}
                onDeleteItem={handleDeleteItem(`${quarter.id}-milestones`)}
                onGenerateAI={handleGenerateAI(`${quarter.id}-milestones`)}
                aiSuggestions={getAISuggestions(`${quarter.id}-milestones`)}
                isLoadingAI={isLoadingAI(`${quarter.id}-milestones`)}
                onDismissAISuggestions={handleDismissAI(`${quarter.id}-milestones`)}
              />
            </Box>

            {/* Key Metrics */}
            <Box sx={{ borderBottom: "1px solid #D1D5DB" }}>
              <CanvasSection
                title="Key Metrics"
                placeholder="How will you measure success?"
                icon={<BarChartOutlinedIcon />}
                accentColor={quarter.color}
                items={getItems(`${quarter.id}-metrics`)}
                onAddItem={handleAddItem(`${quarter.id}-metrics`)}
                onUpdateItem={handleUpdateItem(`${quarter.id}-metrics`)}
                onDeleteItem={handleDeleteItem(`${quarter.id}-metrics`)}
                onGenerateAI={handleGenerateAI(`${quarter.id}-metrics`)}
                aiSuggestions={getAISuggestions(`${quarter.id}-metrics`)}
                isLoadingAI={isLoadingAI(`${quarter.id}-metrics`)}
                onDismissAISuggestions={handleDismissAI(`${quarter.id}-metrics`)}
              />
            </Box>

            {/* Risks & Owners */}
            <Box>
              <CanvasSection
                title="Risks & Owners"
                placeholder="What are the risks and who is responsible?"
                icon={<GppMaybeOutlinedIcon />}
                accentColor={quarter.color}
                items={getItems(`${quarter.id}-risks`)}
                onAddItem={handleAddItem(`${quarter.id}-risks`)}
                onUpdateItem={handleUpdateItem(`${quarter.id}-risks`)}
                onDeleteItem={handleDeleteItem(`${quarter.id}-risks`)}
                onGenerateAI={handleGenerateAI(`${quarter.id}-risks`)}
                aiSuggestions={getAISuggestions(`${quarter.id}-risks`)}
                isLoadingAI={isLoadingAI(`${quarter.id}-risks`)}
                onDismissAISuggestions={handleDismissAI(`${quarter.id}-risks`)}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default FourQuartersCanvasLayout;
