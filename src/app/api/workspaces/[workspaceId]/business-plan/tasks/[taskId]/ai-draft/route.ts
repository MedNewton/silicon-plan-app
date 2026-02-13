import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

import { getBusinessPlanWithChapters } from "@/server/businessPlan";
import { getBusinessPlanTask, getBusinessPlanTaskTree } from "@/server/businessPlanTasks";
import { buildBusinessPlanContext } from "@/lib/businessPlanAi";
import { getWorkspaceAiContext } from "@/lib/workspaceAiContext";
import type { BusinessPlanTaskWithChildren } from "@/types/workspaces";

const findTaskAndParent = (
  tasks: BusinessPlanTaskWithChildren[],
  taskId: string,
  parent: BusinessPlanTaskWithChildren | null = null
): { task: BusinessPlanTaskWithChildren; parent: BusinessPlanTaskWithChildren | null } | null => {
  for (const task of tasks) {
    if (task.id === taskId) {
      return { task, parent };
    }
    if (task.children?.length) {
      const nested = findTaskAndParent(task.children, taskId, task);
      if (nested) return nested;
    }
  }
  return null;
};

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ workspaceId: string; taskId: string }> }
) {
  try {
    const { userId } = await auth();
    const { workspaceId, taskId } = await ctx.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!workspaceId) {
      return new NextResponse("Workspace id is required", { status: 400 });
    }

    if (!taskId) {
      return new NextResponse("Task id is required", { status: 400 });
    }

    const openAiApiKey = process.env.OPEN_AI_API_KEY;
    if (!openAiApiKey) {
      return new NextResponse("AI service not configured", { status: 500 });
    }

    const task = await getBusinessPlanTask({
      taskId,
      userId,
    });

    const [taskTree, planData, workspaceContext] = await Promise.all([
      getBusinessPlanTaskTree({ workspaceId, userId }),
      getBusinessPlanWithChapters({ workspaceId, userId }),
      getWorkspaceAiContext(workspaceId),
    ]);

    const match = taskTree?.tasks
      ? findTaskAndParent(taskTree.tasks, task.id)
      : null;
    const parentTitle = match?.parent?.title ?? "N/A";
    const siblingTitles =
      match?.parent?.children
        ?.filter((child) => child.id !== task.id)
        .map((child) => child.title)
        .slice(0, 6) ?? [];

    const businessPlanContext = buildBusinessPlanContext({
      businessPlan: planData?.businessPlan ?? null,
      chapters: planData?.chapters ?? [],
    });

    const systemPrompt = [
      "You are Silicon Plan AI, a business plan drafting assistant.",
      "Write clear, concrete, investor-ready text.",
      "Use only information from provided context. If context is missing, make minimal safe assumptions and clearly mark them.",
    ].join("\n");

    const userPrompt = [
      `Task hierarchy level: ${task.hierarchy_level.toUpperCase()}`,
      `Parent chapter: ${parentTitle}`,
      `Current task title: ${task.title}`,
      `Task instructions: ${task.instructions || "N/A"}`,
      `Task AI prompt: ${task.ai_prompt || "N/A"}`,
      siblingTitles.length > 0 ? `Sibling task titles: ${siblingTitles.join("; ")}` : null,
      "",
      "Workspace context:",
      workspaceContext.context || "No workspace context available.",
      "",
      "Business plan context:",
      businessPlanContext,
      "",
      "Draft requirements:",
      "- Write a complete draft for this task in Markdown.",
      "- Use short headings and concise paragraphs.",
      "- Include bullets when useful.",
      "- Avoid generic filler text.",
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
      max_tokens: 900,
    });

    const draft = completion.choices[0]?.message?.content?.trim();
    if (!draft) {
      return new NextResponse("Failed to generate draft", { status: 500 });
    }

    return NextResponse.json({
      taskId: task.id,
      draft,
    });
  } catch (error) {
    console.error("Unexpected error in POST /business-plan/tasks/[taskId]/ai-draft:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
