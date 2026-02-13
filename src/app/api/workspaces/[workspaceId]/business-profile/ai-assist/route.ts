import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import OpenAI from "openai";

import { getWorkspaceWithDetails } from "@/server/workspaces";
import { getWorkspaceAiContext } from "@/lib/workspaceAiContext";

type AssistAction = "correct" | "regenerate" | "research";

type AssistBody = {
  action?: AssistAction;
  fieldLabel?: string;
  text?: string;
};

const ACTION_INSTRUCTIONS: Record<AssistAction, string> = {
  correct:
    "Correct grammar and spelling while preserving the original meaning and approximate length.",
  regenerate:
    "Regenerate a stronger business-ready version with clearer structure and concrete wording.",
  research:
    "Produce a richer draft with relevant market/industry considerations. If you infer missing facts, label them as assumptions.",
};

const isAssistAction = (value: unknown): value is AssistAction =>
  value === "correct" || value === "regenerate" || value === "research";

export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { workspaceId } = await context.params;
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const workspace = await getWorkspaceWithDetails(workspaceId, user.id);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or no access" },
        { status: 404 },
      );
    }

    const body = (await request.json().catch(() => null)) as AssistBody | null;
    const action = body?.action;

    if (!isAssistAction(action)) {
      return NextResponse.json(
        { error: "Valid action is required" },
        { status: 400 },
      );
    }

    const trimmedLabel = body?.fieldLabel?.trim();
    const fieldLabel = trimmedLabel && trimmedLabel.length > 0
      ? trimmedLabel
      : "Business field";
    const sourceText = body?.text?.trim() ?? "";

    if (action === "correct" && !sourceText) {
      return NextResponse.json(
        { error: "Text is required for correction" },
        { status: 400 },
      );
    }

    const openAiApiKey = process.env.OPEN_AI_API_KEY;
    if (!openAiApiKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 },
      );
    }

    const workspaceContext = await getWorkspaceAiContext(workspaceId);

    const systemPrompt = [
      "You are Silicon Plan AI, helping users fill workspace setup/business profile fields.",
      "Write concise, practical, investor-ready text.",
      "When details are missing, avoid inventing facts unless the action asks for researched assumptions.",
      "Return only the final field text.",
    ].join("\n");

    const userPrompt = [
      `Field: ${fieldLabel}`,
      `Action: ${action}`,
      `Instruction: ${ACTION_INSTRUCTIONS[action]}`,
      "",
      "Workspace context:",
      workspaceContext.context || "No workspace context available.",
      "",
      "Current field text:",
      sourceText || "[empty]",
    ].join("\n");

    const openai = new OpenAI({ apiKey: openAiApiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: action === "research" ? 0.55 : 0.35,
      max_tokens: 700,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json(
        { error: "No AI output generated" },
        { status: 500 },
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error(
      "Unexpected error in POST /api/workspaces/[workspaceId]/business-profile/ai-assist:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to run AI assist" },
      { status: 500 },
    );
  }
}
