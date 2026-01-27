"use client";

import type { FC } from "react";
import { useState } from "react";
import { Box, Grid, Typography, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import ViewQuiltOutlinedIcon from "@mui/icons-material/ViewQuiltOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";

import ManageSidebar from "@/components/workspaceManage/business-plan/ManageSidebar";
import type { WorkspaceCanvasTemplateType } from "@/types/workspaces";

export type CanvasModelsPageProps = Readonly<{
  workspaceId: string;
}>;

type CanvasModel = {
  id: string;
  title: string;
  description: string;
  previewBg: string;
  previewAccent: string;
};

type TabKey = "all-models" | "my-models";

const MODELS: CanvasModel[] = [
  {
    id: "business-model",
    title: "The Business Model Canvas",
    description:
      "A visual, one-page strategic tool for creating, describing, and analyzing business models by breaking them.",
    previewBg: "#E4F4F2",
    previewAccent: "#B6E2D9",
  },
  {
    id: "four-quarters",
    title: "4 Quarters Canvas",
    description:
      "A one-year plan: define quarterly objectives, milestones, metrics, and risks/owners to keep teams aligned across Q1–Q4.",
    previewBg: "#EAF3D9",
    previewAccent: "#CFE7A8",
  },
  {
    id: "value-proposition",
    title: "Value Proposition Canvas",
    description:
      "Systematically align product features with what customers value, so you build things people actually choose, use, recommend.",
    previewBg: "#F7E1E1",
    previewAccent: "#F0B9B9",
  },
  {
    id: "pitch",
    title: "The Pitch Canvas",
    description:
      "A slide-flow outline for your deck: hook, problem, solution, product demo, market, GTM, traction, business model, competition.",
    previewBg: "#F1E5F6",
    previewAccent: "#D9C4EC",
  },
  {
    id: "startup",
    title: "The Startup Canvas",
    description:
      "Validate and communicate your venture: define problem, solution, customer segments, value proposition, market size.",
    previewBg: "#E3E9FA",
    previewAccent: "#C2D0F7",
  },
  {
    id: "lean",
    title: "Lean Canvas",
    description:
      "Startup snapshot focused on risk: capture Problem, Customer Segments, Unique Value Proposition, Solution, Channels, etc.",
    previewBg: "#E4F4E4",
    previewAccent: "#C4E7C4",
  },
];

const CanvasModelsPage: FC<CanvasModelsPageProps> = ({ workspaceId }) => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState<string | null>(null);

  const handleCanvasClick = async (templateType: WorkspaceCanvasTemplateType, title: string) => {
    if (isCreating) return;

    setIsCreating(templateType);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/canvas-models`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          templateType,
          sectionsData: {},
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create canvas");
      }

      const data = await response.json();
      const canvasId = data.canvasModel.id;

      // Navigate to the edit page for the new canvas
      router.push(`/workspaces/${workspaceId}/manage/canvas-models/edit/${canvasId}`);
    } catch (error) {
      console.error("Error creating canvas:", error);
      setIsCreating(null);
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
          {/* All Models Tab - Active */}
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
            <ViewQuiltOutlinedIcon sx={{ fontSize: 20, color: "#4C6AD2" }} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: "#4C6AD2",
                letterSpacing: 1,
              }}
            >
              ALL MODELS
            </Typography>
          </Box>

          {/* My Models Tab - Inactive */}
          <Box
            onClick={() => router.push(`/workspaces/${workspaceId}/manage/canvas-models/my-models`)}
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
            <FolderOutlinedIcon sx={{ fontSize: 20, color: "#6B7280" }} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: "#6B7280",
                letterSpacing: 1,
              }}
            >
              MY MODELS
            </Typography>
          </Box>
        </Box>

        {/* Scrollable grid area */}
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
            <Grid container spacing={3}>
              {MODELS.map((model) => (
                <Grid key={model.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Box
                    onClick={() => handleCanvasClick(model.id as WorkspaceCanvasTemplateType, model.title)}
                    sx={{
                      borderRadius: 3,
                      border: "1px solid #E2E8F0",
                      bgcolor: "#FFFFFF",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      cursor: isCreating ? "wait" : "pointer",
                      transition: "all 0.2s ease",
                      opacity: isCreating && isCreating !== model.id ? 0.5 : 1,
                      position: "relative",
                      "&:hover": {
                        borderColor: isCreating ? "#E2E8F0" : "#4C6AD2",
                        boxShadow: isCreating ? "none" : "0 4px 12px rgba(76, 106, 210, 0.15)",
                        transform: isCreating ? "none" : "translateY(-2px)",
                      },
                    }}
                  >
                    {/* Loading overlay */}
                    {isCreating === model.id && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          bgcolor: "rgba(255,255,255,0.8)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 1,
                        }}
                      >
                        <CircularProgress size={32} sx={{ color: "#4C6AD2" }} />
                      </Box>
                    )}
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
                          bgcolor: model.previewBg,
                          px: 2,
                          py: 1.8,
                          display: "grid",
                          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                          gridAutoRows: "18px",
                          gap: 0.7,
                        }}
                      >
                        {/* Simplified fake blocks to mimic Figma preview */}
                        <Box
                          sx={{
                            gridColumn: "1 / 3",
                            borderRadius: 1,
                            bgcolor: model.previewAccent,
                          }}
                        />
                        <Box
                          sx={{
                            gridColumn: "3 / 5",
                            borderRadius: 1,
                            bgcolor: model.previewAccent,
                          }}
                        />
                        <Box
                          sx={{
                            gridColumn: "1 / 5",
                            height: 26,
                            borderRadius: 1,
                            bgcolor: model.previewAccent,
                            opacity: 0.9,
                            mt: 0.4,
                          }}
                        />
                        <Box
                          sx={{
                            gridColumn: "1 / 3",
                            height: 20,
                            borderRadius: 1,
                            bgcolor: model.previewAccent,
                            opacity: 0.7,
                            mt: 0.4,
                          }}
                        />
                        <Box
                          sx={{
                            gridColumn: "3 / 5",
                            height: 20,
                            borderRadius: 1,
                            bgcolor: model.previewAccent,
                            opacity: 0.7,
                            mt: 0.4,
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Text content */}
                    <Box sx={{ px: 3, py: 2.5, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#111827",
                          mb: 1,
                        }}
                      >
                        {model.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "#4B5563",
                          lineHeight: 1.6,
                        }}
                      >
                        {model.description}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CanvasModelsPage;
