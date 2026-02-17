"use client";

import type { FC } from "react";
import { useRef, useState } from "react";
import { Box, Typography, Stack, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

import ManageSidebar from "@/components/workspaceManage/business-plan/ManageSidebar";
import ExportSettingsSidebar from "./ExportSettingsSidebar";
import {
  BusinessModelCanvasLayout,
  FourQuartersCanvasLayout,
  ValuePropositionCanvasLayout,
  PitchCanvasLayout,
  StartupCanvasLayout,
  LeanCanvasLayout,
} from "./layouts";
import type { WorkspaceCanvasTemplateType } from "@/types/workspaces";

export type CanvasModelViewPageProps = Readonly<{
  workspaceId: string;
  canvasId: string;
}>;

// Canvas model titles mapping
const CANVAS_TITLES: Record<string, string> = {
  "business-model": "The Business Model Canvas",
  "four-quarters": "4 Quarters Canvas",
  "value-proposition": "Value Proposition Canvas",
  "pitch": "The Pitch Canvas",
  "startup": "The Startup Canvas",
  "lean": "Lean Canvas",
};

const CanvasModelViewPage: FC<CanvasModelViewPageProps> = ({
  workspaceId,
  canvasId,
}) => {
  const router = useRouter();
  const [showExportSidebar, setShowExportSidebar] = useState(false);
  const canvasLayoutRef = useRef<HTMLDivElement | null>(null);

  const canvasTitle = CANVAS_TITLES[canvasId] ?? "Canvas Model";
  const templateType = canvasId as WorkspaceCanvasTemplateType;

  const handleBack = () => {
    router.push(`/workspaces/${workspaceId}/manage/canvas-models`);
  };

  const handleDownloadClick = () => {
    setShowExportSidebar(!showExportSidebar);
  };

  const handleAddItem = (sectionId: string) => (item: { title: string; description: string }) => {
    // TODO: Implement add item functionality
    console.log(`Adding item to ${sectionId}:`, item);
  };

  const handleGenerateAI = (sectionId: string) => () => {
    // TODO: Implement AI generation
    console.log(`Generate AI for ${sectionId}`);
  };

  // Render the appropriate canvas layout based on canvasId
  const renderCanvasLayout = () => {
    switch (canvasId) {
      case "business-model":
        return (
          <BusinessModelCanvasLayout
            onAddItem={handleAddItem}
            onGenerateAI={handleGenerateAI}
          />
        );
      case "four-quarters":
        return (
          <FourQuartersCanvasLayout
            onAddItem={handleAddItem}
            onGenerateAI={handleGenerateAI}
          />
        );
      case "value-proposition":
        return (
          <ValuePropositionCanvasLayout
            onAddItem={handleAddItem}
            onGenerateAI={handleGenerateAI}
          />
        );
      case "pitch":
        return (
          <PitchCanvasLayout
            onAddItem={handleAddItem}
            onGenerateAI={handleGenerateAI}
          />
        );
      case "startup":
        return (
          <StartupCanvasLayout
            onAddItem={handleAddItem}
            onGenerateAI={handleGenerateAI}
          />
        );
      case "lean":
        return (
          <LeanCanvasLayout
            onAddItem={handleAddItem}
            onGenerateAI={handleGenerateAI}
          />
        );
      default:
        return (
          <BusinessModelCanvasLayout
            onAddItem={handleAddItem}
            onGenerateAI={handleGenerateAI}
          />
        );
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

          {/* Center - CREATE and DOWNLOAD buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="text"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
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
              Create
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
          <Stack direction="row" spacing={1} alignItems="center">
            <EditOutlinedIcon sx={{ fontSize: 18, color: "#6B7280" }} />
            <Typography sx={{ fontSize: 15, fontWeight: 500, color: "#111827" }}>
              {canvasTitle}
            </Typography>
          </Stack>

          {/* Generate With AI button */}
          <Button
            variant="outlined"
            startIcon={<AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} />}
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
            }}
          >
            Generate With AI
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
            <Box ref={canvasLayoutRef}>{renderCanvasLayout()}</Box>
          </Box>

          {/* Export Settings Sidebar */}
          {showExportSidebar && (
            <ExportSettingsSidebar
              workspaceId={workspaceId}
              canvasRef={canvasLayoutRef}
              canvasTitle={canvasTitle}
              templateType={templateType}
              sectionsData={{}}
              onClose={() => setShowExportSidebar(false)}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CanvasModelViewPage;
