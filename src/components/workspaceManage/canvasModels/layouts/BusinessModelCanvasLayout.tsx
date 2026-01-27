"use client";

import type { FC } from "react";
import { Box } from "@mui/material";
import CanvasSection, { type CanvasSectionItem, type AiSuggestion } from "../CanvasSection";
import type { CanvasSectionsData } from "@/types/workspaces";

export type BusinessModelCanvasLayoutProps = Readonly<{
  sectionsData?: CanvasSectionsData;
  onAddItem?: (sectionId: string) => (item: { title: string; description: string }) => void;
  onUpdateItem?: (sectionId: string) => (item: CanvasSectionItem) => void;
  onDeleteItem?: (sectionId: string) => (itemId: string) => void;
  onGenerateAI?: (sectionId: string) => () => void;
  aiSuggestions?: Record<string, AiSuggestion[]>;
  loadingAISections?: string[];
  onDismissAISuggestions?: (sectionId: string) => void;
}>;

const BusinessModelCanvasLayout: FC<BusinessModelCanvasLayoutProps> = ({
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
      {/* Top row - 5 columns */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
        }}
      >
        {/* Key Partners - spans 2 rows */}
        <Box
          sx={{
            gridRow: "1 / 3",
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="KEY PARTNERS"
            placeholder="Who are our key partners?"
            items={getItems("key-partners")}
            onAddItem={handleAddItem("key-partners")}
            onUpdateItem={handleUpdateItem("key-partners")}
            onDeleteItem={handleDeleteItem("key-partners")}
            onGenerateAI={handleGenerateAI("key-partners")}
            aiSuggestions={getAISuggestions("key-partners")}
            isLoadingAI={isLoadingAI("key-partners")}
            onDismissAISuggestions={handleDismissAI("key-partners")}
            sx={{ minHeight: 300 }}
          />
        </Box>

        {/* Key Activities */}
        <Box
          sx={{
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Key Activities"
            placeholder="What key activities do our value propositions require?"
            items={getItems("key-activities")}
            onAddItem={handleAddItem("key-activities")}
            onUpdateItem={handleUpdateItem("key-activities")}
            onDeleteItem={handleDeleteItem("key-activities")}
            onGenerateAI={handleGenerateAI("key-activities")}
            aiSuggestions={getAISuggestions("key-activities")}
            isLoadingAI={isLoadingAI("key-activities")}
            onDismissAISuggestions={handleDismissAI("key-activities")}
          />
        </Box>

        {/* Value Proposition - spans 2 rows */}
        <Box
          sx={{
            gridRow: "1 / 3",
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Value Proposition"
            placeholder="What value do we deliver to the customer?"
            items={getItems("value-proposition")}
            onAddItem={handleAddItem("value-proposition")}
            onUpdateItem={handleUpdateItem("value-proposition")}
            onDeleteItem={handleDeleteItem("value-proposition")}
            onGenerateAI={handleGenerateAI("value-proposition")}
            aiSuggestions={getAISuggestions("value-proposition")}
            isLoadingAI={isLoadingAI("value-proposition")}
            onDismissAISuggestions={handleDismissAI("value-proposition")}
            sx={{ minHeight: 300 }}
          />
        </Box>

        {/* Customer Relationships */}
        <Box
          sx={{
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Customer Relationships"
            placeholder="What type of relationship does each customer segment expect?"
            items={getItems("customer-relationships")}
            onAddItem={handleAddItem("customer-relationships")}
            onUpdateItem={handleUpdateItem("customer-relationships")}
            onDeleteItem={handleDeleteItem("customer-relationships")}
            onGenerateAI={handleGenerateAI("customer-relationships")}
            aiSuggestions={getAISuggestions("customer-relationships")}
            isLoadingAI={isLoadingAI("customer-relationships")}
            onDismissAISuggestions={handleDismissAI("customer-relationships")}
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
            placeholder="For whom are we creating value?"
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

        {/* Key Resources (below Key Activities) */}
        <Box
          sx={{
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Key Resources"
            placeholder="What key resources do our value propositions require?"
            items={getItems("key-resources")}
            onAddItem={handleAddItem("key-resources")}
            onUpdateItem={handleUpdateItem("key-resources")}
            onDeleteItem={handleDeleteItem("key-resources")}
            onGenerateAI={handleGenerateAI("key-resources")}
            aiSuggestions={getAISuggestions("key-resources")}
            isLoadingAI={isLoadingAI("key-resources")}
            onDismissAISuggestions={handleDismissAI("key-resources")}
          />
        </Box>

        {/* Channels (below Customer Relationships) */}
        <Box
          sx={{
            borderRight: "1px solid #E5E7EB",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <CanvasSection
            title="Channels"
            placeholder="Through which channels do our customers want to be reached?"
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

      {/* Bottom row - 2 columns (Cost Structure & Revenue Streams) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <Box sx={{ borderRight: "1px solid #E5E7EB" }}>
          <CanvasSection
            title="Cost Structure"
            placeholder="What are the most important costs inherent in our business model?"
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
        <Box>
          <CanvasSection
            title="Revenue Streams"
            placeholder="For what value are our customers really willing to pay?"
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

export default BusinessModelCanvasLayout;
