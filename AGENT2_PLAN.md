---
name: AGENT2_PLAN
overview: Implementation roadmap for addressing SiliconPlan customer feedback across the landing page and core web application, organized into phased tracks with clear priorities, owners, and technical considerations.
todos:
  - id: phase1-foundations
    content: "Implement Phase 1 foundations: auth/password recovery fixes, onboarding Other fields and multi-step UX, AI Library upload/drag-and-drop fixes, AI chat initialization, mobile baseline responsiveness, and landing page copy/data corrections."
    status: pending
  - id: phase2-core-fit
    content: "Implement Phase 2 core product features: onboarding wizard (VentureKit-style), team management and workspace delete, AI Knowledge integration, business plan task system, AI chat + task interplay, and pitch/canvas integration aligned with the provided structures and prompts."
    status: pending
  - id: phase3-polish-i18n
    content: "Implement Phase 3 polish: EN/IT language support with exports, AI tone of voice settings, workspace logo and aligned branding in all exports, unified export formatting layer, improved editability for financial plan, pitch, SWOT, and updated Ask AI UX."
    status: pending
isProject: false
---

## AGENT2_PLAN – SiliconPlan Feedback Implementation Roadmap

### 1. Objectives & Scope

- **Primary goal**: Systematically address customer feedback (Italian + English guidelines) for SiliconPlan across both the **marketing landing page** and the **live web application**, improving reliability, UX, and alignment with the business vision.
- **Scope**:
- **Landing Page Track**: Brand consistency, pricing alignment, copy & data accuracy, and technical clean‑up for `siliconplan.vercel.app`.
- **Web App Track**: Auth & onboarding, workspace structure & AI knowledge, business plan task system, AI & export improvements, multi‑language support (EN/IT), and critical bug fixes.
- **Planning style**: Product roadmap with **three phases**:
- **Phase 1 – Foundations & P0/P1**: Make the platform reliable and unblock core workflows.
- **Phase 2 – Core Product Fit**: Implement the requested flows (onboarding wizard, task system, AI knowledge integration, pitch presets, exports).
- **Phase 3 – UX, Internationalization & Polish**: UX refinement, language support, branding consistency, and performance.

---

### 2. High-Level Architecture Context (for developers)

- **Stack**:
- Next.js 15 app router, React 19, TypeScript.
- Auth via **Clerk**; multi‑tenant workspaces stored in **Supabase**.
- UI via **Material UI (MUI)** with custom theme in `src/theme/theme.ts`.
- **Key domains**:
- **Authentication & Onboarding**: `src/app/auth/*`, `src/app/onboarding/page.tsx`, Clerk middleware.
- **AI Documents / Home**: `src/components/ai-documents/*`, root `/` route.
- **Workspace Setup & Settings**: `src/app/workspaces/[workspaceId]/business-setup/page.tsx`, `src/app/workspaces/[workspaceId]/settings/page.tsx`, and `src/components/workspaceSettings/*`.
- **Business Plan**: `src/app/workspaces/[workspaceId]/manage/business-plan/page.tsx`, `src/components/workspaceManage/business-plan/*`, `src/server/businessPlan.ts`, `src/lib/businessPlanAi.ts`, `src/lib/businessPlanExport.ts`.
- **Canvas Models**: `src/components/workspaceManage/canvasModels/*`, `src/app/api/workspaces/[workspaceId]/canvas-models/*`.
- **Pitch Deck**: `src/components/workspaceManage/pitch-deck/*`, `src/server/pitchDeck.ts`, `src/app/api/workspaces/[workspaceId]/pitch-deck/*`.
- **Workspace / AI Library**: `src/server/workspaces.ts`, `src/lib/workspaceAiContext.ts`, `src/components/workspaceSettings/AILibraryTabContent.tsx` (and related AI library components).
- **Key constraints**:
- Workspace access must be enforced via helpers in `src/server/workspaces.ts` in all new APIs.
- AI calls should reuse central helpers (e.g., business plan AI, workspace AI context) where possible for consistent prompting and context.
- All new exports should flow through a central export abstraction to keep DOCX/PDF/PPTX formatting consistent.

