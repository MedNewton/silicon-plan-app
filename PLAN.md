# SiliconPlan Unified Implementation Plan
Date: February 12, 2026
Source Merge: `PLAN.md` + `AGENT2_PLAN.md`
Owner: Product + Full-Stack Team + QA

## 1. Objective and Scope
Primary goal: implement all client feedback (English + Italian) across landing and web app with a structured, low-regression delivery plan.

Scope:
- Landing track: brand consistency, pricing/copy alignment, legal/social links, hero clarity, testimonials.
- Web app track: auth, onboarding, workspace management, AI knowledge/context, task system, pitch/canvas, exports, localization, mobile UX.

Inputs:
- `/home/mohamedbenmoussa/Downloads/SiliconPlan_Customer_Feedback_Guideline.md.pdf`
- `/home/mohamedbenmoussa/Downloads/Osservazioni (1).pdf`
- Full codebase review (`src`, `supabase`, `docs`)

## 2. Current Architecture Baseline
- Frontend: Next.js 15, React 19, MUI.
- Auth: Clerk is deeply integrated (`src/middleware.ts`, `src/app/layout.tsx`, API routes).
- Data/storage: Supabase.
- AI: OpenAI (`OPEN_AI_API_KEY`) in BP, pitch, canvas endpoints.
- BP editor exists; finance/charts are placeholders.
- AI Library exists but has upload/drag-drop/editability/context gaps.
- Exports exist, but formatting parity/consistency is incomplete.

## 3. Mandatory Decision Gates (Before Build Starts)
1. Auth strategy lock
- Current system is Clerk-based.
- If Clerk removal is required, run as separate migration program.

2. Environment ownership and QA target
- Confirm canonical testing targets: `siliconplan.vercel.app` vs `www.silicon-plan.live`.
- Confirm which repo/deployment owns landing changes.

3. AI web research policy
- OpenAI-only web research is acceptable if enabled for the selected model/account.
- External search providers are optional, not mandatory.

4. Economic-financial implementation review
- Run a working session on the 4 Loom references before deep financial automation.

## 4. Prioritized Backlog
### P0 (Critical)
1. Forgot password broken (desktop/mobile).
2. AI Library PDF upload failure.
3. Business Plan AI Chat initialization failure.
4. Mobile unsupported in core workflows.
5. Workspace create regression (logo/count state issues).
6. Missing structured end-to-end QA baseline.

### P1 (High)
1. Onboarding wizard redesign and multi-step UX.
2. "Other" custom inputs in required fields.
3. Team invites lifecycle UI (status/resend/revoke).
4. Workspace delete flow with warnings.
5. Rename "Edit your workspace" to setup-oriented label.
6. AI Knowledge save/edit/reuse reliability.
7. Real drag-and-drop + long filename handling in AI Library.
8. Task usability and automation gaps in Manage Workspace.
9. Pitch preset sections and BP/Canvas reuse.
10. Back navigation consistency.

### P2 (Strategic)
1. Direct image upload in BP editor.
2. AI tone-of-voice controls.
3. Export typography/margins standardization.
4. EN/IT localization across UI and exports.
5. Landing page optimization and social proof completion.
6. Financial plan, pitch, SWOT editability hardening.

## 5. Delivery Phases
## Phase 0: Stabilization and Diagnostics
Timeline: Feb 13 - Feb 20, 2026
Objective: close hard blockers and establish reliable QA signal.

Web app track:
- Auth/password reset
  - Wire real forgot-password flow in `src/components/auth/AuthCard.tsx` and `src/hooks/useAuthCardController.ts`.
- AI Library upload reliability
  - Harden validation/error reporting in `src/components/workspaceSettings/modals/AILibraryModal.tsx` and `src/app/api/workspaces/[workspaceId]/ai-library/documents/route.ts`.
- BP AI chat bootstrap
  - Stabilize conversation init and error handling in `BusinessPlanContext` and `src/app/api/workspaces/[workspaceId]/business-plan/ai/chat/route.ts`.
- Workspace creation regression
  - Remove hardcoded workspace count and validate post-create state updates.
- Mobile baseline pass
  - Ensure no blocking failures on auth, onboarding, workspace setup, business plan entry.

Landing track:
- Clarify environment labels and testing references.
- Apply urgent copy/data fixes (contact placeholders, typos, legal/social links).

Acceptance:
- P0 issues no longer reproducible in staging.
- QA smoke passes on desktop + mobile.

## Phase 1: Onboarding and Workspace UX Refactor
Timeline: Feb 23 - Mar 6, 2026
Objective: reduce setup friction and align with requested logic.

Web app track:
- Implement wizard flow (VentureKit style) with progress and step persistence.
- Add "Other" conditional text fields with persistence.
- Add extended fields: purpose, product/service, sales channel, market geo, team size.
- ATECO optional searchable step with flexible mapping design.
- Add Team/Users invitation statuses and actions (pending/accepted/declined/expired, resend/revoke).
- Add workspace delete API + UI confirmation flow.
- Rename workspace setup labels for clarity.
- Add back-button consistency in setup/workspace navigation.

Landing track:
- CTA adjustment and pricing alignment first pass (remove unsupported claims/features).

Acceptance:
- Users can complete onboarding via wizard with no dead ends.
- Team invite visibility and workspace deletion are functional.

## Phase 2: AI Knowledge, Context, and Product Core Fit
Timeline: Mar 9 - Mar 20, 2026
Objective: make AI context trustworthy and eliminate repeated user input.

Web app track:
- AI Knowledge CRUD completion
  - Add knowledge update/edit APIs and UI (currently delete-only).
- Real drag-and-drop behavior in AI Library.
- Document ingestion expansion
  - Extend context pipeline beyond text-only snippets to include PDF/DOCX/XLSX/PPTX extraction.
