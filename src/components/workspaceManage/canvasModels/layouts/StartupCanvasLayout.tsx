"use client";

import type { FC } from "react";
import { Box, Typography } from "@mui/material";
import CanvasSection, { type CanvasSectionItem, type AiSuggestion } from "../CanvasSection";
import type { CanvasSectionsData } from "@/types/workspaces";

export type StartupCanvasLayoutProps = Readonly<{
  sectionsData?: CanvasSectionsData;
  onAddItem?: (sectionId: string) => (item: { title: string; description: string }) => void;
  onUpdateItem?: (sectionId: string) => (item: CanvasSectionItem) => void;
  onDeleteItem?: (sectionId: string) => (itemId: string) => void;
  onGenerateAI?: (sectionId: string) => () => void;
  aiSuggestions?: Record<string, AiSuggestion[]>;
  loadingAISections?: string[];
  onDismissAISuggestions?: (sectionId: string) => void;
}>;

const StartupCanvasLayout: FC<StartupCanvasLayoutProps> = ({
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
      {/* Header */}
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
          Startup Canvas
        </Typography>
        <Typography
          sx={{
            fontSize: 12,
            color: "#6B7280",
            mt: 0.5,
          }}
        >
          Validate and communicate your early-stage venture
        </Typography>
      </Box>

      {/* Top row - 3 columns */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
        }}
      >
        {/* Problem */}
        <Box
          sx={{
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Problem"
            placeholder="What problem are you solving? What's the current alternative?"
            items={getItems("problem")}
            onAddItem={handleAddItem("problem")}
            onUpdateItem={handleUpdateItem("problem")}
            onDeleteItem={handleDeleteItem("problem")}
            onGenerateAI={handleGenerateAI("problem")}
            aiSuggestions={getAISuggestions("problem")}
            isLoadingAI={isLoadingAI("problem")}
            onDismissAISuggestions={handleDismissAI("problem")}
            sx={{ minHeight: 200 }}
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
            placeholder="What is your proposed solution? How does it work?"
            items={getItems("solution")}
            onAddItem={handleAddItem("solution")}
            onUpdateItem={handleUpdateItem("solution")}
            onDeleteItem={handleDeleteItem("solution")}
            onGenerateAI={handleGenerateAI("solution")}
            aiSuggestions={getAISuggestions("solution")}
            isLoadingAI={isLoadingAI("solution")}
            onDismissAISuggestions={handleDismissAI("solution")}
            sx={{ minHeight: 200 }}
          />
        </Box>

        {/* Customer Segments */}
        <Box
          sx={{
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Customer Segments"
            placeholder="Who are your target customers? Who are early adopters?"
            items={getItems("customer-segments")}
            onAddItem={handleAddItem("customer-segments")}
            onUpdateItem={handleUpdateItem("customer-segments")}
            onDeleteItem={handleDeleteItem("customer-segments")}
            onGenerateAI={handleGenerateAI("customer-segments")}
            aiSuggestions={getAISuggestions("customer-segments")}
            isLoadingAI={isLoadingAI("customer-segments")}
            onDismissAISuggestions={handleDismissAI("customer-segments")}
            sx={{ minHeight: 200 }}
          />
        </Box>
      </Box>

      {/* Middle row - Unique Value Proposition spanning full width */}
      <Box
        sx={{
          borderBottom: "1px solid #E5E7EB",
          bgcolor: "#F9FAFB",
        }}
      >
        <CanvasSection
          title="UNIQUE VALUE PROPOSITION"
          placeholder="What is your single, clear, compelling message that states why you are different and worth buying?"
          items={getItems("unique-value-proposition")}
          onAddItem={handleAddItem("unique-value-proposition")}
          onUpdateItem={handleUpdateItem("unique-value-proposition")}
          onDeleteItem={handleDeleteItem("unique-value-proposition")}
          onGenerateAI={handleGenerateAI("unique-value-proposition")}
          aiSuggestions={getAISuggestions("unique-value-proposition")}
          isLoadingAI={isLoadingAI("unique-value-proposition")}
          onDismissAISuggestions={handleDismissAI("unique-value-proposition")}
          sx={{ minHeight: 120 }}
        />
      </Box>

      {/* Third row - 3 columns */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
        }}
      >
        {/* Unfair Advantage */}
        <Box
          sx={{
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Unfair Advantage"
            placeholder="What can't be easily copied or bought?"
            items={getItems("unfair-advantage")}
            onAddItem={handleAddItem("unfair-advantage")}
            onUpdateItem={handleUpdateItem("unfair-advantage")}
            onDeleteItem={handleDeleteItem("unfair-advantage")}
            onGenerateAI={handleGenerateAI("unfair-advantage")}
            aiSuggestions={getAISuggestions("unfair-advantage")}
            isLoadingAI={isLoadingAI("unfair-advantage")}
            onDismissAISuggestions={handleDismissAI("unfair-advantage")}
            sx={{ minHeight: 180 }}
          />
        </Box>

        {/* Channels */}
        <Box
          sx={{
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Channels"
            placeholder="How will you reach your customers?"
            items={getItems("channels")}
            onAddItem={handleAddItem("channels")}
            onUpdateItem={handleUpdateItem("channels")}
            onDeleteItem={handleDeleteItem("channels")}
            onGenerateAI={handleGenerateAI("channels")}
            aiSuggestions={getAISuggestions("channels")}
            isLoadingAI={isLoadingAI("channels")}
            onDismissAISuggestions={handleDismissAI("channels")}
            sx={{ minHeight: 180 }}
          />
        </Box>

        {/* Key Metrics */}
        <Box
          sx={{
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Key Metrics"
            placeholder="What key metrics will you track?"
            items={getItems("key-metrics")}
            onAddItem={handleAddItem("key-metrics")}
            onUpdateItem={handleUpdateItem("key-metrics")}
            onDeleteItem={handleDeleteItem("key-metrics")}
            onGenerateAI={handleGenerateAI("key-metrics")}
            aiSuggestions={getAISuggestions("key-metrics")}
            isLoadingAI={isLoadingAI("key-metrics")}
            onDismissAISuggestions={handleDismissAI("key-metrics")}
            sx={{ minHeight: 180 }}
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
            placeholder="What are your fixed and variable costs?"
            items={getItems("cost-structure")}
            onAddItem={handleAddItem("cost-structure")}
            onUpdateItem={handleUpdateItem("cost-structure")}
            onDeleteItem={handleDeleteItem("cost-structure")}
            onGenerateAI={handleGenerateAI("cost-structure")}
            aiSuggestions={getAISuggestions("cost-structure")}
            isLoadingAI={isLoadingAI("cost-structure")}
            onDismissAISuggestions={handleDismissAI("cost-structure")}
            sx={{ minHeight: 150 }}
          />
        </Box>

        {/* Revenue Streams */}
        <Box>
          <CanvasSection
            title="Revenue Streams"
            placeholder="How will you make money?"
            items={getItems("revenue-streams")}
            onAddItem={handleAddItem("revenue-streams")}
            onUpdateItem={handleUpdateItem("revenue-streams")}
            onDeleteItem={handleDeleteItem("revenue-streams")}
            onGenerateAI={handleGenerateAI("revenue-streams")}
            aiSuggestions={getAISuggestions("revenue-streams")}
            isLoadingAI={isLoadingAI("revenue-streams")}
            onDismissAISuggestions={handleDismissAI("revenue-streams")}
            sx={{ minHeight: 150 }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default StartupCanvasLayout;
