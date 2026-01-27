# Business Plan Feature - Complete Implementation Context

## Overview

This document provides complete context for the Business Plan feature implementation, including database schema, TypeScript types, server functions, API routes, and frontend components.

---

## 1. Database Schema (Supabase/PostgreSQL)

```sql
-- Main business plan table
CREATE TABLE business_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Business Plan',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  export_settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chapters (hierarchical structure with parent_chapter_id for nesting)
CREATE TABLE business_plan_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_plan_id UUID NOT NULL REFERENCES business_plans(id) ON DELETE CASCADE,
  parent_chapter_id UUID REFERENCES business_plan_chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sections (content blocks within chapters)
CREATE TABLE business_plan_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES business_plan_chapters(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'section_title', 'subsection', 'text', 'image', 'table',
    'list', 'comparison_table', 'timeline', 'embed', 'page_break', 'empty_space'
  )),
  content JSONB NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Conversations for business plan assistance
CREATE TABLE business_plan_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_plan_id UUID NOT NULL REFERENCES business_plans(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Messages
CREATE TABLE business_plan_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES business_plan_ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pending Changes (AI suggestions awaiting approval)
CREATE TABLE business_plan_pending_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES business_plan_ai_conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES business_plan_ai_messages(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN (
    'add_chapter', 'update_chapter', 'delete_chapter',
    'add_section', 'update_section', 'delete_section',
    'reorder_chapters', 'reorder_sections'
  )),
  target_id UUID,
  proposed_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
```

---

## 2. TypeScript Types

**Location:** `src/types/workspaces.ts`

### Branded ID Types

```typescript
export type BusinessPlanId = string;
export type BusinessPlanChapterId = string;
export type BusinessPlanSectionId = string;
export type BusinessPlanAiConversationId = string;
export type BusinessPlanAiMessageId = string;
export type BusinessPlanPendingChangeId = string;
```

### Status & Enum Types

```typescript
export type BusinessPlanStatus = "draft" | "published" | "archived";

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

export type AiMessageRole = "user" | "assistant";

export type PendingChangeType =
  | "add_chapter"
  | "update_chapter"
  | "delete_chapter"
  | "add_section"
  | "update_section"
  | "delete_section"
  | "reorder_chapters"
  | "reorder_sections";

export type PendingChangeStatus = "pending" | "approved" | "rejected";
```

### Export Settings

```typescript
export type BusinessPlanExportSettings = {
  format?: "pdf" | "docx" | "html";
  includeTableOfContents?: boolean;
  pageSize?: "letter" | "a4";
};
```

### Main Entities

```typescript
export type BusinessPlan = {
  id: BusinessPlanId;
  workspace_id: WorkspaceId;
  title: string;
  status: BusinessPlanStatus;
  export_settings: BusinessPlanExportSettings | null;
  created_at: string;
  updated_at: string;
};

export type BusinessPlanChapter = {
  id: BusinessPlanChapterId;
  business_plan_id: BusinessPlanId;
  parent_chapter_id: BusinessPlanChapterId | null;
  title: string;
  order_index: number;
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
```

### Section Content Types (Discriminated Union)

```typescript
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
```

### Nested Types for API Responses

```typescript
export type BusinessPlanChapterWithSections = BusinessPlanChapter & {
  sections: BusinessPlanSection[];
  children?: BusinessPlanChapterWithSections[];
};

export type BusinessPlanWithChapters = BusinessPlan & {
  chapters: BusinessPlanChapterWithSections[];
};
```

### AI Entities

```typescript
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
  pendingChangeIds?: string[];
  [key: string]: unknown;
};

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
```

---

## 3. Server Functions

**Location:** `src/server/businessPlan.ts`

### Business Plan Functions

