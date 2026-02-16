# TASKS - Web App Feedback Execution
Date: February 12, 2026
Scope: only the feedback sections below from `SiliconPlan_Customer_Feedback_Guideline.md.pdf`
- `2. Web Application Observations`
- `3. Core Missing Features`
- `4. Workspace Structure & Usability`
- `5. Business Plan Task Structure`
- `6. Additional Fixes`
- `7. Bug Reports`

Status legend: `todo`, `in_progress`, `blocked`, `done`

## 1) Web Application Observations
| ID | Priority | Status | Task | Deliverable | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|
| OBS-001 | P0 | done | Implement working Forgot Password flow in auth UI | `Forgot password` triggers Clerk reset flow from `src/components/auth/AuthCard.tsx` | None | User can request reset email and complete reset on desktop/mobile |
| OBS-002 | P0 | done | Add robust password reset error handling | Clear handling for invalid email, expired link, rate limits in `src/hooks/useAuthCardController.ts` | OBS-001 | All reset failure scenarios show actionable message, no silent failure |
| OBS-003 | P0 | done | Add auth reset QA test pack | E2E and manual scripts for desktop/mobile reset | OBS-001, OBS-002 | QA checklist passes in staging |
| OBS-004 | P1 | done | Support `Other` custom input for Industry | Conditional free-text input and persistence | None | Selecting `Other` enables custom text and saves correctly |
| OBS-005 | P1 | done | Support `Other` custom input for Company Stage | Conditional free-text input and persistence | None | Selecting `Other` enables custom text and saves correctly |
| OBS-006 | P1 | done | Support `Other` custom input for Problem Solved | Conditional free-text input and persistence | None | Selecting `Other` enables custom text and saves correctly |
| OBS-007 | P1 | done | Persist custom `Other` values in business profile model/API | Schema + API contract for canonical value + optional custom label | OBS-004, OBS-005, OBS-006 | API returns and saves both selected option and custom value |
| OBS-008 | P1 | done | Convert long onboarding into multi-step experience | Stepper flow replacing long monolithic form | OBS-007 | Completion rate flow has step navigation with no dead ends |
| OBS-009 | P1 | done | Add onboarding step validation and resume safety | Client-side validation and state persistence per step | OBS-008 | Refresh/back does not drop completed data unexpectedly |

## 2) Core Missing Features
| ID | Priority | Status | Task | Deliverable | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|
| CORE-001 | P1 | done | Define onboarding canonical data contract | Typed DTO for all 12 requested steps | None | Single source model covers all required fields |
| CORE-002 | P1 | done | Implement wizard shell for 12-step onboarding | Reusable step container with progress + next/back | CORE-001 | All steps navigable with correct order and validation |
| CORE-003 | P1 | done | Implement Step 1-4 in wizard | Workspace create, business name, operation status, BP purpose | CORE-002 | Values persist and map to profile correctly |
| CORE-004 | P1 | done | Implement Step 5 Industry macro list | 12-16 macro sectors + `Other` with description | CORE-002 | Industry selection available and stored in normalized form |
| CORE-005 | P1 | done | Implement Step 6 ATECO (optional) with search | Search by code/description, skippable | CORE-002 | User can skip or save valid ATECO code |
| CORE-006 | P1 | done | Implement Step 7-8 problem and unique solution | Structured text inputs with guidance | CORE-002 | Inputs saved and available in workspace profile |
| CORE-007 | P1 | done | Implement Step 9-12 extended inputs | Product/service, sales channel, target market, team size | CORE-002 | All four steps save and reload correctly |
| CORE-008 | P1 | done | Build Damodaran <-> onboarding sector mapping layer | Mapping service contract (internal mapping table) | CORE-004 | Sector mapping available to AI/valuation logic |
| CORE-009 | P1 | todo | Add ATECO mapping scaffolding | Placeholder mapping table/service for future enrichment | CORE-005 | ATECO field can map to internal sector taxonomy |
| CORE-010 | P1 | done | Integrate onboarding outputs into AI context | Onboarding data injected via workspace context builder | CORE-003, CORE-004, CORE-006, CORE-007 | AI responses visibly use onboarding context |
| CORE-011 | P1 | done | Define business plan task data model | Task entity with `title`, `instructions`, `ai_prompt`, hierarchy | None | Model supports H1/H2 structure and ordering |
| CORE-012 | P1 | done | Seed default chapter/task hierarchy | Full structure per client summary (Business Fundamentals -> Pitch) | CORE-011 | New workspace gets complete default task hierarchy |
| CORE-013 | P1 | done | Implement task-centric sidebar UX | Hierarchical task navigation (chapter/subsection) | CORE-011, CORE-012 | User can open/edit tasks in logical sequence |
| CORE-014 | P1 | done | Implement per-task `Ask AI to Draft` action | Uses task prompt + workspace context + chapter context | CORE-013, CORE-010 | AI draft generated per selected task with correct context |
| CORE-015 | P1 | done | Keep completed tasks editable and AI-regenerable | No lock after completion; explicit regenerate flow | CORE-014 | Completed tasks remain editable without workaround |
| CORE-016 | P1 | done | Enable AI Chat to create tasks from pasted summary | Summary parsing -> proposed tasks/actions | CORE-011, CORE-013 | Pasted structured summary creates or suggests matching tasks |
| CORE-017 | P1 | done | Implement auto-context reuse in tasks | No retyping of workspace/library info per task | CORE-010, CORE-014 | Task drafting uses existing project info automatically |
| CORE-018 | P1 | todo | Add pitch preset sections template | Problem, Solution, Product, TAM/SAM/SOM, Business Model, Traction, Competitors, GTM, Financial Forecast, Team, Ask | None | New pitch starts with required preset sections |
| CORE-019 | P1 | todo | Reuse BP/Canvas data for pitch generation | Pull from business plan/canvas state before asking for extra input | CORE-018, CORE-017 | Pitch generation does not redundantly request known data |
| CORE-020 | P1 | todo | Add core missing features QA suite | E2E flows for onboarding, task system, pitch preset generation | CORE-003..CORE-019 | All critical scenarios pass on desktop/mobile |