---

### 3. Roadmap Overview (Phases & Tracks)

#### 3.1 Phase 1 – Foundations & Critical Fixes (P0/P1)

**Goal**: Make the platform **reliable and testable** – fix auth, unblock onboarding, stabilize AI Library uploads, and address the most visible usability gaps.

- **Landing Page Track – Phase 1**
- **LP1.1 – Environment & Ownership Clarification**
  - Document which repo / deployment controls the landing page vs the app.
  - Add a short **environment note** to both landing and app (e.g., footer note: “Staging” vs “Production”).
- **LP1.2 – Copy & Data Fixes**
  - Fix typos: `"Standart"→"Standard"`, `"Quaterly"→"Quarterly"`.
  - Replace placeholder phone number with real company data from feedback.
  - Connect **Privacy & Terms**, **Facebook**, **Instagram**, **LinkedIn** links.
- **LP1.3 – CTA & Pricing Alignment (Minimal)**
  - Change main CTA text from “Create My First Plan” to **“Create My Plan”**.
  - Remove or hide **QuickBooks/Xero** integrations and the **“550+ sample plans”** claim until implemented.

- **Web App Track – Phase 1**
- **APP1.1 – Auth & Password Recovery (P0)**
  - Verify current Clerk configuration:
  - Check whether passwordless only, email+password, or SSO is enabled.
  - Ensure **Forgot Password** is properly wired to Clerk’s reset flow on both desktop and mobile.
  - Add **error handling and user messaging** for reset failures (rate limits, invalid links, etc.).
  - Regression tests: desktop and mobile reset flow end‑to‑end.
- **APP1.2 – Onboarding “Other” Fields (P1)**
  - In `onboarding` UI, for dropdowns **Industry**, **Company stage**, **Problem solved**:
  - Extend UI components to show a **companion text input** when “Other” is selected.
  - Update Supabase schema / types to store both the selected enum and custom description.
  - Ensure custom values propagate into the **workspace business profile** and AI context.
- **APP1.3 – Onboarding Form UX Split (P1)**
  - Keep existing questions but split the long onboarding into **logical steps** with a progress indicator.
  - Short‑term: implement a **multi‑step form** within the existing `/onboarding` page.
  - Set up routing, state persistence, and validation per step (client state + server persistence on completion).
- **APP1.4 – AI Library: Upload & Drag‑and‑Drop (P0/P1)**
  - Fix **PDF upload failure** in AI Library:
  - Inspect API route for AI Library uploads (Supabase storage bucket, size limits, MIME types, error handling).
  - Improve UI feedback (loading state, error toasts, per‑file status).
  - Implement proper **drag‑and‑drop** behavior and fall back to file picker.
  - Fix **long filename display** (truncate/ellipsis + tooltip).
- **APP1.5 – Business Plan Editor – AI Chat Initialization (P0)**
  - Fix AI Chat initialization error on entering the business plan editor:
  - Validate API key, model config, per‑workspace context, and token limits.
  - Harden error handling and retries; show a user‑friendly error message instead of breaking the editor.
- **APP1.6 – Mobile Responsiveness (P0/P1 – First Pass)**
  - Identify top **non‑responsive screens** (onboarding, business setup, business plan editor, canvas, pitch deck).
  - Apply a minimal responsive layout baseline using MUI breakpoints (column stacking, drawer behavior).
  - Ensure that **core flows are usable** on common mobile widths.

#### 3.2 Phase 2 – Core Product Fit & Feature Gaps

**Goal**: Implement the **desired workflows and structures**: onboarding wizard (VentureKit style), task system aligned with the proposed chapter structure, AI knowledge integration, and pitch/canvas/finance workflows.

- **Landing Page Track – Phase 2**
- **LP2.1 – Hero Section & AI Preview**
  - Replace or augment the hero with a **real product preview**:
  - A mock screenshot or simplified live preview of the dashboard / AI companion.
  - A mini **“onboarding → output”** flow illustration (3‑step diagram or animation) demonstrating how AI generates a business plan.
