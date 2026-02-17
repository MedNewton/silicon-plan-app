// src/app/api/workspaces/[workspaceId]/pitch-deck/ai/slide-suggest/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getWorkspaceAiContext } from "@/lib/workspaceAiContext";

export const runtime = "nodejs";

type SuggestBody = {
  action: "summarize" | "rephrase" | "simplify" | "detail" | "grammar" | "translate";
  text?: string;
  language?: string;
  label?: string;
  formatHint?: string;
};

const ACTION_PROMPTS: Record<SuggestBody["action"], string> = {
  summarize: "Summarize the text in a concise paragraph.",
  rephrase: "Rephrase the text while preserving the original meaning.",
  simplify: "Rewrite the text to be simpler and easier to read.",
  detail: "Expand the text with more detail and clarity.",
  grammar: "Correct grammar, spelling, and punctuation while preserving tone.",
  translate: "Translate the text to the requested language.",
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
    const { action, language, label, formatHint } = body;

    if (!action || !(action in ACTION_PROMPTS)) {
      return new NextResponse("Valid action is required", { status: 400 });
    }

    const openAiApiKey = process.env.OPEN_AI_API_KEY;
    if (!openAiApiKey) {
      console.error("OPEN_AI_API_KEY is not configured");
      return new NextResponse("AI service not configured", { status: 500 });
    }

    const sourceText = (body.text ?? "").trim();
    if (!sourceText) {
      return new NextResponse("No text provided", { status: 400 });
    }

    const workspaceContext = await getWorkspaceAiContext(workspaceId);
    const systemPrompt = [
      "You are an AI assistant helping improve pitch deck slide content.",
      workspaceContext.context ? `Workspace context:\n${workspaceContext.context}` : null,
      workspaceContext.toneInstruction,
      "Keep the response ready to paste into a slide.",
    ]
      .filter(Boolean)
      .join("\n\n");

    const prompt = [
      `Task: ${ACTION_PROMPTS[action]}`,
      label ? `Target: ${label}` : null,
      action === "translate" ? `Target language: ${language ?? "English"}` : null,
      formatHint ? `Formatting hint: ${formatHint}` : null,
      "Return ONLY the updated text.",
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

    const output = completion.choices[0]?.message?.content?.trim() ?? sourceText;
    return NextResponse.json({ text: output });
  } catch (error) {
    console.error("Unexpected error in POST /pitch-deck/ai/slide-suggest:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(message, { status: 500 });
  }
}
