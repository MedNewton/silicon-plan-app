# Progress Tracker
Last updated: 2026-02-17
Source of truth for tasks: `TASKS.md`

## Summary
- Total scoped tasks: 68
- `done`: 59
- `in_progress`: 0
- `pending_qa`: 0
- `todo`: 9
- `blocked`: 0
- **Note:** Counts now reflect all rows in `TASKS.md` as of 2026-02-17.

## Completed (This Batch - Updated 2026-02-17)
1. `CORE-001` - Define onboarding canonical data contract
2. `CORE-002` - Implement wizard shell for 12-step onboarding
3. `CORE-003` - Implement Step 1-4 in wizard
4. `CORE-004` - Implement Step 5 Industry macro list
5. `CORE-006` - Implement Step 7-8 problem and unique solution
6. `CORE-007` - Implement Step 9-12 extended inputs
7. `CORE-010` - Integrate onboarding outputs into AI context
8. `CORE-011` - Define business plan task data model
9. `CORE-012` - Seed default chapter/task hierarchy
10. `CORE-013` - Implement task-centric sidebar UX
11. `CORE-014` - Implement per-task `Ask AI to Draft` action
12. `CORE-016` - Enable AI Chat to create tasks from pasted summary
13. `CORE-015` - Keep completed tasks editable and AI-regenerable
14. `WS-015` - Improve task action affordance in Manage Workspace
15. `CORE-017` - Implement auto-context reuse in tasks
16. `WS-008` - Upgrade workspace AI actions beyond text correction
17. `WS-009` - Enable Excel uploads in AI Knowledge/Library
18. `WS-010` - Fix AI Knowledge description save issues
19. `WS-011` - Integrate AI Knowledge into BP generation
20. `WS-012` - Add AI Knowledge edit capability
21. `WS-013` - Implement real drag-and-drop in AI Library
22. `WS-014` - Improve long filename handling in AI Library UI
23. `WS-001` - Build Team/Users invitation visibility panel
24. `WS-003` - Add invite actions `resend` and `revoke`
25. `WS-002` - Add invitation lifecycle statuses
26. `WS-007` - Rename confusing section labels
27. `WS-004` - Add workspace delete capability
28. `WS-016` - Initial hardening pass for AI Chat + Plan Chapters task creation gap (reopened, now complete with chapter selection UI)
29. `CORE-005` - Implement ATECO code search with autocomplete (Step 5 in business setup)
30. `CORE-008` - Build Damodaran <-> onboarding sector mapping layer for valuation multiples
31. `CORE-009` - Add ATECO mapping scaffolding (completed as part of CORE-008 implementation)
32. `BPTS-002` - Align default BP chapter/task tree to full client structure (6 chapters + requested subsections)
33. `BPTS-004` - Add section-specific AI prompts for core templates
34. `BPTS-003` - Enforce minimum instruction quality for each task template
35. `BPTS-007` - Add BP task structure QA pack
36. `BPTS-006` - Stabilize AI chat chapter/task proposal reliability
37. `WS-016` - Fix AI Chat + Plan Chapters task creation gap (manual QA pass)
38. `CORE-018` - Add pitch preset sections template
39. `AF-007` - Add pitch preset sections template (covered by CORE-018)
40. `CORE-019` - Reuse BP/Canvas data for pitch generation
41. `AF-002` - Add workspace logo support for exports
42. `AF-003` - Standardize export margins and A4 print layout
43. `AF-004` - Implement typography hierarchy in exports

## Reopened / Not Fully Done
1. None (WS-016 and BPTS-006 passed manual QA on 2026-02-17)

## Todo (Immediate Next)
1. `WS-005` - Implement EN/IT language toggle
2. `WS-017` - Implement workspace/library -> task automation

## Recent Validation
- `npm run typecheck`: pass
- `npm run lint`: pass
- WS-016 / BPTS-006 manual QA: pass

