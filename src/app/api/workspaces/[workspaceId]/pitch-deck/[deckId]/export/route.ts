// src/app/api/workspaces/[workspaceId]/pitch-deck/[deckId]/export/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import pptxgen from "pptxgenjs";
import type { Slide, TableRow } from "pptxgenjs";
import path from "path";
import { readFile } from "fs/promises";
import { getPitchDeck } from "@/server/pitchDeck";
import type {
  PitchDeckSlide,
  PitchDeckSlideContent,
  PitchDeckTemplate,
  PitchDeckSettings,
} from "@/types/workspaces";

export const runtime = "nodejs";

type LayoutPreset = {
  name: string;
  width: number;
  height: number;
  isCustom?: boolean;
};

const getLayout = (settings: PitchDeckSettings): LayoutPreset => {
  switch (settings.paperSize) {
    case "4:3":
      return { name: "LAYOUT_4x3", width: 10, height: 7.5 };
    case "A4":
      return { name: "LAYOUT_A4", width: 8.27, height: 11.69, isCustom: true };
    case "16:9":
    default:
      return { name: "LAYOUT_WIDE", width: 13.33, height: 7.5 };
  }
};

const normalizeColor = (color?: string | null): string | undefined => {
  if (!color) return undefined;
  const trimmed = color.trim();
  if (!trimmed) return undefined;
  const hexMatch = trimmed.match(/#([0-9a-fA-F]{3,6})/);
  if (hexMatch) {
    return hexMatch[1].toUpperCase();
  }
  return trimmed.replace("#", "").toUpperCase();
};

const TEMPLATE_BG_FILES: Record<string, string> = {
  concept: "1.png",
  prototype: "2.png",
  growth: "3.png",
  impact: "4.png",
  innovation: "5.png",
  corporate: "6.png",
};

const getTemplateKey = (template: PitchDeckTemplate | null): string | null => {
  const name = template?.name?.toLowerCase() ?? "";
  if (!name) return null;
  if (name.includes("concept")) return "concept";
  if (name.includes("prototype")) return "prototype";
  if (name.includes("growth")) return "growth";
  if (name.includes("impact")) return "impact";
  if (name.includes("innovation")) return "innovation";
  if (name.includes("corporate")) return "corporate";
  return null;
};

const getBackgroundImageData = async (
  template: PitchDeckTemplate | null
): Promise<string | null> => {
  const key = getTemplateKey(template);
  if (!key) return null;
  const fileName = TEMPLATE_BG_FILES[key];
  if (!fileName) return null;
  const filePath = path.join(process.cwd(), "src/assets/deck-bg", fileName);
  try {
    const data = await readFile(filePath);
    return `data:image/png;base64,${data.toString("base64")}`;
  } catch (error) {
    console.warn("Failed to load deck background image:", filePath, error);
    return null;
  }
};

const getBackgroundColor = (template: PitchDeckTemplate | null, isCover: boolean): string => {
  const design = isCover ? template?.cover_design : template?.slide_design;
  const bg = design?.background;

  if (bg?.color) {
    return normalizeColor(bg.color) ?? "FFFFFF";
  }

  if (bg?.gradient) {
    return normalizeColor(bg.gradient) ?? "FFFFFF";
  }

  if (template?.color_scheme?.background) {
    return normalizeColor(template.color_scheme.background) ?? "FFFFFF";
  }

  return "FFFFFF";
};

const getTextColors = (template: PitchDeckTemplate | null, isCover: boolean) => {
  const design = isCover ? template?.cover_design : template?.slide_design;
  const title = normalizeColor(design?.titleStyle?.color) ?? "111827";
  const content =
    normalizeColor(isCover ? design?.titleStyle?.color : template?.slide_design?.contentStyle?.color) ??
    "111827";

  return { title, content };
};

const addTitle = (
  slide: Slide,
  title: string,
  layout: LayoutPreset,
  colors: { title: string },
  fontFace: string,
  fontSize: number,
  isCentered = false
) => {
  const marginX = layout.width * 0.08;
  const titleHeight = layout.height * 0.12;
  slide.addText(title, {
    x: marginX,
    y: layout.height * 0.08,
    w: layout.width - marginX * 2,
    h: titleHeight,
    fontFace,
    fontSize,
    color: colors.title,
    align: isCentered ? "center" : "left",
    valign: "middle",
  });
};

const addBodyText = (
  slide: Slide,
  text: string,
  layout: LayoutPreset,
  colors: { content: string },
  fontFace: string,
  fontSize: number
) => {
  const marginX = layout.width * 0.08;
  const contentY = layout.height * 0.24;
  const contentHeight = layout.height - contentY - layout.height * 0.08;
  slide.addText(text, {
    x: marginX,
    y: contentY,
    w: layout.width - marginX * 2,
    h: contentHeight,
    fontFace,
    fontSize,
    color: colors.content,
    valign: "top",
  });
};

const bulletsToText = (bullets: string[]) => bullets.map((b) => `- ${b}`).join("\n");

const renderSlideContent = (
  slide: Slide,
  content: PitchDeckSlideContent,
  layout: LayoutPreset,
  colors: { title: string; content: string },
  fontFace: string,
  fontSize: number
) => {
  switch (content.type) {
    case "title_only": {
      slide.addText(content.title, {
        x: layout.width * 0.1,
        y: layout.height * 0.4,
        w: layout.width * 0.8,
        h: layout.height * 0.2,
        fontFace,
        fontSize: Math.max(fontSize * 2, 28),
        color: colors.title,
        align: "center",
        valign: "middle",
      });
      if (content.subtitle) {
        slide.addText(content.subtitle, {
          x: layout.width * 0.1,
          y: layout.height * 0.58,
          w: layout.width * 0.8,
          h: layout.height * 0.1,
          fontFace,
          fontSize: Math.max(fontSize * 1.2, 16),
          color: colors.content,
          align: "center",
        });
      }
      return;
    }
    case "title_bullets": {
      addTitle(slide, content.title, layout, colors, fontFace, Math.max(fontSize * 1.6, 22));
      addBodyText(slide, bulletsToText(content.bullets), layout, colors, fontFace, fontSize);
      return;
    }
    case "title_text": {
      addTitle(slide, content.title, layout, colors, fontFace, Math.max(fontSize * 1.6, 22));
      addBodyText(slide, content.text, layout, colors, fontFace, fontSize);
      return;
    }
    case "title_image": {
      addTitle(slide, content.title, layout, colors, fontFace, Math.max(fontSize * 1.6, 22));
      const marginX = layout.width * 0.08;
      const contentY = layout.height * 0.24;
      const contentHeight = layout.height - contentY - layout.height * 0.08;
      slide.addText(content.imageUrl ? `Image: ${content.imageUrl}` : "Image placeholder", {
        x: marginX,
        y: contentY,
        w: layout.width - marginX * 2,
        h: contentHeight,
        fontFace,
        fontSize: Math.max(fontSize, 12),
        color: colors.content,
        align: "center",
        valign: "middle",
        fill: { color: "F3F4F6" },
        line: { color: "D1D5DB" },
      });
      return;
    }
    case "two_columns": {
      addTitle(slide, content.title, layout, colors, fontFace, Math.max(fontSize * 1.6, 22));
      const marginX = layout.width * 0.08;
      const contentY = layout.height * 0.24;
      const contentHeight = layout.height - contentY - layout.height * 0.08;
      const columnGap = layout.width * 0.04;
      const columnWidth = (layout.width - marginX * 2 - columnGap) / 2;
      const leftLines = [
        content.leftColumn.title ? content.leftColumn.title : "",
        content.leftColumn.text ? content.leftColumn.text : "",
        ...(content.leftColumn.bullets ? content.leftColumn.bullets.map((b) => `- ${b}`) : []),
      ].filter((line) => line.length > 0);
      const rightLines = [
        content.rightColumn.title ? content.rightColumn.title : "",
        content.rightColumn.text ? content.rightColumn.text : "",
        ...(content.rightColumn.bullets ? content.rightColumn.bullets.map((b) => `- ${b}`) : []),
      ].filter((line) => line.length > 0);
      slide.addText(leftLines.join("\n"), {
        x: marginX,
        y: contentY,
        w: columnWidth,
        h: contentHeight,
        fontFace,
        fontSize,
        color: colors.content,
        valign: "top",
      });
      slide.addText(rightLines.join("\n"), {
        x: marginX + columnWidth + columnGap,
        y: contentY,
        w: columnWidth,
        h: contentHeight,
        fontFace,
        fontSize,
        color: colors.content,
        valign: "top",
      });
      return;
    }
    case "comparison": {
      addTitle(slide, content.title, layout, colors, fontFace, Math.max(fontSize * 1.6, 22));
      const marginX = layout.width * 0.08;
      const contentY = layout.height * 0.24;
      const contentHeight = layout.height - contentY - layout.height * 0.1;
      const headerRow: TableRow = content.headers.map((header) => ({
        text: header,
        options: { bold: true, color: colors.title, fill: { color: "EEF2FF" } },
      }));
      const rows: TableRow[] = [
        headerRow,
        ...content.rows.map((row) => row.map((cell) => ({ text: cell, options: { color: colors.content } }))),
      ];
      slide.addTable(rows, {
        x: marginX,
        y: contentY,
        w: layout.width - marginX * 2,
        h: contentHeight,
        fontFace,
        fontSize,
        border: { color: "E5E7EB", pt: 1 },
      });
      return;
    }
    case "timeline": {
      addTitle(slide, content.title, layout, colors, fontFace, Math.max(fontSize * 1.6, 22));
      const lines = content.entries.map(
        (entry) => `${entry.date} - ${entry.title}${entry.description ? `: ${entry.description}` : ""}`
      );
      addBodyText(slide, lines.join("\n"), layout, colors, fontFace, fontSize);
      return;
    }
    case "team_grid": {
      addTitle(slide, content.title, layout, colors, fontFace, Math.max(fontSize * 1.6, 22));
      const lines = content.members.map(
        (member) => `${member.name} - ${member.role}${member.bio ? `: ${member.bio}` : ""}`
      );
      addBodyText(slide, lines.join("\n"), layout, colors, fontFace, fontSize);
      return;
    }
    case "metrics": {
      addTitle(slide, content.title, layout, colors, fontFace, Math.max(fontSize * 1.6, 22));
      const lines = content.metrics.map(
        (metric) => `${metric.value} ${metric.label}${metric.description ? ` (${metric.description})` : ""}`
      );
      addBodyText(slide, lines.join("\n"), layout, colors, fontFace, fontSize);
      return;
    }
    case "quote": {
      slide.addText(`\"${content.quote}\"`, {
        x: layout.width * 0.1,
        y: layout.height * 0.35,
        w: layout.width * 0.8,
        h: layout.height * 0.3,
        fontFace,
        fontSize: Math.max(fontSize * 1.6, 22),
        color: colors.title,
        align: "center",
        valign: "middle",
      });
      if (content.author) {
        slide.addText(`- ${content.author}${content.authorTitle ? `, ${content.authorTitle}` : ""}`, {
          x: layout.width * 0.15,
          y: layout.height * 0.62,
          w: layout.width * 0.7,
          h: layout.height * 0.1,
          fontFace,
          fontSize: Math.max(fontSize, 14),
          color: colors.content,
          align: "center",
        });
      }
      return;
    }
    case "blank":
      return;
    default:
      return;
  }
};

const addSlideToDeck = (
  pptx: pptxgen,
  slideData: PitchDeckSlide,
  template: PitchDeckTemplate | null,
  layout: LayoutPreset,
  settings: PitchDeckSettings,
  backgroundImageData: string | null
) => {
  const slide = pptx.addSlide();
  const isCover = slideData.slide_type === "cover";
  const colors = getTextColors(template, isCover);

  slide.background = backgroundImageData
    ? { data: backgroundImageData }
    : { color: getBackgroundColor(template, isCover) };

  renderSlideContent(slide, slideData.content, layout, colors, settings.fontFamily, settings.fontSize);
};

const sanitizeFileName = (value: string) =>
  value
    .replace(/[^a-z0-9-_]+/gi, " ")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

export async function POST(
  req: Request,
  ctx: { params: Promise<{ workspaceId: string; deckId: string }> }
) {
  try {
    const { userId } = await auth();
    const { deckId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!deckId) {
      return new NextResponse("Deck id is required", { status: 400 });
    }

    const deckData = await getPitchDeck({ pitchDeckId: deckId, userId, fresh: true });

    if (!deckData) {
      return new NextResponse("Pitch deck not found", { status: 404 });
    }

    const { pitchDeck, slides, template } = deckData;
    const layout = getLayout(pitchDeck.settings);

    const pptx = new pptxgen();
    if (layout.isCustom) {
      pptx.defineLayout({ name: layout.name, width: layout.width, height: layout.height });
    }
    pptx.layout = layout.name;

    const backgroundImageData = await getBackgroundImageData(template);
    slides.forEach((slideData) => {
      addSlideToDeck(pptx, slideData, template, layout, pitchDeck.settings, backgroundImageData);
    });

    const fileName = `${sanitizeFileName(pitchDeck.title || "pitch-deck")}.pptx`;
    const buffer = await pptx.write({ outputType: "nodebuffer" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename=\"${fileName}\"`,
      },
    });
  } catch (error) {
    console.error("Unexpected error in POST /pitch-deck/[deckId]/export:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
