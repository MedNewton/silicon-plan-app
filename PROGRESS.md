# Progress Tracker
Last updated: 2026-02-13
Source of truth for tasks: `TASKS.md`

## Summary
- Total scoped tasks: 47
- `done`: 37
- `in_progress`: 0
- `todo`: 10
- `blocked`: 0

## Completed (This Batch)
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
28. `WS-016` - Fix AI Chat + Plan Chapters task creation gap

## Todo (Immediate Next)
1. `CORE-005` - Implement Step 6 ATECO (optional) with search
2. `CORE-008` - Build Damodaran <-> onboarding sector mapping layer
3. `CORE-009` - Add ATECO mapping scaffolding
4. `CORE-018` - Add pitch preset sections template

## Recent Validation
- `npm run typecheck`: pass
- `npm run lint`: pass (2 unrelated existing warnings in `src/middleware.ts`)

## Change Log
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