## Change Log
- 2026-02-17: **AF-002 / AF-003 / AF-004 Complete** - Export branding + layout standardization shipped across BP, Pitch, and Canvas exports.
  - Added shared export design layer in `src/lib/exportStyles.ts` (A4 2.5cm margin constants, unified typography scales, shared filename sanitization).
  - Added workspace branding helpers in `src/lib/workspaceBranding.ts` and wired logo/name into export flows.
  - Business Plan exports (`src/lib/businessPlanExport.ts`, `src/components/workspaceManage/business-plan/ManageActionArea.tsx`):
    - Added workspace logo + workspace name in exported documents.
    - Enforced A4-friendly print layout via `@page` margins (2.5cm) and DOCX page margins (2.5cm twips).
    - Implemented explicit export typography hierarchy (Title/H1/H2/H3/body/caption) in HTML and DOCX styles.
  - Pitch exports (`src/lib/pitchDeckExport.ts`, `src/components/workspaceManage/pitch-deck/PitchDeckEditor.tsx`, `src/app/api/workspaces/[workspaceId]/pitch-deck/[deckId]/export/route.ts`):
    - Added workspace logo + workspace name to PDF/PPTX outputs.
    - Applied shared typography scale usage for PPTX rendering and A4-aware PDF margins.
  - Canvas exports (`src/lib/canvasExport.ts`, `src/components/workspaceManage/canvasModels/ExportSettingsSidebar.tsx`, `src/components/workspaceManage/canvasModels/CanvasModelEditPage.tsx`, `src/components/workspaceManage/canvasModels/CanvasModelViewPage.tsx`):
    - Added workspace logo + workspace name to PDF/PPTX outputs.
    - Applied shared typography scale usage and A4-aware PDF margins.
  - Validation: `npm run typecheck` pass, `npm run lint` pass.
- 2026-02-17: **CORE-019 Complete** - Pitch deck default section seeding now reuses existing workspace Business Plan + Canvas data before falling back to placeholders.
  - Updated `src/server/pitchDeck.ts` to build context-aware seed bullets for each preset pitch section using:
    - Business plan chapter/section content (`getBusinessPlanWithChapters`)
    - Latest canvas model entries (`workspace_canvas_models.sections_data`)
  - Added deterministic slide-keyword mapping (`Problem`, `Solution`, `TAM/SAM/SOM`, `Business Model`, `Traction`, `Competitors`, `Go-To-Market`, `Financial Forecast`, `Team`, `Ask`) with safe dedupe/length limits and fallback bullets.
  - Validation: `npm run typecheck` pass, `npm run lint` pass.
- 2026-02-17: Marked `AF-007` as `done` in `TASKS.md` because it is duplicate scope covered by `CORE-018` preset pitch section seeding.
- 2026-02-17: **CORE-018 Complete** - New pitch deck creation now seeds required preset sections automatically.
  - Updated `createPitchDeck` in `src/server/pitchDeck.ts` to insert cover + 11 content slides on deck creation.
  - Preset slide set now includes: Problem, Solution, Product, TAM/SAM/SOM, Business Model, Traction, Competitors, Go-To-Market, Financial Forecast (3-4 Years), Team, Ask.
  - Added slide-seeding failure handling with rollback cleanup for partially created decks.
  - Validation: `npm run typecheck` pass, `npm run lint` pass.
- 2026-02-17: Manual QA sign-off completed for `WS-016` and `BPTS-006`; both tasks moved from `pending_qa` to `done` in `TASKS.md`.
- 2026-02-17: TC-4.2 remediation for stale chapter-target approvals:
  - Pending-change accept route now classifies expected target-missing errors as handled (no "Unexpected error" stack-noise logging path).
  - On `TARGET_NOT_FOUND` during accept, the pending change is auto-rejected server-side to prevent repeated failing accept attempts.
  - Client now refreshes chat/pending state after accept failures so stale cards are removed immediately.
- 2026-02-17: QA remediation pass for WS-016/BPTS-006 based on manual test feedback:
  - Chat refresh now loads only actionable pending changes (`?status=pending`) to prevent resolved historical cards from showing in new test steps.
  - Added section-intent guardrails to ignore unrelated chapter/task tool calls for section-only requests.
  - Added section type normalization/inference (`bullet list` -> `list`, plus aliases) to avoid misclassifying list requests as text.
  - Added deterministic section fallback using selected chapter context when user says "here"/"this" and the model does not emit section tool calls.
  - Added duplicate pending-change suppression for identical tool outputs in a single assistant turn.