- **LP2.2 – Pricing Plan Alignment**
  - Align pricing cards with product strategy:
  - Plan names: **Free**, **Start‑up**, **Unicorn** (or final naming agreed with business).
  - Feature lists consistent with the actual app (no unsupported integrations).
  - Add links or references that are aligned with the **pitch deck pricing structure**.

- **Web App Track – Phase 2**
- **APP2.1 – New Onboarding Wizard (VentureKit‑Style)**
  - Replace the existing monolithic onboarding form with a **step‑by‑step wizard** matching the specified flow:
  - Step 1: Create your workspace.
  - Step 2: Business Name.
  - Step 3: Is this company currently in operation?
  - Step 4: What do you need the business plan for? (with the specified options; map to internal `bp_purpose`).
  - Step 5: Select industry (macro sectors list from feedback; map to Damodaran sectors internally).
  - Step 6: ATECO code (optional autocomplete; see “future work” note below).
  - Step 7: What problem do you solve, and for whom?
  - Step 8: What’s your solution, and what makes it unique?
  - Step 9: Product vs Service vs Both.
  - Step 10: How do you sell it? (Online / Physical / Both).
  - Step 11: Target markets (Italy / Europe / Global or other with text field).
  - Step 12: Team size.
  - **Implementation notes**:
  - Define a central **Onboarding state model** and Supabase table columns corresponding to all these fields.
  - Map responses into **workspace business profile** and **AI context** (e.g., `industry_macro`, `market_geo`, `bp_purpose`, `team_size`).
  - For ATECO: implement a **pluggable autocomplete** that reads from a local or remote mapping table; keep integration flexible for the later spreadsheet mapping (Damodaran/ATECO crosswalk).
- **APP2.2 – Workspace Structure & Team Management**
  - Implement a **Team/Users** section in workspace settings:
  - List invited users with status: `pending`, `accepted`, `declined`, `expired`.
  - Actions: **resend invite**, **revoke invite**.
  - Backend: extend `invites` and `members` APIs to return invitation status and support these actions.
  - Implement **workspace delete**:
  - Add “Delete workspace” with a strong confirmation dialog and explanation of data loss.
  - Ensure all cascading deletes or soft‑deletes are handled consistently in Supabase.
- **APP2.3 – AI Knowledge & AI Library Integration**
  - Rework the **AI Knowledge** section:
  - Allow **Excel** uploads (budget/quantitative plans) in addition to PDFs and other formats.
  - Fix **description saving** and editing; add an edit mode and prevent silent failures.
  - Integrate AI Knowledge into **AI prompt context** for business plan generation and chat:
    - Extend `getWorkspaceAiContext` to include parsed documents and structured knowledge entries.
    - Provide weights or tagging so prompts can specify which knowledge to emphasize.
  - Ensure AI Knowledge entries are **editable** (not only deletable).
- **APP2.4 – Manage Workspace: Task System for Business Plan**
  - Implement a **task framework** for business plan sections aligned with the provided chapter hierarchy (1–6 sections with H1/H2 structure):
  - Chapters: Business Fundamentals, Market & Competitive Advantage, Business Model Canvas, Go‑to‑Market, Metrics & Economic‑Financial Analysis, Pitch.
  - For each section and subsection: store **title**, **user instructions** (min. 3 lines), and **AI prompt** as configured templates.
  - UI changes in business plan editor:
  - Show tasks as a **hierarchical list** (Chapter → Subsection) in sidebar.
  - Each task has a description panel and a button to **“Ask AI to draft”** using the stored prompt and workspace context.
  - Completed tasks remain **editable**; users can revise text and re‑invoke AI.
  - Backend changes:
  - Define a `tasks` or `bp_sections` schema for each workspace business plan mapping to the provided structure.
  - Refactor existing sections and pending‑changes logic to map cleanly onto the new task schema.
- **APP2.5 – AI Chat & Task Creation Flow**
  - Enable users to **paste a summary** (e.g., the business plan outline) into AI Chat and automatically
  - Propose or generate corresponding tasks/sections when possible.
  - Or at minimum, allow AI Chat to **write into a selected task** or chapter via explicit actions.
  - Ensure that information entered in **Edit Workspace** + **AI Library** is **automatically leveraged** in each task’s AI generation (no need to retype topics per task).
