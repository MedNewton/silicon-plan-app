"use client";

import type { FC, RefObject } from "react";
import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Switch,
} from "@mui/material";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";
import type { CanvasSectionsData, WorkspaceCanvasTemplateType } from "@/types/workspaces";
import { A4_MARGIN_MM, PPTX_TYPOGRAPHY, sanitizeFileName } from "@/lib/exportStyles";
import { fetchWorkspaceBranding, fetchImageAsDataUrl } from "@/lib/workspaceBranding";

export type ExportFormat = "pdf" | "pptx";

export type ExportSettings = {
  format: ExportFormat;
  paperSize: string;
  pitchColor: string;
  fontFamily: string;
  fontSize: string;
};

export type ExportSettingsSidebarProps = Readonly<{
  workspaceId: string;
  canvasRef?: RefObject<HTMLDivElement | null>;
  canvasTitle?: string;
  templateType?: WorkspaceCanvasTemplateType;
  sectionsData?: CanvasSectionsData;
  onClose?: () => void;
}>;

const PAPER_SIZES = [
  { value: "A4", label: "A4", width: 210, height: 297 },
  { value: "A3", label: "A3", width: 297, height: 420 },
  { value: "Letter", label: "Letter", width: 216, height: 279 },
  { value: "Legal", label: "Legal", width: 216, height: 356 },
];

const PITCH_COLORS = [
  { value: "blue", label: "Blue", color: "#4C6AD2" },
  { value: "green", label: "Green", color: "#22C55E" },
  { value: "purple", label: "Purple", color: "#8B5CF6" },
  { value: "red", label: "Red", color: "#EF4444" },
  { value: "orange", label: "Orange", color: "#F97316" },
];

const FONT_FAMILIES = ["Roboto", "Inter", "Open Sans", "Lato", "Poppins"];
const FONT_SIZES = ["12 px", "14 px", "15 px", "16 px", "18 px"];

