// src/app/api/workspaces/[workspaceId]/business-plan/generate/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

import {
  getOrCreateBusinessPlan,
  getBusinessPlanWithChapters,
  createChapter,
  createSection,
  deleteAllChapters,
} from "@/server/businessPlan";
import { getWorkspaceAiContext } from "@/lib/workspaceAiContext";
import { DEFAULT_BUSINESS_PLAN_TASK_TEMPLATE, translateTemplateTitle } from "@/server/businessPlanTaskTemplate";
import type { BusinessPlanSectionContent } from "@/types/workspaces";

// Allow up to 5 minutes for generating ~39 sub-chapters via OpenAI
export const maxDuration = 300;

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

/** Run promises in batches to avoid overwhelming the API */
async function batchAll<T>(
  tasks: (() => Promise<T>)[],
  batchSize: number,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((fn) => fn()));
    results.push(...batchResults);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Structured output: the AI returns a JSON array of section blocks.
// ---------------------------------------------------------------------------

type AiTextBlock = { type: "text"; text: string };
type AiSubsectionBlock = { type: "subsection"; text: string };
type AiListBlock = { type: "list"; items: string[]; ordered?: boolean };
type AiTableBlock = { type: "table"; headers: string[]; rows: string[][] };

type AiSectionBlock =
  | AiTextBlock
  | AiSubsectionBlock
  | AiListBlock
  | AiTableBlock;

const buildStructuredSystemPrompt = (locale?: string) => {
  const languageInstruction = locale === "it"
    ? "\nIMPORTANT: You MUST write ALL content (text, headings, list items, table values) in Italian.\n"
    : locale === "en"
      ? "\nIMPORTANT: You MUST write ALL content (text, headings, list items, table values) in English.\n"
      : "";

  return `You are Silicon Plan AI. Write professional, investor-ready business plan content.
${languageInstruction}Return ONLY a JSON array. No markdown, no text outside JSON.

Block types:
- {"type":"text","text":"paragraph"}
- {"type":"subsection","text":"heading"}
- {"type":"list","items":["a","b"],"ordered":false}
- {"type":"table","headers":["A","B"],"rows":[["1","2"]]}

Rules: Use "table" for ALL tabular data. Use "list" for ALL bullet/numbered items. No markdown (* or -) in text. No LaTeX. Write formulas in plain text. Return ONLY the JSON array.`;
};

/**
 * Parse the AI response into structured section blocks.
 * Handles: bare JSON arrays, objects wrapping an array, markdown code fences,
 * and plain text fallback.
 */
function parseAiSections(raw: string): AiSectionBlock[] {
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // If JSON parsing fails, fall back to a single text section
    return [{ type: "text", text: raw.trim() }];
  }

  // If AI returned a wrapper object like {"sections":[...]} or {"blocks":[...]},
  // unwrap to find the array.
  if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    const arrField = obj.sections ?? obj.blocks ?? obj.content ?? obj.data
      ?? Object.values(obj).find((v) => Array.isArray(v));
    if (Array.isArray(arrField)) {
      parsed = arrField;
    } else {
      // Single object — wrap in array
      parsed = [obj];
    }
  }

  if (!Array.isArray(parsed)) {
    return [{ type: "text", text: raw.trim() }];
  }

  const blocks: AiSectionBlock[] = [];

  for (const item of parsed) {
    if (typeof item !== "object" || item === null || !("type" in item)) {
      continue;
    }

    const obj = item as Record<string, unknown>;

    switch (obj.type) {
      case "text":
        if (typeof obj.text === "string" && obj.text.trim()) {
          blocks.push({ type: "text", text: obj.text.trim() });
        }
        break;
      case "subsection":
        if (typeof obj.text === "string" && obj.text.trim()) {
          blocks.push({ type: "subsection", text: obj.text.trim() });
        }
        break;
      case "list":
        if (Array.isArray(obj.items) && obj.items.length > 0) {
          const items = (obj.items as unknown[])
            .filter((i): i is string => typeof i === "string" && i.trim().length > 0)
            .map((i) => i.trim());
          if (items.length > 0) {
            blocks.push({
              type: "list",
              items,
              ordered: obj.ordered === true,
            });
          }
        }
        break;
      case "table":
        if (Array.isArray(obj.headers) && Array.isArray(obj.rows)) {
          const headers = (obj.headers as unknown[])
            .filter((h): h is string => typeof h === "string")
            .map((h) => h.trim());
          const rows = (obj.rows as unknown[])
            .filter((r): r is unknown[] => Array.isArray(r))
            .map((r) =>
              r.map((c) => (typeof c === "string" ? c.trim() : typeof c === "number" ? String(c) : ""))
            );
          if (headers.length > 0) {
            blocks.push({ type: "table", headers, rows });
          }
        }
        break;
      default:
        // Unknown type — treat as text if it has a text field
        if (typeof obj.text === "string" && obj.text.trim()) {
          blocks.push({ type: "text", text: obj.text.trim() });
        }
        break;
    }
  }

  // If parsing produced nothing usable, fall back
  if (blocks.length === 0) {
    return [{ type: "text", text: raw.trim() }];
  }

  return blocks;
}