- **APP2.6 – Pitch Deck & Canvas Integration**
  - Pitch deck:
  - Implement **preset sections**: Problem, Solution, Product, TAM/SAM/SOM, Business Model, Traction, Competitors, Go‑to‑Market, Financial Forecast (3–4 years), Team, Ask.
  - Ensure pitch deck content is generated **reusing data** from business plan and canvas (`bp_sections_json`, `canvas_json`) instead of asking for new data.
  - Wire the detailed **AI prompt templates** from the Italian document into the pitch AI generator
(title/tagline/one‑liner, each pitch section prompt, master pitch prompt).
  - Canvas:
  - Ensure canvas models can be exported to PDF/PPTX and that these exports integrate cleanly with pitch and plan where relevant.

#### 3.3 Phase 3 – Internationalization, Exports & UX Polish

**Goal**: Make SiliconPlan **production‑ready and market‑aligned**: multi‑language, consistent branding, robust exports, AI tone of voice, and improved editor UX.

- **Landing Page Track – Phase 3**
- **LP3.1 – Brand & Asset Completion**
  - Integrate final **vector logo** variants (full, icon‑only, horizontal/vertical, light/dark) across all landing page components and exported marketing assets that depend on them.
  - Ensure consistent logo usage across hero, navbar, footer, and any static exports from the landing experience.
- **LP3.2 – Testimonials & Social Proof**
  - Replace placeholder testimonials with real case studies; until then, remove or visually de‑emphasize the section.

- **Web App Track – Phase 3**
- **APP3.1 – Language Support (EN/IT)**
  - Introduce an **i18n layer** (e.g., `next-intl` or a simple JSON‑based translation system) with:
  - Central translation files for **UI strings** (English and Italian).
  - A **language toggle** in the app chrome (e.g., header or workspace settings) and persist choice per user.
  - Localize:
  - Core pages: onboarding wizard, business setup, workspace management, business plan, canvas, pitch deck.
  - Key system messages (errors, toasts, confirmations).
  - Export localization:
  - Ensure that **business plan, pitch deck, and canvas exports** can be generated in the selected language (or at least that labels and boilerplate are localized while user content remains as written).
- **APP3.2 – AI Tone of Voice & Settings**
  - Introduce **AI settings** at workspace or user level:
  - Tone of voice options: e.g., professional, academic, conversational, technical.
  - Possibly default length/verbosity.
  - Wire these settings into all AI calls (business plan, pitch, canvas, AI chat), adding prompt parameters such as `{tone_of_voice}`.
- **APP3.3 – Workspace Logo & Branding in Exports**
  - Allow users to upload a **workspace logo**.
  - Use this logo consistently in:
  - Business plan exports (PDF/DOCX) – cover, headers/footers.
  - Pitch deck exports (PDF/PPTX) – title slide and footer.
  - Canvas exports – header/footer or corner branding.
  - Standardize export templates so logo size and positioning work across A4 and slide formats.
- **APP3.4 – Export Formatting & Margins**
  - Create a **central export formatting layer** responsible for:
  - Page size and margins for A4: 2.5 cm on all sides for business plan and relevant outputs.
  - Landscape and margin handling for canvas exports.
  - Font hierarchies (title, heading, body, description) consistent across DOCX and PPTX.
  - Fix existing formatting issues for Word and PowerPoint exports (line breaks, overflowing text, font scaling).
- **APP3.5 – Business Plan & Pitch Editability**
  - Make AI‑generated **financial plan** fully editable and support multiple currencies:
  - Introduce currency selection and consistent formatting.
  - Allow users to adjust generated tables before export.
  - Ensure generated **pitch** and **SWOT** analyses are editable before export, with clear draft vs finalized states.
