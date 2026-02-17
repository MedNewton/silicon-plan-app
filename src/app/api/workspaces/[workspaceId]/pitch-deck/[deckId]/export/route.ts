// src/app/api/workspaces/[workspaceId]/pitch-deck/[deckId]/export/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import pptxgen from "pptxgenjs";
import path from "path";
import { readFile } from "fs/promises";
import { Buffer } from "buffer";
import { getPitchDeck } from "@/server/pitchDeck";
import { getSupabaseClient } from "@/lib/supabaseServer";
import type {
  PitchDeckSlide,
  PitchDeckSlideContent,
  PitchDeckTemplate,
  PitchDeckSettings,
} from "@/types/workspaces";
import { PPTX_TYPOGRAPHY, sanitizeFileName } from "@/lib/exportStyles";

export const runtime = "nodejs";

type LayoutPreset = {
  name: string;
  width: number;
  height: number;
  isCustom?: boolean;
};

type Slide = ReturnType<InstanceType<typeof pptxgen>["addSlide"]>;
type SlideTextOptions = NonNullable<Parameters<Slide["addText"]>[1]>;
type TableCell = {
  text?: string;
  options?: {
    bold?: boolean;
    color?: string;
    fill?: { color?: string };
  };
};
type TableRow = TableCell[];

type WorkspaceBranding = {
  workspaceName: string;
  logoDataUrl: string | null;
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
  const hexMatch = /#([0-9a-fA-F]{3,6})/.exec(trimmed);
  if (hexMatch) {
    return hexMatch[1]?.toUpperCase();
  }
  return trimmed.replace("#", "").toUpperCase();
};

