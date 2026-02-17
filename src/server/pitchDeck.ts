// src/server/pitchDeck.ts
import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
import { getBusinessPlanWithChapters } from "@/server/businessPlan";
import type {
  PitchDeckTemplate,
  PitchDeck,
  PitchDeckSlide,
  PitchDeckWithSlides,
  PitchDeckSettings,
  PitchDeckSlideContent,
  PitchDeckColorScheme,
  PitchDeckCoverDesign,
  PitchDeckSlideDesign,
  CreatePitchDeckParams,
  UpdatePitchDeckParams,
  CreatePitchDeckSlideParams,
  UpdatePitchDeckSlideParams,
  ReorderPitchDeckSlidesParams,
  DuplicatePitchDeckParams,
  WorkspaceId,
  UserId,
  PitchDeckId,
  PitchDeckSlideId,
  PitchDeckTemplateId,
  BusinessPlanSectionContent,
  BusinessPlanChapterWithSections,
  CanvasSectionItem,
  CanvasSectionsData,
  WorkspaceCanvasTemplateType,
} from "@/types/workspaces";
import type { SupabaseClient } from "@supabase/supabase-js";

type Supa = SupabaseClient<SupabaseDb>;

// ========== HELPERS ==========

type SeedSlideDefinition = {
  title: string;
  content: Extract<PitchDeckSlideContent, { type: "title_bullets" }>;
};

const DEFAULT_PITCH_SECTION_SLIDES: SeedSlideDefinition[] = [
  {
    title: "Problem",
    content: {
      type: "title_bullets",
      title: "Problem",
      bullets: [
        "Define the critical pain point you solve.",
        "Identify who experiences this pain most.",
        "Explain why current alternatives are insufficient.",
      ],
    },
  },
  {
    title: "Solution",
    content: {
      type: "title_bullets",
      title: "Solution",
      bullets: [
        "Describe your solution in one clear statement.",
        "Show how it directly solves the core problem.",
        "Highlight the most important outcome for users.",
      ],
    },
  },
  {
    title: "Product",
    content: {
      type: "title_bullets",
      title: "Product",
      bullets: [
        "Summarize your core product/service offering.",
        "Show key features and the value each provides.",
        "Clarify current stage (MVP, beta, live, scaling).",
      ],
    },
  },
  {
    title: "TAM/SAM/SOM",
    content: {
      type: "title_bullets",
      title: "TAM / SAM / SOM",
      bullets: [
        "Estimate TAM: total addressable market.",
        "Estimate SAM: serviceable addressable market.",
        "Estimate SOM: realistic near-term obtainable market.",
      ],
    },
  },
  {
    title: "Business Model",
    content: {
      type: "title_bullets",
      title: "Business Model",
      bullets: [
        "State your revenue model and pricing logic.",
        "Clarify who pays and when revenue is recognized.",
        "Highlight key cost drivers and gross margin assumptions.",
      ],
    },
  },
  {
    title: "Traction",
    content: {
      type: "title_bullets",
      title: "Traction",
      bullets: [
        "List key traction metrics with current values.",
        "Show momentum over time (growth trend).",
        "Mention relevant milestones already achieved.",
      ],
    },
  },
  {
    title: "Competitors",
    content: {
      type: "title_bullets",
      title: "Competitors",
      bullets: [
        "Identify direct and indirect competitors.",
        "Explain your differentiators versus each segment.",
        "Summarize why your advantage is defensible.",
      ],
    },
  },
  {
    title: "Go-To-Market",
    content: {
      type: "title_bullets",
      title: "Go-To-Market",
      bullets: [
        "Define primary acquisition channels.",
        "Describe sales funnel or conversion strategy.",
        "Set initial geographic/segment rollout priorities.",
      ],
    },
  },
  {
    title: "Financial Forecast",
    content: {
      type: "title_bullets",
      title: "Financial Forecast (3-4 Years)",
      bullets: [
        "Project revenue for years 1-4.",
        "Project major cost categories and EBITDA trajectory.",
        "State key assumptions driving the model.",
      ],
    },
  },
  {
    title: "Team",
    content: {
      type: "title_bullets",
      title: "Team",
      bullets: [
        "Present core founders and roles.",
        "Highlight relevant domain/execution experience.",
        "List critical hiring priorities for the next phase.",
      ],
    },
  },
  {
    title: "Ask",
    content: {
      type: "title_bullets",
      title: "Ask",
      bullets: [
        "Specify funding amount and instrument.",
        "Break down use of funds by priority.",
        "Define target runway and milestone outcomes.",
      ],
    },
  },
];

