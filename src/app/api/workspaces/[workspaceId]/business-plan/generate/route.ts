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
import { DEFAULT_BUSINESS_PLAN_TASK_TEMPLATE } from "@/server/businessPlanTaskTemplate";

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

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

    const body = (await req.json()) as { force?: boolean };
    const force = body.force === true;

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
        title: h1Task.title,
        orderIndex: h1Index,
      });

      for (const [h2Index, h2Task] of h1Task.children.entries()) {
        const subChapter = await createChapter({
          businessPlanId: businessPlan.id,
          userId,
          parentChapterId: parentChapter.id,
          title: h2Task.title,
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

    // ── PHASE 2: Fire all OpenAI calls in parallel (the slow part) ──

    const aiResults = await Promise.all(
      chapterEntries.map(async (entry) => {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are Silicon Plan AI, an expert business plan writer. Write professional, investor-ready business plan sections. ${workspaceContext.toneInstruction}`,
              },
              {
                role: "user",
                content: `Using the following workspace context, write the "${entry.h2Title}" section for the "${entry.h1Title}" chapter of this business plan.\n\nWorkspace context:\n${workspaceContext.context}\n\nSpecific guidance:\n${entry.aiPrompt}\n\nReturn ONLY the section text content. Do not include the section title or headings.`,
              },
            ],
            temperature: 0.4,
            max_tokens: 800,
          });

          return completion.choices[0]?.message?.content?.trim() ?? "";
        } catch (aiError) {
          console.error(
            `AI generation failed for "${entry.h2Title}":`,
            aiError
          );
          return "";
        }
      })
    );

    // ── PHASE 3: Create all sections sequentially (fast DB operations) ──

    let sectionCount = 0;

    for (let i = 0; i < chapterEntries.length; i++) {
      const entry = chapterEntries[i]!;
      const generatedText = aiResults[i];

      // Create section_title section
      await createSection({
        chapterId: entry.subChapterId,
        userId,
        sectionType: "section_title",
        content: { type: "section_title", text: entry.h2Title },
        orderIndex: 0,
      });
      sectionCount++;

      // Create text section with generated content
      if (generatedText) {
        await createSection({
          chapterId: entry.subChapterId,
          userId,
          sectionType: "text",
          content: { type: "text", text: generatedText },
          orderIndex: 1,
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
