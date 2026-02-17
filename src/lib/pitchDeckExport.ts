// src/lib/pitchDeckExport.ts
// Client-side PDF export helper for pitch deck slides

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  A4_MARGIN_MM,
  PPTX_TYPOGRAPHY,
  sanitizeFileName,
} from "@/lib/exportStyles";

export { sanitizeFileName };

/**
 * Paper size dimensions in mm for PDF export.
 */
const PAPER_DIMENSIONS: Record<string, { width: number; height: number; orientation: "landscape" | "portrait" }> = {
  "16:9": { width: 338.67, height: 190.5, orientation: "landscape" },
  "4:3": { width: 254, height: 190.5, orientation: "landscape" },
  A4: { width: 210, height: 297, orientation: "portrait" },
};

export type PitchDeckPdfExportOptions = {
  title: string;
  paperSize: string;
  slideElements: HTMLElement[];
};

/**
 * Export pitch deck slides to PDF by capturing each slide element as an image.
 * 
 * @param options - Export options including title, paper size, and slide DOM elements
 * @returns A Blob containing the PDF
 */
export const exportPitchDeckToPdf = async (
  options: PitchDeckPdfExportOptions
): Promise<Blob> => {
  const { title, paperSize, slideElements } = options;

  if (slideElements.length === 0) {
    throw new Error("No slides to export");
  }

  const dimensions = PAPER_DIMENSIONS[paperSize] ?? PAPER_DIMENSIONS["16:9"]!;

  const pdf = new jsPDF({
    orientation: dimensions.orientation,
    unit: "mm",
    format: [dimensions.width, dimensions.height],
  });

  const pageWidth = dimensions.orientation === "landscape" ? dimensions.width : dimensions.width;
  const pageHeight = dimensions.orientation === "landscape" ? dimensions.height : dimensions.height;
  const margin = paperSize === "A4" ? A4_MARGIN_MM : 5;
  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - margin * 2;

  for (let i = 0; i < slideElements.length; i++) {
    const element = slideElements[i]!;

    // Add new page for slides after the first
    if (i > 0) {
      pdf.addPage([dimensions.width, dimensions.height], dimensions.orientation);
    }

    try {
      // Capture the slide element as an image
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FFFFFF",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      // Calculate dimensions to fit within available space
      let imgWidth = availableWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If image height exceeds available height, scale down
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }

      // Center the image on the page
      const xOffset = margin + (availableWidth - imgWidth) / 2;
      const yOffset = margin + (availableHeight - imgHeight) / 2;

      pdf.addImage(imgData, "PNG", xOffset, yOffset, imgWidth, imgHeight);
    } catch (err) {
      console.error(`Failed to capture slide ${i + 1}:`, err);
      // Add a placeholder page for failed slides
      pdf.setFontSize(PPTX_TYPOGRAPHY.body);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Slide ${i + 1} - Failed to render`, pageWidth / 2, pageHeight / 2, {
        align: "center",
      });
    }
  }

  // Set PDF metadata
  pdf.setProperties({
    title: title,
    creator: "SiliconPlan",
  });

  return pdf.output("blob");
};

/**
 * Download a blob as a file.
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