type ContextLine = {
  text: string;
  searchText: string;
};

const MAX_SEED_BULLET_LENGTH = 180;
const MAX_SEED_CONTEXT_LINES = 240;

const SLIDE_CONTEXT_KEYWORDS: Record<string, string[]> = {
  Problem: ["problem", "pain", "challenge", "customer jobs", "pains"],
  Solution: ["solution", "unique value", "value proposition", "pain relievers", "gain creators"],
  Product: ["product", "service", "offering", "features", "mvp"],
  "TAM/SAM/SOM": ["tam", "sam", "som", "market size", "target market", "segment"],
  "Business Model": ["business model", "pricing", "revenue", "cost structure", "revenue streams"],
  Traction: ["traction", "key metrics", "growth", "milestones", "validation"],
  Competitors: ["competitor", "competition", "alternative", "positioning", "differentiation"],
  "Go-To-Market": ["go to market", "gtm", "channel", "acquisition", "sales", "distribution"],
  "Financial Forecast": [
    "financial",
    "forecast",
    "revenue",
    "cost",
    "cash flow",
    "ebitda",
    "margin",
  ],
  Team: ["team", "founder", "cofounder", "roles", "hiring"],
  Ask: ["ask", "funding", "investment", "runway", "use of funds"],
};

const normalizeLookupText = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const trimToLength = (value: string, maxLength: number): string => {
  const clean = value.replace(/\s+/g, " ").replace(/^[-*•]+\s*/, "").trim();
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength - 3).trimEnd()}...`;
};

const humanizeIdentifier = (value: string): string =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const makeContextLine = (text: string, hints: string[]): ContextLine | null => {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  if (!normalizedText) {
    return null;
  }

  const joinedHints = hints.filter(Boolean).join(" ");
  const searchText = normalizeLookupText(`${joinedHints} ${normalizedText}`);

  if (!searchText) {
    return null;
  }

  return {
    text: normalizedText,
    searchText,
  };
};

const cloneSeedSlide = (slide: SeedSlideDefinition): SeedSlideDefinition => ({
  title: slide.title,
  content: {
    ...slide.content,
    bullets: [...slide.content.bullets],
  },
});

const mergeBullets = (
  preferred: string[],
  fallback: string[],
  maxItems: number
): string[] => {
  const merged: string[] = [];
  const seen = new Set<string>();
  const pushUnique = (value: string) => {
    const cleaned = value.replace(/\s+/g, " ").trim();
    if (!cleaned) return;
    const key = normalizeLookupText(cleaned);
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(cleaned);
  };

  for (const value of preferred) {
    pushUnique(value);
    if (merged.length >= maxItems) {
      return merged;
    }
  }

  for (const value of fallback) {
    pushUnique(value);
    if (merged.length >= maxItems) {
      return merged;
    }
  }

  return merged;
};

const pickContextBullets = (
  lines: ContextLine[],
  keywords: string[],
  maxItems: number
): string[] => {
  if (lines.length === 0 || keywords.length === 0) {
    return [];
  }

  const normalizedKeywords = keywords
    .map((keyword) => normalizeLookupText(keyword))
    .filter((keyword) => keyword.length > 0);

  if (normalizedKeywords.length === 0) {
    return [];
  }

  const ranked = lines
    .map((line) => {
      const score = normalizedKeywords.reduce(
        (total, keyword) => (line.searchText.includes(keyword) ? total + 1 : total),
        0
      );

      return {
        line,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return b.line.text.length - a.line.text.length;
    });

  const bullets: string[] = [];
  const seen = new Set<string>();

  for (const item of ranked) {
    const bullet = trimToLength(item.line.text, MAX_SEED_BULLET_LENGTH);
    const key = normalizeLookupText(bullet);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    bullets.push(bullet);

    if (bullets.length >= maxItems) {
      break;
    }
  }

  return bullets;
};

const extractSectionLines = (content: BusinessPlanSectionContent): string[] => {
  switch (content.type) {
    case "section_title":
    case "subsection":
    case "text":
      return [content.text];
    case "list":
      return content.items;
    case "image":
      return [content.caption ?? content.alt_text ?? ""].filter(Boolean);
    case "table": {
      const rows = content.rows.map((row) => row.filter(Boolean).join(" | "));
      return [...rows, content.caption ?? ""].filter(Boolean);
    }
    case "comparison_table":
      return content.rows.map((row) => row.filter(Boolean).join(" | "));
    case "timeline":
      return content.entries.map((entry) =>
        [entry.date, entry.title, entry.description].filter(Boolean).join(" - ")
      );
    case "embed":
    case "page_break":
    case "empty_space":
      return [];
    default:
      return [];
  }
};

const collectBusinessPlanLines = (
  chapters: BusinessPlanChapterWithSections[],
  path: string[] = []
): ContextLine[] => {
  const lines: ContextLine[] = [];

  for (const chapter of chapters) {
    const chapterPath = [...path, chapter.title];
    const chapterHints = chapterPath.filter(Boolean);

    for (const section of chapter.sections) {
      const sectionLines = extractSectionLines(section.content);
      for (const line of sectionLines) {
        const contextLine = makeContextLine(line, chapterHints);
        if (contextLine) {
          lines.push(contextLine);
        }
      }
    }

    if (chapter.children && chapter.children.length > 0) {
      lines.push(...collectBusinessPlanLines(chapter.children, chapterPath));
    }
  }

  return lines;
};

const isCanvasSectionItem = (value: unknown): value is CanvasSectionItem => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CanvasSectionItem>;
  return (
    (typeof candidate.title === "string" && candidate.title.trim().length > 0) ||
    (typeof candidate.description === "string" && candidate.description.trim().length > 0)
  );
};

const extractCanvasLinesFromModel = (model: {
  title: string | null;
  template_type: WorkspaceCanvasTemplateType;
  sections_data: unknown;
}): ContextLine[] => {
  if (!model.sections_data || typeof model.sections_data !== "object") {
    return [];
  }

  const sectionsData = model.sections_data as CanvasSectionsData;
  const baseHints = [
    model.title ?? "",
    model.template_type.replace(/-/g, " "),
    "canvas",
  ].filter(Boolean);

  const lines: ContextLine[] = [];

  for (const [sectionId, rawItems] of Object.entries(sectionsData)) {
    if (!Array.isArray(rawItems)) {
      continue;
    }

    const sectionLabel = humanizeIdentifier(sectionId);
    const sectionHints = [...baseHints, sectionId, sectionLabel];

    for (const rawItem of rawItems) {
      if (!isCanvasSectionItem(rawItem)) {
        continue;
      }

      const itemLine = [rawItem.title ?? "", rawItem.description ?? ""]
        .filter((chunk) => chunk.trim().length > 0)
        .join(": ");

      const contextLine = makeContextLine(itemLine, sectionHints);
      if (contextLine) {
        lines.push(contextLine);
      }
    }
  }

  return lines;
};

async function getBusinessPlanContextLines(params: {
  workspaceId: WorkspaceId;
  userId: UserId;
}): Promise<ContextLine[]> {
  try {
    const businessPlan = await getBusinessPlanWithChapters(params);
    if (!businessPlan) {
      return [];
    }

    return collectBusinessPlanLines(businessPlan.chapters);
  } catch {
    return [];
  }
}

async function getCanvasContextLines(params: {
  client: Supa;
  workspaceId: WorkspaceId;
}): Promise<ContextLine[]> {
  const { client, workspaceId } = params;

  try {
    const { data, error } = await client
      .from("workspace_canvas_models")
      .select("title,template_type,sections_data")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(3);

    if (error) {
      return [];
    }

    const rows = (data ?? []) as Array<{
      title: string | null;
      template_type: WorkspaceCanvasTemplateType;
      sections_data: unknown;
    }>;

    return rows.flatMap(extractCanvasLinesFromModel);
  } catch {
    return [];
  }
}

async function buildContextAwareSeedSlides(params: {
  client: Supa;
  workspaceId: WorkspaceId;
  userId: UserId;
}): Promise<SeedSlideDefinition[]> {
  const { client, workspaceId, userId } = params;

  const [businessPlanLines, canvasLines] = await Promise.all([
    getBusinessPlanContextLines({ workspaceId, userId }),
    getCanvasContextLines({ client, workspaceId }),
  ]);

  const allContextLines = [...businessPlanLines, ...canvasLines].slice(
    0,
    MAX_SEED_CONTEXT_LINES
  );

  return DEFAULT_PITCH_SECTION_SLIDES.map((defaultSlide) => {
    const fallbackSlide = cloneSeedSlide(defaultSlide);
    const keywords = SLIDE_CONTEXT_KEYWORDS[defaultSlide.title] ?? [];
    const contextualBullets = pickContextBullets(allContextLines, keywords, 3);

    if (contextualBullets.length === 0) {
      return fallbackSlide;
    }

    return {
      ...fallbackSlide,
      content: {
        ...fallbackSlide.content,
        bullets: mergeBullets(contextualBullets, fallbackSlide.content.bullets, 3),
      },
    };
  });
};

async function userHasWorkspaceAccess(
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
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to check workspace access: ${error.message}`);
  }

  return data != null;
}