const normalizePptxText = (
  value: string | null | undefined,
  maxChars = 2000
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

const addSlideText = (
  slide: Slide,
  text: string | null | undefined,
  options: SlideTextOptions
) => {
  slide.addText(normalizePptxText(text), {
    fit: "shrink",
    breakLine: true,
    margin: 2,
    ...options,
  });
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
  addSlideText(slide, title, {
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
  addSlideText(slide, text, {
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

const addWorkspaceBranding = (
  slide: Slide,
  layout: LayoutPreset,
  branding: WorkspaceBranding
) => {
  const rightPadding = layout.width * 0.05;
  const topPadding = layout.height * 0.03;
  const logoWidth = Math.max(Math.min(layout.width * 0.14, 2.1), 1.2);
  const logoHeight = logoWidth * 0.33;
  const textBlockWidth = Math.max(layout.width * 0.22, logoWidth + 0.2);
  const logoX = layout.width - rightPadding - logoWidth;
  const textX = layout.width - rightPadding - textBlockWidth;

  if (branding.logoDataUrl) {
    slide.addImage({
      data: branding.logoDataUrl,
      x: logoX,
      y: topPadding,
      w: logoWidth,
      h: logoHeight,
    });
  }

  if (branding.workspaceName.trim().length > 0) {
    addSlideText(slide, branding.workspaceName, {
      x: textX,
      y: branding.logoDataUrl ? topPadding + logoHeight + 0.04 : topPadding + 0.02,
      w: textBlockWidth,
      h: 0.2,
      align: "right",
      fontSize: PPTX_TYPOGRAPHY.caption,
      color: "9CA3AF",
      fontFace: "Roboto",
    });
  }
};

const addDraftBadge = (slide: Slide, layout: LayoutPreset) => {
  addSlideText(slide, "DRAFT", {
    x: layout.width * 0.03,
    y: layout.height * 0.03,
    w: Math.max(layout.width * 0.1, 0.95),
    h: 0.3,
    fontFace: "Roboto",
    fontSize: PPTX_TYPOGRAPHY.caption,
    bold: true,
    color: "92400E",
    align: "center",
    valign: "middle",
    fill: { color: "FEF3C7" },
    line: { color: "F59E0B" },
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
      addSlideText(slide, content.title, {
        x: layout.width * 0.1,
        y: layout.height * 0.4,
        w: layout.width * 0.8,
        h: layout.height * 0.2,
        fontFace,
        fontSize: Math.max(fontSize * 2, PPTX_TYPOGRAPHY.title),
        color: colors.title,
        align: "center",
        valign: "middle",
      });
      if (content.subtitle) {
        addSlideText(slide, content.subtitle, {
          x: layout.width * 0.1,
          y: layout.height * 0.58,
          w: layout.width * 0.8,
          h: layout.height * 0.1,
          fontFace,
          fontSize: Math.max(fontSize * 1.2, PPTX_TYPOGRAPHY.subheading),
          color: colors.content,
          align: "center",
        });
      }
      return;
    }
    case "title_bullets": {
      addTitle(
        slide,
        content.title,
        layout,
        colors,
        fontFace,
        Math.max(fontSize * 1.6, PPTX_TYPOGRAPHY.heading)
      );
      addBodyText(slide, bulletsToText(content.bullets), layout, colors, fontFace, fontSize);
      return;
    }
    case "title_text": {
      addTitle(
        slide,
        content.title,
        layout,
        colors,
        fontFace,
        Math.max(fontSize * 1.6, PPTX_TYPOGRAPHY.heading)
      );
      addBodyText(slide, content.text, layout, colors, fontFace, fontSize);
      return;
    }
    case "title_image": {
      addTitle(
        slide,
        content.title,
        layout,
        colors,
        fontFace,
        Math.max(fontSize * 1.6, PPTX_TYPOGRAPHY.heading)
      );
      const marginX = layout.width * 0.08;
      const contentY = layout.height * 0.24;
      const contentHeight = layout.height - contentY - layout.height * 0.08;
      addSlideText(slide, content.imageUrl ? `Image: ${content.imageUrl}` : "Image placeholder", {
        x: marginX,
        y: contentY,
        w: layout.width - marginX * 2,
        h: contentHeight,
        fontFace,
        fontSize: Math.max(fontSize, PPTX_TYPOGRAPHY.bodySmall),
        color: colors.content,
        align: "center",
        valign: "middle",
        fill: { color: "F3F4F6" },
        line: { color: "D1D5DB" },
      });
      return;
    }
    case "two_columns": {
      addTitle(
        slide,
        content.title,
        layout,
        colors,
        fontFace,
        Math.max(fontSize * 1.6, PPTX_TYPOGRAPHY.heading)
      );
      const marginX = layout.width * 0.08;
      const contentY = layout.height * 0.24;
      const contentHeight = layout.height - contentY - layout.height * 0.08;
      const columnGap = layout.width * 0.04;
      const columnWidth = (layout.width - marginX * 2 - columnGap) / 2;
      const leftLines = [
        content.leftColumn.title ?? "",
        content.leftColumn.text ?? "",
        ...((content.leftColumn.bullets ?? []).map((b) => `- ${b}`)),
      ].filter((line) => line.length > 0);
      const rightLines = [
        content.rightColumn.title ?? "",
        content.rightColumn.text ?? "",
        ...((content.rightColumn.bullets ?? []).map((b) => `- ${b}`)),
      ].filter((line) => line.length > 0);
      addSlideText(slide, leftLines.join("\n"), {
        x: marginX,
        y: contentY,
        w: columnWidth,
        h: contentHeight,
        fontFace,
        fontSize,
        color: colors.content,
        valign: "top",
      });
      addSlideText(slide, rightLines.join("\n"), {
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
      addTitle(
        slide,
        content.title,
        layout,
        colors,
        fontFace,
        Math.max(fontSize * 1.6, PPTX_TYPOGRAPHY.heading)
      );
      const marginX = layout.width * 0.08;
      const contentY = layout.height * 0.24;
      const contentHeight = layout.height - contentY - layout.height * 0.1;
      const headerRow: TableRow = content.headers.map((header) => ({
        text: normalizePptxText(header, 220),
        options: { bold: true, color: colors.title, fill: { color: "EEF2FF" } },
      }));
      const rows: TableRow[] = [
        headerRow,
        ...content.rows.map((row) =>
          row.map((cell) => ({
            text: normalizePptxText(cell, 420),
            options: { color: colors.content },
          }))
        ),
      ];
      slide.addTable(rows, {
        x: marginX,
        y: contentY,
        w: layout.width - marginX * 2,
        h: contentHeight,
        fontFace,
        fontSize,
        margin: 2,
        border: { color: "E5E7EB", pt: 1 },
      });
      return;
    }
    case "timeline": {
      addTitle(
        slide,
        content.title,
        layout,
        colors,
        fontFace,
        Math.max(fontSize * 1.6, PPTX_TYPOGRAPHY.heading)
      );
      const lines = content.entries.map(
        (entry) => `${entry.date} - ${entry.title}${entry.description ? `: ${entry.description}` : ""}`
      );
      addBodyText(slide, lines.join("\n"), layout, colors, fontFace, fontSize);
      return;
    }
    case "team_grid": {
      addTitle(
        slide,
        content.title,
        layout,
        colors,
        fontFace,
        Math.max(fontSize * 1.6, PPTX_TYPOGRAPHY.heading)
      );
      const lines = content.members.map(
        (member) => `${member.name} - ${member.role}${member.bio ? `: ${member.bio}` : ""}`
      );
      addBodyText(slide, lines.join("\n"), layout, colors, fontFace, fontSize);
      return;
    }
    case "metrics": {
      addTitle(
        slide,
        content.title,
        layout,
        colors,
        fontFace,
        Math.max(fontSize * 1.6, PPTX_TYPOGRAPHY.heading)
      );
      const lines = content.metrics.map(
        (metric) => `${metric.value} ${metric.label}${metric.description ? ` (${metric.description})` : ""}`
      );
      addBodyText(slide, lines.join("\n"), layout, colors, fontFace, fontSize);
      return;
    }
    case "quote": {
      addSlideText(slide, `\"${content.quote}\"`, {
        x: layout.width * 0.1,
        y: layout.height * 0.35,
        w: layout.width * 0.8,
        h: layout.height * 0.3,
        fontFace,
        fontSize: Math.max(fontSize * 1.6, PPTX_TYPOGRAPHY.heading),
        color: colors.title,
        align: "center",
        valign: "middle",
      });
      if (content.author) {
        addSlideText(
          slide,
          `- ${content.author}${content.authorTitle ? `, ${content.authorTitle}` : ""}`,
          {
          x: layout.width * 0.15,
          y: layout.height * 0.62,
          w: layout.width * 0.7,
          h: layout.height * 0.1,
          fontFace,
          fontSize: Math.max(fontSize, PPTX_TYPOGRAPHY.body),
          color: colors.content,
          align: "center",
          }
        );
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
  backgroundImageData: string | null,
  branding: WorkspaceBranding
) => {
  const slide = pptx.addSlide();
  const isCover = slideData.slide_type === "cover";
  const colors = getTextColors(template, isCover);

  slide.background = backgroundImageData
    ? { data: backgroundImageData }
    : { color: getBackgroundColor(template, isCover) };

  renderSlideContent(slide, slideData.content, layout, colors, settings.fontFamily, settings.fontSize);
  if (slideData.content.generation_status === "draft") {
    addDraftBadge(slide, layout);
  }
  addWorkspaceBranding(slide, layout, branding);
};

const loadWorkspaceBranding = async (workspaceId: string): Promise<WorkspaceBranding> => {
  const client = getSupabaseClient();
  const { data } = await client
    .from("workspaces")
    .select("name,image_url")
    .eq("id", workspaceId)
    .maybeSingle();

  const workspaceName =
    data && typeof data.name === "string" && data.name.trim().length > 0
      ? data.name.trim()
      : "Workspace";

  const imageUrl = data?.image_url;
  if (!imageUrl || typeof imageUrl !== "string") {
    return { workspaceName, logoDataUrl: null };
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return { workspaceName, logoDataUrl: null };
    }
    const contentType = response.headers.get("content-type") ?? "image/png";
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return {
      workspaceName,
      logoDataUrl: `data:${contentType};base64,${base64}`,
    };
  } catch {
    return { workspaceName, logoDataUrl: null };
  }
};

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

    const body = (await req.json().catch(() => null)) as
      | { includeBranding?: boolean }
      | null;
    const includeBranding = body?.includeBranding ?? true;

    const deckData = await getPitchDeck({ pitchDeckId: deckId, userId, fresh: true });

    if (!deckData) {
      return new NextResponse("Pitch deck not found", { status: 404 });
    }

    const { pitchDeck, slides, template } = deckData;
    const layout = getLayout(pitchDeck.settings);
    const branding = includeBranding
      ? await loadWorkspaceBranding(pitchDeck.workspace_id)
      : null;

    const pptx = new pptxgen();
    if (layout.isCustom) {
      pptx.defineLayout({ name: layout.name, width: layout.width, height: layout.height });
    }
    pptx.layout = layout.name;

    const backgroundImageData = await getBackgroundImageData(template);
    slides.forEach((slideData) => {
      addSlideToDeck(
        pptx,
        slideData,
        template,
        layout,
        pitchDeck.settings,
        backgroundImageData,
        branding ?? { workspaceName: "", logoDataUrl: null }
      );
    });

    const fileName = `${sanitizeFileName(pitchDeck.title || "pitch-deck", "pitch-deck")}.pptx`;
    const buffer = (await pptx.write({ outputType: "arraybuffer" })) as ArrayBuffer;

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
