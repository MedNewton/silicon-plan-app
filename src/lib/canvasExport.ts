// src/lib/canvasExport.ts
// Client-side PPTX export helper for canvas models

import PptxGenJS from "pptxgenjs";
import type {
  WorkspaceCanvasTemplateType,
  CanvasSectionsData,
  CanvasSectionItem,
} from "@/types/workspaces";
import {
  DEFAULT_EXPORT_FONT_FAMILY,
  PPTX_TYPOGRAPHY,
  sanitizeFileName,
} from "@/lib/exportStyles";

export { sanitizeFileName };

const normalizePptxText = (
  value: string | null | undefined,
  maxChars = 1600
): string => {
  if (!value) return "";
  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "  ")
    .replace(/\u0000/g, "")
    .replace(/[ \u00A0]{2,}/g, " ")
    .trim();
  return normalized.length > maxChars ? `${normalized.slice(0, maxChars - 1)}…` : normalized;
};

const addCanvasText = (
  slide: ReturnType<PptxGenJS["addSlide"]>,
  text: string | null | undefined,
  options: NonNullable<Parameters<ReturnType<PptxGenJS["addSlide"]>["addText"]>[1]>
) => {
  slide.addText(normalizePptxText(text), {
    fit: "shrink",
    breakLine: true,
    margin: 2,
    ...options,
  });
};

// Section label mapping per template type
const SECTION_LABELS: Record<string, Record<string, string>> = {
  "business-model": {
    "key-partners": "Key Partners",
    "key-activities": "Key Activities",
    "key-resources": "Key Resources",
    "value-proposition": "Value Proposition",
    "customer-relationships": "Customer Relationships",
    channels: "Channels",
    "customer-segments": "Customer Segments",
    "cost-structure": "Cost Structure",
    "revenue-streams": "Revenue Streams",
  },
  lean: {
    problem: "Problem",
    solution: "Solution",
    "unique-value-proposition": "Unique Value Proposition",
    "unfair-advantage": "Unfair Advantage",
    "customer-segments": "Customer Segments",
    "key-metrics": "Key Metrics",
    channels: "Channels",
    "cost-structure": "Cost Structure",
    "revenue-streams": "Revenue Streams",
  },
  startup: {
    problem: "Problem",
    solution: "Solution",
    "customer-segments": "Customer Segments",
    "unique-value-proposition": "Unique Value Proposition",
    "unfair-advantage": "Unfair Advantage",
    channels: "Channels",
    "key-metrics": "Key Metrics",
    "cost-structure": "Cost Structure",
    "revenue-streams": "Revenue Streams",
  },
  "value-proposition": {
    "products-services": "Products & Services",
    "pain-relievers": "Pain Relievers",
    "gain-creators": "Gain Creators",
    "customer-jobs": "Customer Jobs",
    pains: "Pains",
    gains: "Gains",
  },
  pitch: {
    problem: "Problem",
    solution: "Solution",
    "market-size": "Market Size",
    "business-model": "Business Model",
    traction: "Traction",
    team: "Team",
    competition: "Competition",
    financials: "Financials",
    ask: "Ask",
  },
  "four-quarters": {
    "q1-objectives": "Q1 Objectives",
    "q1-milestones": "Q1 Milestones",
    "q1-metrics": "Q1 Metrics",
    "q1-risks": "Q1 Risks",
    "q2-objectives": "Q2 Objectives",
    "q2-milestones": "Q2 Milestones",
    "q2-metrics": "Q2 Metrics",
    "q2-risks": "Q2 Risks",
    "q3-objectives": "Q3 Objectives",
    "q3-milestones": "Q3 Milestones",
    "q3-metrics": "Q3 Metrics",
    "q3-risks": "Q3 Risks",
    "q4-objectives": "Q4 Objectives",
    "q4-milestones": "Q4 Milestones",
    "q4-metrics": "Q4 Metrics",
    "q4-risks": "Q4 Risks",
  },
};