- **APP3.6 – AI Chat & “Ask AI” UX Refresh**
  - Elevate AI in the UI:
  - Convert the current AI chat into an **“Ask AI”** section in the left tab for each main area (business plan, canvas, pitch).
  - Consider using **icon‑based** entry points.
  - Improve performance and perceived latency in pitch deck editing (avoid full‑page reloads when moving between slides—only update the slide area).
- **APP3.7 – Business Plan Media & Attachments**
  - Enable direct **image uploads** into business plan sections (drag‑and‑drop / file picker) in addition to URL‑based images.
  - Ensure images are handled in exports (embedded or linked appropriately).

---

### 4. Cross-Cutting Technical Design Considerations

- **4.1 Data Model & Schema Evolution**
- Add or extend Supabase tables for:
  - Onboarding wizard fields (purpose, macro‑industry, ATECO, product/service, channels, markets, team size).
  - AI Knowledge items (file metadata, type, tags, description, parsed text summary or embeddings reference).
  - Business plan **tasks/sections** aligned with the chapter hierarchy.
  - Invitations and their status (pending/accepted/declined/expired) plus audit fields.
- Use migrations and TypeScript types to keep `src/server/workspaces.ts` and `src/types/*` consistent.

- **4.2 AI Integration & Context**
- Centralize AI calls for:
  - Business plan sections, pitch sections, canvas suggestions.
  - AI Chat and Ask AI.
- `getWorkspaceAiContext` (or a successor) should:
  - Pull business profile, onboarding answers, AI knowledge documents, and any financial data.
  - Expose a structured object used consistently in prompts (e.g., `{company_description}`, `{industry_macro}`, `{market_geo}`, `{bp_purpose}`, `{team_size}`).

- **4.3 Exports System**
- Standardize export generation for **PDF, DOCX, PPTX** into a shared abstraction:
  - One layer responsible for templating, margins, fonts, and logo placement.
  - Feature‑specific serializers (business plan, pitch, canvas) feed structured content into that layer.

- **4.4 Internationalization Strategy**
- Start with **string‑based localization** (labels, instructions, system text) and gradually expand to AI prompt templates.
- Keep AI prompts for EN/IT as separate templates keyed by language, so they can fully match the Italian spec.

---

### 5. Suggested Implementation Order & Milestones

- **Milestone 1 – Production Stability (2–3 sprints)**
- Finish **APP1.x** and **LP1.x** items.
- Shipping criteria: password reset works on all devices; onboarding “Other” fields and multi‑step UX are live; AI Library upload and AI Chat are stable; landing page no longer has placeholder data or major copy issues.

- **Milestone 2 – Product Fit & Guided Experience (3–5 sprints)**
- Deliver **APP2.x** and **LP2.1**.
- Shipping criteria: new onboarding wizard in place; Team/Users section and workspace delete implemented; AI Knowledge fully integrated and editable; structured task system for the business plan live; pitch deck presets reusing BP/Canvas data; hero updated with realistic AI preview.

- **Milestone 3 – Internationalization & Professionalization (3–4 sprints)**
- Deliver **APP3.x** and **LP3.x**.
- Shipping criteria: EN/IT toggle with main flows localized; exports correctly formatted for A4/PPT with margins and fonts; workspace logo and tone‑of‑voice applied across AI and exports; pitch/SWOT and financial plan fully editable; AI surfaced as “Ask AI” across key modules.

---

### 6. Risks, Open Questions & Next Steps

- **External dependencies**:
- ATECO code mapping and Damodaran sectors rely on external spreadsheets/data; integration details (hosting, caching, license considerations) must be agreed before implementation.
- Financial forecasting flows are supported by Loom videos and may require additional clarification sessions for edge cases.
- **Performance & Cost**:
- Heavy AI usage (especially with long BP and pitch prompts) can increase latency and cost; we should instrument metrics and possibly add rate‑limiting or smart context selection.
- **Next steps**:
- Confirm final pricing strategy and logo assets.
- Validate this roadmap with product/QA, then break each APP/LP item into detailed tickets (with owners, estimates, and dependencies) in the chosen project management tool.
- Align test strategy: regression suite for auth/onboarding, AI Library, business plan editor, pitch, exports, and at least smoke tests on mobile.