## 3) Workspace Structure & Usability
| ID | Priority | Status | Task | Deliverable | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|
| WS-001 | P1 | done | Build Team/Users invitation visibility panel | List of invited users in workspace settings | None | Invited users are visible in UI |
| WS-002 | P1 | done | Add invitation lifecycle statuses | `pending`, `accepted`, `declined`, `expired` | WS-001 | Each invite displays accurate status |
| WS-003 | P1 | done | Add invite actions `resend` and `revoke` | API + UI actions in Team/Users | WS-002 | Resend/revoke work with proper permission checks |
| WS-004 | P1 | done | Add workspace delete capability | API `DELETE /api/workspaces/[workspaceId]` + warning dialog | None | Owner can delete workspace with explicit confirmation |
| WS-005 | P1 | todo | Implement EN/IT language toggle | Toggle on main pages + persisted choice | None | UI switches language without breaking flows |
| WS-006 | P1 | todo | Localize key workspace pages and exports | Workspace setup/settings/manage and export labels localized | WS-005 | EN/IT visible in targeted pages and exports |
| WS-007 | P1 | done | Rename confusing section labels | `Edit your workspace` -> `Setup Business` (or approved wording) | None | Terminology matches real function and is consistent |
| WS-008 | P1 | done | Upgrade workspace AI actions beyond text correction | Add research + regenerate capability in setup/business sections | None | User can trigger research/regenerate in setup context |
| WS-009 | P1 | done | Enable Excel uploads in AI Knowledge/Library | Accept `.xls/.xlsx` and process correctly | None | Excel file uploads succeed with useful status |
| WS-010 | P1 | done | Fix AI Knowledge description save issues | Reliable create/save/update behavior | None | Description persists and reloads correctly |
| WS-011 | P1 | done | Integrate AI Knowledge into BP generation | Knowledge included in prompts/context pipeline | WS-010 | Generated BP content reflects uploaded knowledge |
| WS-012 | P1 | done | Add AI Knowledge edit capability | Edit UI + API update endpoint for knowledge items | WS-010 | Knowledge entries are editable, not just deletable |
| WS-013 | P1 | done | Implement real drag-and-drop in AI Library | Functional dropzone with file processing | None | Dragging a file uploads successfully |
| WS-014 | P1 | done | Improve long filename handling in AI Library UI | Truncation + tooltip + no layout breaks | None | Long names render without overflow or broken layout |
| WS-015 | P1 | done | Improve task action affordance in Manage Workspace | Clarify button meaning and flow in task UI | CORE-013 | Users can understand task actions without ambiguity |
| WS-016 | P1 | pending_qa | Fix AI Chat + Plan Chapters task creation gap | Chat instructions should create/update tasks as expected | CORE-016 | Code complete, migration applied, awaiting manual QA validation per `docs/qa/ws-016-manual-qa-script.md` |
| WS-017 | P1 | todo | Implement workspace/library -> task automation | Auto-preload task context from existing project data | CORE-017 | User no longer needs to re-enter same topic per task |
| WS-018 | P1 | todo | Add workspace usability QA suite | Focused QA for settings/manage/library/task usability | WS-001..WS-017 | Usability checklist passes with no P1 blockers |

