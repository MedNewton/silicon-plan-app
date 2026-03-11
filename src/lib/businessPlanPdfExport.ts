// src/lib/businessPlanPdfExport.ts
// PDF export using html2canvas + jsPDF with proper page-break logic.

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type PaperSize = "A4" | "Letter" | "A3";

/** Paper dimensions in CSS px at 96 DPI */
const PAPER_PX: Record<PaperSize, { w: number; h: number }> = {
  A4: { w: 794, h: 1123 },
  Letter: { w: 816, h: 1056 },
  A3: { w: 1123, h: 1587 },
};

const mmToPx = (mm: number): number => (mm * 96) / 25.4;

export type PdfExportOptions = {
  paperSize?: PaperSize;
  marginMm?: number;
  fontFamily?: string;
  fontSize?: number;
};

/**
 * Render an HTML string to PDF using html2canvas + jsPDF.
 *
 * Strategy:
 * 1. Inject the full HTML into an offscreen container at content-area width.
 * 2. Walk every `.export-block` (or top-level child) and measure its
 *    offsetTop + offsetHeight to decide page assignments — no cloneNode or
 *    re-rendering per page.
 * 3. Render the ENTIRE container once with html2canvas (single pass).
 * 4. Slice the resulting canvas into per-page strips, placing each strip
 *    with the correct vertical offset so margins are respected and no
 *    content is cut mid-block.
 */