const ExportSettingsSidebar: FC<ExportSettingsSidebarProps> = ({
  workspaceId,
  canvasRef,
  canvasTitle = "Canvas Model",
  templateType,
  sectionsData,
  onClose: _onClose,
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: "pdf",
    paperSize: "A4",
    pitchColor: "blue",
    fontFamily: "Roboto",
    fontSize: "15 px",
  });
  const [includeBrandingExport, setIncludeBrandingExport] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleSettingChange = (key: keyof ExportSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleDownloadPdf = async () => {
    if (!canvasRef?.current) {
      console.error("Canvas reference not available");
      toast.error("Canvas reference not available");
      return;
    }

    setIsExporting(true);

    try {
      const branding = includeBrandingExport
        ? await fetchWorkspaceBranding(workspaceId)
        : null;
      const workspaceName = includeBrandingExport ? branding?.workspaceName ?? null : null;
      const logoDataUrl = includeBrandingExport
        ? await fetchImageAsDataUrl(branding?.logoUrl ?? null)
        : null;
      const element = canvasRef.current;
      const paperSize = PAPER_SIZES.find((p) => p.value === settings.paperSize) ?? PAPER_SIZES[0]!;

      // Capture the canvas element as an image
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FFFFFF",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdfWidth = paperSize.width;
      const pdfHeight = paperSize.height;

      const canvasAspectRatio = canvas.width / canvas.height;
      const isLandscape = canvasAspectRatio > 1;

      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "mm",
        format: [paperSize.width, paperSize.height],
      });

      const margin = settings.paperSize === "A4" ? A4_MARGIN_MM : 10;
      const availableWidth = (isLandscape ? pdfHeight : pdfWidth) - margin * 2;
      const availableHeight = (isLandscape ? pdfWidth : pdfHeight) - margin * 2;

      let imgWidth = availableWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }

      const xOffset = ((isLandscape ? pdfHeight : pdfWidth) - imgWidth) / 2;
      const yOffset = ((isLandscape ? pdfWidth : pdfHeight) - imgHeight) / 2;

      pdf.addImage(imgData, "PNG", xOffset, yOffset, imgWidth, imgHeight);

      const pageWidth = isLandscape ? pdfHeight : pdfWidth;
      const pageHeight = isLandscape ? pdfWidth : pdfHeight;
      if (logoDataUrl) {
        try {
          const logoWidth = 24;
          const logoHeight = 8;
          const logoFormat = logoDataUrl.includes("image/jpeg") ? "JPEG" : "PNG";
          pdf.addImage(
            logoDataUrl,
            logoFormat,
            pageWidth - margin - logoWidth,
            margin * 0.45,
            logoWidth,
            logoHeight
          );
        } catch {
          // ignore logo render failures
        }
      }

      if (workspaceName && workspaceName.trim().length > 0) {
        pdf.setFontSize(PPTX_TYPOGRAPHY.caption);
        pdf.setTextColor(120, 127, 142);
        pdf.text(workspaceName.trim(), margin, pageHeight - margin * 0.35);
      }

      const filename = `${sanitizeFileName(canvasTitle, "canvas-export")}.pdf`;
      pdf.save(filename);
      toast.success("Exported as PDF successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPptx = async () => {
    setIsExporting(true);

    try {
      const branding = includeBrandingExport
        ? await fetchWorkspaceBranding(workspaceId)
        : null;
      const logoDataUrl = includeBrandingExport
        ? await fetchImageAsDataUrl(branding?.logoUrl ?? null)
        : null;
      const { exportCanvasToPptx, downloadBlob } = await import("@/lib/canvasExport");

      if (!templateType || !sectionsData) {
        throw new Error("Canvas data not available for PPTX export");
      }

      const blob = await exportCanvasToPptx({
        title: canvasTitle,
        templateType,
        sectionsData,
        workspaceName: includeBrandingExport ? branding?.workspaceName ?? null : null,
        workspaceLogoDataUrl: logoDataUrl,
      });

      const filename = `${sanitizeFileName(canvasTitle, "canvas-export")}.pptx`;
      downloadBlob(blob, filename);
      toast.success("Exported as PPTX successfully");
    } catch (error) {
      console.error("Error generating PPTX:", error);
      toast.error("Failed to export PPTX. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    if (settings.format === "pptx") {
      await handleDownloadPptx();
    } else {
      await handleDownloadPdf();
    }
  };

  return (
    <Box
      sx={{
        width: 280,
        bgcolor: "#FFFFFF",
        borderLeft: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: "#4C6AD2",
        }}
      >
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 600,
            color: "#FFFFFF",
          }}
        >
          Export Settings
        </Typography>
      </Box>

      {/* Settings form */}
      <Box
        sx={{
          flex: 1,
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        {/* Export Format */}
        <Box>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: "#6B7280",
              mb: 1,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Format
          </Typography>
          <ToggleButtonGroup
            value={settings.format}
            exclusive
            onChange={(_e, val: ExportFormat | null) => {
              if (val) handleSettingChange("format", val);
            }}
            fullWidth
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                py: 1,
                borderColor: "#E5E7EB",
                color: "#6B7280",
                "&.Mui-selected": {
                  bgcolor: "#EEF2FF",
                  color: "#4C6AD2",
                  borderColor: "#4C6AD2",
                  "&:hover": {
                    bgcolor: "#E0E7FF",
                  },
                },
              },
            }}
          >
            <ToggleButton value="pdf">
              <PictureAsPdfOutlinedIcon sx={{ fontSize: 16, mr: 0.75 }} />
              PDF
            </ToggleButton>
            <ToggleButton value="pptx">
              <SlideshowOutlinedIcon sx={{ fontSize: 16, mr: 0.75 }} />
              PPTX
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Paper Size */}
        <FormControl fullWidth size="small">
          <InputLabel
            sx={{
              fontSize: 13,
              color: "#6B7280",
              "&.Mui-focused": {
                color: "#4C6AD2",
              },
            }}
          >
            Paper Size
          </InputLabel>
          <Select
            value={settings.paperSize}
            label="Paper Size"
            onChange={(e) => handleSettingChange("paperSize", e.target.value)}
            sx={{
              fontSize: 14,
              borderRadius: 1.5,
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
            {PAPER_SIZES.map((size) => (
              <MenuItem key={size.value} value={size.value} sx={{ fontSize: 14 }}>
                {size.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Pitch Color */}
        <FormControl fullWidth size="small">
          <InputLabel
            sx={{
              fontSize: 13,
              color: "#6B7280",
              "&.Mui-focused": {
                color: "#4C6AD2",
              },
            }}
          >
            Pitch Color
          </InputLabel>
          <Select
            value={settings.pitchColor}
            label="Pitch Color"
            onChange={(e) => handleSettingChange("pitchColor", e.target.value)}
            sx={{
              fontSize: 14,
              borderRadius: 1.5,
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
            renderValue={(value) => {
              const color = PITCH_COLORS.find((c) => c.value === value);
              return (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: color?.color,
                    }}
                  />
                  {color?.label}
                </Box>
              );
            }}
          >
            {PITCH_COLORS.map((color) => (
              <MenuItem key={color.value} value={color.value} sx={{ fontSize: 14 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: color.color,
                    }}
                  />
                  {color.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Font Family */}
        <FormControl fullWidth size="small">
          <InputLabel
            sx={{
              fontSize: 13,
              color: "#6B7280",
              "&.Mui-focused": {
                color: "#4C6AD2",
              },
            }}
          >
            Font Family
          </InputLabel>
          <Select
            value={settings.fontFamily}
            label="Font Family"
            onChange={(e) => handleSettingChange("fontFamily", e.target.value)}
            sx={{
              fontSize: 14,
              borderRadius: 1.5,
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
            {FONT_FAMILIES.map((font) => (
              <MenuItem key={font} value={font} sx={{ fontSize: 14 }}>
                {font}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Font Size */}
        <FormControl fullWidth size="small">
          <InputLabel
            sx={{
              fontSize: 13,
              color: "#6B7280",
              "&.Mui-focused": {
                color: "#4C6AD2",
              },
            }}
          >
            Font Size
          </InputLabel>
          <Select
            value={settings.fontSize}
            label="Font Size"
            onChange={(e) => handleSettingChange("fontSize", e.target.value)}
            sx={{
              fontSize: 14,
              borderRadius: 1.5,
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
            {FONT_SIZES.map((size) => (
              <MenuItem key={size} value={size} sx={{ fontSize: 14 }}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
      </Box>

      {/* Download button at bottom */}
      <Box sx={{ p: 3, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={
            isExporting ? (
              <CircularProgress size={20} sx={{ color: "#FFFFFF" }} />
            ) : settings.format === "pptx" ? (
              <SlideshowOutlinedIcon sx={{ fontSize: 20 }} />
            ) : (
              <PictureAsPdfOutlinedIcon sx={{ fontSize: 20 }} />
            )
          }
          onClick={() => { void handleDownload(); }}
          disabled={isExporting || (settings.format === "pdf" && !canvasRef?.current)}
          sx={{
            bgcolor: "#4C6AD2",
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 600,
            py: 1.5,
            borderRadius: 2,
            textTransform: "none",
            "&:hover": {
              bgcolor: "#3B5AC5",
            },
            "&:disabled": {
              bgcolor: "#9CA3AF",
              color: "#FFFFFF",
            },
          }}
        >
          {isExporting
            ? "Exporting..."
            : settings.format === "pptx"
              ? "Download PPTX"
              : "Download PDF"}
        </Button>
      </Box>
    </Box>
  );
};

export default ExportSettingsSidebar;