## 4) Business Plan Task Structure
| ID | Priority | Status | Task | Deliverable | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|
| BPTS-001 | P1 | done | Implement hierarchical BP task model (H1/H2) with title, instructions, AI prompt | `business_plan_tasks` entity + API supports task authoring fields | CORE-011 | Task model supports ordered H1/H2 tasks with editable content fields |
| BPTS-002 | P1 | in_progress | Align default BP chapter/task tree to full client structure (6 chapters + requested subsections) | Seeded template includes all requested chapter/subchapter nodes | CORE-012, CORE-013 | New workspaces start with structure matching feedback document |
| BPTS-003 | P1 | todo | Enforce minimum instruction quality for each task template | Task templates include at least 3-line user instructions | BPTS-002 | Every core task template provides actionable writing guidance |
| BPTS-004 | P1 | in_progress | Add section-specific AI prompts for core templates | Prompt library for key nodes (e.g. Business Idea, TAM/SAM/SOM, COCA) | CORE-014, BPTS-002 | AI output consistency improves and follows per-section intent |
| BPTS-005 | P1 | done | Keep task outputs editable and regenerable | Users can edit completed tasks and re-run AI draft anytime | CORE-015 | No lockout after completion; edits/regeneration remain available |
| BPTS-006 | P1 | in_progress | Stabilize AI chat -> chapter/task proposal reliability | Deterministic proposal mapping and approval application for chapter/task requests | WS-016 | Chapter/task creation via AI Chat is reliable with low misclassification rate |
| BPTS-007 | P1 | todo | Add BP task structure QA pack | Regression checklist for task hierarchy, prompts, approvals, and editability | BPTS-001..BPTS-006 | QA pass covers structure + AI flow edge cases |

## 5) Additional Fixes
| ID | Priority | Status | Task | Deliverable | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|
| AF-001 | P1 | todo | Add AI tone of voice settings | Workspace/user AI settings: professional, academic, conversational, technical | None | Selected tone is applied consistently across AI outputs |
| AF-002 | P1 | todo | Add workspace logo support for exports | Logo upload + inclusion in BP/Pitch/Canvas exports | None | Exported assets include correctly sized workspace logo |
| AF-003 | P1 | todo | Standardize export margins and A4 print layout | Export layout layer enforces 2.5cm margins and valid page settings | AF-006 | PDF/DOCX exports print correctly without clipped content |
| AF-004 | P1 | todo | Implement typography hierarchy in exports | Clear font scale for titles/headings/body/descriptions | AF-006 | Export documents have consistent visual hierarchy |
| AF-005 | P1 | in_progress | Promote AI assistant UX via dedicated `Ask AI` pattern in left panel | Discoverable AI entry point per core area | WS-015, WS-016 | AI entry is obvious and section-specific actions are easy to access |
| AF-006 | P1 | in_progress | Complete and harden export formats matrix | BP: PDF/DOCX, Pitch: PDF/PPTX, Canvas: PDF/PPTX with reliable formatting | None | All required export formats succeed without major formatting defects |
| AF-007 | P1 | todo | Add pitch preset sections template | Preset pitch sections from problem to financial forecast/team/ask | CORE-018 | New pitch starts with complete required section set |
| AF-008 | P1 | todo | Make financial plan editable and multi-currency | Editable financial tables + currency selection support | None | Users can revise AI financial outputs and switch currency |
| AF-009 | P1 | todo | Make generated pitch and SWOT outputs editable | Inline edit/save flow for generated pitch/SWOT blocks | None | Users can modify generated outputs before export |
| AF-010 | P1 | todo | Resolve DOCX/PPTX formatting regressions | Word/PPT exports preserve spacing, sizing, and layout fidelity | AF-006 | Generated files remain visually consistent with in-app content |

## 6) Bug Reports
| ID | Priority | Status | Task | Deliverable | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|---|
| BUG-001 | P0 | done | Fix forgot-password flow on desktop/mobile | Stable password reset flow with failure handling | OBS-001, OBS-002, OBS-003 | Users can reset password reliably across target devices |
| BUG-002 | P1 | done | Fix `Other` input behavior in onboarding fields | Free-text support for `Other` in Industry/Stage/Problem Solved | OBS-004, OBS-005, OBS-006, OBS-007 | Custom values are captured and persisted correctly |
| BUG-003 | P1 | done | Fix onboarding UX friction from long form | Step-based onboarding with validation and resume safety | OBS-008, OBS-009 | Users can complete onboarding with reduced drop-off and no data loss |
| BUG-004 | P1 | done | Fix missing invitation visibility and lifecycle controls | Team/Users list with statuses + resend/revoke/decline actions | WS-001, WS-002, WS-003 | Invitation flow is visible, manageable, and status-accurate |

## 7) Execution Sequence
1. Run P0 first: `OBS-001` to `OBS-003`.
2. Deliver onboarding baseline: `OBS-004` to `OBS-009`, then `CORE-001` to `CORE-010`.
3. Deliver task system core: `CORE-011` to `CORE-017`.
4. Deliver workspace usability set: `WS-001` to `WS-017`.
5. Complete business plan task structure alignment and QA: `BPTS-001` to `BPTS-007`.
6. Deliver additional fixes bundle: `AF-001` to `AF-010`.
7. Deliver pitch core-missing items: `CORE-018`, `CORE-019`, `AF-007`.
8. Execute final validation: `CORE-020`, `WS-018`, `BPTS-007`.

## 8) Done Criteria for This File
All requested scope is complete only when:
1. Every task in sections 1-6 is `done`.
2. No open P0/P1 defects remain for these covered feedback categories.
3. Desktop and mobile QA sign-off exists for all affected flows.
4. UAT confirms all covered feedback sections are fully satisfied.
