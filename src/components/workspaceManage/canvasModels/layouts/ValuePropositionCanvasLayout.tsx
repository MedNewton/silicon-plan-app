"use client";

import type { FC } from "react";
import { Box, Typography } from "@mui/material";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import HealingOutlinedIcon from "@mui/icons-material/HealingOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import WorkOutlinedIcon from "@mui/icons-material/WorkOutlined";
import SentimentDissatisfiedOutlinedIcon from "@mui/icons-material/SentimentDissatisfiedOutlined";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import CanvasSection, { type CanvasSectionItem, type AiSuggestion } from "../CanvasSection";
import type { CanvasSectionsData } from "@/types/workspaces";
import { useLanguage } from "@/components/i18n/LanguageProvider";

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
  const { locale } = useLanguage();
  const copy =
    locale === "it"
      ? {
          valueMap: "Value Map",
          valueMapSubtitle: "Come crei valore per i clienti",
          customerProfile: "Profilo cliente",
          customerProfileSubtitle: "Comprendere il tuo segmento cliente",
        }
      : {
          valueMap: "Value Map",
          valueMapSubtitle: "How you create value for customers",
          customerProfile: "Customer Profile",
          customerProfileSubtitle: "Understanding your customer segment",
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
            borderRight: "1px solid #D1D5DB",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Value Map Header */}
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
              {copy.valueMap}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: "rgba(255,255,255,0.8)",
                mt: 0.5,
              }}
            >
              {copy.valueMapSubtitle}
            </Typography>
          </Box>

          {/* Products & Services */}
          <Box sx={{ borderBottom: "1px solid #D1D5DB" }}>
            <CanvasSection
              title="Products & Services"
              placeholder="What products and services do you offer?"
              icon={<CategoryOutlinedIcon />}
              accentColor="#3B82F6"
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
          <Box sx={{ borderBottom: "1px solid #D1D5DB" }}>
            <CanvasSection
              title="Pain Relievers"
              placeholder="How do you alleviate customer pains?"
              icon={<HealingOutlinedIcon />}
              accentColor="#10B981"
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
              icon={<AutoAwesomeOutlinedIcon />}
              accentColor="#8B5CF6"
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
              background: "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)",
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
              {copy.customerProfile}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: "rgba(255,255,255,0.8)",
                mt: 0.5,
              }}
            >
              {copy.customerProfileSubtitle}
            </Typography>
          </Box>

          {/* Customer Jobs */}
          <Box sx={{ borderBottom: "1px solid #D1D5DB" }}>
            <CanvasSection
              title="Customer Jobs"
              placeholder="What jobs are customers trying to get done?"
              icon={<WorkOutlinedIcon />}
              accentColor="#EC4899"
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
          <Box sx={{ borderBottom: "1px solid #D1D5DB" }}>
            <CanvasSection
              title="Pains"
              placeholder="What frustrates your customers?"
              icon={<SentimentDissatisfiedOutlinedIcon />}
              accentColor="#EF4444"
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
              icon={<EmojiEmotionsOutlinedIcon />}
              accentColor="#10B981"
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