- 2026-02-17: Completed BPTS-006 hardening pass for AI chat chapter/task reliability and moved status to `pending_qa`; key fixes include task UI context propagation (`selectedTaskId`), task-target fallback from selection, improved task update payload parsing (snake_case/camelCase + `newTitle`), and chapter-tool suppression when user intent is task-primary.
- 2026-02-17: Validation after BPTS-006 hardening: `npm run typecheck` pass, `npm run lint` pass.
- 2026-02-12: Initialized tracker and logged progress for `OBS-001` and `OBS-002`.
- 2026-02-12: Completed `OBS-003` via `docs/qa/auth-reset-test-pack.md`.
- 2026-02-12: Completed `OBS-004` to `OBS-007` in business setup/settings forms with `Other` custom persistence through `rawFormData`.
- 2026-02-12: Confirmed no DB schema migration required for `OBS-001` to `OBS-007`.
- 2026-02-12: Completed `OBS-008` by converting `src/app/workspaces/[workspaceId]/business-setup/page.tsx` into a 5-step onboarding wizard with progress UI and next/back navigation.
- 2026-02-12: Completed `OBS-009` with per-step validation gates and local draft restore/auto-save keyed by workspace ID.
- 2026-02-12: Confirmed no DB schema migration required for `OBS-008` and `OBS-009` (implemented using existing profile fields + `raw_form_data` metadata).
- 2026-02-12: Completed `CORE-001` by adding canonical onboarding contract types in `src/types/onboarding.ts` (12 step IDs, definitions, and typed DTO).
- 2026-02-12: Completed `CORE-002` by restoring `src/app/workspaces/[workspaceId]/business-setup/page.tsx` as a 12-step wizard shell with progress, navigation, validation gates, and draft resume.
- 2026-02-12: Completed `CORE-004` with a 14-sector macro industry list + `Other` option and normalized persistence in onboarding payload.
- 2026-02-12: Completed `CORE-006` and `CORE-007` with structured inputs for problem/solution and extended fields (product/service, channel, target market, team size) including reload from `raw_form_data`.
- 2026-02-12: Confirmed no DB schema migration required for `CORE-001` and `CORE-002` (new fields persisted in `raw_form_data` for now).
- 2026-02-12: Confirmed no DB schema migration required for `CORE-004`, `CORE-006`, and `CORE-007`.
- 2026-02-12: Completed `CORE-003` by aligning early onboarding steps to workspace name + business name + operation status + business-plan purpose with profile/workspace persistence.
- 2026-02-12: Completed `CORE-010` by extending `src/lib/workspaceAiContext.ts` to include onboarding/business-profile context in AI prompts (business plan chat/section AI and pitch AI routes consume this shared context).
- 2026-02-12: Confirmed no DB schema migration required for `CORE-003` and `CORE-010`.
- 2026-02-12: Completed `CORE-011` with a dedicated business-plan task model (`business_plan_tasks`) including H1/H2 hierarchy, `title`, `instructions`, `ai_prompt`, status, and order fields; added typed server CRUD + API routes under `/business-plan/tasks`.
- 2026-02-12: DB schema migration required for `CORE-011` (`supabase/migrations/20260212_business_plan_tasks.sql`).
- 2026-02-12: Completed `CORE-012` by adding a default H1/H2 task template (Business Fundamentals -> Pitch) and auto-seeding it for new business plans and task fetch flows.
- 2026-02-12: No additional DB schema migration required for `CORE-012` (reused `business_plan_tasks`).
- 2026-02-12: Completed `CORE-013` by implementing a hierarchical Plan Tasks (H1/H2) sidebar backed by `business_plan_tasks` CRUD APIs, including create/edit/delete flows.
- 2026-02-12: No additional DB schema migration required for `CORE-013`.
- 2026-02-12: Completed `CORE-014` by adding per-task AI draft API (`/business-plan/tasks/[taskId]/ai-draft`) and wiring an `Ask AI to Draft` action on H2 task rows in the sidebar UI.
- 2026-02-12: No additional DB schema migration required for `CORE-014`.
- 2026-02-12: Updated business plan left-panel tabs to keep both `Plan Chapters` and `Plan Tasks` alongside `AI Chat`, matching client wording that references both AI Chat and Plan Chapters flows.
- 2026-02-12: Completed `CORE-016` by extending AI Chat tooling/pending-change pipeline with task operations (`add_task`, `update_task`, `delete_task`) so approved task proposals persist in `business_plan_tasks` and remain reusable/editable.
- 2026-02-12: No additional DB schema migration required for `CORE-016`.
- 2026-02-12: Completed `CORE-015` by adding explicit task status controls (`todo`, `in_progress`, `done`) while keeping tasks editable and `Ask AI to Draft` available in all statuses.
- 2026-02-12: No additional DB schema migration required for `CORE-015`.
- 2026-02-12: Completed `WS-015` with a full left-panel UI refresh for `AI Chat`, `Plan Chapters`, and `Plan Tasks` tabs, improving spacing, hierarchy clarity, action grouping, status visibility, and overall task editing flow.
- 2026-02-12: No DB schema migration required for `WS-015`.
- 2026-02-12: Completed `CORE-017` by adding automatic task instruction/AI-prompt defaults that reuse workspace setup + AI library context when task fields are empty, and surfacing this behavior in the Plan Tasks UI.
- 2026-02-12: No DB schema migration required for `CORE-017`.
- 2026-02-13: Completed `WS-008` by adding actionable AI field controls (`Correct`, `Regenerate`, `Research`) in both workspace setup and business settings forms, backed by a new API route at `/api/workspaces/[workspaceId]/business-profile/ai-assist`.
- 2026-02-13: Completed `WS-009` by enabling server-side `.xls/.xlsx` extraction during AI library uploads (SheetJS), validating supported file extensions/sizes, and storing extraction metadata in `workspace_ai_documents.ai_metadata`.
- 2026-02-13: Completed `WS-010` by hardening AI knowledge creation (stable JSON errors, unique `key_name` generation, and deterministic `order_index` assignment) to eliminate save collisions/silent failures.
- 2026-02-13: Completed `WS-011` by extending workspace AI context to consume extracted AI library document text from metadata, ensuring BP AI chat/section/task generation receives knowledge/library content reliably.
- 2026-02-13: Completed `WS-012` by adding knowledge update API (`PUT /api/workspaces/[workspaceId]/ai-library/knowledge/[knowledgeId]`) and inline edit/save UI inside AI Library knowledge cards.
- 2026-02-13: Completed `WS-013` by implementing actual drag-and-drop behavior in the AI Library upload dropzone (with visual drag state and direct dropped-file selection).
- 2026-02-13: Completed `WS-014` by adding ellipsis + tooltip handling for long filenames in the documents table and upload selection preview to prevent layout breaks.
- 2026-02-13: No DB schema migration required for `WS-008` to `WS-014` (application/API layer changes only).
- 2026-02-13: Added `xlsx` dependency for spreadsheet ingestion in AI Library uploads.
- 2026-02-13: Applied DB migration `supabase/migrations/20260213_workspace_member_invites_lifecycle.sql` to add invite lifecycle fields (`declined_at`, `revoked_at`, resend metadata) for Team/Users invite workflows.
- 2026-02-13: Completed `WS-001` by extending members settings data/API to include workspace invitation records and rendering a dedicated Invitations panel in `Members` tab.
- 2026-02-13: Completed `WS-003` by adding invite action endpoints for resend/revoke with owner/admin permission checks and wiring action buttons in the Members invitations UI.
- 2026-02-13: Completed `WS-002` by implementing invite decline flow (`POST /api/workspaces/invites/decline`), wiring decline action in the join page UI, and persisting `declined_at`/`declined_by_user_id` so lifecycle statuses (`pending`, `accepted`, `declined`, `expired`) are fully actionable.
- 2026-02-13: Completed `WS-007` by renaming user-facing workspace editing labels to `Setup Business` in settings sidebar, workspace cards, and Learning Center instructional copy for terminology consistency.
- 2026-02-13: Completed `WS-004` with owner-only workspace deletion (API `DELETE /api/workspaces/[workspaceId]`), explicit typed-name confirmation dialog in General settings, foreign-key-safe dependency cleanup fallback, and post-delete redirect to My Workspaces.
- 2026-02-13: Completed `WS-016` by hardening business-plan AI chat task/chapter change generation: added recent conversation history to prompts, introduced a strict second-pass tool-call retry for structural requests, improved H1/H2 inference and parent resolution from chapter/task references, and expanded pending-change API validation to include task change types.
- 2026-02-13: Added migration `supabase/migrations/20260213_pending_change_task_types.sql` to support task pending-change values in DB schemas still missing `add_task`/`update_task`/`delete_task` in `pending_change_type`.
- 2026-02-13: Improved WS-016 UX after approval by auto-opening the relevant Plan Tasks card (parent H1 or task itself) when an AI pending-change task is accepted, so newly added H2 tasks are immediately visible.
- 2026-02-13: Hardened `applyPendingChange` task handling to support both snake_case/camelCase task payload keys and strict validation (no silent task no-op approvals when target or parent resolution is missing).
- 2026-02-13: Hardened pending-change approval for chapter/task flows by normalizing legacy `create/update/delete` payloads, rejecting unsupported change types instead of silently approving no-ops, surfacing server accept errors in UI, auto-selecting newly applied chapter/section in context, and keeping Plan Chapters open-state synced after full delete/recreate cycles.
- 2026-02-13: Fixed AI `add_section` approval failures after chapter resets by resolving target chapter robustly (id/title fallback) during both tool parsing and server apply, and storing `chapter_title` alongside `chapter_id` in proposed pending changes.
- 2026-02-13: Fixed AI tool-intent ambiguity where "subchapter/chapter" requests could be mis-routed to `add_task`; chapter-language requests now force `add_chapter` proposal flow with optional parent chapter resolution.
- 2026-02-13: Added chapter-intent guardrails in AI chat parsing: chapter-only requests now ignore non-chapter tool outputs, duplicate chapter proposals are skipped (existing + same-response dedupe), and `"under \"...\""` parent-title phrasing is resolved to the correct parent chapter.
- 2026-02-13: Added deterministic chapter-creation parsing for chapter-only prompts (e.g., `add subchapter "X" under "Y"`), forcing a single `add_chapter` proposal with duplicate suppression against existing chapters and same-turn proposals.
- 2026-02-16: Reopened `WS-016` as not fully complete after validation feedback; status set back to `in_progress` until reliability/QA gaps are closed.
- 2026-02-16: Added remediation checklist `docs/qa/ws-016-hardening-checklist.md` to track remaining WS-016 hardening work.
- 2026-02-16: Completed WS-016 code implementation with all 8 goals addressed:
  - Fixed status schema mismatch (accepted vs approved) with backward-compatible migration
  - Added robust chapter resolution by title+parent for update/delete operations
  - Blocked no-op approvals with explicit validation and clear error messages
  - Improved apply flow safety with compensation logging for inconsistent states
  - Extended AI tool-call retry logic to handle wrong tool types, not just missing tools
  - Passed UI context (selectedChapterId) to chat API for better resolution
  - Implemented actionable error messages throughout accept/reject flows
  - Created comprehensive manual QA script with 22 test cases
