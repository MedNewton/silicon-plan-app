// src/components/workspaceManage/business-plan/ManageActionArea.tsx
"use client";

import type { FC, ReactNode } from "react";
import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Menu,
  type SelectChangeEvent,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "react-toastify";

import ViewHeadlineOutlinedIcon from "@mui/icons-material/ViewHeadlineOutlined";
import SubjectOutlinedIcon from "@mui/icons-material/SubjectOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import GridOnOutlinedIcon from "@mui/icons-material/GridOnOutlined";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";

import type { ManageTopTab } from "./ManageTopTabs";
import { useBusinessPlan } from "./BusinessPlanContext";
import type {
  BusinessPlanSectionType,
  BusinessPlanSectionContent,
} from "@/types/workspaces";
import { buildBusinessPlanHtml, buildBusinessPlanDocx } from "@/lib/businessPlanExport";

type RightPlanTab = "sections" | "finance" | "charts";

export type ManageActionAreaProps = Readonly<{
  activeTopTab: ManageTopTab;
}>;

type SectionTool = {
  id: string;
  label: string;
  icon: ReactNode;
  sectionType: BusinessPlanSectionType;
  defaultContent: BusinessPlanSectionContent;
};

const sectionTools: SectionTool[] = [
  {
    id: "section-title",
    label: "Section Title",
    icon: <ViewHeadlineOutlinedIcon />,
    sectionType: "section_title",
    defaultContent: { type: "section_title", text: "New Section" },
  },
  {
    id: "subsection",
    label: "Subsection",
    icon: <SubjectOutlinedIcon />,
    sectionType: "subsection",
    defaultContent: { type: "subsection", text: "New Subsection" },
  },
  {
    id: "text",
    label: "Text",
    icon: <NotesOutlinedIcon />,
    sectionType: "text",
    defaultContent: { type: "text", text: "Enter your text here..." },
  },
  {
    id: "image",
    label: "Image",
    icon: <ImageOutlinedIcon />,
    sectionType: "image",
    defaultContent: { type: "image", url: "" },
  },
  {
    id: "table",
    label: "Table",
    icon: <GridOnOutlinedIcon />,
    sectionType: "table",
    defaultContent: {
      type: "table",
      headers: ["Column 1", "Column 2", "Column 3"],
      rows: [["", "", ""]],
    },
  },
  {
    id: "list",
    label: "List",
    icon: <FormatListBulletedOutlinedIcon />,
    sectionType: "list",
    defaultContent: { type: "list", items: ["Item 1"], ordered: false },
  },
  {
    id: "comparison-table",
    label: "Comparison",
    icon: <GridOnOutlinedIcon />,
    sectionType: "comparison_table",
    defaultContent: {
      type: "comparison_table",
      headers: ["Feature", "Option A", "Option B"],
      rows: [["", "", ""]],
    },
  },
  {
    id: "timeline",
    label: "Timeline",
    icon: <TimelineOutlinedIcon />,
    sectionType: "timeline",
    defaultContent: {
      type: "timeline",
      entries: [{ date: "", title: "", description: "" }],
    },
  },
  {
    id: "embed",
    label: "Embed",
    icon: <CodeOutlinedIcon />,
    sectionType: "embed",
    defaultContent: { type: "embed", embed_type: "html", code: "" },
  },
  {
    id: "page-break",
    label: "Page Break",
    icon: <SubjectOutlinedIcon />,
    sectionType: "page_break",
    defaultContent: { type: "page_break" },
  },
  {
    id: "empty-space",
    label: "Empty Space",
    icon: <SubjectOutlinedIcon />,
    sectionType: "empty_space",
    defaultContent: { type: "empty_space", height: 40 },
  },
];

