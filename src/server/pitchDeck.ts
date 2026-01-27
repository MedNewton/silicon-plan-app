// src/server/pitchDeck.ts
import { getSupabaseClient, type SupabaseDb } from "@/lib/supabaseServer";
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
} from "@/types/workspaces";
import type { SupabaseClient } from "@supabase/supabase-js";

type Supa = SupabaseClient<SupabaseDb>;

// ========== HELPERS ==========

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

  return getWorkspaceIdFromPitchDeck(client, data.pitch_deck_id);
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
  const client = await getSupabaseClient();

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
  const client = await getSupabaseClient();

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
  const client = await getSupabaseClient();

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
  const client = await getSupabaseClient({ fresh });

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
  const client = await getSupabaseClient();

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

  // Create default cover slide
  await client.from("pitch_deck_slides").insert({
    pitch_deck_id: pitchDeck.id,
    title: title,
    slide_type: "cover",
    order_index: 0,
    content: {
      type: "title_only",
      title: title,
      subtitle: "",
    },
  });

  return pitchDeck;
}

export async function updatePitchDeck(
  params: UpdatePitchDeckParams & { userId: UserId }
): Promise<PitchDeck> {
  const { pitchDeckId, userId, title, settings, templateId } = params;
  const client = await getSupabaseClient();

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
      ...(currentDeck.settings as PitchDeckSettings),
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
  const client = await getSupabaseClient();

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
  const client = await getSupabaseClient();

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

  // Duplicate all slides
  if (original.slides.length > 0) {
    const slidesToInsert = original.slides.map((slide) => ({
      pitch_deck_id: newDeck.id,
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
      await client.from("pitch_decks").delete().eq("id", newDeck.id);
      throw new Error(`Failed to duplicate slides: ${slidesError.message}`);
    }
  }

  return mapPitchDeckRow(newDeck);
}

// ========== SLIDE CRUD ==========

export async function createSlide(
  params: CreatePitchDeckSlideParams & { userId: UserId }
): Promise<PitchDeckSlide> {
  const { pitchDeckId, userId, title, slideType, content, orderIndex } = params;
  const client = await getSupabaseClient();

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

    finalOrderIndex = maxOrderData ? maxOrderData.order_index + 1 : 0;
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
  const client = await getSupabaseClient();

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
  const client = await getSupabaseClient();

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
  const client = await getSupabaseClient();

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
  const client = await getSupabaseClient();

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

  const newOrderIndex = maxOrderData ? maxOrderData.order_index + 1 : 0;

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