```typescript
// Gets existing business plan or creates new one for workspace
getOrCreateBusinessPlan({ workspaceId, userId }): Promise<BusinessPlan>

// Gets full business plan with nested chapters and sections
getBusinessPlanWithChapters({ workspaceId, userId }): Promise<{
  businessPlan: BusinessPlan | null;
  chapters: BusinessPlanChapterWithSections[];
}>

// Updates business plan properties
updateBusinessPlan({
  businessPlanId,
  userId,
  title?,
  status?,
  exportSettings?
}): Promise<BusinessPlan>
```

### Chapter Functions

```typescript
// Creates a new chapter
createChapter({
  businessPlanId,
  userId,
  title,
  parentChapterId?,
  orderIndex?
}): Promise<BusinessPlanChapter>

// Updates chapter properties
updateChapter({
  chapterId,
  userId,
  title?,
  orderIndex?,
  parentChapterId?
}): Promise<BusinessPlanChapter>

// Deletes chapter (cascades to delete sections)
deleteChapter({ chapterId, userId }): Promise<void>
```

### Section Functions

```typescript
// Creates a new section
createSection({
  chapterId,
  userId,
  sectionType,
  content,
  orderIndex?
}): Promise<BusinessPlanSection>

// Updates section properties
updateSection({
  sectionId,
  userId,
  sectionType?,
  content?,
  orderIndex?
}): Promise<BusinessPlanSection>

// Deletes a section
deleteSection({ sectionId, userId }): Promise<void>
```

### AI Functions

```typescript
// Gets or creates AI conversation for business plan
getOrCreateConversation({
  businessPlanId,
  userId
}): Promise<BusinessPlanAiConversation>

// Gets conversation with all messages
getConversationWithMessages({
  conversationId,
  userId
}): Promise<AiConversationWithMessages>

// Creates a new message
createMessage({
  conversationId,
  userId,
  role,
  content,
  metadata?
}): Promise<BusinessPlanAiMessage>

// Creates a pending change suggestion
createPendingChange({
  messageId,
  changeType,
  targetId?,
  proposedData
}): Promise<BusinessPlanPendingChange>

// Resolves (approves/rejects) a pending change
resolvePendingChange({
  pendingChangeId,
  userId,
  status
}): Promise<BusinessPlanPendingChange>

// Applies an approved AI suggestion
applyPendingChange({
  pendingChangeId,
  userId
}): Promise<{ chapter?: BusinessPlanChapter; section?: BusinessPlanSection }>
```

---

## 4. API Routes

### Route Structure

```
src/app/api/workspaces/[workspaceId]/business-plan/
├── route.ts                           # GET (fetch), PUT (update)
├── chapters/
│   ├── route.ts                       # POST (create chapter)
│   └── [chapterId]/
│       └── route.ts                   # PUT (update), DELETE
├── sections/
│   └── [sectionId]/
│       └── route.ts                   # PUT (update), DELETE
└── ai/
    ├── conversations/
    │   └── route.ts                   # POST (get/create conversation)
    ├── messages/
    │   └── route.ts                   # POST (create message)
    └── pending-changes/
        └── [changeId]/
            └── route.ts               # POST (accept/reject)
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces/[workspaceId]/business-plan` | Get business plan with chapters |
| PUT | `/api/workspaces/[workspaceId]/business-plan` | Update business plan |
| POST | `/api/workspaces/[workspaceId]/business-plan/chapters` | Create chapter |
| PUT | `/api/workspaces/[workspaceId]/business-plan/chapters/[chapterId]` | Update chapter |
| DELETE | `/api/workspaces/[workspaceId]/business-plan/chapters/[chapterId]` | Delete chapter |
| PUT | `/api/workspaces/[workspaceId]/business-plan/sections/[sectionId]` | Update section |
| DELETE | `/api/workspaces/[workspaceId]/business-plan/sections/[sectionId]` | Delete section |
| POST | `/api/workspaces/[workspaceId]/business-plan/ai/conversations` | Get/create conversation |
| POST | `/api/workspaces/[workspaceId]/business-plan/ai/messages` | Create message |
| POST | `/api/workspaces/[workspaceId]/business-plan/ai/pending-changes/[changeId]` | Accept/reject change |