- 2026-02-16: Applied database migration `20260216_status_schema_alignment.sql` successfully.
- 2026-02-16: Status changed to `pending_qa` - awaiting manual QA validation before marking as `done`.
- 2026-02-16: **CORE-005 Complete** - Implemented ATECO code autocomplete search in business setup Step 5. Features:
  - Full dropdown showing all 52 ATECO codes on click (no typing required)
  - Search by code (e.g., "62"), category (e.g., "ICT"), or description (e.g., "programming")
  - Descriptive labels: "62 - Computer programming and consultancy" (not repetitive "62 - ICT")
  - All ATECO macro names translated to English (Agriculture, Manufacturing, ICT, etc.)
  - Search filters results dynamically without auto-clearing input
  - Optional/skippable field - doesn't block onboarding completion
  - Selected ATECO code and description saved to business profile
- 2026-02-16: **CORE-008 Complete** - Built complete Damodaran <-> onboarding sector mapping layer for accurate startup valuation:
  - Created `src/lib/sectorMapping.ts` with comprehensive mapping service
  - 16 user-friendly onboarding sectors in Step 4 (all English): Software/SaaS, E-commerce, FinTech, Health/MedTech, Education, Media, Tourism, Transport, Manufacturing, Agri-food, Energy, Construction, Professional Services, Business Services, Other
  - 52 ATECO 2-digit codes with specific descriptions (e.g., "62 - Computer programming and consultancy")
  - 95 Damodaran industries for valuation multiples
  - Each sector maps to 3 weighted Damodaran industries (e.g., 70%, 20%, 10%)
  - Example: "Software / SaaS / IT" → 70% Software (System & Application), 20% Software (Internet), 10% Information Services
  - ATECO code selection refines mapping for more accurate industry classification
