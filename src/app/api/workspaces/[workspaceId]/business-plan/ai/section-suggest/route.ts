// src/app/api/workspaces/[workspaceId]/business-plan/ai/section-suggest/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getBusinessPlanWithChapters, getOrCreateBusinessPlan } from "@/server/businessPlan";
import { buildBusinessPlanContext, buildBusinessPlanSystemPrompt } from "@/lib/businessPlanAi";
import { getWorkspaceAiContext } from "@/lib/workspaceAiContext";
import {
  type SectionAiAction,
  ACTION_PROMPTS,
  executeSectionAiAction,
} from "@/lib/sectionSuggest";

type SuggestBody = {
  sectionId: string;
  sectionType?: string;
  action: SectionAiAction;
  text?: string;
  language?: string;
};

const findSectionText = (
  chapters: Array<{ sections?: Array<{ id: string; content: { type?: string; text?: string } }>; children?: unknown[] }>,
  sectionId: string
): string => {
  for (const chapter of chapters) {
    for (const section of chapter.sections ?? []) {
      if (section.id === sectionId) {
        const text = section.content?.text;
        if (typeof text === "string") {
          return text;
        }
      }
    }
    if ((chapter as { children?: typeof chapters }).children?.length) {
      const found = findSectionText(
        (chapter as { children?: typeof chapters }).children ?? [],
        sectionId
      );
      if (found) return found;
    }
  }
  return "";
};

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

    const body = (await req.json()) as SuggestBody;
    const { sectionId, action, language, sectionType } = body;

    if (!sectionId) {
      return new NextResponse("sectionId is required", { status: 400 });
    }

    if (!action || !(action in ACTION_PROMPTS)) {
      return new NextResponse("Valid action is required", { status: 400 });
    }

    const openAiApiKey = process.env.OPEN_AI_API_KEY;
    if (!openAiApiKey) {
      console.error("OPEN_AI_API_KEY is not configured");
      return new NextResponse("AI service not configured", { status: 500 });
    }

    await getOrCreateBusinessPlan({ workspaceId, userId });
    const planData = await getBusinessPlanWithChapters({ workspaceId, userId });
    const context = buildBusinessPlanContext({
      businessPlan: planData?.businessPlan ?? null,
      chapters: planData?.chapters ?? [],
    });
    const workspaceContext = await getWorkspaceAiContext(workspaceId);
    const combinedContext = [context, workspaceContext.context].filter(Boolean).join("\n\n");
    const systemPrompt = [
      buildBusinessPlanSystemPrompt(combinedContext),
      workspaceContext.toneInstruction,
    ]
      .filter(Boolean)
      .join("\n\n");

    const textFromSection = findSectionText(planData?.chapters ?? [], sectionId);
    const sourceText = (body.text ?? "").trim() || textFromSection;

    if (!sourceText) {
      return new NextResponse("No text available for this section", { status: 400 });
    }

    const output = await executeSectionAiAction({
      action,
      sourceText,
      sectionType: sectionType ?? "text",
      language,
      systemPrompt,
      openAiApiKey,
    });

    return NextResponse.json({ text: output });
  } catch (error) {
    console.error("Unexpected error in POST /ai/section-suggest:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
