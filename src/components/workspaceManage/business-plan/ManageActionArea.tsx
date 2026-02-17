// src/components/workspaceManage/business-plan/ManageActionArea.tsx
"use client";

import type { FC, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Menu,
  FormControlLabel,
  Switch,
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
import SectionEditorModal from "./SectionEditorModal";
import type {
  BusinessPlanCurrencyCode,
  BusinessPlanSection,
  BusinessPlanSectionType,
  BusinessPlanSectionContent,
} from "@/types/workspaces";
import { buildBusinessPlanHtml, buildBusinessPlanDocx } from "@/lib/businessPlanExport";
import { A4_MARGIN_CM, A4_MARGIN_MM, mmToPx, sanitizeFileName } from "@/lib/exportStyles";
import {
  fetchWorkspaceBranding,
  fetchImageAsDataUrl,
  fetchImageAsUint8Array,
} from "@/lib/workspaceBranding";

type RightPlanTab = "sections" | "finance" | "charts";

export type ManageActionAreaProps = Readonly<{
  activeTopTab: ManageTopTab;
  workspaceId: string;
}>;

type SectionTool = {
  id: string;
  label: string;
  icon: ReactNode;
  sectionType: BusinessPlanSectionType;
  defaultContent: BusinessPlanSectionContent;
};

type FinanceTableSectionItem = {
  chapterId: string;
  chapterTitle: string;
  section: BusinessPlanSection;
};

const currencyOptions: Array<{ code: BusinessPlanCurrencyCode; label: string }> = [
  { code: "USD", label: "USD - US Dollar" },
  { code: "EUR", label: "EUR - Euro" },
  { code: "GBP", label: "GBP - British Pound" },
  { code: "CAD", label: "CAD - Canadian Dollar" },
  { code: "AUD", label: "AUD - Australian Dollar" },
  { code: "JPY", label: "JPY - Japanese Yen" },
  { code: "INR", label: "INR - Indian Rupee" },
];

const FINANCE_CHAPTER_TITLE_REGEX = /\b(finance|financial|economic|valuation|revenue|cost|cash|forecast|pricing)\b/i;

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

const ManageActionArea: FC<ManageActionAreaProps> = ({ activeTopTab, workspaceId }) => {
  const {
    selectedChapterId,
    setSelectedChapterId,
    setSelectedSectionId,
    addSection,
    updateSection,
    updateBusinessPlanExportSettings,
    businessPlan,
    chapters,
  } = useBusinessPlan();
  const [rightTab, setRightTab] = useState<RightPlanTab>("sections");
  const [paperSize, setPaperSize] = useState("A4");
  const [headingColor, setHeadingColor] = useState("Blue");
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [fontSize, setFontSize] = useState("15");
  const [currencyCode, setCurrencyCode] = useState<BusinessPlanCurrencyCode>("USD");
  const [includeBrandingExport, setIncludeBrandingExport] = useState(true);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isAddingFinanceTable, setIsAddingFinanceTable] = useState(false);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const [editingFinanceSection, setEditingFinanceSection] = useState<BusinessPlanSection | null>(
    null
  );
  const [isSavingFinanceSection, setIsSavingFinanceSection] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const financeTableSections = useMemo<FinanceTableSectionItem[]>(() => {
    const collect = (
      items: typeof chapters
    ): FinanceTableSectionItem[] =>
      items.flatMap((chapter) => {
        const childChapters = chapter.children ?? [];
        const localSections: FinanceTableSectionItem[] = chapter.sections
          .filter(
            (section) =>
              section.content.type === "table" || section.content.type === "comparison_table"
          )
          .map((section) => ({
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            section,
          }));
        return childChapters.length > 0
          ? [...localSections, ...collect(childChapters)]
          : localSections;
      });
    return collect(chapters);
  }, [chapters]);

  useEffect(() => {
    const savedCurrency = businessPlan?.export_settings?.currency_code;
    if (!savedCurrency) return;
    if (currencyOptions.some((option) => option.code === savedCurrency)) {
      setCurrencyCode(savedCurrency);
    }
  }, [businessPlan?.export_settings?.currency_code]);

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

  const resolveFinanceChapterId = (): string | null => {
    if (selectedChapterId) return selectedChapterId;

    const findFirstChapterId = (
      items: typeof chapters
    ): string | null => {
      for (const chapter of items) {
        const childChapters = chapter.children ?? [];
        if (FINANCE_CHAPTER_TITLE_REGEX.test(chapter.title)) {
          return chapter.id;
        }
        if (childChapters.length > 0) {
          const nested = findFirstChapterId(childChapters);
          if (nested) return nested;
        }
      }
      return null;
    };

    const financeChapterId = findFirstChapterId(chapters);
    if (financeChapterId) return financeChapterId;
    return chapters[0]?.id ?? null;
  };

  const handleCurrencyChange = async (
    event: SelectChangeEvent<string>
  ) => {
    const nextCurrency = event.target.value as BusinessPlanCurrencyCode;
    const previousCurrency = currencyCode;
    setCurrencyCode(nextCurrency);

    if (!businessPlan) return;

    setIsSavingCurrency(true);
    try {
      await updateBusinessPlanExportSettings({
        ...(businessPlan.export_settings ?? {}),
        currency_code: nextCurrency,
      });
    } catch (error) {
      console.error("Failed to save currency setting:", error);
      setCurrencyCode(previousCurrency);
      toast.error("Failed to save currency. Please try again.");
    } finally {
      setIsSavingCurrency(false);
    }
  };

  const handleAddFinancialTable = async () => {
    const targetChapterId = resolveFinanceChapterId();
    if (!targetChapterId) {
      toast.error("Create a chapter first to add a financial table.");
      return;
    }

    setIsAddingFinanceTable(true);
    try {
      await addSection(targetChapterId, "table", {
        type: "table",
        headers: ["Metric", "Year 1", "Year 2", "Year 3"],
        rows: [
          ["Revenue", "", "", ""],
          ["Cost of Goods Sold", "", "", ""],
          ["Gross Profit", "", "", ""],
          ["Operating Expenses", "", "", ""],
          ["Net Income", "", "", ""],
        ],
      });
      setSelectedChapterId(targetChapterId);
      toast.success("Financial table added.");
    } catch (error) {
      console.error("Failed to add financial table:", error);
      toast.error("Failed to add financial table.");
    } finally {
      setIsAddingFinanceTable(false);
    }
  };

  const handleSaveFinanceSection = async (newContent: BusinessPlanSectionContent) => {
    if (!editingFinanceSection) return;

    setIsSavingFinanceSection(true);
    try {
      await updateSection(editingFinanceSection.id, newContent);
      setEditingFinanceSection(null);
      toast.success("Financial table updated.");
    } catch (error) {
      console.error("Failed to save financial table:", error);
      toast.error("Failed to save changes.");
    } finally {
      setIsSavingFinanceSection(false);
    }
  };

  const exportCurrencyCode = businessPlan?.export_settings?.currency_code ?? currencyCode;

  const handleExport = async (format: "pdf" | "docx") => {
    if (!businessPlan) {
      toast.error("No business plan to export yet.");
      return;
    }

    setIsExporting(true);
    try {
      const safeName = sanitizeFileName(businessPlan.title || "business-plan", "business-plan");
      const branding = includeBrandingExport
        ? await fetchWorkspaceBranding(workspaceId)
        : null;
      const workspaceName = includeBrandingExport ? branding?.workspaceName ?? null : null;
      const logoUrl = includeBrandingExport ? branding?.logoUrl ?? null : null;
      const [logoDataUrl, logoBytes] = includeBrandingExport
        ? await Promise.all([fetchImageAsDataUrl(logoUrl), fetchImageAsUint8Array(logoUrl)])
        : [null, null];

      const html = buildBusinessPlanHtml(businessPlan, chapters, {
        headingColor: headingColorValue,
        fontFamily,
        fontSize: Number(fontSize),
        paperSize: paperSize as "A4" | "Letter" | "A3",
        marginCm: A4_MARGIN_CM,
        currencyCode: exportCurrencyCode,
        logoDataUrl,
        workspaceName,
      });

      if (format === "docx") {
        const blob = await buildBusinessPlanDocx(businessPlan, chapters, {
          headingColor: headingColorValue,
          fontFamily,
          paperSize: paperSize as "A4" | "Letter" | "A3",
          currencyCode: exportCurrencyCode,
          logoBytes,
          workspaceName,
        });
        downloadBlob(blob, `${safeName}.docx`);
        toast.success("Exported as DOCX successfully");
        return;
      }

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = `${paperSizePx.width}px`;
      container.style.padding = `${mmToPx(A4_MARGIN_MM)}px`;
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

      const safeName2 = sanitizeFileName(businessPlan.title || "business-plan", "business-plan");
      pdf.save(`${safeName2}.pdf`);
      container.remove();
      toast.success("Exported as PDF successfully");
    } catch (error) {
      console.error("Failed to export:", error);
      toast.error("Failed to export business plan. Please try again.");
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

  const getFinanceTableSummary = (section: BusinessPlanSection): string => {
    if (section.content.type !== "table" && section.content.type !== "comparison_table") {
      return "Unsupported section format";
    }
    const headers = section.content.headers?.filter(Boolean) ?? [];
    if (headers.length > 0) {
      return headers.join(" | ");
    }
    return "No headers yet";
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

            <Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#4B5563",
                  mb: 0.7,
                }}
              >
                Currency
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={currencyCode}
                  onChange={(event) => {
                    void handleCurrencyChange(event);
                  }}
                  sx={{
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                  }}
                >
                  {currencyOptions.map((option) => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {isSavingCurrency && (
                <Typography sx={{ mt: 0.8, fontSize: 12, color: "#6B7280" }}>
                  Saving currency preference...
                </Typography>
              )}
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
              sx={{ fontSize: 14, py: 1.2 }}
            >
              PDF
            </MenuItem>
            <MenuItem
              onClick={() => {
                setExportAnchorEl(null);
                void handleExport("docx");
              }}
              sx={{ fontSize: 14, py: 1.2 }}
            >
              DOCX
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    );
  }

  // ---------------- PLAN TAB (Sections / Finance / Charts) ----------------

  return (
    <>
      <SectionEditorModal
        open={editingFinanceSection !== null}
        section={editingFinanceSection}
        isSaving={isSavingFinanceSection}
        onSave={(newContent) => {
          void handleSaveFinanceSection(newContent);
        }}
        onCancel={() => {
          if (!isSavingFinanceSection) {
            setEditingFinanceSection(null);
          }
        }}
      />

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

        {/* Finance tab */}
        {rightTab === "finance" && (
          <Stack spacing={2.2}>
            <Box
              sx={{
                p: 1.8,
                borderRadius: 2,
                border: "1px solid #D9E2F7",
                bgcolor: "#F7F9FF",
              }}
            >
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1F2A44", mb: 0.6 }}>
                Financial Plan
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#5F6B83", lineHeight: 1.55 }}>
                Edit financial tables directly and pick the default currency used in exports.
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#4B5563",
                  mb: 0.8,
                }}
              >
                Default Currency
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={currencyCode}
                  onChange={(event) => {
                    void handleCurrencyChange(event);
                  }}
                  sx={{
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                  }}
                >
                  {currencyOptions.map((option) => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {isSavingCurrency && (
                <Typography sx={{ mt: 0.8, fontSize: 12, color: "#6B7280" }}>
                  Saving currency preference...
                </Typography>
              )}
            </Box>

            <Button
              variant="outlined"
              disabled={isAddingFinanceTable}
              onClick={() => {
                void handleAddFinancialTable();
              }}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                borderColor: "#B6C5F4",
                color: "#3052C8",
                fontSize: 13,
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#8FA5ED",
                  bgcolor: "#EEF2FF",
                },
              }}
            >
              {isAddingFinanceTable ? "Adding..." : "Add Financial Table"}
            </Button>

            {financeTableSections.length === 0 ? (
              <Alert
                severity="info"
                sx={{
                  fontSize: 12.5,
                  "& .MuiAlert-icon": { fontSize: 18 },
                }}
              >
                No financial tables yet. Add one, or generate a table from Ask AI and edit it here.
              </Alert>
            ) : (
              <Stack spacing={1.3}>
                {financeTableSections.map((item) => (
                  <Box
                    key={item.section.id}
                    sx={{
                      borderRadius: 2,
                      border: "1px solid #E5E7EB",
                      bgcolor: "#FFFFFF",
                      p: 1.3,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.7 }}>
                      <Typography
                        sx={{
                          flex: 1,
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#334155",
                          lineHeight: 1.3,
                        }}
                        noWrap
                      >
                        {item.chapterTitle}
                      </Typography>
                      <Chip
                        size="small"
                        label={
                          item.section.content.type === "comparison_table"
                            ? "Comparison"
                            : "Table"
                        }
                        sx={{
                          height: 20,
                          fontSize: 10.5,
                          fontWeight: 700,
                          bgcolor: "#EEF2FF",
                          color: "#1E40AF",
                        }}
                      />
                    </Stack>

                    <Typography
                      sx={{
                        fontSize: 11.5,
                        color: "#64748B",
                        mb: 1.1,
                        lineHeight: 1.45,
                      }}
                    >
                      {getFinanceTableSummary(item.section)}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedChapterId(item.chapterId);
                          setSelectedSectionId(item.section.id);
                          setEditingFinanceSection(item.section);
                        }}
                        sx={{
                          textTransform: "none",
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: "#1D4ED8",
                          minWidth: 0,
                          px: 0.8,
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedChapterId(item.chapterId);
                          setSelectedSectionId(item.section.id);
                        }}
                        sx={{
                          textTransform: "none",
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: "#64748B",
                          minWidth: 0,
                          px: 0.8,
                        }}
                      >
                        Focus
                      </Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>
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
    </>
  );
};

export default ManageActionArea;
