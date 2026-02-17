// src/types/workspaces.ts

// ========== ID ALIASES ==========

export type WorkspaceId = string;
export type WorkspaceMemberId = string;
export type WorkspaceBusinessProfileId = string;
export type WorkspaceAiDocumentId = string;
export type WorkspaceAiKnowledgeId = string;
export type WorkspaceAiLibraryEventId = string;
export type WorkspaceCanvasModelId = string;

// Business Plan IDs
export type BusinessPlanId = string;
export type BusinessPlanChapterId = string;
export type BusinessPlanSectionId = string;
export type BusinessPlanTaskId = string;
export type BusinessPlanAiConversationId = string;
export type BusinessPlanAiMessageId = string;
export type BusinessPlanPendingChangeId = string;

// Pitch Deck IDs
export type PitchDeckTemplateId = string;
export type PitchDeckId = string;
export type PitchDeckSlideId = string;

// id for invites
export type WorkspaceMemberInviteId = string;

// Clerk user id
export type UserId = string;

// ========== ENUM-LIKE STRING LITERALS ==========

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export type WorkspaceMemberStatus = "active" | "invited" | "removed";

export type WorkspaceAiDocumentStatus =
  | "uploading"
  | "processing"
  | "uploaded"
  | "failed";

export type WorkspaceAiLibraryEventType =
  | "document_uploaded"
  | "document_deleted"
  | "document_processing_started"
  | "document_processing_completed"
  | "document_processing_failed"
  | "knowledge_created"
  | "knowledge_updated"
  | "knowledge_deleted";

export type WorkspaceCanvasTemplateType =
  | "business-model"
  | "four-quarters"
  | "value-proposition"
  | "pitch"
  | "startup"
  | "lean";

// Business Plan enums (matching database enums)
export type BusinessPlanStatus = "draft" | "published";
export type BusinessPlanCurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "INR";

export type BusinessPlanSectionType =
  | "section_title"
  | "subsection"
  | "text"
  | "image"
  | "table"
  | "list"
  | "comparison_table"
  | "timeline"
  | "embed"
  | "page_break"
  | "empty_space";

export type BusinessPlanTaskHierarchyLevel = "h1" | "h2";
export type BusinessPlanTaskStatus = "todo" | "in_progress" | "done";

export type AiMessageRole = "user" | "assistant";

export type PendingChangeType =
  | "add_section"
  | "update_section"
  | "delete_section"
  | "reorder_sections"
  | "add_chapter"
  | "update_chapter"
  | "delete_chapter"
  | "reorder_chapters"
  | "add_task"
  | "update_task"
  | "delete_task";

export type PendingChangeStatus = "pending" | "approved" | "rejected";

// Pitch Deck enums
export type PitchDeckSlideType = "cover" | "content";

export type PitchDeckSlideContentType =
  | "title_only"
  | "title_bullets"
  | "title_image"
  | "title_text"
  | "two_columns"
  | "comparison"
  | "timeline"
  | "team_grid"
  | "metrics"
  | "quote"
  | "blank";

// ========== CORE ENTITIES (MATCH SUPABASE COLUMNS) ==========

export type Workspace = {
  id: WorkspaceId;
  owner_user_id: UserId;
  name: string;
  image_url: string | null;
  is_archived: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
};