- 2026-02-16: Created API endpoints:
  - `GET /api/sectors/ateco/search?q=<query>` - Returns all 52 codes when query empty, filtered results when query provided
  - `POST /api/sectors/damodaran` - Resolves weighted Damodaran industries from onboarding sector + optional ATECO code
  - `GET /api/sectors/damodaran` - Returns all 95 Damodaran industries
- 2026-02-16: Created `src/components/onboarding/AtecoSearchField.tsx` with Material-UI Autocomplete:
  - Loads all codes on mount for instant dropdown
  - Debounced server-side search for filtering
  - Visual feedback with loading states
  - Prevents input clearing on blur/selection
  - Shows code chips and descriptions in dropdown
- 2026-02-16: Integrated into business setup page:
  - Step 4: 16 English onboarding sectors (user-friendly macro categories)
  - Step 5: ATECO search field (optional, with full dropdown and search)
- 2026-02-16: Created comprehensive types in `src/types/sectors.ts`:
  - `OnboardingSector`, `Ateco2Digit`, `AtecoMacro`, `DamodaranIndustry`
  - `SectorMapping`, `SectorResolution`, `AtecoSearchResult`
- 2026-02-16: Added comprehensive implementation documentation in `docs/CORE-005-008-IMPLEMENTATION.md`.
- 2026-02-16: Damodaran valuation multiples data integrated (95 industries with EV/EBITDA ratios) - ready for future valuation calculator features.
- 2026-02-16: Files created/modified for CORE-005 & CORE-008:
  - Created: `src/types/sectors.ts`, `src/lib/sectorMapping.ts`, `src/app/api/sectors/ateco/search/route.ts`, `src/app/api/sectors/damodaran/route.ts`, `src/components/onboarding/AtecoSearchField.tsx`, `docs/CORE-005-008-IMPLEMENTATION.md`
  - Modified: `src/app/workspaces/[workspaceId]/business-setup/page.tsx`, `TASKS.md`, `PROGRESS.md`
