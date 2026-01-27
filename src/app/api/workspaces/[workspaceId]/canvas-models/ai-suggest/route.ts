// src/app/api/workspaces/[workspaceId]/canvas-models/ai-suggest/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
import type {
  WorkspaceId,
  UserId,
  WorkspaceAiKnowledge,
  WorkspaceAiDocument,
  WorkspaceCanvasTemplateType,
} from "@/types/workspaces";
import type { SupabaseClient } from "@supabase/supabase-js";

type Supa = SupabaseClient<SupabaseDb>;

// Section descriptions for each canvas type
const SECTION_DESCRIPTIONS: Record<string, Record<string, string>> = {
  "business-model": {
    "key-partners": "Key Partners - Who are our key partners? Who are our key suppliers? Which key resources are we acquiring from partners? Which key activities do partners perform?",
    "key-activities": "Key Activities - What key activities do our value propositions require? Our distribution channels? Customer relationships? Revenue streams?",
    "key-resources": "Key Resources - What key resources do our value propositions require? Our distribution channels? Customer relationships? Revenue streams?",
    "value-propositions": "Value Propositions - What value do we deliver to the customer? Which customer needs are we satisfying? What bundles of products and services are we offering?",
    "customer-relationships": "Customer Relationships - What type of relationship does each customer segment expect? How are they integrated with our business model? How costly are they?",
    "channels": "Channels - Through which channels do our customer segments want to be reached? How are we reaching them now? How are our channels integrated?",
    "customer-segments": "Customer Segments - For whom are we creating value? Who are our most important customers?",
    "cost-structure": "Cost Structure - What are the most important costs inherent in our business model? Which key resources are most expensive? Which key activities are most expensive?",
    "revenue-streams": "Revenue Streams - For what value are our customers willing to pay? For what do they currently pay? How are they paying? How much does each revenue stream contribute?",
  },
  "lean": {
    "problem": "Problem - List your top 1-3 problems. What existing alternatives do customers use?",
    "solution": "Solution - Outline a possible solution for each problem.",
    "unique-value-proposition": "Unique Value Proposition - Single, clear, compelling message that turns an unaware visitor into an interested prospect.",
    "unfair-advantage": "Unfair Advantage - Something that cannot be easily copied or bought.",
    "customer-segments": "Customer Segments - List your target customers and users. Who are your early adopters?",
    "key-metrics": "Key Metrics - List the key numbers that tell you how your business is doing.",
    "channels": "Channels - List your path to customers (inbound or outbound).",
    "cost-structure": "Cost Structure - List your fixed and variable costs.",
    "revenue-streams": "Revenue Streams - List your sources of revenue.",
  },
  "startup": {
    "problem": "Problem - What problem are you solving? What's the current alternative?",
    "solution": "Solution - What is your proposed solution? How does it work?",
    "customer-segments": "Customer Segments - Who are your target customers? Who are early adopters?",
    "unique-value-proposition": "Unique Value Proposition - What is your single, clear, compelling message that states why you are different and worth buying?",
    "unfair-advantage": "Unfair Advantage - What can't be easily copied or bought?",
    "channels": "Channels - How will you reach your customers?",
    "key-metrics": "Key Metrics - What key metrics will you track?",
    "cost-structure": "Cost Structure - What are your fixed and variable costs?",
    "revenue-streams": "Revenue Streams - How will you make money?",
  },
  "value-proposition": {
    "products-services": "Products & Services - What products and services do you offer that help your customer get a job done?",
    "gain-creators": "Gain Creators - How do your products and services create customer gains?",
    "pain-relievers": "Pain Relievers - How do your products and services alleviate customer pains?",
    "customer-jobs": "Customer Jobs - What functional, social, or emotional jobs is your customer trying to get done?",
    "gains": "Gains - What outcomes and benefits does your customer want?",
    "pains": "Pains - What annoys your customer? What risks do they fear?",
  },
  "pitch": {
    "problem": "Problem - What is the problem you're solving?",
    "solution": "Solution - How are you solving the problem?",
    "unique-value": "Unique Value - What makes you different from competitors?",
    "target-market": "Target Market - Who are your customers?",
    "business-model": "Business Model - How will you make money?",
    "traction": "Traction - What progress have you made?",
    "team": "Team - Who is on your team?",
    "financials": "Financials - What are your financial projections?",
    "ask": "Ask - What are you asking for?",
  },
  "four-quarters": {
    "strengths": "Strengths - What advantages does your organization have? What do you do better than anyone else?",
    "weaknesses": "Weaknesses - What could you improve? What should you avoid?",
    "opportunities": "Opportunities - What good opportunities can you spot? What interesting trends are you aware of?",
    "threats": "Threats - What obstacles do you face? What is your competition doing?",
  },
};

async function ensureWorkspaceAccess(
  client: Supa,
  workspaceId: WorkspaceId,
  userId: UserId
): Promise<boolean> {
  const { data, error } = await client
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to check workspace access:", error);
    throw new Error("Failed to check workspace access");
  }

  return data != null;
}