async function ensureUserHasWorkspaceAccess(
  client: Supa,
  workspaceId: WorkspaceId,
  userId: UserId
): Promise<void> {
  const hasAccess = await userHasWorkspaceAccess(client, workspaceId, userId);
  if (!hasAccess) {
    throw new Error("User does not have access to this workspace.");
  }
}

async function getWorkspaceIdFromPitchDeck(
  client: Supa,
  pitchDeckId: PitchDeckId
): Promise<WorkspaceId | null> {
  const { data, error } = await client
    .from("pitch_decks")
    .select("workspace_id")
    .eq("id", pitchDeckId)
    .single();

  if (error || !data) {
    return null;
  }

  return (data as { workspace_id: WorkspaceId }).workspace_id;
}

async function getWorkspaceIdFromSlide(
  client: Supa,
  slideId: PitchDeckSlideId
): Promise<WorkspaceId | null> {
  const { data, error } = await client
    .from("pitch_deck_slides")
    .select("pitch_deck_id")
    .eq("id", slideId)
    .single();

  if (error || !data) {
    return null;
  }

  const pitchDeckId = (data as { pitch_deck_id: PitchDeckId }).pitch_deck_id;
  return getWorkspaceIdFromPitchDeck(client, pitchDeckId);
}

// ========== MAPPERS ==========

