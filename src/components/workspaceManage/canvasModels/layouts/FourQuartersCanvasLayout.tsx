"use client";

import type { FC } from "react";
import { Box, Typography } from "@mui/material";
import CanvasSection, { type CanvasSectionItem, type AiSuggestion } from "../CanvasSection";
import type { CanvasSectionsData } from "@/types/workspaces";

export type FourQuartersCanvasLayoutProps = Readonly<{
  sectionsData?: CanvasSectionsData;
  onAddItem?: (sectionId: string) => (item: { title: string; description: string }) => void;
  onUpdateItem?: (sectionId: string) => (item: CanvasSectionItem) => void;
  onDeleteItem?: (sectionId: string) => (itemId: string) => void;
  onGenerateAI?: (sectionId: string) => () => void;
  aiSuggestions?: Record<string, AiSuggestion[]>;
  loadingAISections?: string[];
  onDismissAISuggestions?: (sectionId: string) => void;
}>;

const QUARTERS = [
  { id: "q1", label: "Q1", color: "#E4F4F2" },
  { id: "q2", label: "Q2", color: "#EAF3D9" },
  { id: "q3", label: "Q3", color: "#F7E1E1" },
  { id: "q4", label: "Q4", color: "#E3E9FA" },
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
    return (sectionsData[sectionId] || []) as CanvasSectionItem[];
  };

  const handleAddItem = (sectionId: string) => (item: { title: string; description: string }) => {
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
    return aiSuggestions[sectionId] || [];
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
        border: "1px solid #E5E7EB",
        overflow: "hidden",
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
              borderRight: index < 3 ? "1px solid #E5E7EB" : "none",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Quarter header */}
            <Box
              sx={{
                bgcolor: quarter.color,
                px: 2,
                py: 1.5,
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111827",
                  textAlign: "center",
                }}
              >
                {quarter.label}
              </Typography>
            </Box>

            {/* Objectives */}
            <Box sx={{ borderBottom: "1px solid #E5E7EB" }}>
              <CanvasSection
                title="Objectives"
                placeholder="What are the key objectives for this quarter?"
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
            <Box sx={{ borderBottom: "1px solid #E5E7EB" }}>
              <CanvasSection
                title="Milestones"
                placeholder="What milestones need to be achieved?"
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
            <Box sx={{ borderBottom: "1px solid #E5E7EB" }}>
              <CanvasSection
                title="Key Metrics"
                placeholder="How will you measure success?"
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
