// src/components/workspaceManage/pitch-deck/PitchDeckEditor.tsx
"use client";

import type { FC } from "react";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Stack,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Menu,
  FormControlLabel,
  Switch,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import SettingsIcon from "@mui/icons-material/Settings";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "react-toastify";
import { usePitchDeck } from "./PitchDeckContext";
import SlidePreview, { type SlideEditTarget } from "./SlidePreview";
import SlideEditorModal from "./SlideEditorModal";
import SlideAiDrawer from "./SlideAiDrawer";
import PitchAskAiPanel from "./PitchAskAiPanel";
import { sanitizeFileName, downloadBlob } from "@/lib/pitchDeckExport";
import type { PitchDeckSlide, PitchDeckSettings, PitchDeckSlideContent } from "@/types/workspaces";
import { fetchWorkspaceBranding, fetchImageAsDataUrl } from "@/lib/workspaceBranding";

type PitchDeckEditorProps = {
  workspaceId: string;
};

// Sortable slide item
const SortableSlideItem: FC<{
  slide: PitchDeckSlide;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}> = ({ slide, isSelected, onSelect, onDelete, onDuplicate }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1.5,
        borderRadius: 2,
        border: isSelected ? "2px solid #4C6AD2" : "1px solid #E5E7EB",
        bgcolor: isSelected ? "#F0F4FF" : "#FFFFFF",
        cursor: "pointer",
        transition: "all 0.15s",
        "&:hover": {
          borderColor: "#4C6AD2",
          "& .slide-actions": { opacity: 1 },
        },
      }}
    >
      <Box {...attributes} {...listeners} sx={{ cursor: "grab", color: "#9CA3AF" }}>
        <DragIndicatorIcon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 500,
            color: "#111827",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {slide.title}
        </Typography>
        <Typography sx={{ fontSize: 11, color: "#9CA3AF", textTransform: "capitalize" }}>
          {slide.slide_type}
        </Typography>
      </Box>
      <Stack
        direction="row"
        spacing={0.5}
        className="slide-actions"
        sx={{ opacity: 0, transition: "opacity 0.15s" }}
      >
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          sx={{ p: 0.5 }}
        >
          <ContentCopyIcon sx={{ fontSize: 16, color: "#6B7280" }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          sx={{ p: 0.5 }}
        >
          <DeleteOutlineIcon sx={{ fontSize: 16, color: "#EF4444" }} />
        </IconButton>
      </Stack>
    </Box>
  );
};

