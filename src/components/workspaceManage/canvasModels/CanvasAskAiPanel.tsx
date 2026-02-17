// src/components/workspaceManage/canvasModels/CanvasAskAiPanel.tsx
"use client";

import type { FC } from "react";
import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CheckIcon from "@mui/icons-material/Check";
import { toast } from "react-toastify";
import type {
  WorkspaceCanvasTemplateType,
  CanvasSectionsData,
  CanvasSectionItem,
} from "@/types/workspaces";
import type { AiSuggestion } from "./CanvasSection";
import { useLanguage } from "@/components/i18n/LanguageProvider";

// Section label mapping per template type
const SECTION_LABELS: Record<string, Record<string, string>> = {
  "business-model": {
    "key-partners": "Key Partners",
    "key-activities": "Key Activities",
    "key-resources": "Key Resources",
    "value-proposition": "Value Proposition",
    "customer-relationships": "Customer Relationships",
    "channels": "Channels",
    "customer-segments": "Customer Segments",
    "cost-structure": "Cost Structure",
    "revenue-streams": "Revenue Streams",
  },
  lean: {
    problem: "Problem",
    solution: "Solution",
    "unique-value-proposition": "Unique Value Proposition",
    "unfair-advantage": "Unfair Advantage",
    "customer-segments": "Customer Segments",
    "key-metrics": "Key Metrics",
    channels: "Channels",
    "cost-structure": "Cost Structure",
    "revenue-streams": "Revenue Streams",
  },
  startup: {
    problem: "Problem",
    solution: "Solution",
    "customer-segments": "Customer Segments",
    "unique-value-proposition": "Unique Value Proposition",
    "unfair-advantage": "Unfair Advantage",
    channels: "Channels",
    "key-metrics": "Key Metrics",
    "cost-structure": "Cost Structure",
    "revenue-streams": "Revenue Streams",
  },
  "value-proposition": {
    "products-services": "Products & Services",
    "pain-relievers": "Pain Relievers",
    "gain-creators": "Gain Creators",
    "customer-jobs": "Customer Jobs",
    pains: "Pains",
    gains: "Gains",
  },
  pitch: {
    problem: "Problem",
    solution: "Solution",
    "market-size": "Market Size",
    "business-model": "Business Model",
    traction: "Traction",
    team: "Team",
    competition: "Competition",
    financials: "Financials",
    ask: "Ask",
  },
  "four-quarters": {
    "q1-objectives": "Q1 Objectives",
    "q1-milestones": "Q1 Milestones",
    "q1-metrics": "Q1 Metrics",
    "q1-risks": "Q1 Risks",
    "q2-objectives": "Q2 Objectives",
    "q2-milestones": "Q2 Milestones",
    "q2-metrics": "Q2 Metrics",
    "q2-risks": "Q2 Risks",
    "q3-objectives": "Q3 Objectives",
    "q3-milestones": "Q3 Milestones",
    "q3-metrics": "Q3 Metrics",
    "q3-risks": "Q3 Risks",
    "q4-objectives": "Q4 Objectives",
    "q4-milestones": "Q4 Milestones",
    "q4-metrics": "Q4 Metrics",
    "q4-risks": "Q4 Risks",
  },
};

const getSectionIds = (templateType: WorkspaceCanvasTemplateType): string[] => {
  return Object.keys(SECTION_LABELS[templateType] ?? {});
};