const ManageActionArea: FC<ManageActionAreaProps> = ({ activeTopTab }) => {
  const { selectedChapterId, addSection, businessPlan, chapters } = useBusinessPlan();
  const [rightTab, setRightTab] = useState<RightPlanTab>("sections");
  const [paperSize, setPaperSize] = useState("A4");
  const [headingColor, setHeadingColor] = useState("Blue");
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [fontSize, setFontSize] = useState("15");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const headingColorValue =
    headingColor === "Navy" ? "#1F2A44" : headingColor === "Black" ? "#111827" : "#4C6AD2";

  const paperSizePx =
    paperSize === "Letter"
      ? { width: 816, height: 1056 }
      : paperSize === "A3"
      ? { width: 1123, height: 1587 }
      : { width: 794, height: 1123 };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: "pdf" | "html" | "docx") => {
    if (!businessPlan) {
      toast.error("No business plan to export yet.");
      return;
    }

    setIsExporting(true);
    try {
      const html = buildBusinessPlanHtml(businessPlan, chapters, {
        headingColor: headingColorValue,
        fontSize: Number(fontSize),
        paperSize: paperSize as "A4" | "Letter" | "A3",
      });

      if (format === "html") {
        const blob = new Blob([html], { type: "text/html" });
        downloadBlob(blob, `${businessPlan.title || "business-plan"}.html`);
        return;
      }

      if (format === "docx") {
        const blob = await buildBusinessPlanDocx(businessPlan, chapters);
        downloadBlob(blob, `${businessPlan.title || "business-plan"}.docx`);
        return;
      }

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = `${paperSizePx.width}px`;
      container.style.padding = "32px";
      container.style.background = "#FFFFFF";
      container.style.fontFamily = fontFamily;
      container.innerHTML = html;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFFFFF",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        unit: "px",
        format: [paperSizePx.width, paperSizePx.height],
      });

      const imgWidth = paperSizePx.width;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= paperSizePx.height;

      while (heightLeft > 0) {
        position -= paperSizePx.height;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= paperSizePx.height;
      }

      pdf.save(`${businessPlan.title || "business-plan"}.pdf`);
      container.remove();
    } catch (error) {
      console.error("Failed to export:", error);
      toast.error("Failed to export business plan.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddSection = async (tool: SectionTool) => {
    if (!selectedChapterId) return;

    setIsAddingSection(true);
    try {
      await addSection(
        selectedChapterId,
        tool.sectionType,
        tool.defaultContent
      );
    } catch (error) {
      console.error("Failed to add section:", error);
    } finally {
      setIsAddingSection(false);
    }
  };

  // ---------------- DOWNLOAD TAB ----------------
  if (activeTopTab === "download") {
    return (
      <Box
        sx={{
          width: 320,
          borderLeft: "1px solid #E5E7EB",
          bgcolor: "#F9FAFB",
          display: "flex",
          flexDirection: "column",
          height: "100%", // use 100% of parent, parent is clamped to 100vh
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
          <Typography
            sx={{ fontSize: 16, fontWeight: 600, letterSpacing: 0.2 }}
          >
            Export Settings
          </Typography>
        </Box>

        {/* Scrollable settings content */}
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
                  value={paperSize}
                  onChange={(e: SelectChangeEvent<string>) =>
                    setPaperSize(e.target.value)
                  }
                  sx={{
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <MenuItem value="A4">A4</MenuItem>
                  <MenuItem value="Letter">Letter</MenuItem>
                  <MenuItem value="A3">A3</MenuItem>
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
                Plan Heading Color
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={headingColor}
                  onChange={(e: SelectChangeEvent<string>) =>
                    setHeadingColor(e.target.value)
                  }
                  sx={{
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <MenuItem value="Blue">Blue</MenuItem>
                  <MenuItem value="Navy">Navy</MenuItem>
                  <MenuItem value="Black">Black</MenuItem>
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
                  value={fontFamily}
                  onChange={(e: SelectChangeEvent<string>) =>
                    setFontFamily(e.target.value)
                  }
                  sx={{
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <MenuItem value="Roboto">Roboto</MenuItem>
                  <MenuItem value="Inter">Inter</MenuItem>
                  <MenuItem value="Open Sans">Open Sans</MenuItem>
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
                  value={fontSize}
                  onChange={(e: SelectChangeEvent<string>) =>
                    setFontSize(e.target.value)
                  }
                  sx={{
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <MenuItem value="13">13 px</MenuItem>
                  <MenuItem value="15">15 px</MenuItem>
                  <MenuItem value="17">17 px</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderTop: "1px solid #E5E7EB",
          }}
        >
          <Button
            fullWidth
            variant="contained"
            startIcon={<DownloadOutlinedIcon />}
            onClick={(event) => setExportAnchorEl(event.currentTarget)}
            disabled={isExporting}
            sx={{
              textTransform: "none",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 999,
              py: 1.1,
              backgroundImage:
                "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
                opacity: 0.96,
                backgroundImage:
                  "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
              },
            }}
          >
            {isExporting ? "Preparing..." : "Download"}
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            transformOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <MenuItem
              onClick={() => {
                setExportAnchorEl(null);
                void handleExport("pdf");
              }}
            >
              PDF
            </MenuItem>
            <MenuItem
              onClick={() => {
                setExportAnchorEl(null);
                void handleExport("docx");
              }}
            >
              DOCX
            </MenuItem>
            <MenuItem
              onClick={() => {
                setExportAnchorEl(null);
                void handleExport("html");
              }}
            >
              HTML
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    );
  }

  // ---------------- PLAN TAB (Sections / Finance / Charts) ----------------

  return (
    <Box
      sx={{
        width: 320,
        borderLeft: "1px solid #E5E7EB",
        bgcolor: "#F9FAFB",
        display: "flex",
        flexDirection: "column",
        height: "100%", // take full height of parent, which is 100vh
        overflow: "hidden",
      }}
    >
      {/* Right-side tabs: Sections / Finance / Charts */}
      <Box
        sx={{
          display: "flex",
          borderBottom: "1px solid #E5E7EB",
          bgcolor: "#FFFFFF",
          height: 52,
        }}
      >
        {(["sections", "finance", "charts"] as RightPlanTab[]).map((tab) => {
          const isActive = rightTab === tab;
          const label =
            tab === "sections"
              ? "Sections"
              : tab === "finance"
              ? "Finance"
              : "Charts";
          return (
            <Button
              key={tab}
              disableRipple
              onClick={() => setRightTab(tab)}
              sx={{
                flex: 1,
                textTransform: "none",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 0,
                height: "100%",
                color: isActive ? "#FFFFFF" : "#4B5563",
                bgcolor: isActive ? "#4C6AD2" : "#FFFFFF",
                borderBottom: isActive ? "none" : "1px solid #E5E7EB",
                "&:hover": {
                  bgcolor: isActive ? "#4C6AD2" : "#F9FAFB",
                },
              }}
            >
              {label}
            </Button>
          );
        })}
      </Box>

      {/* Tab content area */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 2.5,
          py: 3,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {/* Sections tab content */}
        {rightTab === "sections" && (
          <>
            {/* Show message when no chapter is selected */}
            {!selectedChapterId && (
              <Alert
                severity="info"
                sx={{
                  mb: 2,
                  fontSize: 13,
                  "& .MuiAlert-icon": { fontSize: 18 },
                }}
              >
                Select a chapter from the left panel to add sections.
              </Alert>
            )}

            {/* Loading indicator */}
            {isAddingSection && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                  gap: 1,
                }}
              >
                <CircularProgress size={16} sx={{ color: "#4C6AD2" }} />
                <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
                  Adding section...
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                columnGap: 2,
                rowGap: 2.5,
              }}
            >
              {sectionTools.map((tool) => {
                const isDisabled = !selectedChapterId || isAddingSection;
                return (
                  <Box
                    key={tool.id}
                    onClick={() => !isDisabled && handleAddSection(tool)}
                    sx={{
                      borderRadius: 3,
                      border: "1px solid #D3DDF5",
                      bgcolor: isDisabled ? "#F3F4F6" : "#F9FBFF",
                      px: 1.5,
                      py: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.5 : 1,
                      transition: "all 0.15s ease",
                      "&:hover": isDisabled
                        ? {}
                        : {
                            bgcolor: "#EEF2FF",
                            borderColor: "#4C6AD2",
                            transform: "translateY(-1px)",
                          },
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: "1px solid #C3D4FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isDisabled ? "#9CA3AF" : "#4C6AD2",
                      }}
                    >
                      {tool.icon}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: isDisabled ? "#9CA3AF" : "#111827",
                        textAlign: "center",
                      }}
                    >
                      {tool.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        {/* Finance tab - Coming Soon */}
        {rightTab === "finance" && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              minHeight: 300,
              textAlign: "center",
              px: 3,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 28 }}>💰</Typography>
            </Box>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 600,
                color: "#111827",
                mb: 1,
              }}
            >
              Finance Tools
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                color: "#6B7280",
                mb: 2,
              }}
            >
              Coming Soon
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: "#9CA3AF",
                lineHeight: 1.6,
              }}
            >
              Financial projections, revenue models, and expense tracking tools will be available here.
            </Typography>
          </Box>
        )}

        {/* Charts tab - Coming Soon */}
        {rightTab === "charts" && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              minHeight: 300,
              textAlign: "center",
              px: 3,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 28 }}>📊</Typography>
            </Box>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 600,
                color: "#111827",
                mb: 1,
              }}
            >
              Charts & Visualizations
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                color: "#6B7280",
                mb: 2,
              }}
            >
              Coming Soon
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: "#9CA3AF",
                lineHeight: 1.6,
              }}
            >
              Add charts, graphs, and data visualizations to your business plan.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ManageActionArea;