- Context propagation
  - Ensure workspace setup + AI library inputs are reused in BP tasks and AI chat.
- AI capability uplift in setup/editor
  - Support regenerate/research behaviors where currently missing.
- Tone-of-voice baseline settings wired into prompts.

Code targets:
- `src/lib/workspaceAiContext.ts`
- `src/lib/businessPlanAi.ts`
- `src/components/workspaceSettings/AILibraryTabContent.tsx`
- `src/app/api/workspaces/[workspaceId]/ai-library/knowledge/*.ts`

Landing track:
- Hero AI preview (onboarding -> output visual flow).
- Pricing/feature list alignment with actual product and pitch deck strategy.

Acceptance:
- Uploaded knowledge materially affects AI outputs.
- AI library workflows are reliable and editable.

## Phase 3: Task System, Ask AI UX, and Pitch/Canvas Cohesion
Timeline: Mar 23 - Apr 3, 2026
Objective: implement guided business plan creation with coherent AI-assisted outputs.

Web app track:
- Structured BP task hierarchy (H1/H2) based on client chapter map.
- Task metadata model per item: title, user instructions, AI prompt.
- AI chat to task generation behavior from pasted summaries.
- Keep completed tasks editable and AI-rewritable.
- Introduce/position "Ask AI" as a clearer per-section workflow (business plan, canvas, pitch).
- Pitch preset section scaffold (10-12 sections) with data reuse from BP/Canvas.
- Fix pitch editor loading flicker and reduce full-page refresh behavior.

Acceptance:
- Users can follow guided task flow end-to-end.
- Pitch generation is complete, coherent, and not asking repeated inputs.

## Phase 4: Exports, Localization, Financial Editability, Branding
Timeline: Apr 6 - Apr 17, 2026
Objective: produce investor-grade outputs and regional readiness.

Web app track:
- Export system unification
  - Standardize A4 margins (2.5 cm), typography hierarchy, overflow handling.
- Workspace logo consistency in BP/Pitch/Canvas exports.
- Format parity
  - BP: PDF + DOCX.
  - Pitch: PDF + PPTX.
  - Canvas: PDF + PPTX (if product-approved).
- Direct image upload in BP editor (URL as fallback).
- EN/IT localization layer for major flows and exports.
- Financial plan editability + multi-currency support.
- Pitch/SWOT editability before export.

Landing track:
- Final brand asset integration (vector variants).
- Testimonials/social proof replacement or suppression if unavailable.

Acceptance:
- Export quality passes print/readability checks.
- Localized core flows are usable in EN/IT.

## Phase 5: Release Hardening and UAT
Timeline: Apr 20 - Apr 24, 2026
Objective: finalize quality, align with client, and release safely.

- Full regression suite (desktop + mobile).
- Performance checks (AI-heavy screens, exports, pitch editor).
- UAT checklist closure with client.
- Deployment, monitoring, rollback readiness.

Acceptance:
- All P0/P1 closed or explicitly waived.
- UAT sign-off completed.

## 6. Technical Work Packages
### WP-A Auth and Access
- Password reset hardening.
- Invite lifecycle APIs and permissions.

### WP-B Onboarding and Workspace Model
- Wizard state model + schema evolution.
- ATECO-ready mapping layer.

### WP-C AI Library and Context Engine
- Multi-format ingestion and context structuring.
- Knowledge CRUD and context weighting.

### WP-D BP Tasks and Ask AI Layer
- Task schema + UI integration.
- AI prompt templates and task generation logic.

### WP-E Pitch and Canvas Integration
- Preset sections, BP/Canvas reuse.
- Editor performance and reduced loading friction.

### WP-F Export and Localization Platform
- Unified export formatting layer.
- EN/IT i18n architecture for UI + export labels.

## 7. QA and Validation Strategy
Automated:
- API tests: auth reset, invites, workspace delete, AI library, BP chat/tasks, exports.
- Component tests: onboarding wizard, task editing, AI actions.
- E2E smoke on desktop and mobile viewport.

Manual:
- Scenario checklist mapped to every feedback issue.
- A4 print tests and export visual inspection.
- EN/IT verification for key screens and outputs.

## 8. Milestones (Sprint-Level)
1. Milestone 1 (2-3 sprints): stability
- Phase 0 + critical parts of Phase 1.

2. Milestone 2 (3-5 sprints): product fit
- Phase 1 + Phase 2 + core Phase 3 task system.

3. Milestone 3 (3-4 sprints): professionalization
- Phase 4 + Phase 5 readiness and UAT closure.

## 9. API Keys and External Services
Mandatory (current architecture):
- `OPEN_AI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Clerk deployment keys

Optional:
- `RESEND_API_KEY` for invite emails
- Monitoring service key (recommended)

Live web research:
- Can run with OpenAI-only if enabled on your account.
- Third-party search providers remain optional.

## 10. Risks and Open Questions
- Auth-provider mismatch risk if non-Clerk migration is requested mid-stream.
- Landing ownership risk if landing changes are outside this repository.
- Financial workflow scope expansion risk without early domain validation.
- AI latency/cost risk with large contexts; requires instrumentation and guardrails.

Open questions:
1. Are we committing to Clerk for this release cycle?
2. Which environment is the official UAT source of truth?
3. Is Canvas PPTX export mandatory for this release or deferred?
4. Is full Ask AI redesign required now or after core stability?

## 11. Definition of Done
1. Feature behavior matches client requirement.
2. UX flow is clear and testable in target environments.
3. No critical regressions in auth, workspace, AI, editor, or exports.
4. QA evidence exists (automated or checklist-based) for acceptance.
5. Release notes and rollback plan are prepared for production deployment.