const SECTION_LABELS_IT: Record<string, Record<string, string>> = {
  "business-model": {
    "key-partners": "Partner chiave",
    "key-activities": "Attivita chiave",
    "key-resources": "Risorse chiave",
    "value-proposition": "Proposta di valore",
    "customer-relationships": "Relazioni con i clienti",
    channels: "Canali",
    "customer-segments": "Segmenti clienti",
    "cost-structure": "Struttura costi",
    "revenue-streams": "Flussi di ricavi",
  },
  lean: {
    problem: "Problema",
    solution: "Soluzione",
    "unique-value-proposition": "Proposta di valore unica",
    "unfair-advantage": "Vantaggio competitivo",
    "customer-segments": "Segmenti clienti",
    "key-metrics": "Metriche chiave",
    channels: "Canali",
    "cost-structure": "Struttura costi",
    "revenue-streams": "Flussi di ricavi",
  },
  startup: {
    problem: "Problema",
    solution: "Soluzione",
    "customer-segments": "Segmenti clienti",
    "unique-value-proposition": "Proposta di valore unica",
    "unfair-advantage": "Vantaggio competitivo",
    channels: "Canali",
    "key-metrics": "Metriche chiave",
    "cost-structure": "Struttura costi",
    "revenue-streams": "Flussi di ricavi",
  },
  "value-proposition": {
    "products-services": "Prodotti e servizi",
    "pain-relievers": "Riduttori di pain",
    "gain-creators": "Generatori di gain",
    "customer-jobs": "Customer jobs",
    pains: "Pain",
    gains: "Gain",
  },
  pitch: {
    problem: "Problema",
    solution: "Soluzione",
    "market-size": "Dimensione mercato",
    "business-model": "Modello di business",
    traction: "Traction",
    team: "Team",
    competition: "Concorrenza",
    financials: "Finanze",
    ask: "Richiesta",
  },
  "four-quarters": {
    "q1-objectives": "Obiettivi Q1",
    "q1-milestones": "Milestone Q1",
    "q1-metrics": "Metriche Q1",
    "q1-risks": "Rischi Q1",
    "q2-objectives": "Obiettivi Q2",
    "q2-milestones": "Milestone Q2",
    "q2-metrics": "Metriche Q2",
    "q2-risks": "Rischi Q2",
    "q3-objectives": "Obiettivi Q3",
    "q3-milestones": "Milestone Q3",
    "q3-metrics": "Metriche Q3",
    "q3-risks": "Rischi Q3",
    "q4-objectives": "Obiettivi Q4",
    "q4-milestones": "Milestone Q4",
    "q4-metrics": "Metriche Q4",
    "q4-risks": "Rischi Q4",
  },
};

export type CanvasAskAiPanelProps = {
  workspaceId: string;
  templateType: WorkspaceCanvasTemplateType;
  sectionsData: CanvasSectionsData;
  onAddItem: (sectionId: string) => (item: Omit<CanvasSectionItem, "id">) => Promise<void>;
  onClose: () => void;
};