/**
 * Convert a parsed AI block into a BusinessPlanSectionContent.
 */
function toSectionContent(block: AiSectionBlock): {
  sectionType: BusinessPlanSectionContent["type"];
  content: BusinessPlanSectionContent;
} {
  switch (block.type) {
    case "text":
      return { sectionType: "text", content: { type: "text", text: block.text } };
    case "subsection":
      return {
        sectionType: "subsection",
        content: { type: "subsection", text: block.text },
      };
    case "list":
      return {
        sectionType: "list",
        content: {
          type: "list",
          items: block.items,
          ordered: block.ordered ?? false,
        },
      };
    case "table":
      return {
        sectionType: "table",
        content: {
          type: "table",
          headers: block.headers,
          rows: block.rows,
        },
      };
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  req: Request,
  ctx: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await auth();
    const { workspaceId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId) {
      return new NextResponse("Workspace id is required", { status: 400 });
    }

    const body = (await req.json()) as { force?: boolean; locale?: string };
    const force = body.force === true;
    const locale = body.locale;

    // Get or create business plan
    const businessPlan = await getOrCreateBusinessPlan({ workspaceId, userId });

    // Check if chapters already exist
    const existing = await getBusinessPlanWithChapters({ workspaceId, userId });
    const hasChapters = (existing?.chapters ?? []).length > 0;

    if (hasChapters && !force) {
      return NextResponse.json({ skipped: true });
    }

    // Check workspace knowledge base
    const workspaceContext = await getWorkspaceAiContext(workspaceId);

    if (!workspaceContext.hasContext) {
      return NextResponse.json({ error: "no_context" });
    }

    // If force, delete all existing chapters first
    if (hasChapters && force) {
      await deleteAllChapters({ businessPlanId: businessPlan.id, userId });
    }

    // ── PHASE 1: Create all chapters sequentially (fast DB operations) ──

    type ChapterEntry = {
      subChapterId: string;
      h1Title: string;
      h2Title: string;
      aiPrompt: string;
    };

    const chapterEntries: ChapterEntry[] = [];

    for (const [h1Index, h1Task] of DEFAULT_BUSINESS_PLAN_TASK_TEMPLATE.entries()) {
      const parentChapter = await createChapter({
        businessPlanId: businessPlan.id,
        userId,
        title: translateTemplateTitle(h1Task.title, locale),
        orderIndex: h1Index,
      });

      for (const [h2Index, h2Task] of h1Task.children.entries()) {
        const subChapter = await createChapter({
          businessPlanId: businessPlan.id,
          userId,
          parentChapterId: parentChapter.id,
          title: translateTemplateTitle(h2Task.title, locale),
          orderIndex: h2Index,
        });

        chapterEntries.push({
          subChapterId: subChapter.id,
          h1Title: h1Task.title,
          h2Title: h2Task.title,
          aiPrompt: h2Task.aiPrompt,
        });
      }
    }

    // ── PHASE 2: OpenAI calls in batches of 10 ──

    const BATCH_SIZE = 10;

    const aiResults = await batchAll(
      chapterEntries.map((entry) => async () => {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `${buildStructuredSystemPrompt(locale)}\n\n${workspaceContext.toneInstruction}`,
              },
              {
                role: "user",
                content: `Using the following workspace context, write the "${entry.h2Title}" section for the "${entry.h1Title}" chapter of this business plan.\n\nIMPORTANT SOURCE PRIORITY: When there are conflicts between the Workspace Setup/Profile data and Library Documents, ALWAYS prioritize the Workspace Setup/Profile data as the authoritative source. Library documents serve as supplementary context only.\n\nWorkspace context:\n${workspaceContext.context}\n\nSpecific guidance:\n${entry.aiPrompt}\n\nReturn ONLY a JSON array of section blocks as specified in your instructions. Do not include the section title "${entry.h2Title}" — it is already shown as a heading.`,
              },
            ],
            temperature: 0.4,
            max_tokens: 800,
          });

          const raw = completion.choices[0]?.message?.content?.trim() ?? "";
          return parseAiSections(raw);
        } catch (aiError) {
          console.error(
            `AI generation failed for "${entry.h2Title}":`,
            aiError
          );
          return [] as AiSectionBlock[];
        }
      }),
      BATCH_SIZE,
    );

    // ── PHASE 3: Create all sections sequentially (fast DB operations) ──

    let sectionCount = 0;

    for (let i = 0; i < chapterEntries.length; i++) {
      const entry = chapterEntries[i]!;
      const blocks = aiResults[i] ?? [];

      for (let j = 0; j < blocks.length; j++) {
        const block = blocks[j]!;
        const { sectionType, content } = toSectionContent(block);

        await createSection({
          chapterId: entry.subChapterId,
          userId,
          sectionType,
          content,
          orderIndex: j,
        });
        sectionCount++;
      }
    }

    return NextResponse.json({
      success: true,
      chapterCount: chapterEntries.length + DEFAULT_BUSINESS_PLAN_TASK_TEMPLATE.length,
      sectionCount,
    });
  } catch (error) {
    console.error("Unexpected error in POST /business-plan/generate:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
