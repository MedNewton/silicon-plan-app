// src/lib/businessPlanPdfExport.ts
// PDF export using jsPDF's built-in html() plugin for selectable text and proper pagination.

import jsPDF from "jspdf";

type PaperSize = "A4" | "Letter" | "A3";

/** Paper dimensions in mm */
const PAPER_MM: Record<PaperSize, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  Letter: { w: 215.9, h: 279.4 },
  A3: { w: 297, h: 420 },
};

/** Convert mm to px at 96 DPI */
const mmToPx96 = (mm: number): number => (mm * 96) / 25.4;

export type PdfExportOptions = {
  paperSize?: PaperSize;
  marginMm?: number;
  fontFamily?: string;
};

/**
 * Render an HTML string to a jsPDF document using `pdf.html()`.
 *
 * This produces a real PDF with selectable text and respects CSS page break
 * rules (`break-inside: avoid`, `break-after: avoid`, etc.).
 */
export async function renderHtmlToPdf(
  htmlString: string,
  options: PdfExportOptions = {},
): Promise<jsPDF> {
  const paperSize = options.paperSize ?? "A4";
  const marginMm = options.marginMm ?? 25;
  const fontFamily = options.fontFamily ?? "Helvetica";

  const paper = PAPER_MM[paperSize];
  const contentWidthMm = paper.w - 2 * marginMm;
  const contentWidthPx = mmToPx96(contentWidthMm);

  // Build an offscreen container so html2canvas (internal) can measure layout.
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = `${contentWidthPx}px`;
  container.style.background = "#FFFFFF";
  container.style.fontFamily = `${fontFamily}, Arial, sans-serif`;
  container.innerHTML = htmlString;
  document.body.appendChild(container);

  // Use the <body> inside the parsed HTML if it exists, otherwise use the
  // container itself (innerHTML doesn't keep <html>/<body> wrappers).
  const bodyEl = container.querySelector("body");
  const sourceEl = (bodyEl ?? container) as HTMLElement;

  // Hoist the <style> from <head> (if present) into our container so
  // html2canvas sees the stylesheet.
  const headStyle = container.querySelector("head style");
  if (headStyle) {
    container.insertBefore(headStyle.cloneNode(true), container.firstChild);
  }

  const jsPdfFormat: string | [number, number] =
    paperSize === "A4" ? "a4" : paperSize === "Letter" ? "letter" : [paper.w, paper.h];

  const pdf = new jsPDF({
    unit: "mm",
    format: jsPdfFormat,
    orientation: "portrait",
  });

  const htmlOptions: Record<string, unknown> = {
    callback: (_doc: jsPDF) => {/* resolved inside the promise wrapper */},
    margin: [marginMm, marginMm, marginMm, marginMm],
    autoPaging: "text",
    width: contentWidthMm,
    windowWidth: contentWidthPx,
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#FFFFFF",
    },
  };

  await new Promise<void>((resolve) => {
    htmlOptions.callback = () => resolve();
    void pdf.html(sourceEl, htmlOptions as Parameters<typeof pdf.html>[1]);
  });

  container.remove();

  return pdf;
}