const CanvasAskAiPanel: FC<CanvasAskAiPanelProps> = ({
  workspaceId,
  templateType,
  sectionsData,
  onAddItem,
  onClose,
}) => {
  const { locale } = useLanguage();
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [allSuggestions, setAllSuggestions] = useState<Record<string, AiSuggestion[]>>({});

  const labelsByTemplate = locale === "it" ? SECTION_LABELS_IT : SECTION_LABELS;
  const copy =
    locale === "it"
      ? {
          generatedSuggestions: "Generati {count} suggerimenti",
          generatedAllSuggestions: "Generati {count} suggerimenti in tutte le sezioni",
          failedGenerate: "Impossibile generare suggerimenti AI",
          failedGenerateSome: "Impossibile generare suggerimenti per alcune sezioni",
          itemAdded: "Elemento aggiunto alla sezione",
          askAi: "Chiedi all'AI",
          generateCanvasContent: "Genera contenuto canvas",
          aiSuggestionsSubtitle: "Suggerimenti AI per le sezioni del canvas",
          selectSection: "Seleziona sezione",
          items: "elementi",
          currentItems: "Elementi correnti",
          noItems: "Nessun elemento",
          draft: "BOZZA",
          generating: "Generazione...",
          generateForSection: "Genera per sezione",
          aiSuggestions: "Suggerimenti AI",
          dismiss: "Chiudi",
          clickToAdd: "Clicca un suggerimento per aggiungerlo",
          generatingAll: "Generazione completa...",
          generateAllSections: "Genera tutte le sezioni",
        }
      : {
          generatedSuggestions: "Generated {count} suggestions",
          generatedAllSuggestions: "Generated {count} suggestions across all sections",
          failedGenerate: "Failed to generate AI suggestions",
          failedGenerateSome: "Failed to generate suggestions for some sections",
          itemAdded: "Item added to section",
          askAi: "Ask AI",
          generateCanvasContent: "Generate Canvas Content",
          aiSuggestionsSubtitle: "AI-powered suggestions for your canvas sections",
          selectSection: "Select Section",
          items: "items",
          currentItems: "Current Items",
          noItems: "No items yet",
          draft: "Draft",
          generating: "Generating...",
          generateForSection: "Generate for Section",
          aiSuggestions: "AI Suggestions",
          dismiss: "Dismiss",
          clickToAdd: "Click a suggestion to add it",
          generatingAll: "Generating All...",
          generateAllSections: "Generate All Sections",
        };

  const sectionLabelFor = (sectionId: string): string =>
    labelsByTemplate[templateType]?.[sectionId] ?? sectionId;

  const sectionIds = getSectionIds(templateType);

  const handleGenerateForSection = useCallback(
    async (sectionId: string) => {
      if (!sectionId) return;
      setIsLoading(true);
      setSuggestions([]);

      try {
        const existingItems = sectionsData[sectionId] ?? [];

        const response = await fetch(
          `/api/workspaces/${workspaceId}/canvas-models/ai-suggest`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sectionId,
              templateType,
              existingItems: existingItems.map((item: CanvasSectionItem) => ({
                title: item.title,
                description: item.description,
              })),
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to generate AI suggestions");
        }

        const data = (await response.json()) as { suggestions?: AiSuggestion[] };
        const newSuggestions = data.suggestions ?? [];
        setSuggestions(newSuggestions);
        setAllSuggestions((prev) => ({ ...prev, [sectionId]: newSuggestions }));
        toast.success(copy.generatedSuggestions.replace("{count}", String(newSuggestions.length)));
      } catch (err) {
        console.error("AI suggestion error:", err);
        toast.error(copy.failedGenerate);
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceId, templateType, sectionsData, copy.generatedSuggestions, copy.failedGenerate]
  );

  const handleGenerateAll = useCallback(async () => {
    if (isGeneratingAll) return;
    setIsGeneratingAll(true);

    try {
      const results = await Promise.allSettled(
        sectionIds.map(async (sectionId) => {
          const existingItems = sectionsData[sectionId] ?? [];

          const response = await fetch(
            `/api/workspaces/${workspaceId}/canvas-models/ai-suggest`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sectionId,
                templateType,
                existingItems: existingItems.map((item: CanvasSectionItem) => ({
                  title: item.title,
                  description: item.description,
                })),
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed for ${sectionId}`);
          }

          const data = (await response.json()) as { suggestions?: AiSuggestion[] };
          return { sectionId, suggestions: data.suggestions ?? [] };
        })
      );

      const newAllSuggestions: Record<string, AiSuggestion[]> = {};
      let totalCount = 0;
      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value.suggestions.length > 0) {
          newAllSuggestions[result.value.sectionId] = result.value.suggestions;
          totalCount += result.value.suggestions.length;
        }
      });

      setAllSuggestions(newAllSuggestions);
      if (selectedSection && newAllSuggestions[selectedSection]) {
        setSuggestions(newAllSuggestions[selectedSection]);
      }
      toast.success(copy.generatedAllSuggestions.replace("{count}", String(totalCount)));
    } catch (err) {
      console.error("Error generating all AI suggestions:", err);
      toast.error(copy.failedGenerateSome);
    } finally {
      setIsGeneratingAll(false);
    }
  }, [
    isGeneratingAll,
    sectionIds,
    sectionsData,
    workspaceId,
    templateType,
    selectedSection,
    copy.generatedAllSuggestions,
    copy.failedGenerateSome,
  ]);

  const handleSelectSuggestion = async (suggestion: AiSuggestion) => {
    if (!selectedSection) return;
    await onAddItem(selectedSection)({
      title: suggestion.title,
      description: suggestion.description,
      generation_status: "draft",
    });
    // Remove the used suggestion from the list
    setSuggestions((prev) => prev.filter((s) => s !== suggestion));
    toast.success(copy.itemAdded);
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
    setSuggestions(allSuggestions[sectionId] ?? []);
  };

  return (
    <Box
      sx={{
        width: 320,
        borderRight: "1px solid #E5E7EB",
        bgcolor: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: "#EEF2FF",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoFixHighRoundedIcon sx={{ color: "#4C6AD2", fontSize: 20 }} />
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1E3A8A" }}>
            {copy.askAi}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#6B7280" }}>
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Subtitle */}
      <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid #EEF2F7", bgcolor: "#FFFFFF" }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#1E293B" }}>
          {copy.generateCanvasContent}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: "#64748B" }}>
          {copy.aiSuggestionsSubtitle}
        </Typography>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 2,
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Section selector */}
        <FormControl fullWidth size="small">
          <InputLabel sx={{ fontSize: 13 }}>{copy.selectSection}</InputLabel>
          <Select
            value={selectedSection}
            label={copy.selectSection}
            onChange={(e) => handleSectionChange(e.target.value)}
            sx={{
              fontSize: 13,
              borderRadius: 1.5,
              bgcolor: "#FFFFFF",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#E5E7EB",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#D1D5DB",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#4C6AD2",
              },
            }}
          >
            {sectionIds.map((id) => (
              <MenuItem key={id} value={id} sx={{ fontSize: 13 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontSize: 13 }}>
                    {sectionLabelFor(id)}
                  </Typography>
                  {(sectionsData[id]?.length ?? 0) > 0 && (
                    <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
                      ({sectionsData[id]?.length} {copy.items})
                    </Typography>
                  )}
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Current section items */}
        {selectedSection && (
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mb: 0.75 }}>
              {copy.currentItems} ({(sectionsData[selectedSection] ?? []).length})
            </Typography>
            {(sectionsData[selectedSection] ?? []).length === 0 ? (
              <Typography sx={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>
                {copy.noItems}
              </Typography>
            ) : (
              <Stack spacing={0.5}>
                {(sectionsData[selectedSection] ?? []).map((item: CanvasSectionItem) => (
                  <Box
                    key={item.id}
                    sx={{
                      bgcolor: "#FFFFFF",
                      borderRadius: 1,
                      border: "1px solid #E5E7EB",
                      px: 1.5,
                      py: 0.75,
                    }}
                  >
                    <Stack direction="row" spacing={0.7} alignItems="center">
                      <Typography sx={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 500, color: "#111827" }}>
                        {item.title}
                      </Typography>
                      {(item.generation_status ?? "final") === "draft" && (
                        <Typography
                          sx={{
                            fontSize: 10,
                            fontWeight: 700,
                            px: 0.6,
                            py: 0.15,
                            borderRadius: 999,
                            bgcolor: "rgba(245, 158, 11, 0.16)",
                            color: "#92400E",
                            textTransform: "uppercase",
                            letterSpacing: 0.25,
                          }}
                        >
                          {copy.draft}
                        </Typography>
                      )}
                    </Stack>
                    {item.description && (
                      <Typography sx={{ fontSize: 11, color: "#6B7280" }}>
                        {item.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {/* Generate button */}
        <Button
          variant="contained"
          onClick={() => void handleGenerateForSection(selectedSection)}
          disabled={!selectedSection || isLoading}
          startIcon={
            isLoading ? (
              <CircularProgress size={16} sx={{ color: "#FFFFFF" }} />
            ) : (
              <AutoAwesomeOutlinedIcon sx={{ fontSize: 16 }} />
            )
          }
          sx={{
            bgcolor: "#4C6AD2",
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 2,
            py: 1,
            "&:hover": { bgcolor: "#3B5AC5" },
            "&:disabled": { bgcolor: "#A5B4FC", color: "#FFFFFF" },
          }}
        >
          {isLoading ? copy.generating : copy.generateForSection}
        </Button>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Stack direction="row" spacing={0.5} alignItems="center">
                <AutoAwesomeOutlinedIcon sx={{ fontSize: 14, color: "#4C6AD2" }} />
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#4C6AD2" }}>
                  {copy.aiSuggestions} ({suggestions.length})
                </Typography>
              </Stack>
              <Button
                size="small"
                onClick={() => setSuggestions([])}
                sx={{ fontSize: 10, color: "#6B7280", textTransform: "none", minWidth: 0 }}
              >
                {copy.dismiss}
              </Button>
            </Stack>
            <Stack spacing={0.75}>
              {suggestions.map((suggestion, index) => (
                <Box
                  key={index}
                  onClick={() => void handleSelectSuggestion(suggestion)}
                  sx={{
                    bgcolor: "#F0F4FF",
                    borderRadius: 1.5,
                    border: "1px solid #C2D0F7",
                    p: 1.5,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: "#4C6AD2",
                      bgcolor: "#E8EDFF",
                    },
                  }}
                >
                  <Stack direction="row" spacing={0.5} alignItems="flex-start">
                    <CheckIcon sx={{ fontSize: 14, color: "#4C6AD2", mt: 0.2 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#111827" }}>
                        {suggestion.title}
                      </Typography>
                      {suggestion.description && (
                        <Typography sx={{ fontSize: 11, color: "#6B7280", mt: 0.25 }}>
                          {suggestion.description}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>
              ))}
              <Typography sx={{ fontSize: 10, color: "#9CA3AF", textAlign: "center" }}>
                {copy.clickToAdd}
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>

      {/* Footer - Generate All */}
      <Box
        sx={{
          px: 2,
          py: 2,
          borderTop: "1px solid #E5E7EB",
          bgcolor: "#FFFFFF",
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          onClick={() => void handleGenerateAll()}
          disabled={isGeneratingAll || isLoading}
          startIcon={
            isGeneratingAll ? (
              <CircularProgress size={16} sx={{ color: "#4C6AD2" }} />
            ) : (
              <AutoAwesomeOutlinedIcon sx={{ fontSize: 16 }} />
            )
          }
          sx={{
            borderColor: "#E5E7EB",
            color: "#4C6AD2",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 2,
            py: 1,
            "&:hover": {
              borderColor: "#4C6AD2",
              bgcolor: "rgba(76,106,210,0.04)",
            },
            "&:disabled": {
              borderColor: "#E5E7EB",
              color: "#A5B4FC",
            },
          }}
        >
          {isGeneratingAll ? copy.generatingAll : copy.generateAllSections}
        </Button>
      </Box>
    </Box>
  );
};

export default CanvasAskAiPanel;
