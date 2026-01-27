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
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export type ExportSettings = {
  paperSize: string;
  pitchColor: string;
  fontFamily: string;
  fontSize: string;
};

export type ExportSettingsSidebarProps = Readonly<{
  canvasRef?: RefObject<HTMLDivElement | null>;
  canvasTitle?: string;
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
  canvasRef,
  canvasTitle = "Canvas Model",
  onClose,
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    paperSize: "A4",
    pitchColor: "blue",
    fontFamily: "Roboto",
    fontSize: "15 px",
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleSettingChange = (key: keyof ExportSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleDownload = async () => {
    if (!canvasRef?.current) {
      console.error("Canvas reference not available");
      return;
    }

    setIsExporting(true);

    try {
      const element = canvasRef.current;
      const paperSize = PAPER_SIZES.find((p) => p.value === settings.paperSize) ?? PAPER_SIZES[0]!;

      // Capture the canvas element as an image
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FFFFFF",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      // Calculate dimensions for PDF
      // Paper sizes are in mm, convert to points (1mm = 2.83465 points)
      const pdfWidth = paperSize.width;
      const pdfHeight = paperSize.height;

      // Determine orientation based on canvas aspect ratio
      const canvasAspectRatio = canvas.width / canvas.height;
      const isLandscape = canvasAspectRatio > 1;

      // Create PDF with appropriate orientation
      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "mm",
        format: [paperSize.width, paperSize.height],
      });

      // Calculate image dimensions to fit the page with margins
      const margin = 10; // 10mm margin
      const availableWidth = (isLandscape ? pdfHeight : pdfWidth) - margin * 2;
      const availableHeight = (isLandscape ? pdfWidth : pdfHeight) - margin * 2;

      let imgWidth = availableWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If image height exceeds available height, scale down
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }

      // Center the image on the page
      const xOffset = ((isLandscape ? pdfHeight : pdfWidth) - imgWidth) / 2;
      const yOffset = ((isLandscape ? pdfWidth : pdfHeight) - imgHeight) / 2;

      // Add the image to the PDF
      pdf.addImage(imgData, "PNG", xOffset, yOffset, imgWidth, imgHeight);

      // Generate filename from canvas title
      const filename = `${canvasTitle.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

      // Download the PDF
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
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
      </Box>

      {/* Download button at bottom */}
      <Box sx={{ p: 3, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={
            isExporting ? (
              <CircularProgress size={20} sx={{ color: "#FFFFFF" }} />
            ) : (
              <FileDownloadOutlinedIcon sx={{ fontSize: 20 }} />
            )
          }
          onClick={handleDownload}
          disabled={isExporting || !canvasRef?.current}
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
          {isExporting ? "Exporting..." : "Download PDF"}
        </Button>
      </Box>
    </Box>
  );
};

export default ExportSettingsSidebar;