async function getWorkspaceKnowledge(
  client: Supa,
  workspaceId: WorkspaceId
): Promise<WorkspaceAiKnowledge[]> {
  const { data, error } = await client
    .from("workspace_ai_knowledge")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Failed to load workspace knowledge:", error);
    return [];
  }

  return (data ?? []) as WorkspaceAiKnowledge[];
}

async function getWorkspaceDocuments(
  client: Supa,
  workspaceId: WorkspaceId
): Promise<WorkspaceAiDocument[]> {
  const { data, error } = await client
    .from("workspace_ai_documents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "uploaded");

  if (error) {
    console.error("Failed to load workspace documents:", error);
    return [];
  }

  return (data ?? []) as WorkspaceAiDocument[];
}

async function getDocumentContent(
  client: Supa,
  document: WorkspaceAiDocument
): Promise<string | null> {
  try {
    // Only try to read text-based files
    const textTypes = ["txt", "md", "json", "csv", "xml", "html"];
    if (!document.file_type || !textTypes.includes(document.file_type.toLowerCase())) {
      return null;
    }

    const { data, error } = await client.storage
      .from(document.storage_bucket)
      .download(document.storage_path);

    if (error || !data) {
      console.error("Failed to download document:", error);
      return null;
    }

    const text = await data.text();
    // Limit content to avoid token limits
    return text.slice(0, 5000);
  } catch (err) {
    console.error("Error reading document content:", err);
    return null;
  }
}

type AiSuggestBody = {
  sectionId: string;
  templateType: WorkspaceCanvasTemplateType;
  existingItems?: Array<{ title: string; description: string }>;
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

    const openAiApiKey = process.env.OPEN_AI_API_KEY;
    if (!openAiApiKey) {
      console.error("OPEN_AI_API_KEY is not configured");
      return new NextResponse("AI service not configured", { status: 500 });
    }

    const body = (await req.json()) as AiSuggestBody;
    const { sectionId, templateType, existingItems = [] } = body;

    if (!sectionId) {
      return new NextResponse("sectionId is required", { status: 400 });
    }

    if (!templateType) {
      return new NextResponse("templateType is required", { status: 400 });
    }

    const client = getSupabaseClient();

    const hasAccess = await ensureWorkspaceAccess(client, workspaceId, userId);
    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Fetch knowledge and documents
    const [knowledge, documents] = await Promise.all([
      getWorkspaceKnowledge(client, workspaceId),
      getWorkspaceDocuments(client, workspaceId),
    ]);

    // Build context from knowledge
    let knowledgeContext = "";
    if (knowledge.length > 0) {
      knowledgeContext = "## Business Knowledge\n\n";
      for (const k of knowledge) {
        knowledgeContext += `**${k.label}**: ${k.value}\n\n`;
      }
    }

    // Build context from documents (text files only)
    let documentsContext = "";
    const docContents: string[] = [];
    for (const doc of documents.slice(0, 5)) { // Limit to 5 documents
      const content = await getDocumentContent(client, doc);
      if (content) {
        docContents.push(`### ${doc.name}\n${content}`);
      }
    }
    if (docContents.length > 0) {
      documentsContext = "## Business Documents\n\n" + docContents.join("\n\n");
    }

    // Get section description
    const sectionDescriptions = SECTION_DESCRIPTIONS[templateType] ?? {};
    const sectionDescription = sectionDescriptions[sectionId] ?? `Section: ${sectionId}`;

    // Build existing items context
    let existingContext = "";
    if (existingItems.length > 0) {
      existingContext = "\n## Existing Items in This Section\n\n";
      for (const item of existingItems) {
        existingContext += `- **${item.title}**${item.description ? `: ${item.description}` : ""}\n`;
      }
      existingContext += "\nPlease suggest new items that complement these existing ones without duplicating them.\n";
    }

    // Build the prompt
    const systemPrompt = `You are a business strategy expert helping to fill out a ${templateType.replace("-", " ")} canvas.
Your task is to suggest 2-3 concise, actionable items for a specific section of the canvas.

Each suggestion should have:
- A short title (3-7 words)
- A brief description (1-2 sentences)

Base your suggestions on the business context provided. Be specific and relevant to the business.
If no business context is provided, give generic but useful suggestions.

Respond ONLY with a valid JSON array in this exact format:
[
  {"title": "Title here", "description": "Description here"},
  {"title": "Title here", "description": "Description here"}
]

Do not include any other text or explanation, just the JSON array.`;

    const userPrompt = `${knowledgeContext}${documentsContext}${existingContext}

## Task
Generate 2-3 suggestions for this canvas section:
**${sectionDescription}**

Remember: Respond ONLY with a JSON array of objects with "title" and "description" fields.`;

    // Call OpenAI
    const openai = new OpenAI({ apiKey: openAiApiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() ?? "[]";

    // Parse the response
    let suggestions: Array<{ title: string; description: string }> = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = /\[[\s\S]*\]/.exec(responseText);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Array<{ title: string; description: string }>;
        suggestions = Array.isArray(parsed) ? parsed : [];
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw response:", responseText);
      // Return empty suggestions if parsing fails
      suggestions = [];
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Unexpected error in POST /canvas-models/ai-suggest:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