function mapTemplateRow(row: unknown): PitchDeckTemplate {
  const r = row as {
    id: string;
    name: string;
    description: string | null;
    thumbnail_url: string | null;
    cover_design: unknown;
    slide_design: unknown;
    color_scheme: unknown;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    thumbnail_url: r.thumbnail_url,
    cover_design: r.cover_design as PitchDeckCoverDesign,
    slide_design: r.slide_design as PitchDeckSlideDesign,
    color_scheme: r.color_scheme as PitchDeckColorScheme,
    is_active: r.is_active,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function mapPitchDeckRow(row: unknown): PitchDeck {
  const r = row as {
    id: string;
    workspace_id: string;
    template_id: string | null;
    title: string;
    settings: unknown;
    created_by: string;
    created_at: string;
    updated_at: string;
  };
  return {
    id: r.id,
    workspace_id: r.workspace_id,
    template_id: r.template_id,
    title: r.title,
    settings: r.settings as PitchDeckSettings,
    created_by: r.created_by,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function mapSlideRow(row: unknown): PitchDeckSlide {
  const r = row as {
    id: string;
    pitch_deck_id: string;
    title: string;
    slide_type: string;
    order_index: number;
    content: unknown;
    created_at: string;
    updated_at: string;
  };
  return {
    id: r.id,
    pitch_deck_id: r.pitch_deck_id,
    title: r.title,
    slide_type: r.slide_type as "cover" | "content",
    order_index: r.order_index,
    content: r.content as PitchDeckSlideContent,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// ========== TEMPLATE FUNCTIONS ==========

export async function getTemplates(): Promise<PitchDeckTemplate[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("pitch_deck_templates")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`);
  }

  return (data ?? []).map(mapTemplateRow);
}

export async function getTemplateById(
  templateId: PitchDeckTemplateId
): Promise<PitchDeckTemplate | null> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("pitch_deck_templates")
    .select("*")
    .eq("id", templateId)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch template: ${error.message}`);
  }

  return mapTemplateRow(data);
}

// ========== PITCH DECK CRUD ==========

export async function getPitchDecksByWorkspace(params: {
  workspaceId: WorkspaceId;
  userId: UserId;
}): Promise<PitchDeck[]> {
  const { workspaceId, userId } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { data, error } = await client
    .from("pitch_decks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch pitch decks: ${error.message}`);
  }

  return (data ?? []).map(mapPitchDeckRow);
}

export async function getPitchDeck(params: {
  pitchDeckId: PitchDeckId;
  userId: UserId;
  fresh?: boolean;
}): Promise<PitchDeckWithSlides | null> {
  const { pitchDeckId, userId, fresh } = params;
  const client = getSupabaseClient({ fresh });

  // Get pitch deck
  const { data: deckData, error: deckError } = await client
    .from("pitch_decks")
    .select("*")
    .eq("id", pitchDeckId)
    .single();

  if (deckError) {
    if (deckError.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch pitch deck: ${deckError.message}`);
  }

  const pitchDeck = mapPitchDeckRow(deckData);

  // Check access
  await ensureUserHasWorkspaceAccess(client, pitchDeck.workspace_id, userId);

  // Get slides
  const { data: slidesData, error: slidesError } = await client
    .from("pitch_deck_slides")
    .select("*")
    .eq("pitch_deck_id", pitchDeckId)
    .order("order_index", { ascending: true });

  if (slidesError) {
    throw new Error(`Failed to fetch slides: ${slidesError.message}`);
  }

  const slides = (slidesData ?? []).map(mapSlideRow);

  // Get template if exists
  let template: PitchDeckTemplate | null = null;
  if (pitchDeck.template_id) {
    template = await getTemplateById(pitchDeck.template_id);
  }

  return {
    pitchDeck,
    slides,
    template,
  };
}

export async function createPitchDeck(
  params: CreatePitchDeckParams
): Promise<PitchDeck> {
  const { workspaceId, templateId, title, createdBy } = params;
  const client = getSupabaseClient();

  await ensureUserHasWorkspaceAccess(client, workspaceId, createdBy);

  // Get template for default settings
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new Error("Template not found");
  }

  const defaultSettings: PitchDeckSettings = {
    paperSize: "16:9",
    fontFamily: "Roboto",
    fontSize: 15,
  };

  const { data, error } = await client
    .from("pitch_decks")
    .insert({
      workspace_id: workspaceId,
      template_id: templateId,
      title,
      settings: defaultSettings,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create pitch deck: ${error.message}`);
  }

  const pitchDeck = mapPitchDeckRow(data);
  const seededSlides = await buildContextAwareSeedSlides({
    client,
    workspaceId,
    userId: createdBy,
  });

  const slidesToInsert = [
    {
      pitch_deck_id: pitchDeck.id,
      title,
      slide_type: "cover" as const,
      order_index: 0,
      content: {
        type: "title_only" as const,
        title,
        subtitle: "",
      } satisfies PitchDeckSlideContent,
    },
    ...seededSlides.map((slide, index) => ({
      pitch_deck_id: pitchDeck.id,
      title: slide.title,
      slide_type: "content" as const,
      order_index: index + 1,
      content: slide.content,
    })),
  ];

  const { error: slidesError } = await client.from("pitch_deck_slides").insert(slidesToInsert);
  if (slidesError) {
    await client.from("pitch_decks").delete().eq("id", pitchDeck.id);
    throw new Error(`Failed to seed default pitch slides: ${slidesError.message}`);
  }

  return pitchDeck;
}

export async function updatePitchDeck(
  params: UpdatePitchDeckParams & { userId: UserId }
): Promise<PitchDeck> {
  const { pitchDeckId, userId, title, settings, templateId } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromPitchDeck(client, pitchDeckId);
  if (!workspaceId) {
    throw new Error("Pitch deck not found");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Get current pitch deck for settings merge
  const { data: currentDeck } = await client
    .from("pitch_decks")
    .select("settings")
    .eq("id", pitchDeckId)
    .single();

  const updateData: Record<string, unknown> = {};

  if (title !== undefined) {
    updateData.title = title;
  }
  

  if (settings !== undefined && currentDeck) {
    updateData.settings = {
      ...currentDeck.settings,
      ...settings,
    };
  }

  if (templateId !== undefined) {
    updateData.template_id = templateId;
  }

  if (Object.keys(updateData).length === 0) {
    // Nothing to update, return current deck
    const { data } = await client
      .from("pitch_decks")
      .select("*")
      .eq("id", pitchDeckId)
      .single();
    return mapPitchDeckRow(data);
  }

  const { data, error } = await client
    .from("pitch_decks")
    .update(updateData)
    .eq("id", pitchDeckId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update pitch deck: ${error.message}`);
  }

  return mapPitchDeckRow(data);
}

export async function deletePitchDeck(params: {
  pitchDeckId: PitchDeckId;
  userId: UserId;
}): Promise<void> {
  const { pitchDeckId, userId } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromPitchDeck(client, pitchDeckId);
  if (!workspaceId) {
    throw new Error("Pitch deck not found");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { error } = await client
    .from("pitch_decks")
    .delete()
    .eq("id", pitchDeckId);

  if (error) {
    throw new Error(`Failed to delete pitch deck: ${error.message}`);
  }
}

export async function duplicatePitchDeck(
  params: DuplicatePitchDeckParams & { userId: UserId }
): Promise<PitchDeck> {
  const { pitchDeckId, userId, newTitle } = params;
  const client = getSupabaseClient();

  // Get original pitch deck with slides
  const original = await getPitchDeck({ pitchDeckId, userId });
  if (!original) {
    throw new Error("Pitch deck not found");
  }

  // Create new pitch deck
  const { data: newDeck, error: deckError } = await client
    .from("pitch_decks")
    .insert({
      workspace_id: original.pitchDeck.workspace_id,
      template_id: original.pitchDeck.template_id,
      title: newTitle ?? `${original.pitchDeck.title} (Copy)`,
      settings: original.pitchDeck.settings,
      created_by: userId,
    })
    .select()
    .single();

  if (deckError) {
    throw new Error(`Failed to duplicate pitch deck: ${deckError.message}`);
  }

  const createdDeck = newDeck as {
    id: PitchDeckId;
    workspace_id: WorkspaceId;
    template_id: PitchDeckTemplateId;
    title: string;
    settings: PitchDeckSettings | null;
    created_at: string;
    updated_at: string;
    created_by: UserId | null;
  };
  const newDeckId = createdDeck.id;

  // Duplicate all slides
  if (original.slides.length > 0) {
    const slidesToInsert = original.slides.map((slide) => ({
      pitch_deck_id: newDeckId,
      title: slide.title,
      slide_type: slide.slide_type,
      order_index: slide.order_index,
      content: slide.content,
    }));

    const { error: slidesError } = await client
      .from("pitch_deck_slides")
      .insert(slidesToInsert);

    if (slidesError) {
      // Clean up the deck if slides failed
      await client.from("pitch_decks").delete().eq("id", newDeckId);
      throw new Error(`Failed to duplicate slides: ${slidesError.message}`);
    }
  }

  return mapPitchDeckRow(createdDeck);
}

// ========== SLIDE CRUD ==========

export async function createSlide(
  params: CreatePitchDeckSlideParams & { userId: UserId }
): Promise<PitchDeckSlide> {
  const { pitchDeckId, userId, title, slideType, content, orderIndex } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromPitchDeck(client, pitchDeckId);
  if (!workspaceId) {
    throw new Error("Pitch deck not found");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Get next order index if not provided
  let finalOrderIndex = orderIndex;
  if (finalOrderIndex === undefined) {
    const { data: maxOrderData } = await client
      .from("pitch_deck_slides")
      .select("order_index")
      .eq("pitch_deck_id", pitchDeckId)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const maxOrderRow = maxOrderData as { order_index: number } | null;
    finalOrderIndex = maxOrderRow ? maxOrderRow.order_index + 1 : 0;
  }

  const { data, error } = await client
    .from("pitch_deck_slides")
    .insert({
      pitch_deck_id: pitchDeckId,
      title,
      slide_type: slideType ?? "content",
      order_index: finalOrderIndex,
      content,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create slide: ${error.message}`);
  }

  return mapSlideRow(data);
}

export async function updateSlide(
  params: UpdatePitchDeckSlideParams & { userId: UserId }
): Promise<PitchDeckSlide> {
  const { slideId, userId, title, slideType, content, orderIndex } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromSlide(client, slideId);
  if (!workspaceId) {
    throw new Error("Slide not found");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const updateData: Record<string, unknown> = {};

  if (title !== undefined) {
    updateData.title = title;
  }

  if (slideType !== undefined) {
    updateData.slide_type = slideType;
  }

  if (content !== undefined) {
    updateData.content = content;
  }

  if (orderIndex !== undefined) {
    updateData.order_index = orderIndex;
  }

  if (Object.keys(updateData).length === 0) {
    const { data } = await client
      .from("pitch_deck_slides")
      .select("*")
      .eq("id", slideId)
      .single();
    return mapSlideRow(data);
  }

  const { data, error } = await client
    .from("pitch_deck_slides")
    .update(updateData)
    .eq("id", slideId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update slide: ${error.message}`);
  }

  return mapSlideRow(data);
}

export async function deleteSlide(params: {
  slideId: PitchDeckSlideId;
  userId: UserId;
}): Promise<void> {
  const { slideId, userId } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromSlide(client, slideId);
  if (!workspaceId) {
    throw new Error("Slide not found");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  const { error } = await client
    .from("pitch_deck_slides")
    .delete()
    .eq("id", slideId);

  if (error) {
    throw new Error(`Failed to delete slide: ${error.message}`);
  }
}

export async function reorderSlides(
  params: ReorderPitchDeckSlidesParams & { userId: UserId }
): Promise<void> {
  const { pitchDeckId, userId, orderedSlideIds } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromPitchDeck(client, pitchDeckId);
  if (!workspaceId) {
    throw new Error("Pitch deck not found");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Update each slide's order_index
  const updates = orderedSlideIds.map((slideId, index) =>
    client
      .from("pitch_deck_slides")
      .update({ order_index: index })
      .eq("id", slideId)
      .eq("pitch_deck_id", pitchDeckId)
  );

  const results = await Promise.all(updates);

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    throw new Error(`Failed to reorder slides: ${failed.error.message}`);
  }
}

export async function duplicateSlide(params: {
  slideId: PitchDeckSlideId;
  userId: UserId;
}): Promise<PitchDeckSlide> {
  const { slideId, userId } = params;
  const client = getSupabaseClient();

  const workspaceId = await getWorkspaceIdFromSlide(client, slideId);
  if (!workspaceId) {
    throw new Error("Slide not found");
  }

  await ensureUserHasWorkspaceAccess(client, workspaceId, userId);

  // Get original slide
  const { data: originalSlide, error: fetchError } = await client
    .from("pitch_deck_slides")
    .select("*")
    .eq("id", slideId)
    .single();

  if (fetchError || !originalSlide) {
    throw new Error("Slide not found");
  }

  const slide = mapSlideRow(originalSlide);

  // Get max order index
  const { data: maxOrderData } = await client
    .from("pitch_deck_slides")
    .select("order_index")
    .eq("pitch_deck_id", slide.pitch_deck_id)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const maxOrderRow = maxOrderData as { order_index: number } | null;
  const newOrderIndex = maxOrderRow ? maxOrderRow.order_index + 1 : 0;

  // Create duplicate
  const { data, error } = await client
    .from("pitch_deck_slides")
    .insert({
      pitch_deck_id: slide.pitch_deck_id,
      title: `${slide.title} (Copy)`,
      slide_type: slide.slide_type,
      order_index: newOrderIndex,
      content: slide.content,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to duplicate slide: ${error.message}`);
  }

  return mapSlideRow(data);
}
