// src/app/api/workspaces/[workspaceId]/business-plan/ai/section-suggest/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

import { getBusinessPlanWithChapters, getOrCreateBusinessPlan } from "@/server/businessPlan";
import { buildBusinessPlanContext, buildBusinessPlanSystemPrompt } from "@/lib/businessPlanAi";
import { getWorkspaceAiContext } from "@/lib/workspaceAiContext";

type SuggestBody = {
  sectionId: string;
  sectionType?: string;
  action: "summarize" | "rephrase" | "simplify" | "detail" | "grammar" | "translate";
  text?: string;
  language?: string;
};

const ACTION_PROMPTS: Record<SuggestBody["action"], string> = {
  summarize: "Summarize the text in a concise paragraph.",
  rephrase: "Rephrase the text while preserving the original meaning.",
  simplify: "Rewrite the text to be simpler and easier to read.",
  detail: "Expand the text with more detail and clarity.",
  grammar: "Correct grammar, spelling, and punctuation while preserving tone.",
  translate: "Translate the text to the requested language.",
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
    const systemPrompt = buildBusinessPlanSystemPrompt(combinedContext);

    const textFromSection = findSectionText(planData?.chapters ?? [], sectionId);
    const sourceText = (body.text ?? "").trim() || textFromSection;

    if (!sourceText) {
      return new NextResponse("No text available for this section", { status: 400 });
    }

    const formattingHint =
      sectionType === "list"
        ? "Return one list item per line."
        : sectionType === "table" || sectionType === "comparison_table"
        ? "Return a table with the first line as headers and each next line as a row, using ' | ' as the separator."
        : null;

    const prompt = [
      `Task: ${ACTION_PROMPTS[action]}`,
      action === "translate" ? `Target language: ${language ?? "English"}` : null,
      formattingHint,
      "Return ONLY the updated text. Do not add headings or bullet labels.",
      "",
      "Text:",
      sourceText,
    ]
      .filter(Boolean)
      .join("\n");

    const openai = new OpenAI({ apiKey: openAiApiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 600,
    });

    const output = completion.choices[0]?.message?.content?.trim() || sourceText;
    return NextResponse.json({ text: output });
  } catch (error) {
    console.error("Unexpected error in POST /ai/section-suggest:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