- 2026-02-16: **CORE-009 Complete** - ATECO mapping scaffolding fully implemented as part of CORE-008:
  - Complete ATECO → sector taxonomy mapping (52 codes, 10 macros)
  - ATECO → Damodaran industry resolution with validation
  - Search, lookup, and suggestion functions for ATECO codes
  - Integration with onboarding flow (Step 5)
  - All acceptance criteria met: "ATECO field can map to internal sector taxonomy" ✅
  - Implementation in `src/lib/sectorMapping.ts` includes: `searchAtecoCodes()`, `getAtecoByCode()`, `getSuggestedAtecoCodes()`, `resolveSectorToDamodaran()` with ATECO refinement
  - No additional scaffolding needed - production-ready service delivered
- 2026-02-17: **BPTS-002 Complete** - Rebuilt `DEFAULT_BUSINESS_PLAN_TASK_TEMPLATE` with the exact 6 chapters and requested subsection hierarchy from client feedback section 5.1 (Business Fundamentals -> Pitch).
- 2026-02-17: **BPTS-004 Complete** - Added section-specific prompts for all seeded chapter/task nodes, including explicit core prompt behavior for Business Idea, TAM SAM SOM Analysis, and Customer Acquisition Cost (COCA).
- 2026-02-17: **BPTS-003 Complete** - Added runtime instruction-quality enforcement for default task templates (`MIN_TEMPLATE_INSTRUCTION_LINES = 3`) with validation wired into default-task seeding.
- 2026-02-17: **BPTS-007 Complete** - Added `docs/qa/bpts-task-structure-qa-pack.md` covering regression checklist for hierarchy, prompts, approvals, and editability.
- 2026-02-17: **AF-005 Complete** - Implemented "Ask AI" left-panel pattern for Pitch Deck and Canvas editors:
  - Created `PitchAskAiPanel.tsx` (320px left panel with AI actions: summarize, rephrase, simplify, detail, grammar, translate)
  - Created `CanvasAskAiPanel.tsx` (320px left panel with section selector and AI suggestions)
  - Updated `PitchDeckEditor.tsx` to integrate AI panel toggle (mutual exclusion with settings)
  - Updated `CanvasModelEditPage.tsx` to integrate AI panel toggle (mutual exclusion with export sidebar)
  - Reuses existing APIs: `pitch-deck/ai/slide-suggest` and `canvas-models/ai-suggest`
  - Business Plan already had left-panel AI pattern (ManageAiTabs) - no changes needed
- 2026-02-17: **AF-006 Complete** - Completed export matrix and hardened export UX:
  - **Business Plan**: Removed HTML from export menu, kept PDF + DOCX, added toast notifications
  - **Pitch Deck**: Added PDF export (client-side html2canvas + jsPDF), kept PPTX, added format picker dropdown
  - **Canvas Model**: Added PPTX export (client-side pptxgenjs), kept PDF, added format toggle
  - Created `src/lib/pitchDeckExport.ts` (PDF export helper with sanitizeFileName)
  - Created `src/lib/canvasExport.ts` (PPTX export helper with sanitizeFileName)
  - Updated `ExportSettingsSidebar.tsx` with PDF/PPTX toggle and toast notifications
  - Updated `ManageActionArea.tsx` to remove HTML option and add toast success
  - All exports now have: loading states, toast success/error, filename sanitization
  - Created `docs/qa/af-005-af-006-manual-qa-script.md` for QA validation
