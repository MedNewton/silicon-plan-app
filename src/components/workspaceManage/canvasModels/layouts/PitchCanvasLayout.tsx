"use client";

import type { FC } from "react";
import { Box, Typography } from "@mui/material";
import CanvasSection, { type CanvasSectionItem, type AiSuggestion } from "../CanvasSection";
import type { CanvasSectionsData } from "@/types/workspaces";

export type PitchCanvasLayoutProps = Readonly<{
  sectionsData?: CanvasSectionsData;
  onAddItem?: (sectionId: string) => (item: { title: string; description: string }) => void;
  onUpdateItem?: (sectionId: string) => (item: CanvasSectionItem) => void;
  onDeleteItem?: (sectionId: string) => (itemId: string) => void;
  onGenerateAI?: (sectionId: string) => () => void;
  aiSuggestions?: Record<string, AiSuggestion[]>;
  loadingAISections?: string[];
  onDismissAISuggestions?: (sectionId: string) => void;
}>;

const PITCH_SECTIONS = [
  { id: "hook", title: "Hook", placeholder: "What's your attention-grabbing opening?", color: "#E4F4F2" },
  { id: "problem", title: "Problem", placeholder: "What problem are you solving?", color: "#F7E1E1" },
  { id: "solution", title: "Solution", placeholder: "How do you solve this problem?", color: "#E4F4F2" },
  { id: "product", title: "Product Demo", placeholder: "How does your product work?", color: "#EAF3D9" },
  { id: "market", title: "Market Size", placeholder: "How big is the opportunity?", color: "#F1E5F6" },
  { id: "gtm", title: "Go-to-Market", placeholder: "How will you reach customers?", color: "#E3E9FA" },
  { id: "traction", title: "Traction", placeholder: "What progress have you made?", color: "#E4F4F2" },
  { id: "business-model", title: "Business Model", placeholder: "How do you make money?", color: "#EAF3D9" },
  { id: "competition", title: "Competition", placeholder: "Who are your competitors?", color: "#F7E1E1" },
  { id: "team", title: "Team", placeholder: "Who is on your team?", color: "#F1E5F6" },
  { id: "financials", title: "Financials", placeholder: "What are your projections?", color: "#E3E9FA" },
  { id: "ask", title: "The Ask", placeholder: "What are you asking for?", color: "#E4F4F2" },
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
          bgcolor: "#F1E5F6",
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
          Pitch Deck Flow
        </Typography>
        <Typography
          sx={{
            fontSize: 12,
            color: "#6B7280",
            mt: 0.5,
          }}
        >
          Structure your investor presentation slide by slide
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
              borderRight: (index + 1) % 4 !== 0 ? "1px solid #E5E7EB" : "none",
              borderBottom: index < 8 ? "1px solid #E5E7EB" : "none",
            }}
          >
            {/* Section number badge */}
            <Box
              sx={{
                px: 2,
                pt: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: section.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  {index + 1}
                </Typography>
              </Box>
            </Box>
            <CanvasSection
              title={section.title}
              placeholder={section.placeholder}
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
