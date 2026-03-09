"use client";

import type { FC, ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";
import CanvasSection, { type CanvasSectionItem, type AiSuggestion } from "../CanvasSection";
import type { CanvasSectionsData } from "@/types/workspaces";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export type PitchCanvasLayoutProps = Readonly<{
  sectionsData?: CanvasSectionsData;
  onAddItem?: (sectionId: string) => (item: Omit<CanvasSectionItem, "id">) => void;
  onUpdateItem?: (sectionId: string) => (item: CanvasSectionItem) => void;
  onDeleteItem?: (sectionId: string) => (itemId: string) => void;
  onGenerateAI?: (sectionId: string) => () => void;
  aiSuggestions?: Record<string, AiSuggestion[]>;
  loadingAISections?: string[];
  onDismissAISuggestions?: (sectionId: string) => void;
}>;

type PitchSection = {
  id: string;
  title: string;
  placeholder: string;
  icon: ReactNode;
  accentColor: string;
};

const PITCH_SECTIONS: PitchSection[] = [
  { id: "hook", title: "Hook", placeholder: "What's your attention-grabbing opening?", icon: <CampaignOutlinedIcon />, accentColor: "#6366F1" },
  { id: "problem", title: "Problem", placeholder: "What problem are you solving?", icon: <WarningAmberOutlinedIcon />, accentColor: "#EF4444" },
  { id: "solution", title: "Solution", placeholder: "How do you solve this problem?", icon: <LightbulbOutlinedIcon />, accentColor: "#8B5CF6" },
  { id: "product", title: "Product Demo", placeholder: "How does your product work?", icon: <DevicesOutlinedIcon />, accentColor: "#3B82F6" },
  { id: "market", title: "Market Size", placeholder: "How big is the opportunity?", icon: <PublicOutlinedIcon />, accentColor: "#10B981" },
  { id: "gtm", title: "Go-to-Market", placeholder: "How will you reach customers?", icon: <RocketLaunchOutlinedIcon />, accentColor: "#EC4899" },
  { id: "traction", title: "Traction", placeholder: "What progress have you made?", icon: <TrendingUpOutlinedIcon />, accentColor: "#10B981" },
  { id: "business-model", title: "Business Model", placeholder: "How do you make money?", icon: <StorefrontOutlinedIcon />, accentColor: "#F59E0B" },
  { id: "competition", title: "Competition", placeholder: "Who are your competitors?", icon: <PeopleOutlinedIcon />, accentColor: "#EF4444" },
  { id: "team", title: "Team", placeholder: "Who is on your team?", icon: <GroupsOutlinedIcon />, accentColor: "#8B5CF6" },
  { id: "financials", title: "Financials", placeholder: "What are your projections?", icon: <AccountBalanceOutlinedIcon />, accentColor: "#F59E0B" },
  { id: "ask", title: "The Ask", placeholder: "What are you asking for?", icon: <VolunteerActivismOutlinedIcon />, accentColor: "#6366F1" },
];

const PitchCanvasLayout: FC<PitchCanvasLayoutProps> = ({
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
          header: "Flusso Pitch Deck",
          subtitle: "Struttura la tua presentazione per investitori slide per slide",
        }
      : {
          header: "Pitch Deck Flow",
          subtitle: "Structure your investor presentation slide by slide",
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
          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
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

      {/* Grid of pitch sections - 4 columns, 3 rows */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
      >
        {PITCH_SECTIONS.map((section, index) => (
          <Box
            key={section.id}
            sx={{
              borderRight: (index + 1) % 4 !== 0 ? "1px solid #D1D5DB" : "none",
              borderBottom: index < 8 ? "1px solid #D1D5DB" : "none",
            }}
          >
            {/* Section number badge */}
            <Box
              sx={{
                px: 2,
                pt: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "6px",
                  bgcolor: `${section.accentColor}14`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${section.accentColor}30`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: section.accentColor,
                  }}
                >
                  {index + 1}
                </Typography>
              </Box>
            </Box>
            <CanvasSection
              title={section.title}
              placeholder={section.placeholder}
              icon={section.icon}
              accentColor={section.accentColor}
              items={getItems(section.id)}
              onAddItem={handleAddItem(section.id)}
              onUpdateItem={handleUpdateItem(section.id)}
              onDeleteItem={handleDeleteItem(section.id)}
              onGenerateAI={handleGenerateAI(section.id)}
              aiSuggestions={getAISuggestions(section.id)}
              isLoadingAI={isLoadingAI(section.id)}
              onDismissAISuggestions={handleDismissAI(section.id)}
              sx={{ pt: 1 }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PitchCanvasLayout;
