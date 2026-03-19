import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

import { getBusinessPlanWithChapters } from "@/server/businessPlan";
import { buildBusinessPlanContext } from "@/lib/businessPlanAi";
import { getWorkspaceAiContext } from "@/lib/workspaceAiContext";
import type { BusinessPlanChapterWithSections } from "@/types/workspaces";

const findChapter = (
  chapters: BusinessPlanChapterWithSections[],
  chapterId: string
): BusinessPlanChapterWithSections | null => {
  for (const chapter of chapters) {
    if (chapter.id === chapterId) return chapter;
    if (chapter.children?.length) {
      const nested = findChapter(chapter.children, chapterId);
      if (nested) return nested;
    }
  }
  return null;
};

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ workspaceId: string; chapterId: string }> }
) {
  try {
    const { userId } = await auth();
    const { workspaceId, chapterId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId || !chapterId) {
      return new NextResponse("Workspace and chapter IDs are required", { status: 400 });
    }

    const openAiApiKey = process.env.OPEN_AI_API_KEY;
    if (!openAiApiKey) {
      return new NextResponse("AI service not configured", { status: 500 });
    }

    const [planData, workspaceContext] = await Promise.all([
      getBusinessPlanWithChapters({ workspaceId, userId }),
      getWorkspaceAiContext(workspaceId),
    ]);

    if (!planData) {
      return new NextResponse("Business plan not found", { status: 404 });
    }

    const chapter = findChapter(planData.chapters, chapterId);
    if (!chapter) {
      return new NextResponse("Chapter not found", { status: 404 });
    }

    const existingSections = chapter.sections
      .map((s) => {
        if (s.content.type === "text") return s.content.text;
        if (s.content.type === "section_title") return s.content.text;
        return null;
      })
      .filter(Boolean)
      .join("\n");

    const businessPlanContext = buildBusinessPlanContext({
      businessPlan: planData.businessPlan,
      chapters: planData.chapters,
    });

    const systemPrompt = [
      "You are Silicon Plan AI, a business plan drafting assistant.",
      "Write clear, concrete, investor-ready text.",
      workspaceContext.toneInstruction,
      "Use only information from provided context. If context is missing, make minimal safe assumptions and clearly mark them.",
    ].join("\n");

    const userPrompt = [
      `Chapter title: ${chapter.title}`,
      existingSections
        ? `Existing content in this chapter:\n${existingSections}`
        : "This chapter has no content yet.",
      "",
      "Workspace context:",
      workspaceContext.context || "No workspace context available.",
      "",
      "Business plan context:",
      businessPlanContext,
      "",
      "Draft requirements:",
      "- Write a complete draft for this chapter in Markdown.",
      "- Use short headings and concise paragraphs.",
      "- Include bullets when useful.",
      "- Avoid generic filler text.",
      existingSections
        ? "- Expand on or improve existing content rather than repeating it."
        : "- Create comprehensive initial content for this chapter.",
      "- Return only the draft content.",
    ]
      .filter(Boolean)
      .join("\n");

    const openai = new OpenAI({ apiKey: openAiApiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 1200,
    });

    const draft = completion.choices[0]?.message?.content?.trim();
    if (!draft) {
      return new NextResponse("Failed to generate draft", { status: 500 });
    }

    return NextResponse.json({
      chapterId: chapter.id,
      draft,
    });
  } catch (error) {
    console.error("Unexpected error in POST /business-plan/chapters/[chapterId]/ai-draft:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