export async function renderHtmlToPdf(
  htmlString: string,
  options: PdfExportOptions = {},
): Promise<jsPDF> {
  const paperSize = options.paperSize ?? "A4";
  const marginMm = options.marginMm ?? 25;
  const fontFamily = options.fontFamily ?? "Helvetica";
  const fontSize = options.fontSize ?? 14;

  const pagePx = PAPER_PX[paperSize];
  const marginPx = mmToPx(marginMm);
  const contentW = pagePx.w - 2 * marginPx;
  const contentH = pagePx.h - 2 * marginPx;

  // ---- 1. Build offscreen container ----
  const container = document.createElement("div");
  container.style.cssText = [
    "position:fixed",
    "left:-9999px",
    "top:0",
    `width:${contentW}px`,
    "background:#FFFFFF",
    `font-family:${fontFamily},Arial,sans-serif`,
    `font-size:${fontSize}px`,
    "color:#1F2933",
    "line-height:1.6",
  ].join(";");
  container.innerHTML = htmlString;
  document.body.appendChild(container);

  // innerHTML strips <html>/<head>/<body> wrappers but keeps their children.
  // Hoist any <style> tags that ended up as direct children so they apply.
  const styleTags = container.querySelectorAll("style");
  styleTags.forEach((tag) => {
    if (tag.parentElement === container) return; // already at top level
    container.insertBefore(tag.cloneNode(true), container.firstChild);
  });

  // Resolve the element whose children we paginate.
  const bodyEl = container.querySelector("body");
  const sourceEl = bodyEl ?? container;

  // Wait for any images (especially base64 logos) to finish loading
  const images = Array.from(sourceEl.querySelectorAll("img")) as HTMLImageElement[];
  await Promise.all(
    images.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
    )
  );

  // ---- 2. Force cover/final page elements to fill exactly one page ----
  // These use flexbox centering which needs an explicit height to work
  // in the offscreen container (vh units don't apply here).
  const coverPage = sourceEl.querySelector(".cover-page") as HTMLElement | null;
  const finalPage = sourceEl.querySelector(".final-page") as HTMLElement | null;
  if (coverPage) {
    coverPage.style.height = `${contentH}px`;
    coverPage.style.minHeight = `${contentH}px`;
    coverPage.style.maxHeight = `${contentH}px`;
    coverPage.style.overflow = "hidden";
  }
  if (finalPage) {
    finalPage.style.height = `${contentH}px`;
    finalPage.style.minHeight = `${contentH}px`;
    finalPage.style.maxHeight = `${contentH}px`;
    finalPage.style.overflow = "hidden";
  }

  // ---- 3. Measure block positions ----
  // Collect every direct child; if it is an .export-block we treat it as
  // indivisible.  For very tall blocks (taller than one content area) we
  // still accept them — they will be sliced across pages later.
  type Block = { top: number; height: number; fullPage?: boolean };
  const blocks: Block[] = [];
  const children = Array.from(sourceEl.children) as HTMLElement[];
  for (const child of children) {
    const isFullPage = child.classList.contains("cover-page") || child.classList.contains("final-page");
    blocks.push({ top: child.offsetTop, height: child.offsetHeight, fullPage: isFullPage });
  }

  // ---- 3. Assign blocks to pages ----
  // Each page has a "virtual Y budget" of contentH px.  We greedily pack
  // blocks; when the next block would overflow we start a new page.
  // We track the *actual* Y coordinate in the source where each page
  // starts/ends so we can slice the canvas later.
  type PageSlice = { yStart: number; yEnd: number };
  const pages: PageSlice[] = [];
  let pageYStart = 0;
  let usedH = 0;

  for (const block of blocks) {
    if (block.fullPage) {
      // Full-page block (cover/final): finish current page if it has content,
      // then give this block its own page.
      if (usedH > 0) {
        pages.push({ yStart: pageYStart, yEnd: pageYStart + usedH });
      }
      pages.push({ yStart: block.top, yEnd: block.top + block.height });
      pageYStart = block.top + block.height;
      usedH = 0;
      continue;
    }

    const blockRelY = block.top - pageYStart;
    const blockEnd = blockRelY + block.height;

    if (blockEnd > contentH && usedH > 0) {
      // This block overflows — finish current page and start a new one.
      pages.push({ yStart: pageYStart, yEnd: pageYStart + usedH });
      pageYStart = block.top;
      usedH = block.height;
    } else {
      usedH = blockEnd;
    }
  }
  // Push the last page.
  if (usedH > 0 || blocks.length === 0) {
    const totalH = sourceEl.scrollHeight;
    pages.push({ yStart: pageYStart, yEnd: Math.min(pageYStart + usedH, totalH) });
  }

  // ---- 4. Single-pass html2canvas render ----
  const scale = 2; // high-DPI
  const canvas = await html2canvas(sourceEl, {
    scale,
    useCORS: true,
    backgroundColor: "#FFFFFF",
    width: contentW,
    // Let html2canvas use the element's natural height
  });

  // ---- 5. Slice canvas into pages and build PDF ----
  const pdf = new jsPDF({
    unit: "px",
    format: [pagePx.w, pagePx.h],
    hotfixes: ["px_scaling"],
  });

  const canvasScaleY = canvas.height / sourceEl.scrollHeight;
  const canvasScaleX = canvas.width / contentW;

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();

    const slice = pages[i]!;
    const sliceH = slice.yEnd - slice.yStart;

    // If the slice is taller than one page (oversized block), we need to
    // split it into sub-pages.
    const subPages = Math.ceil(sliceH / contentH);

    for (let sub = 0; sub < subPages; sub++) {
      if (sub > 0) pdf.addPage();

      const subYStart = slice.yStart + sub * contentH;
      const subYEnd = Math.min(subYStart + contentH, slice.yEnd);
      const subSliceH = subYEnd - subYStart;

      // Source rect in canvas coordinates
      const sx = 0;
      const sy = Math.round(subYStart * canvasScaleY);
      const sw = canvas.width;
      const sh = Math.round(subSliceH * canvasScaleY);

      if (sh <= 0 || sw <= 0) continue;

      // Create a sub-canvas for this page slice
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = sw;
      pageCanvas.height = sh;
      const ctx = pageCanvas.getContext("2d");
      if (!ctx) continue;

      // Fill white background first
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, sw, sh);

      // Draw the slice
      ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);

      const imgData = pageCanvas.toDataURL("image/png");
      const imgW = contentW;
      const imgH = sh / canvasScaleX;

      pdf.addImage(imgData, "PNG", marginPx, marginPx, imgW, imgH);
    }
  }

  container.remove();
  return pdf;
}