---

## 5. Frontend Components

**Location:** `src/components/workspaceManage/business-plan/`

### Component Structure

```
business-plan/
├── ManageBusinessPlanPage.tsx      # Main page wrapper
├── BusinessPlanContext.tsx         # React Context for state
├── ManageTopTabs.tsx               # Top navigation (Plan, Export)
├── ManageAiTabs.tsx                # Left sidebar (chapters, AI chat)
├── ManageActionArea.tsx            # Right sidebar (section tools)
├── ManageBusinessPlanContentArea.tsx # Main content/preview
├── SectionEditorModal.tsx          # Section editor modal
└── ConfirmDeleteModal.tsx          # Delete confirmation modal
```

### ManageBusinessPlanPage.tsx

Main page wrapper that provides the BusinessPlanContext.

### BusinessPlanContext.tsx

React Context providing state management for the business plan.

```typescript
type BusinessPlanContextValue = {
  // Data
  businessPlan: BusinessPlan | null;
  chapters: BusinessPlanChapterWithSections[];
  isLoading: boolean;
  error: string | null;

  // Selection state
  selectedChapterId: BusinessPlanChapterId | null;
  setSelectedChapterId: (id: BusinessPlanChapterId | null) => void;
  selectedSectionId: BusinessPlanSectionId | null;
  setSelectedSectionId: (id: BusinessPlanSectionId | null) => void;

  // Actions
  refreshData: () => Promise<void>;
  updateBusinessPlanTitle: (title: string) => Promise<void>;
  addChapter: (title: string) => Promise<BusinessPlanChapter>;
  updateChapter: (chapterId: string, title: string) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;
  addSection: (
    chapterId: string,
    sectionType: BusinessPlanSectionType,
    content: BusinessPlanSectionContent
  ) => Promise<BusinessPlanSection>;
  updateSection: (sectionId: string, content: BusinessPlanSectionContent) => Promise<void>;
  deleteSection: (sectionId: string) => Promise<void>;
};
```

### ManageAiTabs.tsx

Left sidebar containing:
- Chapter list with add/edit/delete functionality
- AI Chat tab (placeholder)
- Click-to-select chapter interaction
- Visual selection indicator

### ManageActionArea.tsx

Right sidebar containing:
- **Sections tab**: Grid of section tools to add content
- **Finance tab**: Coming soon placeholder
- **Charts tab**: Coming soon placeholder

### ManageBusinessPlanContentArea.tsx

Main content area with:
- Business plan title display
- Preview rendering for all section types
- Section selection (click to select)
- Section editing (double-click to edit)
- Edit/delete buttons on selected sections

### SectionEditorModal.tsx

Comprehensive modal for editing all section types:

| Editor | Section Types | Features |
|--------|---------------|----------|
| TextBasedEditor | section_title, subsection, text | Text field, multiline support |
| ListEditor | list | Add/remove items, ordered/unordered toggle |
| TableEditor | table | Edit headers/cells, add/remove rows/columns |
| ComparisonTableEditor | comparison_table | Same as table editor |
| ImageEditor | image | URL, alt text, caption, preview |
| TimelineEditor | timeline | Date, title, description entries |
| EmbedEditor | embed | HTML, iframe, video type selector |
| EmptySpaceEditor | empty_space | Height picker with preview |

### ConfirmDeleteModal.tsx

Reusable confirmation modal for delete operations with:
- Title and message
- Item name display
- Cancel/Delete buttons
- Loading state during deletion

---

## 6. Key Features Implemented

### Chapter Management
- Add new chapters
- Edit chapter titles (inline editing)
- Delete chapters with confirmation modal
- Click to select chapter in sidebar
- Visual selection indicator (blue border, light background)

