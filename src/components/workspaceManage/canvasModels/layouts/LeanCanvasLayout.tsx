"use client";

import type { FC } from "react";
import { Box } from "@mui/material";
import CanvasSection, { type CanvasSectionItem, type AiSuggestion } from "../CanvasSection";
import type { CanvasSectionsData } from "@/types/workspaces";

export type LeanCanvasLayoutProps = Readonly<{
  sectionsData?: CanvasSectionsData;
  onAddItem?: (sectionId: string) => (item: Omit<CanvasSectionItem, "id">) => void;
  onUpdateItem?: (sectionId: string) => (item: CanvasSectionItem) => void;
  onDeleteItem?: (sectionId: string) => (itemId: string) => void;
  onGenerateAI?: (sectionId: string) => () => void;
  aiSuggestions?: Record<string, AiSuggestion[]>;
  loadingAISections?: string[];
  onDismissAISuggestions?: (sectionId: string) => void;
}>;

const LeanCanvasLayout: FC<LeanCanvasLayoutProps> = ({
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
      {/* Main grid - 5 columns like Business Model Canvas */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
        }}
      >
        {/* Problem - spans 2 rows */}
        <Box
          sx={{
            gridRow: "1 / 3",
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="PROBLEM"
            placeholder="List your top 1-3 problems. What existing alternatives do customers use?"
            items={getItems("problem")}
            onAddItem={handleAddItem("problem")}
            onUpdateItem={handleUpdateItem("problem")}
            onDeleteItem={handleDeleteItem("problem")}
            onGenerateAI={handleGenerateAI("problem")}
            aiSuggestions={getAISuggestions("problem")}
            isLoadingAI={isLoadingAI("problem")}
            onDismissAISuggestions={handleDismissAI("problem")}
            sx={{ minHeight: 300 }}
          />
        </Box>

        {/* Solution */}
        <Box
          sx={{
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Solution"
            placeholder="Outline a possible solution for each problem"
            items={getItems("solution")}
            onAddItem={handleAddItem("solution")}
            onUpdateItem={handleUpdateItem("solution")}
            onDeleteItem={handleDeleteItem("solution")}
            onGenerateAI={handleGenerateAI("solution")}
            aiSuggestions={getAISuggestions("solution")}
            isLoadingAI={isLoadingAI("solution")}
            onDismissAISuggestions={handleDismissAI("solution")}
          />
        </Box>

        {/* Unique Value Proposition - spans 2 rows */}
        <Box
          sx={{
            gridRow: "1 / 3",
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Unique Value Proposition"
            placeholder="Single, clear, compelling message that turns an unaware visitor into an interested prospect"
            items={getItems("unique-value-proposition")}
            onAddItem={handleAddItem("unique-value-proposition")}
            onUpdateItem={handleUpdateItem("unique-value-proposition")}
            onDeleteItem={handleDeleteItem("unique-value-proposition")}
            onGenerateAI={handleGenerateAI("unique-value-proposition")}
            aiSuggestions={getAISuggestions("unique-value-proposition")}
            isLoadingAI={isLoadingAI("unique-value-proposition")}
            onDismissAISuggestions={handleDismissAI("unique-value-proposition")}
            sx={{ minHeight: 300 }}
          />
        </Box>

        {/* Unfair Advantage */}
        <Box
          sx={{
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Unfair Advantage"
            placeholder="Something that cannot be easily copied or bought"
            items={getItems("unfair-advantage")}
            onAddItem={handleAddItem("unfair-advantage")}
            onUpdateItem={handleUpdateItem("unfair-advantage")}
            onDeleteItem={handleDeleteItem("unfair-advantage")}
            onGenerateAI={handleGenerateAI("unfair-advantage")}
            aiSuggestions={getAISuggestions("unfair-advantage")}
            isLoadingAI={isLoadingAI("unfair-advantage")}
            onDismissAISuggestions={handleDismissAI("unfair-advantage")}
          />
        </Box>

        {/* Customer Segments - spans 2 rows */}
        <Box
          sx={{
            gridRow: "1 / 3",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Customer Segments"
            placeholder="List your target customers and users. Who are your early adopters?"
            items={getItems("customer-segments")}
            onAddItem={handleAddItem("customer-segments")}
            onUpdateItem={handleUpdateItem("customer-segments")}
            onDeleteItem={handleDeleteItem("customer-segments")}
            onGenerateAI={handleGenerateAI("customer-segments")}
            aiSuggestions={getAISuggestions("customer-segments")}
            isLoadingAI={isLoadingAI("customer-segments")}
            onDismissAISuggestions={handleDismissAI("customer-segments")}
            sx={{ minHeight: 300 }}
          />
        </Box>

        {/* Key Metrics (below Solution) */}
        <Box
          sx={{
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Key Metrics"
            placeholder="List the key numbers that tell you how your business is doing"
            items={getItems("key-metrics")}
            onAddItem={handleAddItem("key-metrics")}
            onUpdateItem={handleUpdateItem("key-metrics")}
            onDeleteItem={handleDeleteItem("key-metrics")}
            onGenerateAI={handleGenerateAI("key-metrics")}
            aiSuggestions={getAISuggestions("key-metrics")}
            isLoadingAI={isLoadingAI("key-metrics")}
            onDismissAISuggestions={handleDismissAI("key-metrics")}
          />
        </Box>

        {/* Channels (below Unfair Advantage) */}
        <Box
          sx={{
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Channels"
            placeholder="List your path to customers (inbound or outbound)"
            items={getItems("channels")}
            onAddItem={handleAddItem("channels")}
            onUpdateItem={handleUpdateItem("channels")}
            onDeleteItem={handleDeleteItem("channels")}
            onGenerateAI={handleGenerateAI("channels")}
            aiSuggestions={getAISuggestions("channels")}
            isLoadingAI={isLoadingAI("channels")}
            onDismissAISuggestions={handleDismissAI("channels")}
          />
        </Box>
      </Box>

      {/* Bottom row - 2 columns */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        {/* Cost Structure */}
        <Box sx={{ borderRight: "1px solid #E5E7EB" }}>
          <CanvasSection
            title="Cost Structure"
            placeholder="List your fixed and variable costs"
            items={getItems("cost-structure")}
            onAddItem={handleAddItem("cost-structure")}
            onUpdateItem={handleUpdateItem("cost-structure")}
            onDeleteItem={handleDeleteItem("cost-structure")}
            onGenerateAI={handleGenerateAI("cost-structure")}
            aiSuggestions={getAISuggestions("cost-structure")}
            isLoadingAI={isLoadingAI("cost-structure")}
            onDismissAISuggestions={handleDismissAI("cost-structure")}
          />
        </Box>

        {/* Revenue Streams */}
        <Box>
          <CanvasSection
            title="Revenue Streams"
            placeholder="List your sources of revenue"
            items={getItems("revenue-streams")}
            onAddItem={handleAddItem("revenue-streams")}
            onUpdateItem={handleUpdateItem("revenue-streams")}
            onDeleteItem={handleDeleteItem("revenue-streams")}
            onGenerateAI={handleGenerateAI("revenue-streams")}
            aiSuggestions={getAISuggestions("revenue-streams")}
            isLoadingAI={isLoadingAI("revenue-streams")}
            onDismissAISuggestions={handleDismissAI("revenue-streams")}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default LeanCanvasLayout;
