"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import ViewQuiltOutlinedIcon from "@mui/icons-material/ViewQuiltOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import ManageSidebar from "@/components/workspaceManage/business-plan/ManageSidebar";
import ConfirmDeleteModal from "@/components/workspaceManage/business-plan/ConfirmDeleteModal";
import type { WorkspaceCanvasModel, WorkspaceCanvasTemplateType } from "@/types/workspaces";

export type MyCanvasModelsPageProps = Readonly<{
  workspaceId: string;
}>;

// Template colors mapping
const TEMPLATE_COLORS: Record<WorkspaceCanvasTemplateType, { bg: string; accent: string }> = {
  "business-model": { bg: "#E4F4F2", accent: "#B6E2D9" },
  "four-quarters": { bg: "#EAF3D9", accent: "#CFE7A8" },
  "value-proposition": { bg: "#F7E1E1", accent: "#F0B9B9" },
  "pitch": { bg: "#F1E5F6", accent: "#D9C4EC" },
  "startup": { bg: "#E3E9FA", accent: "#C2D0F7" },
  "lean": { bg: "#E4F4E4", accent: "#C4E7C4" },
};

// Template display names
const TEMPLATE_NAMES: Record<WorkspaceCanvasTemplateType, string> = {
  "business-model": "Business Model Canvas",
  "four-quarters": "4 Quarters Canvas",
  "value-proposition": "Value Proposition Canvas",
  "pitch": "Pitch Canvas",
  "startup": "Startup Canvas",
  "lean": "Lean Canvas",
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();

  // Format time as HH:MM
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // Check if same day
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    return `Today at ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  } else {
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
    return `${dateStr} at ${timeStr}`;
  }
};

const MyCanvasModelsPage: FC<MyCanvasModelsPageProps> = ({ workspaceId }) => {
  const router = useRouter();
  const [canvasModels, setCanvasModels] = useState<WorkspaceCanvasModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadCanvasModels = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/canvas-models`);

        if (!response.ok) {
          throw new Error("Failed to load canvas models");
        }

        const data = await response.json();
        setCanvasModels(data.canvasModels);
      } catch (err) {
        console.error("Error loading canvas models:", err);
        setError("Failed to load canvas models");
      } finally {
        setIsLoading(false);
      }
    };

    loadCanvasModels();
  }, [workspaceId]);

  const handleCanvasClick = (canvasId: string) => {
    router.push(`/workspaces/${workspaceId}/manage/canvas-models/edit/${canvasId}`);
  };

  const handleCreateNew = () => {
    router.push(`/workspaces/${workspaceId}/manage/canvas-models`);
  };

  const handleDeleteClick = (e: React.MouseEvent, model: WorkspaceCanvasModel) => {
    e.stopPropagation(); // Prevent card click
    setModelToDelete({ id: model.id, title: model.title });
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setModelToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!modelToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/canvas-models/${modelToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete canvas model");
      }

      // Remove from local state
      setCanvasModels((prev) => prev.filter((model) => model.id !== modelToDelete.id));
      setDeleteDialogOpen(false);
      setModelToDelete(null);
    } catch (err) {
      console.error("Error deleting canvas model:", err);
    } finally {
      setIsDeleting(false);
    }
  };

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
      {/* Left sidebar – Canvas Models active */}
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
        {/* Header row with tabs */}
        <Box
          sx={{
            px: 4,
            py: 0,
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          {/* All Models Tab - Inactive */}
          <Box
            onClick={() => router.push(`/workspaces/${workspaceId}/manage/canvas-models`)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 2,
              borderBottom: "2px solid transparent",
              cursor: "pointer",
              "&:hover": {
                borderBottomColor: "#E5E7EB",
              },
            }}
          >
            <ViewQuiltOutlinedIcon sx={{ fontSize: 20, color: "#6B7280" }} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: "#6B7280",
                letterSpacing: 1,
              }}
            >
              ALL MODELS
            </Typography>
          </Box>

          {/* My Models Tab - Active */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 2,
              borderBottom: "2px solid #4C6AD2",
              cursor: "pointer",
            }}
          >
            <FolderOutlinedIcon sx={{ fontSize: 20, color: "#4C6AD2" }} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: "#4C6AD2",
                letterSpacing: 1,
              }}
            >
              MY MODELS
            </Typography>
          </Box>
        </Box>

        {/* Scrollable content area */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: 4,
            py: 4,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Box
            sx={{
              maxWidth: 1120,
              mx: "auto",
            }}
          >
            {isLoading ? (
              /* Loading state */
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 12,
                }}
              >
                <CircularProgress sx={{ color: "#4C6AD2" }} />
              </Box>
            ) : error ? (
              /* Error state */
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 12,
                }}
              >
                <Typography sx={{ fontSize: 16, color: "#EF4444", mb: 2 }}>
                  {error}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => window.location.reload()}
                  sx={{ borderColor: "#4C6AD2", color: "#4C6AD2" }}
                >
                  Retry
                </Button>
              </Box>
            ) : canvasModels.length > 0 ? (
              /* Grid of user's canvases */
              <Grid container spacing={3}>
                {canvasModels.map((model) => {
                  const colors = TEMPLATE_COLORS[model.template_type] || {
                    bg: "#F3F4F6",
                    accent: "#E5E7EB",
                  };
                  const templateName = TEMPLATE_NAMES[model.template_type] || model.template_type;

                  return (
                    <Grid key={model.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Box
                        onClick={() => handleCanvasClick(model.id)}
                        sx={{
                          borderRadius: 3,
                          border: "1px solid #E2E8F0",
                          bgcolor: "#FFFFFF",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#4C6AD2",
                            boxShadow: "0 4px 12px rgba(76, 106, 210, 0.15)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        {/* Top preview block */}
                        <Box
                          sx={{
                            px: 3,
                            pt: 3,
                            pb: 2,
                            bgcolor: "#FFFFFF",
                            borderBottom: "1px solid #E5E7EB",
                          }}
                        >
                          <Box
                            sx={{
                              borderRadius: 2,
                              bgcolor: colors.bg,
                              px: 2,
                              py: 1.8,
                              display: "grid",
                              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                              gridAutoRows: "18px",
                              gap: 0.7,
                            }}
                          >
                            <Box
                              sx={{
                                gridColumn: "1 / 3",
                                borderRadius: 1,
                                bgcolor: colors.accent,
                              }}
                            />
                            <Box
                              sx={{
                                gridColumn: "3 / 5",
                                borderRadius: 1,
                                bgcolor: colors.accent,
                              }}
                            />
                            <Box
                              sx={{
                                gridColumn: "1 / 5",
                                height: 26,
                                borderRadius: 1,
                                bgcolor: colors.accent,
                                opacity: 0.9,
                                mt: 0.4,
                              }}
                            />
                          </Box>
                        </Box>

                        {/* Text content */}
                        <Box
                          sx={{
                            px: 3,
                            py: 2.5,
                            flex: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box>
                            <Typography
                              sx={{
                                fontSize: 15,
                                fontWeight: 600,
                                color: "#111827",
                                mb: 0.5,
                              }}
                            >
                              {model.title}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: "#9CA3AF",
                              }}
                            >
                              {templateName} • Updated {formatDate(model.updated_at)}
                            </Typography>
                          </Box>
                          {/* Delete button */}
                          <Box
                            onClick={(e) => handleDeleteClick(e, model)}
                            sx={{
                              p: 1,
                              borderRadius: 1.5,
                              color: "#9CA3AF",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                bgcolor: "#FEE2E2",
                                color: "#EF4444",
                              },
                            }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              /* Empty state */
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 12,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    bgcolor: "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3,
                  }}
                >
                  <FolderOutlinedIcon sx={{ fontSize: 36, color: "#9CA3AF" }} />
                </Box>
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#111827",
                    mb: 1,
                  }}
                >
                  No canvas models yet
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                    color: "#6B7280",
                    mb: 4,
                    textAlign: "center",
                    maxWidth: 400,
                  }}
                >
                  Create your first canvas model from one of our templates to start planning your business strategy.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateNew}
                  sx={{
                    bgcolor: "#4C6AD2",
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 600,
                    textTransform: "none",
                    px: 3,
                    py: 1.2,
                    borderRadius: 2,
                    "&:hover": {
                      bgcolor: "#3B5AC5",
                    },
                  }}
                >
                  Create from Template
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <ConfirmDeleteModal
        open={deleteDialogOpen}
        title="Delete Canvas Model"
        message="Are you sure you want to delete this canvas model? This action cannot be undone."
        itemName={modelToDelete?.title}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Box>
  );
};

export default MyCanvasModelsPage;