### Section Management
- Add sections via right sidebar tools grid
- Edit any section type via modal editor
- Delete sections with confirmation modal
- Visual preview of all section types
- Single-click to select, double-click to edit
- Edit/delete buttons appear on selected sections

### Section Types Supported
1. **Section Title** - Main section headings
2. **Subsection** - Sub-headings
3. **Text** - Paragraph content
4. **List** - Ordered/unordered lists
5. **Table** - Data tables with headers
6. **Comparison Table** - Feature comparison tables
7. **Image** - Images with URL, alt text, caption
8. **Timeline** - Milestone/event timelines
9. **Embed** - HTML, iframe, or video embeds
10. **Empty Space** - Adjustable vertical spacing
11. **Page Break** - Page break indicator

### UI/UX Features
- Clean preview rendering for all section types
- Modal-based editing (not inline)
- Modal-based delete confirmations
- Loading states and error handling
- Responsive sidebar layout
- Scrollable content areas

### Coming Soon (Placeholders)
- **Finance tab**: Financial projections, revenue models, expense tracking
- **Charts tab**: Data visualizations, graphs
- **AI Chat**: Backend ready, frontend placeholder
- **Export functionality**: PDF, DOCX, HTML export

---

## 7. File Structure Summary

```
src/
├── types/
│   └── workspaces.ts                    # All TypeScript types
├── server/
│   └── businessPlan.ts                  # Server-side functions
├── app/api/workspaces/[workspaceId]/business-plan/
│   ├── route.ts                         # GET, PUT business plan
│   ├── chapters/
│   │   ├── route.ts                     # POST chapter
│   │   └── [chapterId]/route.ts         # PUT, DELETE chapter
│   ├── sections/
│   │   └── [sectionId]/route.ts         # PUT, DELETE section
│   └── ai/
│       ├── conversations/route.ts       # POST conversation
│       ├── messages/route.ts            # POST message
│       └── pending-changes/[changeId]/route.ts  # POST accept/reject
└── components/workspaceManage/business-plan/
    ├── ManageBusinessPlanPage.tsx
    ├── BusinessPlanContext.tsx
    ├── ManageTopTabs.tsx
    ├── ManageAiTabs.tsx
    ├── ManageActionArea.tsx
    ├── ManageBusinessPlanContentArea.tsx
    ├── SectionEditorModal.tsx
    └── ConfirmDeleteModal.tsx
```

---

## 8. Usage Example

```typescript
// Using the BusinessPlanContext in a component
import { useBusinessPlan } from "./BusinessPlanContext";

function MyComponent() {
  const {
    businessPlan,
    chapters,
    isLoading,
    selectedChapterId,
    setSelectedChapterId,
    addChapter,
    addSection,
    updateSection,
    deleteSection,
  } = useBusinessPlan();

  // Add a new chapter
  const handleAddChapter = async () => {
    await addChapter("New Chapter");
  };

  // Add a text section to selected chapter
  const handleAddTextSection = async () => {
    if (!selectedChapterId) return;
    await addSection(selectedChapterId, "text", {
      type: "text",
      text: "Your content here...",
    });
  };

  // Update a section's content
  const handleUpdateSection = async (sectionId: string) => {
    await updateSection(sectionId, {
      type: "text",
      text: "Updated content...",
    });
  };

  return (
    // Your component JSX
  );
}
```

---

## 9. Next Steps / Future Improvements

1. **AI Chat Integration**: Connect the AI chat interface to generate and suggest content
2. **Finance Tools**: Implement financial projection calculators and templates
3. **Charts & Visualizations**: Add chart creation and data visualization tools
4. **Export Functionality**: Implement PDF, DOCX, and HTML export
5. **Drag & Drop Reordering**: Add drag-and-drop for chapters and sections
6. **Collaboration**: Real-time collaboration features
7. **Version History**: Track changes and allow reverting
8. **Templates**: Pre-built business plan templates
