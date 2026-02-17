"use client";

import type { FC } from "react";
import { Box, Typography } from "@mui/material";
import CanvasSection, { type CanvasSectionItem, type AiSuggestion } from "../CanvasSection";
import type { CanvasSectionsData } from "@/types/workspaces";

export type ValuePropositionCanvasLayoutProps = Readonly<{
  sectionsData?: CanvasSectionsData;
  onAddItem?: (sectionId: string) => (item: Omit<CanvasSectionItem, "id">) => void;
  onUpdateItem?: (sectionId: string) => (item: CanvasSectionItem) => void;
  onDeleteItem?: (sectionId: string) => (itemId: string) => void;
  onGenerateAI?: (sectionId: string) => () => void;
  aiSuggestions?: Record<string, AiSuggestion[]>;
  loadingAISections?: string[];
  onDismissAISuggestions?: (sectionId: string) => void;
}>;

const ValuePropositionCanvasLayout: FC<ValuePropositionCanvasLayoutProps> = ({
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
        border: "1px solid #E5E7EB",
        overflow: "hidden",
      }}
    >
      {/* Two main columns: Value Map and Customer Profile */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        {/* Value Map (Left side) */}
        <Box
          sx={{
            borderRight: "1px solid #E5E7EB",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Value Map Header */}
          <Box
            sx={{
              bgcolor: "#E3E9FA",
              px: 3,
              py: 2,
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Value Map
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: "#6B7280",
                mt: 0.5,
              }}
            >
              How you create value for customers
            </Typography>
          </Box>

          {/* Products & Services */}
          <Box sx={{ borderBottom: "1px solid #E5E7EB" }}>
            <CanvasSection
              title="Products & Services"
              placeholder="What products and services do you offer?"
              items={getItems("products-services")}
              onAddItem={handleAddItem("products-services")}
              onUpdateItem={handleUpdateItem("products-services")}
              onDeleteItem={handleDeleteItem("products-services")}
              onGenerateAI={handleGenerateAI("products-services")}
              aiSuggestions={getAISuggestions("products-services")}
              isLoadingAI={isLoadingAI("products-services")}
              onDismissAISuggestions={handleDismissAI("products-services")}
              sx={{ minHeight: 180 }}
            />
          </Box>

          {/* Pain Relievers */}
          <Box sx={{ borderBottom: "1px solid #E5E7EB" }}>
            <CanvasSection
              title="Pain Relievers"
              placeholder="How do you alleviate customer pains?"
              items={getItems("pain-relievers")}
              onAddItem={handleAddItem("pain-relievers")}
              onUpdateItem={handleUpdateItem("pain-relievers")}
              onDeleteItem={handleDeleteItem("pain-relievers")}
              onGenerateAI={handleGenerateAI("pain-relievers")}
              aiSuggestions={getAISuggestions("pain-relievers")}
              isLoadingAI={isLoadingAI("pain-relievers")}
              onDismissAISuggestions={handleDismissAI("pain-relievers")}
              sx={{ minHeight: 180 }}
            />
          </Box>

          {/* Gain Creators */}
          <Box>
            <CanvasSection
              title="Gain Creators"
              placeholder="How do you create customer gains?"
              items={getItems("gain-creators")}
              onAddItem={handleAddItem("gain-creators")}
              onUpdateItem={handleUpdateItem("gain-creators")}
              onDeleteItem={handleDeleteItem("gain-creators")}
              onGenerateAI={handleGenerateAI("gain-creators")}
              aiSuggestions={getAISuggestions("gain-creators")}
              isLoadingAI={isLoadingAI("gain-creators")}
              onDismissAISuggestions={handleDismissAI("gain-creators")}
              sx={{ minHeight: 180 }}
            />
          </Box>
        </Box>

        {/* Customer Profile (Right side) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Customer Profile Header */}
          <Box
            sx={{
              bgcolor: "#F7E1E1",
              px: 3,
              py: 2,
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Customer Profile
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: "#6B7280",
                mt: 0.5,
              }}
            >
              Understanding your customer segment
            </Typography>
          </Box>

          {/* Customer Jobs */}
          <Box sx={{ borderBottom: "1px solid #E5E7EB" }}>
            <CanvasSection
              title="Customer Jobs"
              placeholder="What jobs are customers trying to get done?"
              items={getItems("customer-jobs")}
              onAddItem={handleAddItem("customer-jobs")}
              onUpdateItem={handleUpdateItem("customer-jobs")}
              onDeleteItem={handleDeleteItem("customer-jobs")}
              onGenerateAI={handleGenerateAI("customer-jobs")}
              aiSuggestions={getAISuggestions("customer-jobs")}
              isLoadingAI={isLoadingAI("customer-jobs")}
              onDismissAISuggestions={handleDismissAI("customer-jobs")}
              sx={{ minHeight: 180 }}
            />
          </Box>

          {/* Pains */}
          <Box sx={{ borderBottom: "1px solid #E5E7EB" }}>
            <CanvasSection
              title="Pains"
              placeholder="What frustrates your customers?"
              items={getItems("pains")}
              onAddItem={handleAddItem("pains")}
              onUpdateItem={handleUpdateItem("pains")}
              onDeleteItem={handleDeleteItem("pains")}
              onGenerateAI={handleGenerateAI("pains")}
              aiSuggestions={getAISuggestions("pains")}
              isLoadingAI={isLoadingAI("pains")}
              onDismissAISuggestions={handleDismissAI("pains")}
              sx={{ minHeight: 180 }}
            />
          </Box>

          {/* Gains */}
          <Box>
            <CanvasSection
              title="Gains"
              placeholder="What outcomes do customers want to achieve?"
              items={getItems("gains")}
              onAddItem={handleAddItem("gains")}
              onUpdateItem={handleUpdateItem("gains")}
              onDeleteItem={handleDeleteItem("gains")}
              onGenerateAI={handleGenerateAI("gains")}
              aiSuggestions={getAISuggestions("gains")}
              isLoadingAI={isLoadingAI("gains")}
              onDismissAISuggestions={handleDismissAI("gains")}
              sx={{ minHeight: 180 }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ValuePropositionCanvasLayout;
