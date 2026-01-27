// src/app/api/workspaces/[workspaceId]/business-plan/ai/chat/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

import {
  getOrCreateBusinessPlan,
  getOrCreateConversation,
  getConversationWithMessages,
  createMessage,
  createPendingChange,
  getBusinessPlanWithChapters,
} from "@/server/businessPlan";
import { buildBusinessPlanContext, buildBusinessPlanSystemPrompt } from "@/lib/businessPlanAi";
import { getWorkspaceAiContext } from "@/lib/workspaceAiContext";
import type {
  BusinessPlanAiMessage,
  BusinessPlanPendingChange,
  PendingChangeType,
  BusinessPlanChapterWithSections,
} from "@/types/workspaces";

type ChatBody = {
  message: string;
  conversationId?: string | null;
};

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "propose_add_chapter",
      description: "Propose adding a new chapter",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          parentChapterId: { type: "string", nullable: true },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_update_chapter",
      description: "Propose updating a chapter title",
      parameters: {
        type: "object",
        properties: {
          chapterId: { type: "string" },
          newTitle: { type: "string" },
        },
        required: ["chapterId", "newTitle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_delete_chapter",
      description: "Propose deleting a chapter",
      parameters: {
        type: "object",
        properties: {
          chapterId: { type: "string" },
        },
        required: ["chapterId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_add_section",
      description: "Propose adding a new section to a chapter",
      parameters: {
        type: "object",
        properties: {
          chapterId: { type: "string" },
          sectionType: { type: "string" },
          content: { type: "object" },
        },
        required: ["chapterId", "sectionType", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_update_section",
      description: "Propose updating a section's content",
      parameters: {
        type: "object",
        properties: {
          sectionId: { type: "string" },
          newContent: { type: "object" },
        },
        required: ["sectionId", "newContent"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_delete_section",
      description: "Propose deleting a section",
      parameters: {
        type: "object",
        properties: {
          sectionId: { type: "string" },
        },
        required: ["sectionId"],
      },
    },
  },
];

const parseToolArguments = (args: string | undefined): Record<string, unknown> => {
  if (!args) return {};
  try {
    return JSON.parse(args) as Record<string, unknown>;
  } catch (error) {
    console.error("Failed to parse tool arguments:", error);
    return {};
  }
};

const validSectionTypes = new Set([
  "section_title",
  "subsection",
  "text",
  "image",
  "table",
  "list",
  "comparison_table",
  "timeline",
  "embed",
  "page_break",
  "empty_space",
]);

const normalizeSectionType = (value: unknown): string => {
  if (typeof value !== "string") return "text";
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  return validSectionTypes.has(normalized) ? normalized : "text";
};

const buildDefaultContent = (sectionType: string): Record<string, unknown> => {
  switch (sectionType) {
    case "section_title":
    case "subsection":
    case "text":
      return { type: sectionType, text: "Draft content" };
    case "list":
      return { type: "list", items: ["First item", "Second item"], ordered: false };
    case "table":
    case "comparison_table":
      return {
        type: sectionType,
        headers: ["Column 1", "Column 2"],
        rows: [["Value 1", "Value 2"]],
      };
    case "image":
      return { type: "image", url: "", alt_text: "" };
    case "timeline":
      return { type: "timeline", entries: [] };
    case "embed":
      return { type: "embed", embed_type: "html", code: "" };
    case "page_break":
      return { type: "page_break" };
    case "empty_space":
      return { type: "empty_space", height: 40 };
    default:
      return { type: "text", text: "Draft content" };
  }
};

const findSectionById = (
  chapters: BusinessPlanChapterWithSections[],
  sectionId: string
): { id: string; content: Record<string, unknown>; section_type: string } | null => {
  const stack = [...chapters];
  while (stack.length > 0) {
    const chapter = stack.shift();
    if (!chapter) continue;
    for (const section of chapter.sections ?? []) {
      if (section.id === sectionId) {
        return {
          id: section.id,
          content: section.content as Record<string, unknown>,
          section_type: section.section_type as string,
        };
      }
    }
    if (chapter.children?.length) {
      stack.push(...chapter.children);
    }
  }
  return null;
};

const mergeSectionContent = (
  baseContent: Record<string, unknown>,
  updates: Record<string, unknown> | null
): Record<string, unknown> => {
  if (!updates) return baseContent;
  return {
    ...baseContent,
    ...updates,
  };
};

const isSameContent = (
  baseContent: Record<string, unknown>,
  nextContent: Record<string, unknown>
): boolean => {
  try {
    return JSON.stringify(baseContent) === JSON.stringify(nextContent);
  } catch {
    return false;
  }
};

const extractQuotedUpdate = (message: string): string | null => {
  const match = message.match(/["“](.+?)["”]/);
  if (!match) return null;
  const candidate = match[1]?.trim();
  return candidate && candidate.length > 0 ? candidate : null;
};

const TOOL_TO_CHANGE: Record<string, PendingChangeType> = {
  propose_add_chapter: "add_chapter",
  propose_update_chapter: "update_chapter",
  propose_delete_chapter: "delete_chapter",
  propose_add_section: "add_section",
  propose_update_section: "update_section",
  propose_delete_section: "delete_section",
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

    const body = (await req.json()) as ChatBody;
    const messageText = body.message?.trim();

    if (!messageText) {
      return new NextResponse("Message is required", { status: 400 });
    }

    const openAiApiKey = process.env.OPEN_AI_API_KEY;
    if (!openAiApiKey) {
      console.error("OPEN_AI_API_KEY is not configured");
      return new NextResponse("AI service not configured", { status: 500 });
    }

    const businessPlan = await getOrCreateBusinessPlan({
      workspaceId,
      userId,
    });

    const conversation = await getOrCreateConversation({
      businessPlanId: businessPlan.id,
      userId,
    });

    if (body.conversationId && body.conversationId !== conversation.id) {
      return new NextResponse("Conversation mismatch", { status: 400 });
    }

    const conversationData = await getConversationWithMessages({
      businessPlanId: businessPlan.id,
      userId,
    });

    const planData = await getBusinessPlanWithChapters({
      workspaceId,
      userId,
    });

    const context = buildBusinessPlanContext({
      businessPlan: planData?.businessPlan ?? null,
      chapters: planData?.chapters ?? [],
    });
    const workspaceContext = await getWorkspaceAiContext(workspaceId);
    const combinedContext = [context, workspaceContext.context].filter(Boolean).join("\n\n");
    const systemPrompt = buildBusinessPlanSystemPrompt(combinedContext);

    const historyMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

    const userMessage = await createMessage({
      conversationId: conversation.id,
      userId,
      role: "user",
      content: messageText,
    });

    const openai = new OpenAI({ apiKey: openAiApiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: messageText },
      ],
      tools,
      tool_choice: "auto",
      temperature: 0.4,
      max_tokens: 800,
    });

    const toolCalls = completion.choices[0]?.message?.tool_calls ?? [];
    const pendingChanges: BusinessPlanPendingChange[] = [];
    const pendingChangeInputs: Array<{
      changeType: PendingChangeType;
      targetId: string | null;
      proposedData: Record<string, unknown>;
    }> = [];
    const skippedUpdates: string[] = [];

    for (const toolCall of toolCalls) {
      if (toolCall.type !== "function") continue;
      const functionName = toolCall.function.name;
      const changeType = TOOL_TO_CHANGE[functionName];
      if (!changeType) continue;

      const args = parseToolArguments(toolCall.function.arguments);
      let targetId: string | null = null;
      let proposedData: Record<string, unknown> = {};

      switch (functionName) {
        case "propose_add_chapter": {
          proposedData = {
            title: args.title ?? "New Chapter",
            parent_id: args.parentChapterId ?? null,
          };
          break;
        }
        case "propose_update_chapter": {
          targetId = (args.chapterId as string) ?? null;
          proposedData = {
            title: args.newTitle ?? undefined,
          };
          break;
        }
        case "propose_delete_chapter": {
          targetId = (args.chapterId as string) ?? null;
          proposedData = {};
          break;
        }
        case "propose_add_section": {
          const normalizedType = normalizeSectionType(args.sectionType);
          const content =
            args.content && typeof args.content === "object"
              ? { type: normalizedType, ...(args.content as Record<string, unknown>) }
              : buildDefaultContent(normalizedType);
          proposedData = {
            chapter_id: args.chapterId,
            section_type: normalizedType,
            content,
          };
          break;
        }
        case "propose_update_section": {
          targetId = (args.sectionId as string) ?? null;
          if (!targetId) break;
          const existingSection = findSectionById(planData?.chapters ?? [], targetId);
          if (!existingSection) {
            skippedUpdates.push("I couldn't find that section to update.");
            break;
          }
          let normalizedUpdates: Record<string, unknown> | null = null;
          if (typeof args.newContent === "string") {
            normalizedUpdates = { text: args.newContent.trim() };
          } else if (args.newContent && typeof args.newContent === "object") {
            normalizedUpdates = args.newContent as Record<string, unknown>;
          } else if (typeof args.text === "string") {
            normalizedUpdates = { text: args.text.trim() };
          }
          const baseContent = existingSection.content ?? buildDefaultContent("text");
          if (!normalizedUpdates) {
            const quoted = extractQuotedUpdate(messageText);
            if (quoted && existingSection.section_type === "text") {
              normalizedUpdates = { text: quoted };
            }
          }
          if (!normalizedUpdates) {
            skippedUpdates.push(
              "Please share the exact text you want for that section so I can update it."
            );
            break;
          }
          const mergedContent = mergeSectionContent(baseContent, normalizedUpdates);
          if (typeof mergedContent.type !== "string") {
            mergedContent.type = existingSection?.section_type ?? "text";
          }
          if (isSameContent(baseContent, mergedContent)) {
            const quoted = extractQuotedUpdate(messageText);
            if (quoted && existingSection.section_type === "text") {
              mergedContent.text = quoted;
            } else {
              skippedUpdates.push(
                "The proposed update matches the current content, so I didn't change it."
              );
              break;
            }
          }
          proposedData = {
            content: mergedContent,
            section_type: existingSection?.section_type,
          };
          break;
        }
        case "propose_delete_section": {
          targetId = (args.sectionId as string) ?? null;
          proposedData = {};
          break;
        }
        default:
          break;
      }

      const hasProposedData = Object.keys(proposedData).length > 0;
      if (changeType === "update_section" && !hasProposedData) {
        skippedUpdates.push(
          "I couldn't generate an updated section payload. Please provide the exact text to replace."
        );
        continue;
      }
      if (hasProposedData || targetId) {
        pendingChangeInputs.push({ changeType, targetId, proposedData });
      }
    }

    const assistantContentBase =
      completion.choices[0]?.message?.content?.trim() ||
      "I have suggestions for your business plan. Would you like to review them?";
    const genericNotice = workspaceContext.hasContext
      ? ""
      : "Note: I don't have access to workspace knowledge or AI documents, so my answers may be generic.";
    const assistantContent = [
      assistantContentBase,
      skippedUpdates.length > 0 ? skippedUpdates.join(" ") : null,
      genericNotice || null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const assistantMessage = await createMessage({
      conversationId: conversation.id,
      userId,
      role: "assistant",
      content: assistantContent,
    });

    for (const input of pendingChangeInputs) {
      const pendingChange = await createPendingChange({
        messageId: assistantMessage.id,
        userId,
        changeType: input.changeType,
        targetId: input.targetId,
        proposedData: input.proposedData,
      });

      pendingChanges.push(pendingChange);
    }

    return NextResponse.json({
      conversation,
      userMessage: userMessage as BusinessPlanAiMessage,
      assistantMessage: assistantMessage as BusinessPlanAiMessage,
      pendingChanges,
    });
  } catch (error) {
    console.error("Unexpected error in POST /ai/chat:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
