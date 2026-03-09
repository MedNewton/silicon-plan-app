"use client";

import type { FC } from "react";
import { Box, Typography } from "@mui/material";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import DiamondOutlinedIcon from "@mui/icons-material/DiamondOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import CanvasSection, { type CanvasSectionItem, type AiSuggestion } from "../CanvasSection";
import type { CanvasSectionsData } from "@/types/workspaces";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export type StartupCanvasLayoutProps = Readonly<{
  sectionsData?: CanvasSectionsData;
  onAddItem?: (sectionId: string) => (item: Omit<CanvasSectionItem, "id">) => void;
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
  const { locale } = useLanguage();
  const copy =
    locale === "it"
      ? {
          header: "Startup Canvas",
          subtitle: "Valida e comunica la tua iniziativa nelle prime fasi",
        }
      : {
          header: "Startup Canvas",
          subtitle: "Validate and communicate your early-stage venture",
        };
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
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
          px: 3,
          py: 2,
          borderBottom: "1px solid #D1D5DB",
        }}
      >
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 700,
            color: "#FFFFFF",
          }}
        >
          {copy.header}
        </Typography>
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.8)",
            mt: 0.5,
          }}
        >
          {copy.subtitle}
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
            borderRight: "1px solid #D1D5DB",
            borderBottom: "1px solid #D1D5DB",
          }}
        >
          <CanvasSection
            title="Problem"
            placeholder="What problem are you solving? What's the current alternative?"
            icon={<WarningAmberOutlinedIcon />}
            accentColor="#EF4444"
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
            borderRight: "1px solid #D1D5DB",
            borderBottom: "1px solid #D1D5DB",
          }}
        >
          <CanvasSection
            title="Solution"
            placeholder="What is your proposed solution? How does it work?"
            icon={<LightbulbOutlinedIcon />}
            accentColor="#8B5CF6"
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
            borderBottom: "1px solid #D1D5DB",
          }}
        >
          <CanvasSection
            title="Customer Segments"
            placeholder="Who are your target customers? Who are early adopters?"
            icon={<PeopleOutlinedIcon />}
            accentColor="#3B82F6"
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
          borderBottom: "1px solid #D1D5DB",
          bgcolor: "#FAFAFE",
        }}
      >
        <CanvasSection
          title="UNIQUE VALUE PROPOSITION"
          placeholder="What is your single, clear, compelling message that states why you are different and worth buying?"
          icon={<DiamondOutlinedIcon />}
          accentColor="#EC4899"
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
            borderRight: "1px solid #D1D5DB",
            borderBottom: "1px solid #D1D5DB",
          }}
        >
          <CanvasSection
            title="Unfair Advantage"
            placeholder="What can't be easily copied or bought?"
            icon={<ShieldOutlinedIcon />}
            accentColor="#F59E0B"
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
            borderRight: "1px solid #D1D5DB",
            borderBottom: "1px solid #D1D5DB",
          }}
        >
          <CanvasSection
            title="Channels"
            placeholder="How will you reach your customers?"
            icon={<LocalShippingOutlinedIcon />}
            accentColor="#10B981"
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
            borderBottom: "1px solid #D1D5DB",
          }}
        >
          <CanvasSection
            title="Key Metrics"
            placeholder="What key metrics will you track?"
            icon={<BarChartOutlinedIcon />}
            accentColor="#6366F1"
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
        <Box sx={{ borderRight: "1px solid #D1D5DB" }}>
          <CanvasSection
            title="Cost Structure"
            placeholder="What are your fixed and variable costs?"
            icon={<AccountBalanceOutlinedIcon />}
            accentColor="#F59E0B"
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
            icon={<TrendingUpOutlinedIcon />}
            accentColor="#10B981"
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