const PitchDeckEditor: FC<PitchDeckEditorProps> = ({ workspaceId }) => {
  const router = useRouter();
  const {
    pitchDeck,
    slides,
    template,
    isLoading,
    error,
    selectedSlideId,
    setSelectedSlideId,
    updatePitchDeck,
    addSlide,
    updateSlide,
    deleteSlide,
    duplicateSlide,
    reorderSlides,
  } = usePitchDeck();

  const [showSettings, setShowSettings] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [aiTarget, setAiTarget] = useState<SlideEditTarget | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [includeBrandingExport, setIncludeBrandingExport] = useState(true);
  const [branding, setBranding] = useState<{
    workspaceName: string | null;
    workspaceLogoDataUrl: string | null;
  }>({
    workspaceName: null,
    workspaceLogoDataUrl: null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedSlide = slides.find((s) => s.id === selectedSlideId);

  useEffect(() => {
    let active = true;

    const loadBranding = async () => {
      const workspaceBranding = await fetchWorkspaceBranding(workspaceId);
      const logoDataUrl = await fetchImageAsDataUrl(workspaceBranding?.logoUrl ?? null);

      if (!active) return;

      setBranding({
        workspaceName: workspaceBranding?.workspaceName ?? null,
        workspaceLogoDataUrl: logoDataUrl,
      });
    };

    void loadBranding();

    return () => {
      active = false;
    };
  }, [workspaceId]);

  // Handle drag end for reordering
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(slides, oldIndex, newIndex).map((s) => s.id);
      void reorderSlides(newOrder);
    },
    [slides, reorderSlides]
  );

  // Handle add new slide
  const handleAddSlide = useCallback(async () => {
    await addSlide({
      title: `Slide ${slides.length + 1}`,
      slideType: "content",
      content: {
        type: "title_bullets",
        title: "New Slide",
        bullets: ["Point 1", "Point 2", "Point 3"],
      },
    });
  }, [addSlide, slides.length]);

  // Handle title edit
  const handleStartEditTitle = () => {
    setTitleValue(pitchDeck?.title ?? "");
    setEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (titleValue.trim() && titleValue !== pitchDeck?.title) {
      await updatePitchDeck({ title: titleValue.trim() });
    }
    setEditingTitle(false);
  };

  // Handle settings change
  const handleSettingsChange = async (key: keyof PitchDeckSettings, value: string | number) => {
    await updatePitchDeck({ settings: { [key]: value } });
  };

  const handleDownloadPptx = useCallback(async () => {
    if (!pitchDeck) return;
    setIsDownloading(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/pitch-deck/${pitchDeck.id}/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ includeBranding: includeBrandingExport }),
        }
      );
      if (!res.ok) {
        throw new Error("Failed to export pitch deck");
      }
      const blob = await res.blob();
      const safeName = sanitizeFileName(pitchDeck.title || "pitch-deck");
      downloadBlob(blob, `${safeName}.pptx`);
      toast.success("Exported as PPTX successfully");
    } catch (err) {
      console.error("Failed to download pitch deck:", err);
      toast.error("Failed to export. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [pitchDeck, workspaceId, includeBrandingExport]);

  const handleDownloadPdf = useCallback(async () => {
    if (!pitchDeck) return;
    setIsDownloading(true);
    try {
      // Dynamically import to avoid SSR issues
      const { exportPitchDeckToPdf } = await import("@/lib/pitchDeckExport");

      // Collect all slide preview elements from the DOM
      const slideElements = Array.from(
        document.querySelectorAll<HTMLElement>("[data-slide-export-preview]")
      );

      if (slideElements.length === 0) {
        // Fallback: try to capture the current preview
        const previewEl = document.querySelector<HTMLElement>("[data-slide-current-preview]");
        if (previewEl) {
          slideElements.push(previewEl);
        }
      }

      if (slideElements.length === 0) {
        throw new Error("No slide elements found to export");
      }

      const blob = await exportPitchDeckToPdf({
        title: pitchDeck.title || "pitch-deck",
        paperSize: pitchDeck.settings.paperSize,
        slideElements,
      });

      const safeName = sanitizeFileName(pitchDeck.title || "pitch-deck");
      downloadBlob(blob, `${safeName}.pdf`);
      toast.success("Exported as PDF successfully");
    } catch (err) {
      console.error("Failed to export PDF:", err);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [pitchDeck]);

  const handleDownload = useCallback(
    async (format: "pptx" | "pdf") => {
      const fmt = format;
      setExportMenuAnchor(null);
      if (fmt === "pdf") {
        await handleDownloadPdf();
      } else {
        await handleDownloadPptx();
      }
    },
    [handleDownloadPdf, handleDownloadPptx]
  );

  const handleAiRequest = useCallback((target: SlideEditTarget) => {
    setAiTarget(target);
    setIsAiOpen(true);
  }, []);

  const handleAiApply = useCallback(
    async (text: string) => {
      if (!aiTarget) return;
      const nextContent = aiTarget.apply(text);
      await updateSlide(aiTarget.slideId, { content: nextContent });
    },
    [aiTarget, updateSlide]
  );

  // Handler for the left-side AI panel
  const handleAiPanelApply = useCallback(
    async (slideId: string, content: PitchDeckSlideContent) => {
      await updateSlide(slideId, { content });
    },
    [updateSlide]
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={32} sx={{ color: "#4C6AD2" }} />
      </Box>
    );
  }

  if (error || !pitchDeck) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Typography sx={{ color: "#EF4444" }}>{error ?? "Pitch deck not found"}</Typography>
        <Button
          variant="outlined"
          onClick={() => router.push(`/workspaces/${workspaceId}/manage/pitch-deck`)}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#FFFFFF",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton
            onClick={() => router.push(`/workspaces/${workspaceId}/manage/pitch-deck`)}
            sx={{ color: "#6B7280" }}
          >
            <ArrowBackIcon />
          </IconButton>
          {editingTitle ? (
            <TextField
              size="small"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
              autoFocus
              sx={{ width: 300 }}
            />
          ) : (
            <Typography
              onClick={handleStartEditTitle}
              sx={{
                fontSize: 18,
                fontWeight: 600,
                color: "#111827",
                cursor: "pointer",
                "&:hover": { color: "#4C6AD2" },
              }}
            >
              {pitchDeck.title}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          <IconButton
            onClick={() => {
              setShowAiPanel(!showAiPanel);
              if (!showAiPanel) setShowSettings(false);
            }}
            sx={{
              color: showAiPanel ? "#4C6AD2" : "#6B7280",
              bgcolor: showAiPanel ? "#F0F4FF" : "transparent",
            }}
            title="Ask AI"
          >
            <AutoFixHighRoundedIcon />
          </IconButton>
          <IconButton
            onClick={() => {
              setShowSettings(!showSettings);
              if (!showSettings) setShowAiPanel(false);
            }}
            sx={{
              color: showSettings ? "#4C6AD2" : "#6B7280",
              bgcolor: showSettings ? "#F0F4FF" : "transparent",
            }}
          >
            <SettingsIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={isDownloading ? <CircularProgress size={16} sx={{ color: "#FFFFFF" }} /> : <DownloadIcon />}
            endIcon={<KeyboardArrowDownIcon />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            disabled={isDownloading}
            sx={{
              bgcolor: "#4C6AD2",
              "&:hover": { bgcolor: "#3D5ABF" },
              textTransform: "none",
            }}
          >
            {isDownloading ? "Preparing..." : "Download"}
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                sx: {
                  mt: 0.5,
                  borderRadius: 2,
                  minWidth: 180,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                },
              },
            }}
          >
            <MenuItem
              onClick={() => void handleDownload("pptx")}
              sx={{ fontSize: 14, gap: 1.5, py: 1.2 }}
            >
              <SlideshowOutlinedIcon sx={{ fontSize: 18, color: "#4C6AD2" }} />
              Download as PPTX
            </MenuItem>
            <MenuItem
              onClick={() => void handleDownload("pdf")}
              sx={{ fontSize: 14, gap: 1.5, py: 1.2 }}
            >
              <PictureAsPdfOutlinedIcon sx={{ fontSize: 18, color: "#EF4444" }} />
              Download as PDF
            </MenuItem>
          </Menu>
        </Stack>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Ask AI Panel */}
        {showAiPanel && (
          <PitchAskAiPanel
            workspaceId={workspaceId}
            selectedSlide={selectedSlide ?? null}
            onApply={handleAiPanelApply}
            onClose={() => setShowAiPanel(false)}
          />
        )}

        {/* Slides list */}
        <Box
          sx={{
            width: 280,
            borderRight: "1px solid #E5E7EB",
            bgcolor: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid #E5E7EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
              Slides
            </Typography>
            <IconButton size="small" onClick={handleAddSlide} sx={{ color: "#4C6AD2" }}>
              <AddIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={slides.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {slides.map((slide) => (
                  <SortableSlideItem
                    key={slide.id}
                    slide={slide}
                    isSelected={slide.id === selectedSlideId}
                    onSelect={() => setSelectedSlideId(slide.id)}
                    onDelete={() => deleteSlide(slide.id)}
                    onDuplicate={() => duplicateSlide(slide.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </Box>
        </Box>

        {/* Preview */}
        <Box
          sx={{
            flex: 1,
            bgcolor: "#F3F4FB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            overflow: "auto",
          }}
        >
          {selectedSlide ? (
            <Box
              data-slide-current-preview
              sx={{
                position: "relative",
                p: 1,
                borderRadius: 3,
                bgcolor: "rgba(148, 163, 184, 0.25)",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                maxWidth: "100%",
                width: "100%",
              }}
            >
              <SlidePreview
                slide={selectedSlide}
                template={template}
                paperSize={pitchDeck.settings.paperSize}
                onEditRequest={handleAiRequest}
                workspaceName={branding.workspaceName}
                workspaceLogoDataUrl={branding.workspaceLogoDataUrl}
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<EditOutlinedIcon />}
                onClick={() => setIsEditorOpen(true)}
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  bgcolor: "rgba(17, 24, 39, 0.85)",
                  "&:hover": { bgcolor: "rgba(17, 24, 39, 1)" },
                  textTransform: "none",
                }}
              >
                Edit Slide
              </Button>
            </Box>
          ) : (
            <Typography sx={{ color: "#9CA3AF" }}>Select a slide to preview</Typography>
          )}
        </Box>

        {/* Settings panel */}
        {showSettings ? (
          <Box
            sx={{
              width: 320,
              borderLeft: "1px solid #E5E7EB",
              bgcolor: "#F9FAFB",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                bgcolor: "#4F46E5",
                color: "#FFFFFF",
              }}
            >
              <Typography sx={{ fontSize: 16, fontWeight: 600, letterSpacing: 0.2 }}>
                Export Settings
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                px: 3,
                pt: 3,
                pb: 4,
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              <Stack spacing={2.5}>
                <Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#4B5563",
                      mb: 0.7,
                    }}
                  >
                    Paper Size
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={pitchDeck.settings.paperSize}
                      onChange={(e) => handleSettingsChange("paperSize", e.target.value)}
                      sx={{ borderRadius: 2, bgcolor: "#FFFFFF" }}
                    >
                      <MenuItem value="16:9">16:9 (Widescreen)</MenuItem>
                      <MenuItem value="4:3">4:3 (Standard)</MenuItem>
                      <MenuItem value="A4">A4</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#4B5563",
                      mb: 0.7,
                    }}
                  >
                    Font Family
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={pitchDeck.settings.fontFamily}
                      onChange={(e) => handleSettingsChange("fontFamily", e.target.value)}
                      sx={{ borderRadius: 2, bgcolor: "#FFFFFF" }}
                    >
                      <MenuItem value="Roboto">Roboto</MenuItem>
                      <MenuItem value="Inter">Inter</MenuItem>
                      <MenuItem value="Open Sans">Open Sans</MenuItem>
                      <MenuItem value="Lato">Lato</MenuItem>
                      <MenuItem value="Montserrat">Montserrat</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#4B5563",
                      mb: 0.7,
                    }}
                  >
                    Font Size
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={pitchDeck.settings.fontSize}
                      onChange={(e) => handleSettingsChange("fontSize", Number(e.target.value))}
                      sx={{ borderRadius: 2, bgcolor: "#FFFFFF" }}
                    >
                      <MenuItem value={12}>12 px</MenuItem>
                      <MenuItem value={14}>14 px</MenuItem>
                      <MenuItem value={15}>15 px</MenuItem>
                      <MenuItem value={16}>16 px</MenuItem>
                      <MenuItem value={18}>18 px</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includeBrandingExport}
                        onChange={(event) => setIncludeBrandingExport(event.target.checked)}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#4C6AD2",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                            bgcolor: "#4C6AD2",
                          },
                        }}
                      />
                    }
                    label="Include Branding"
                    sx={{
                      m: 0,
                      "& .MuiFormControlLabel-label": {
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#4B5563",
                      },
                    }}
                  />
                </Box>
              </Stack>
            </Box>

            <Box sx={{ px: 3, py: 2.5, borderTop: "1px solid #E5E7EB" }}>
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={isDownloading ? <CircularProgress size={16} sx={{ color: "#FFFFFF" }} /> : <SlideshowOutlinedIcon />}
                  onClick={() => { void handleDownloadPptx(); }}
                  disabled={isDownloading}
                  sx={{
                    textTransform: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    borderRadius: 999,
                    py: 1,
                    backgroundImage: "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: "none",
                      opacity: 0.96,
                      backgroundImage: "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
                    },
                  }}
                >
                  {isDownloading ? "Preparing..." : "Download PPTX"}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={isDownloading ? <CircularProgress size={16} sx={{ color: "#4C6AD2" }} /> : <PictureAsPdfOutlinedIcon />}
                  onClick={() => { void handleDownloadPdf(); }}
                  disabled={isDownloading}
                  sx={{
                    textTransform: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    borderRadius: 999,
                    py: 1,
                    borderColor: "#E5E7EB",
                    color: "#4C6AD2",
                    "&:hover": {
                      borderColor: "#4C6AD2",
                      bgcolor: "rgba(76,106,210,0.04)",
                    },
                  }}
                >
                  Download PDF
                </Button>
              </Stack>
            </Box>
          </Box>
        ) : null}
      </Box>

      <Box
        aria-hidden
        sx={{
          position: "fixed",
          top: 0,
          left: -20000,
          width: 1360,
          p: 2,
          pointerEvents: "none",
        }}
      >
        <Stack spacing={2}>
          {slides.map((slide) => (
            <Box key={slide.id} data-slide-export-preview sx={{ width: 1280 }}>
              <SlidePreview
                slide={slide}
                template={template}
                paperSize={pitchDeck.settings.paperSize}
                workspaceName={includeBrandingExport ? branding.workspaceName : null}
                workspaceLogoDataUrl={
                  includeBrandingExport ? branding.workspaceLogoDataUrl : null
                }
              />
            </Box>
          ))}
        </Stack>
      </Box>

      <SlideEditorModal
        open={isEditorOpen}
        slide={selectedSlide ?? null}
        onClose={() => setIsEditorOpen(false)}
        onSave={async ({ title, content }) => {
          if (!selectedSlide) return;
          await updateSlide(selectedSlide.id, { title, content });
        }}
      />

      <SlideAiDrawer
        open={isAiOpen}
        workspaceId={workspaceId}
        target={aiTarget}
        onClose={() => {
          setIsAiOpen(false);
          setAiTarget(null);
        }}
        onApply={handleAiApply}
      />
    </Box>
  );
};

export default PitchDeckEditor;
