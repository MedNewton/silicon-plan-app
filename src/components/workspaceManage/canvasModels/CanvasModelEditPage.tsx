"use client";

import type { FC } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Typography, Stack, Button, CircularProgress, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

import ManageSidebar from "@/components/workspaceManage/business-plan/ManageSidebar";
import ExportSettingsSidebar from "./ExportSettingsSidebar";
import type { AiSuggestion } from "./CanvasSection";
import {
  BusinessModelCanvasLayout,
  FourQuartersCanvasLayout,
  ValuePropositionCanvasLayout,
  PitchCanvasLayout,
  StartupCanvasLayout,
  LeanCanvasLayout,
} from "./layouts";
import type {
  WorkspaceCanvasModel,
  WorkspaceCanvasTemplateType,
  CanvasSectionsData,
  CanvasSectionItem,
} from "@/types/workspaces";

export type CanvasModelEditPageProps = Readonly<{
  workspaceId: string;
  canvasId: string;
}>;

const CanvasModelEditPage: FC<CanvasModelEditPageProps> = ({
  workspaceId,
  canvasId,
}) => {
  const router = useRouter();
  const [canvas, setCanvas] = useState<WorkspaceCanvasModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExportSidebar, setShowExportSidebar] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AiSuggestion[]>>({});
  const [loadingAISections, setLoadingAISections] = useState<string[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const canvasLayoutRef = useRef<HTMLDivElement>(null);

  // Load canvas data
  useEffect(() => {
    const loadCanvas = async () => {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/canvas-models/${canvasId}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Canvas not found");
          } else {
            setError("Failed to load canvas");
          }
          return;
        }

        const data = await response.json();
        setCanvas(data.canvasModel);
        setEditedTitle(data.canvasModel.title);
      } catch (err) {
        console.error("Error loading canvas:", err);
        setError("Failed to load canvas");
      } finally {
        setIsLoading(false);
      }
    };

    loadCanvas();
  }, [workspaceId, canvasId]);

  // Save canvas data
  const saveCanvas = useCallback(
    async (updates: { title?: string; sectionsData?: CanvasSectionsData }) => {
      if (!canvas) return;

      setIsSaving(true);
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/canvas-models/${canvasId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to save canvas");
        }

        const data = await response.json();
        setCanvas(data.canvasModel);
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error("Error saving canvas:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [canvas, workspaceId, canvasId]
  );

  const handleBack = () => {
    router.push(`/workspaces/${workspaceId}/manage/canvas-models/my-models`);
  };

  const handleDownloadClick = () => {
    setShowExportSidebar(!showExportSidebar);
  };

  const handleSaveModel = async () => {
    if (!canvas) return;
    await saveCanvas({ sectionsData: canvas.sections_data });
  };

  const handleTitleSave = async () => {
    if (editedTitle.trim() && editedTitle !== canvas?.title) {
      await saveCanvas({ title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleAddItem = (sectionId: string) => async (item: { title: string; description: string }) => {
    if (!canvas) return;

    const newItem: CanvasSectionItem = {
      id: crypto.randomUUID(),
      title: item.title,
      description: item.description,
    };

    const currentSections = canvas.sections_data || {};
    const currentItems = (currentSections[sectionId] || []) as CanvasSectionItem[];
    const updatedSections: CanvasSectionsData = {
      ...currentSections,
      [sectionId]: [...currentItems, newItem],
    };

    // Optimistically update UI
    setCanvas({
      ...canvas,
      sections_data: updatedSections,
    });
    setHasUnsavedChanges(true);

    // Auto-save to server
    await saveCanvas({ sectionsData: updatedSections });
  };

  const handleUpdateItem = (sectionId: string) => async (updatedItem: CanvasSectionItem) => {
    if (!canvas) return;

    const currentSections = canvas.sections_data || {};
    const currentItems = (currentSections[sectionId] || []) as CanvasSectionItem[];
    const updatedItems = currentItems.map((item) =>
      item.id === updatedItem.id ? updatedItem : item
    );
    const updatedSections: CanvasSectionsData = {
      ...currentSections,
      [sectionId]: updatedItems,
    };

    // Optimistically update UI
    setCanvas({
      ...canvas,
      sections_data: updatedSections,
    });
    setHasUnsavedChanges(true);

    // Auto-save to server
    await saveCanvas({ sectionsData: updatedSections });
  };

  const handleDeleteItem = (sectionId: string) => async (itemId: string) => {
    if (!canvas) return;

    const currentSections = canvas.sections_data || {};
    const currentItems = (currentSections[sectionId] || []) as CanvasSectionItem[];
    const updatedItems = currentItems.filter((item) => item.id !== itemId);
    const updatedSections: CanvasSectionsData = {
      ...currentSections,
      [sectionId]: updatedItems,
    };

    // Optimistically update UI
    setCanvas({
      ...canvas,
      sections_data: updatedSections,
    });
    setHasUnsavedChanges(true);

    // Auto-save to server
    await saveCanvas({ sectionsData: updatedSections });
  };

  const handleGenerateAI = (sectionId: string) => async () => {
    if (!canvas) return;

    // Add section to loading state
    setLoadingAISections((prev) => [...prev, sectionId]);

    try {
      const currentSections = canvas.sections_data || {};
      const existingItems = (currentSections[sectionId] || []) as CanvasSectionItem[];

      const response = await fetch(
        `/api/workspaces/${workspaceId}/canvas-models/ai-suggest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sectionId,
            templateType: canvas.template_type,
            existingItems: existingItems.map((item) => ({
              title: item.title,
              description: item.description,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate AI suggestions");
      }

      const data = await response.json();
      setAiSuggestions((prev) => ({
        ...prev,
        [sectionId]: data.suggestions || [],
      }));
    } catch (err) {
      console.error("Error generating AI suggestions:", err);
    } finally {
      setLoadingAISections((prev) => prev.filter((id) => id !== sectionId));
    }
  };

  const handleDismissAISuggestions = (sectionId: string) => {
    setAiSuggestions((prev) => {
      const newSuggestions = { ...prev };
      delete newSuggestions[sectionId];
      return newSuggestions;
    });
  };

  // Get all section IDs for a template type
  const getSectionIdsForTemplate = (templateType: WorkspaceCanvasTemplateType): string[] => {
    switch (templateType) {
      case "business-model":
        return [
          "key-partners",
          "key-activities",
          "key-resources",
          "value-proposition",
          "customer-relationships",
          "channels",
          "customer-segments",
          "cost-structure",
          "revenue-streams",
        ];
      case "lean":
        return [
          "problem",
          "solution",
          "unique-value-proposition",
          "unfair-advantage",
          "customer-segments",
          "key-metrics",
          "channels",
          "cost-structure",
          "revenue-streams",
        ];
      case "startup":
        return [
          "problem",
          "solution",
          "customer-segments",
          "unique-value-proposition",
          "unfair-advantage",
          "channels",
          "key-metrics",
          "cost-structure",
          "revenue-streams",
        ];
      case "four-quarters":
        return [
          "q1-objectives",
          "q1-milestones",
          "q1-metrics",
          "q1-risks",
          "q2-objectives",
          "q2-milestones",
          "q2-metrics",
          "q2-risks",
          "q3-objectives",
          "q3-milestones",
          "q3-metrics",
          "q3-risks",
          "q4-objectives",
          "q4-milestones",
          "q4-metrics",
          "q4-risks",
        ];
      case "value-proposition":
        return [
          "products-services",
          "pain-relievers",
          "gain-creators",
          "customer-jobs",
          "pains",
          "gains",
        ];
      case "pitch":
        return [
          "problem",
          "solution",
          "market-size",
          "business-model",
          "traction",
          "team",
          "competition",
          "financials",
          "ask",
        ];
      default:
        return [];
    }
  };

  // Generate AI suggestions for all sections
  const handleGenerateAllAI = async () => {
    if (!canvas || isGeneratingAll) return;

    const templateType = canvas.template_type as WorkspaceCanvasTemplateType;
    const sectionIds = getSectionIdsForTemplate(templateType);

    if (sectionIds.length === 0) return;

    setIsGeneratingAll(true);
    setLoadingAISections(sectionIds);

    try {
      const currentSections = canvas.sections_data || {};

      // Generate suggestions for all sections in parallel
      const results = await Promise.allSettled(
        sectionIds.map(async (sectionId) => {
          const existingItems = (currentSections[sectionId] || []) as CanvasSectionItem[];

          const response = await fetch(
            `/api/workspaces/${workspaceId}/canvas-models/ai-suggest`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sectionId,
                templateType: canvas.template_type,
                existingItems: existingItems.map((item) => ({
                  title: item.title,
                  description: item.description,
                })),
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to generate AI suggestions for ${sectionId}`);
          }

          const data = await response.json();
          return { sectionId, suggestions: data.suggestions || [] };
        })
      );

      // Collect all successful suggestions
      const newSuggestions: Record<string, AiSuggestion[]> = {};
      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value.suggestions.length > 0) {
          newSuggestions[result.value.sectionId] = result.value.suggestions;
        }
      });

      setAiSuggestions(newSuggestions);
    } catch (err) {
      console.error("Error generating AI suggestions for all sections:", err);
    } finally {
      setIsGeneratingAll(false);
      setLoadingAISections([]);
    }
  };

  // Render the appropriate canvas layout based on template type
  const renderCanvasLayout = () => {
    if (!canvas) return null;

    const templateType = canvas.template_type as WorkspaceCanvasTemplateType;
    const sectionsData = canvas.sections_data || {};

    const commonProps = {
      sectionsData,
      onAddItem: handleAddItem,
      onUpdateItem: handleUpdateItem,
      onDeleteItem: handleDeleteItem,
      onGenerateAI: handleGenerateAI,
      aiSuggestions,
      loadingAISections,
      onDismissAISuggestions: handleDismissAISuggestions,
    };

    switch (templateType) {
      case "business-model":
        return <BusinessModelCanvasLayout {...commonProps} />;
      case "four-quarters":
        return <FourQuartersCanvasLayout {...commonProps} />;
      case "value-proposition":
        return <ValuePropositionCanvasLayout {...commonProps} />;
      case "pitch":
        return <PitchCanvasLayout {...commonProps} />;
      case "startup":
        return <StartupCanvasLayout {...commonProps} />;
      case "lean":
        return <LeanCanvasLayout {...commonProps} />;
      default:
        return <BusinessModelCanvasLayout {...commonProps} />;
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#F3F4FB",
        }}
      >
        <CircularProgress sx={{ color: "#4C6AD2" }} />
      </Box>
    );
  }

  if (error || !canvas) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#F3F4FB",
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: 18, color: "#6B7280" }}>
          {error || "Canvas not found"}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => router.push(`/workspaces/${workspaceId}/manage/canvas-models`)}
          sx={{ borderColor: "#4C6AD2", color: "#4C6AD2" }}
        >
          Back to Canvas Models
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        height: "100vh",
        maxHeight: "100vh",
        display: "flex",
        bgcolor: "#F3F4FB",
      }}
    >
      {/* Left sidebar */}
      <ManageSidebar workspaceId={workspaceId} activeItem="canvas-models" />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#F9FAFF",
          minHeight: 0,
        }}
      >
        {/* Top header with actions */}
        <Box
          sx={{
            px: 3,
            py: 1.5,
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "#FFFFFF",
          }}
        >
          {/* Left side - Back button */}
          <Box
            onClick={handleBack}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              color: "#6B7280",
              "&:hover": {
                color: "#374151",
              },
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Back</Typography>
          </Box>

          {/* Center - SAVE MODEL and DOWNLOAD buttons */}
          <Stack direction="row" spacing={2} alignItems="center">
            {isSaving && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "#9CA3AF" }}>
                <CircularProgress size={16} sx={{ color: "#9CA3AF" }} />
                <Typography sx={{ fontSize: 12 }}>Saving...</Typography>
              </Stack>
            )}
            <Button
              variant="contained"
              startIcon={<SaveOutlinedIcon sx={{ fontSize: 18 }} />}
              onClick={handleSaveModel}
              disabled={isSaving}
              sx={{
                bgcolor: "#4C6AD2",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
                "&:hover": {
                  bgcolor: "#3B5AC5",
                },
                "&:disabled": {
                  bgcolor: "#9CA3AF",
                },
              }}
            >
              Save Model
            </Button>
            <Button
              variant="text"
              startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />}
              onClick={handleDownloadClick}
              sx={{
                color: "#374151",
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
                "&:hover": {
                  bgcolor: "rgba(0,0,0,0.04)",
                },
              }}
            >
              Download
            </Button>
          </Stack>

          {/* Right side - empty for balance */}
          <Box sx={{ width: 60 }} />
        </Box>

        {/* Secondary header with title and Generate With AI */}
        <Box
          sx={{
            px: 3,
            py: 1.5,
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "#FFFFFF",
          }}
        >
          {/* Title with edit icon */}
          {isEditingTitle ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                variant="standard"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTitleSave();
                  } else if (e.key === "Escape") {
                    setEditedTitle(canvas.title);
                    setIsEditingTitle(false);
                  }
                }}
                sx={{
                  minWidth: 200,
                  "& .MuiInputBase-input": {
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#111827",
                  },
                }}
              />
              <CheckIcon
                onClick={handleTitleSave}
                sx={{
                  fontSize: 20,
                  color: "#10B981",
                  cursor: "pointer",
                  "&:hover": { color: "#059669" },
                }}
              />
              <CloseIcon
                onClick={() => {
                  setEditedTitle(canvas.title);
                  setIsEditingTitle(false);
                }}
                sx={{
                  fontSize: 20,
                  color: "#EF4444",
                  cursor: "pointer",
                  "&:hover": { color: "#DC2626" },
                }}
              />
            </Stack>
          ) : (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              onClick={() => setIsEditingTitle(true)}
              sx={{ cursor: "pointer" }}
            >
              <EditOutlinedIcon sx={{ fontSize: 18, color: "#6B7280" }} />
              <Typography sx={{ fontSize: 15, fontWeight: 500, color: "#111827" }}>
                {canvas.title}
              </Typography>
            </Stack>
          )}

          {/* Generate With AI button */}
          <Button
            variant="outlined"
            onClick={handleGenerateAllAI}
            disabled={isGeneratingAll}
            startIcon={
              isGeneratingAll ? (
                <CircularProgress size={16} sx={{ color: "#4C6AD2" }} />
              ) : (
                <AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} />
              )
            }
            sx={{
              borderColor: "#E5E7EB",
              color: "#4C6AD2",
              fontSize: 13,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              px: 2,
              "&:hover": {
                borderColor: "#4C6AD2",
                bgcolor: "rgba(76,106,210,0.04)",
              },
              "&:disabled": {
                borderColor: "#E5E7EB",
                color: "#4C6AD2",
              },
            }}
          >
            {isGeneratingAll ? "Generating..." : "Generate With AI"}
          </Button>
        </Box>

        {/* Canvas content area */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            overflow: "hidden",
          }}
        >
          {/* Canvas grid */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 3,
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            <Box ref={canvasLayoutRef}>
              {renderCanvasLayout()}
            </Box>
          </Box>

          {/* Export Settings Sidebar */}
          {showExportSidebar && (
            <ExportSettingsSidebar
              canvasRef={canvasLayoutRef}
              canvasTitle={canvas?.title}
              onClose={() => setShowExportSidebar(false)}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CanvasModelEditPage;