export type WorkspaceMember = {
  id: WorkspaceMemberId;
  workspace_id: WorkspaceId;
  user_id: UserId;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  invited_email: string | null;
  added_by_user_id: UserId | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceBusinessProfile = {
  id: WorkspaceBusinessProfileId;
  workspace_id: WorkspaceId;

  tagline: string | null;
  is_operating: boolean | null;
  industry: string | null;
  company_stage: string | null;

  problem_short: string | null;
  problem_long: string | null;
  solution_and_uniqueness: string | null;
  team_and_roles: string | null;
  financial_projections: string | null;
  risks_and_mitigation: string | null;
  success_metrics: string | null;
  growth_partnerships: string | null;

  raw_form_data: Record<string, unknown> | null;

  created_at: string;
  updated_at: string;
};

export type WorkspaceAiDocument = {
  id: WorkspaceAiDocumentId;
  workspace_id: WorkspaceId;
  created_by: UserId | null;
  name: string;
  file_type: string | null;
  storage_bucket: string;
  storage_path: string;
  uploaded_at: string;
  status: WorkspaceAiDocumentStatus;
  ai_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceAiKnowledge = {
  id: WorkspaceAiKnowledgeId;
  workspace_id: WorkspaceId;
  key_name: string;
  label: string;
  value: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type WorkspaceAiLibraryEvent = {
  id: WorkspaceAiLibraryEventId;
  workspace_id: WorkspaceId;
  user_id: UserId | null;
  event_type: WorkspaceAiLibraryEventType;
  document_id: WorkspaceAiDocumentId | null;
  knowledge_id: WorkspaceAiKnowledgeId | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

// Canvas section item structure
export type CanvasSectionItem = {
  id: string;
  title: string;
  description: string;
};

// Canvas sections data (keyed by section ID)
export type CanvasSectionsData = Record<string, CanvasSectionItem[]>;

export type WorkspaceCanvasModel = {
  id: WorkspaceCanvasModelId;
  workspace_id: WorkspaceId;
  created_by: UserId;
  title: string;
  template_type: WorkspaceCanvasTemplateType;
  sections_data: CanvasSectionsData;
  created_at: string;
  updated_at: string;
};

// ========== BUSINESS PLAN ENTITIES ==========

export type BusinessPlan = {
  id: BusinessPlanId;
  workspace_id: WorkspaceId;
  title: string;
  status: BusinessPlanStatus;
  export_settings: BusinessPlanExportSettings | null;
  created_at: string;
  updated_at: string;
};

export type BusinessPlanExportSettings = {
  include_toc?: boolean;
  include_cover_page?: boolean;
  font_family?: string;
  font_size?: number;
  currency_code?: BusinessPlanCurrencyCode;
  page_margins?: { top: number; right: number; bottom: number; left: number };
};

export type BusinessPlanChapter = {
  id: BusinessPlanChapterId;
  business_plan_id: BusinessPlanId;
  parent_id: BusinessPlanChapterId | null;
  title: string;
  order_index: number;
  is_collapsed: boolean;
  created_at: string;
  updated_at: string;
};

export type BusinessPlanSection = {
  id: BusinessPlanSectionId;
  chapter_id: BusinessPlanChapterId;
  section_type: BusinessPlanSectionType;
  content: BusinessPlanSectionContent;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type BusinessPlanTask = {
  id: BusinessPlanTaskId;
  business_plan_id: BusinessPlanId;
  parent_task_id: BusinessPlanTaskId | null;
  title: string;
  instructions: string;
  ai_prompt: string;
  hierarchy_level: BusinessPlanTaskHierarchyLevel;
  status: BusinessPlanTaskStatus;
  order_index: number;
  created_at: string;
  updated_at: string;
};

// Section content types (discriminated union based on section_type)
// Matching database enum: section_title, subsection, text, image, table, list, comparison_table, timeline, embed, page_break, empty_space
export type BusinessPlanSectionContent =
  | SectionTitleContent
  | SubsectionContent
  | TextSectionContent
  | ImageSectionContent
  | TableSectionContent
  | ListSectionContent
  | ComparisonTableContent
  | TimelineSectionContent
  | EmbedSectionContent
  | PageBreakContent
  | EmptySpaceContent;

export type SectionTitleContent = {
  type: "section_title";
  text: string;
};

export type SubsectionContent = {
  type: "subsection";
  text: string;
};

export type TextSectionContent = {
  type: "text";
  text: string;
};

export type ImageSectionContent = {
  type: "image";
  url: string;
  alt_text?: string;
  caption?: string;
};

export type TableSectionContent = {
  type: "table";
  headers: string[];
  rows: string[][];
  caption?: string;
};

export type ListSectionContent = {
  type: "list";
  items: string[];
  ordered: boolean;
};

export type ComparisonTableContent = {
  type: "comparison_table";
  headers: string[];
  rows: string[][];
};

export type TimelineSectionContent = {
  type: "timeline";
  entries: Array<{
    date: string;
    title: string;
    description?: string;
  }>;
};

export type EmbedSectionContent = {
  type: "embed";
  embed_type: "html" | "iframe" | "video";
  code: string;
};

export type PageBreakContent = {
  type: "page_break";
};

export type EmptySpaceContent = {
  type: "empty_space";
  height?: number;
};

// AI conversation entities
export type BusinessPlanAiConversation = {
  id: BusinessPlanAiConversationId;
  business_plan_id: BusinessPlanId;
  user_id: UserId;
  created_at: string;
};

export type BusinessPlanAiMessage = {
  id: BusinessPlanAiMessageId;
  conversation_id: BusinessPlanAiConversationId;
  role: AiMessageRole;
  content: string;
  metadata: AiMessageMetadata | null;
  created_at: string;
};

export type AiMessageMetadata = {
  tokens_used?: number;
  model?: string;
  has_pending_changes?: boolean;
  pending_change_ids?: string[];
};

// Pending changes for AI suggestions
export type BusinessPlanPendingChange = {
  id: BusinessPlanPendingChangeId;
  conversation_id: BusinessPlanAiConversationId;
  message_id: BusinessPlanAiMessageId;
  change_type: PendingChangeType;
  target_id: string | null;
  proposed_data: Record<string, unknown>;
  status: PendingChangeStatus;
  created_at: string;
  reviewed_at: string | null;
};

// Invite row type (matches SQL table)
export type WorkspaceMemberInvite = {
  id: WorkspaceMemberInviteId;
  workspace_id: WorkspaceId;
  email: string;
  role: WorkspaceRole;
  token: string;
  invited_by_user_id: UserId;
  expires_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  declined_by_user_id: UserId | null;
  revoked_at: string | null;
  revoked_by_user_id: UserId | null;
  resend_count: number;
  last_sent_at: string | null;
  created_at: string;
};

// ========== AGGREGATE TYPES ==========

export type WorkspaceWithDetails = {
  workspace: Workspace;
  businessProfile: WorkspaceBusinessProfile | null;
  members: WorkspaceMember[];
};

// ========== INPUT TYPES (FOR SERVER FUNCTIONS / APIS) ==========

export type CreateWorkspaceParams = {
  userId: UserId; // Clerk user id of the creator
  name: string;
  imageUrl?: string | null;
};

export type UpdateWorkspaceParams = {
  workspaceId: WorkspaceId;
  name?: string;
  imageUrl?: string | null;
  isArchived?: boolean;
};

export type UpsertWorkspaceMemberParams = {
  workspaceId: WorkspaceId;
  userId: UserId;
  role: WorkspaceRole;
  status?: WorkspaceMemberStatus; // default "active" if omitted
  invitedEmail?: string | null;
  addedByUserId?: UserId | null;
};

export type RemoveWorkspaceMemberParams = {
  workspaceId: WorkspaceId;
  userId: UserId;
};

export type UpsertWorkspaceBusinessProfileParams = {
  workspaceId: WorkspaceId;

  tagline?: string | null;
  isOperating?: boolean | null;
  industry?: string | null;
  companyStage?: string | null;

  problemShort?: string | null;
  problemLong?: string | null;
  solutionAndUniqueness?: string | null;
  teamAndRoles?: string | null;
  financialProjections?: string | null;
  risksAndMitigation?: string | null;
  successMetrics?: string | null;
  growthPartnerships?: string | null;

  rawFormData?: Record<string, unknown> | null;
};

export type CreateWorkspaceAiDocumentParams = {
  workspaceId: WorkspaceId;
  name: string;
  fileType?: string | null;
  storageBucket: string; // Supabase bucket name
  storagePath: string; // path inside the bucket
  status?: WorkspaceAiDocumentStatus; // default "uploaded" if omitted
  aiMetadata?: Record<string, unknown> | null;
  createdByUserId?: UserId | null;
};

export type UpsertWorkspaceAiKnowledgeParams = {
  workspaceId: WorkspaceId;
  keyName: string; // e.g. "industry"
  label: string; // human label
  value: string;
  orderIndex?: number;
};

export type CreateWorkspaceMemberInviteParams = {
  workspaceId: WorkspaceId;
  email: string;
  role: WorkspaceRole;
  invitedByUserId: UserId;
  expiresAt?: string | null; // optional override, normally we compute +7 days
};

export type CreateWorkspaceAiLibraryEventParams = {
  workspaceId: WorkspaceId;
  userId?: UserId | null;
  eventType: WorkspaceAiLibraryEventType;
  documentId?: WorkspaceAiDocumentId | null;
  knowledgeId?: WorkspaceAiKnowledgeId | null;
  payload?: Record<string, unknown> | null;
};

export type CreateWorkspaceCanvasModelParams = {
  workspaceId: WorkspaceId;
  createdBy: UserId;
  title: string;
  templateType: WorkspaceCanvasTemplateType;
  sectionsData?: CanvasSectionsData;
};

export type UpdateWorkspaceCanvasModelParams = {
  canvasId: WorkspaceCanvasModelId;
  title?: string;
  sectionsData?: CanvasSectionsData;
};

// ========== BUSINESS PLAN INPUT TYPES ==========

export type CreateBusinessPlanParams = {
  workspaceId: WorkspaceId;
  title: string;
  status?: BusinessPlanStatus;
};

export type UpdateBusinessPlanParams = {
  businessPlanId: BusinessPlanId;
  title?: string;
  status?: BusinessPlanStatus;
  exportSettings?: BusinessPlanExportSettings | null;
};

export type CreateBusinessPlanChapterParams = {
  businessPlanId: BusinessPlanId;
  parentChapterId?: BusinessPlanChapterId | null;
  title: string;
  orderIndex?: number;
};

export type UpdateBusinessPlanChapterParams = {
  chapterId: BusinessPlanChapterId;
  title?: string;
  orderIndex?: number;
  parentChapterId?: BusinessPlanChapterId | null;
};

export type CreateBusinessPlanSectionParams = {
  chapterId: BusinessPlanChapterId;
  sectionType: BusinessPlanSectionType;
  content: BusinessPlanSectionContent;
  orderIndex?: number;
};

export type UpdateBusinessPlanSectionParams = {
  sectionId: BusinessPlanSectionId;
  sectionType?: BusinessPlanSectionType;
  content?: BusinessPlanSectionContent;
  orderIndex?: number;
};

export type CreateBusinessPlanTaskParams = {
  businessPlanId: BusinessPlanId;
  parentTaskId?: BusinessPlanTaskId | null;
  title: string;
  instructions?: string;
  aiPrompt?: string;
  hierarchyLevel: BusinessPlanTaskHierarchyLevel;
  status?: BusinessPlanTaskStatus;
  orderIndex?: number;
};

export type UpdateBusinessPlanTaskParams = {
  taskId: BusinessPlanTaskId;
  parentTaskId?: BusinessPlanTaskId | null;
  title?: string;
  instructions?: string;
  aiPrompt?: string;
  hierarchyLevel?: BusinessPlanTaskHierarchyLevel;
  status?: BusinessPlanTaskStatus;
  orderIndex?: number;
};

export type CreateAiConversationParams = {
  businessPlanId: BusinessPlanId;
  userId: UserId;
};

export type CreateAiMessageParams = {
  conversationId: BusinessPlanAiConversationId;
  role: AiMessageRole;
  content: string;
  metadata?: AiMessageMetadata | null;
};

export type CreatePendingChangeParams = {
  messageId: BusinessPlanAiMessageId;
  changeType: PendingChangeType;
  targetId?: string | null;
  proposedData: Record<string, unknown>;
};

export type ResolvePendingChangeParams = {
  pendingChangeId: BusinessPlanPendingChangeId;
  status: "approved" | "rejected";
};

// ========== BUSINESS PLAN AGGREGATE TYPES ==========

export type BusinessPlanWithChapters = {
  businessPlan: BusinessPlan;
  chapters: BusinessPlanChapterWithSections[];
};

export type BusinessPlanChapterWithSections = BusinessPlanChapter & {
  sections: BusinessPlanSection[];
  children?: BusinessPlanChapterWithSections[];
};

export type BusinessPlanTaskWithChildren = BusinessPlanTask & {
  children?: BusinessPlanTaskWithChildren[];
};

export type AiConversationWithMessages = {
  conversation: BusinessPlanAiConversation;
  messages: BusinessPlanAiMessage[];
};

// ========== PITCH DECK ENTITIES ==========

// Template color scheme
export type PitchDeckColorScheme = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  border: string;
};

// Background overlay types for templates
export type PitchDeckBackgroundOverlay = {
  type: "curve" | "stripes" | "wave" | "dots" | "curves";
  color: string;
  position?: string;
  angle?: number;
  size?: number;
  spacing?: number;
  strokeWidth?: number;
};

// Background definition
export type PitchDeckBackground = {
  type: "gradient" | "solid" | "image";
  gradient?: string;
  color?: string;
  imageUrl?: string;
  overlay?: PitchDeckBackgroundOverlay;
};

// Style definitions for text elements
export type PitchDeckTextStyle = {
  color: string;
  fontSize: number;
  fontWeight?: number;
  textAlign?: "left" | "center" | "right";
};

// Cover design configuration
export type PitchDeckCoverDesign = {
  background: PitchDeckBackground;
  titleStyle: PitchDeckTextStyle;
};

// Slide design configuration
export type PitchDeckSlideDesign = {
  background: PitchDeckBackground;
  titleStyle: PitchDeckTextStyle;
  contentStyle: PitchDeckTextStyle;
};

// Template entity (read-only, predefined)
export type PitchDeckTemplate = {
  id: PitchDeckTemplateId;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  cover_design: PitchDeckCoverDesign;
  slide_design: PitchDeckSlideDesign;
  color_scheme: PitchDeckColorScheme;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Pitch deck settings
export type PitchDeckSettings = {
  paperSize: "16:9" | "4:3" | "A4";
  fontFamily: string;
  fontSize: number;
};

// Pitch deck entity
export type PitchDeck = {
  id: PitchDeckId;
  workspace_id: WorkspaceId;
  template_id: PitchDeckTemplateId | null;
  title: string;
  settings: PitchDeckSettings;
  created_by: UserId;
  created_at: string;
  updated_at: string;
};

// Slide content types
export type PitchDeckSlideContent =
  | PitchDeckTitleOnlyContent
  | PitchDeckTitleBulletsContent
  | PitchDeckTitleImageContent
  | PitchDeckTitleTextContent
  | PitchDeckTwoColumnsContent
  | PitchDeckComparisonContent
  | PitchDeckTimelineContent
  | PitchDeckTeamGridContent
  | PitchDeckMetricsContent
  | PitchDeckQuoteContent
  | PitchDeckBlankContent;

export type PitchDeckTitleOnlyContent = {
  type: "title_only";
  title: string;
  subtitle?: string;
};

export type PitchDeckTitleBulletsContent = {
  type: "title_bullets";
  title: string;
  bullets: string[];
};

export type PitchDeckTitleImageContent = {
  type: "title_image";
  title: string;
  imageUrl: string;
  imageAlt?: string;
  imagePosition?: "left" | "right" | "top" | "bottom";
};

export type PitchDeckTitleTextContent = {
  type: "title_text";
  title: string;
  text: string;
};

export type PitchDeckTwoColumnsContent = {
  type: "two_columns";
  title: string;
  leftColumn: {
    title?: string;
    bullets?: string[];
    text?: string;
  };
  rightColumn: {
    title?: string;
    bullets?: string[];
    text?: string;
  };
};

export type PitchDeckComparisonContent = {
  type: "comparison";
  title: string;
  headers: string[];
  rows: string[][];
};

export type PitchDeckTimelineContent = {
  type: "timeline";
  title: string;
  entries: Array<{
    date: string;
    title: string;
    description?: string;
  }>;
};

export type PitchDeckTeamGridContent = {
  type: "team_grid";
  title: string;
  members: Array<{
    name: string;
    role: string;
    imageUrl?: string;
    bio?: string;
  }>;
};

export type PitchDeckMetricsContent = {
  type: "metrics";
  title: string;
  metrics: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
};

export type PitchDeckQuoteContent = {
  type: "quote";
  quote: string;
  author?: string;
  authorTitle?: string;
};

export type PitchDeckBlankContent = {
  type: "blank";
};

// Slide entity
export type PitchDeckSlide = {
  id: PitchDeckSlideId;
  pitch_deck_id: PitchDeckId;
  title: string;
  slide_type: PitchDeckSlideType;
  order_index: number;
  content: PitchDeckSlideContent;
  created_at: string;
  updated_at: string;
};

// ========== PITCH DECK AGGREGATE TYPES ==========

export type PitchDeckWithSlides = {
  pitchDeck: PitchDeck;
  slides: PitchDeckSlide[];
  template: PitchDeckTemplate | null;
};

export type PitchDeckWithTemplate = PitchDeck & {
  template: PitchDeckTemplate | null;
};

// ========== PITCH DECK INPUT TYPES ==========

export type CreatePitchDeckParams = {
  workspaceId: WorkspaceId;
  templateId: PitchDeckTemplateId;
  title: string;
  createdBy: UserId;
};

export type UpdatePitchDeckParams = {
  pitchDeckId: PitchDeckId;
  title?: string;
  settings?: Partial<PitchDeckSettings>;
  templateId?: PitchDeckTemplateId;
};

export type CreatePitchDeckSlideParams = {
  pitchDeckId: PitchDeckId;
  title: string;
  slideType?: PitchDeckSlideType;
  content: PitchDeckSlideContent;
  orderIndex?: number;
};

export type UpdatePitchDeckSlideParams = {
  slideId: PitchDeckSlideId;
  title?: string;
  slideType?: PitchDeckSlideType;
  content?: PitchDeckSlideContent;
  orderIndex?: number;
};

export type ReorderPitchDeckSlidesParams = {
  pitchDeckId: PitchDeckId;
  orderedSlideIds: PitchDeckSlideId[];
};

export type DuplicatePitchDeckParams = {
  pitchDeckId: PitchDeckId;
  newTitle?: string;
};