const getSectionLabel = (templateType: string, sectionId: string): string => {
  return SECTION_LABELS[templateType]?.[sectionId] ?? sectionId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const getSectionIds = (templateType: string): string[] => {
  return Object.keys(SECTION_LABELS[templateType] ?? {});
};

// Template type display names
const TEMPLATE_NAMES: Record<string, string> = {
  "business-model": "Business Model Canvas",
  lean: "Lean Canvas",
  startup: "Startup Canvas",
  "value-proposition": "Value Proposition Canvas",
  pitch: "Pitch Canvas",
  "four-quarters": "Four Quarters Canvas",
};

export type CanvasPptxExportOptions = {
  title: string;
  templateType: WorkspaceCanvasTemplateType;
  sectionsData: CanvasSectionsData;
  workspaceName?: string | null;
  workspaceLogoDataUrl?: string | null;
};

/**
 * Export canvas model to PPTX.
 * Creates a title slide + one slide per section with items.
 */
export const exportCanvasToPptx = async (
  options: CanvasPptxExportOptions
): Promise<Blob> => {
  const {
    title,
    templateType,
    sectionsData,
    workspaceName,
    workspaceLogoDataUrl,
  } = options;

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 inches
  pptx.author = "SiliconPlan";
  pptx.title = title;

  const templateName = TEMPLATE_NAMES[templateType] ?? "Canvas Model";
  const sectionIds = getSectionIds(templateType);
  const resolvedWorkspaceName =
    typeof workspaceName === "string" && workspaceName.trim().length > 0
      ? workspaceName.trim()
      : null;

  // --- Title Slide ---
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "4C6AD2" };

  addCanvasText(titleSlide, title, {
    x: 0.5,
    y: 2.0,
    w: 12.33,
    h: 1.5,
    fontSize: PPTX_TYPOGRAPHY.title + 4,
    fontFace: DEFAULT_EXPORT_FONT_FAMILY,
    color: "FFFFFF",
    bold: true,
    align: "center",
  });

  addCanvasText(titleSlide, templateName, {
    x: 0.5,
    y: 3.5,
    w: 12.33,
    h: 0.8,
    fontSize: PPTX_TYPOGRAPHY.subheading,
    fontFace: DEFAULT_EXPORT_FONT_FAMILY,
    color: "C2D0F7",
    align: "center",
  });

  addCanvasText(
    titleSlide,
    resolvedWorkspaceName
      ? `Generated for ${resolvedWorkspaceName} by SiliconPlan`
      : "Generated by SiliconPlan",
    {
    x: 0.5,
    y: 6.5,
    w: 12.33,
    h: 0.5,
    fontSize: PPTX_TYPOGRAPHY.caption,
    fontFace: DEFAULT_EXPORT_FONT_FAMILY,
    color: "8B9FE8",
    align: "center",
    }
  );

  if (workspaceLogoDataUrl) {
    titleSlide.addImage({
      data: workspaceLogoDataUrl,
      x: 10.7,
      y: 0.3,
      w: 2.1,
      h: 0.72,
    });
  }

  // --- Section Slides ---
  // Group sections into slides (max 3 sections per slide for readability)
  const SECTIONS_PER_SLIDE = 3;
  const sectionGroups: string[][] = [];

  for (let i = 0; i < sectionIds.length; i += SECTIONS_PER_SLIDE) {
    sectionGroups.push(sectionIds.slice(i, i + SECTIONS_PER_SLIDE));
  }

  for (const group of sectionGroups) {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };

    // Add a thin colored bar at the top
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 0.08,
      fill: { color: "4C6AD2" },
    });

    const colWidth = 12.33 / group.length;

    group.forEach((sectionId, colIndex) => {
      const label = getSectionLabel(templateType, sectionId);
      const items: CanvasSectionItem[] = sectionsData[sectionId] ?? [];
      const xPos = 0.5 + colIndex * colWidth;

      // Section title
      addCanvasText(slide, label.toUpperCase(), {
        x: xPos,
        y: 0.3,
        w: colWidth - 0.3,
        h: 0.5,
        fontSize: PPTX_TYPOGRAPHY.bodySmall,
        fontFace: DEFAULT_EXPORT_FONT_FAMILY,
        color: "4C6AD2",
        bold: true,
      });

      // Section divider line
      slide.addShape(pptx.ShapeType.rect, {
        x: xPos,
        y: 0.8,
        w: colWidth - 0.5,
        h: 0.02,
        fill: { color: "E5E7EB" },
      });

      // Section items
      if (items.length === 0) {
        addCanvasText(slide, "No items", {
          x: xPos,
          y: 1.0,
          w: colWidth - 0.3,
          h: 0.4,
          fontSize: PPTX_TYPOGRAPHY.caption,
          fontFace: DEFAULT_EXPORT_FONT_FAMILY,
          color: "9CA3AF",
          italic: true,
        });
      } else {
        let yCursor = 1.0;
        const maxContentY = 6.7;

        items.forEach((item) => {
          if (yCursor > maxContentY) return;
          const isDraft = item.generation_status === "draft";
          const titlePrefix = isDraft ? "[DRAFT] " : "";
          const titleText = `${titlePrefix}${item.title}`;

          addCanvasText(slide, titleText, {
            x: xPos,
            y: yCursor,
            w: colWidth - 0.3,
            h: 0.33,
            fontSize: PPTX_TYPOGRAPHY.bodySmall,
            fontFace: DEFAULT_EXPORT_FONT_FAMILY,
            color: isDraft ? "92400E" : "111827",
            bold: true,
          });

          yCursor += 0.32;
          if (item.description && yCursor <= maxContentY) {
            addCanvasText(slide, item.description, {
              x: xPos,
              y: yCursor,
              w: colWidth - 0.3,
              h: 0.32,
              fontSize: PPTX_TYPOGRAPHY.caption,
              fontFace: DEFAULT_EXPORT_FONT_FAMILY,
              color: "6B7280",
            });
            yCursor += 0.31;
          }
          yCursor += 0.09;
        });
      }
    });

    if (workspaceLogoDataUrl) {
      slide.addImage({
        data: workspaceLogoDataUrl,
        x: 10.7,
        y: 0.12,
        w: 2.1,
        h: 0.72,
      });
    }

    if (resolvedWorkspaceName) {
      addCanvasText(slide, resolvedWorkspaceName, {
        x: 0.5,
        y: 7.08,
        w: 4.2,
        h: 0.2,
        fontSize: PPTX_TYPOGRAPHY.caption,
        fontFace: DEFAULT_EXPORT_FONT_FAMILY,
        color: "9CA3AF",
      });
    }
  }

  // Generate the PPTX as a blob
  const output = await pptx.write({ outputType: "blob" });
  return output as Blob;
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
