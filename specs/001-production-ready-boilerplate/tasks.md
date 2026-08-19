# Tasks: Production-Ready Boilerplate (Multi-Language Focus)

**Input**: Design documents from `/specs/001-production-ready-boilerplate/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/feature-toggles.md

**Tests**: Test tasks are included only where the spec explicitly requires them (FR-023 critical-flow tests in US5). The i18n story (US3) is validated via quickstart scenarios, not unit tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. The immediate focus (user request) is **multi-language: English as base, French added now** - US3 is fully detailed and can be implemented first; other stories follow in priority order.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js + Convex project: `src/` at repo root, `convex/` for backend, `messages/` for i18n
- New i18n files: `src/i18n/request.ts`, `messages/en.json`, `messages/fr.json`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and i18n prerequisites

- [ ] T001 Install next-intl as a dependency (`pnpm add next-intl`) and verify `next.config.ts` still builds
- [ ] T002 Create `messages/en.json` and `messages/fr.json` with an empty namespace structure (common + per-page sections)
- [ ] T003 [P] Install vitest toolchain as dev dependencies (`pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths`) and create `vitest.config.mts` with jsdom + react + tsconfigPaths plugins (needed for US5; harmless early)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core i18n infrastructure that MUST be complete before US3 (multi-language) can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Register the next-intl plugin in `next.config.ts` (`createNextIntlPlugin()`) and wrap the default export
- [ ] T005 Create `src/i18n/request.ts` with `getRequestConfig`: resolve locale from the `locale` cookie, fall back to browser locale via `headers()`, then `en`; register `messages/en.json` and `messages/fr.json` (fallback locale = `en`)
- [ ] T006 Wrap the root layout in `src/app/layout.tsx` with `NextIntlClientProvider` (messages passed for client components)
- [ ] T007 Add the `language` field to `user.additionalFields` in `convex/auth.ts` (type string, default `"en"`, input true) and mirror it in the `user` table in `convex/betterAuth/schema.ts` (keep both in sync per AGENTS.md)
- [ ] T008 Add the `locale` cookie contract to `src/lib/consent.ts` sibling (new `src/lib/locale.ts` with `getLocale`/`setLocale` cookie helpers) per contracts/feature-toggles.md
- [ ] T009 Verify `pnpm check` passes with the i18n scaffolding in place (lint + typecheck)

**Checkpoint**: Foundation ready - US3 implementation can begin

---

## Phase 3: User Story 3 - Multi-Language Support (Priority: P2, immediate focus) 🎯

**Goal**: English (base) + French (added now). Signed-in users get a runtime language switcher that persists their choice; visitors without a saved preference get browser-locale detection with an English fallback; missing translations fall back to English; adding a language requires no code changes.

**Independent Test**: Switch the app language to French in Settings - all user-facing text switches immediately (no full reload), the choice survives a reload, and the login page shows English (or the browser locale) for signed-out visitors.

### Implementation for User Story 3

- [ ] T010 [P] [US3] Create `src/components/language-switcher.tsx` (shadcn Select bound to the user's `language` field; writes the `locale` cookie via `src/lib/locale.ts` and calls the user-update mutation for signed-in users)
- [ ] T011 [US3] Extract all user-facing strings from `src/app/page.tsx`, `src/app/login/`, `src/app/register/`, `src/app/settings/`, `src/app/dashboard/`, and `src/components/` (header, footer, auth-shell, forms, command-palette, cookie-consent) into `messages/en.json` namespaces, replacing hardcoded strings with `useTranslations`/`getTranslations` calls
- [ ] T012 [P] [US3] Translate every key in `messages/fr.json` (all namespaces from T011) - French as the added language
- [ ] T013 [US3] Wire the language switcher into the signed-in UI: Settings page section (per user story: Settings) and optionally the header (site-header/nav-user) for quick access
- [ ] T014 [US3] Add `src/i18n/request.ts` browser-locale detection tests via `pnpm check` verification: unsupported locale falls back to `en`, `fr` browser locale resolves to French when no cookie
- [ ] T015 [US3] Persist the signed-in user's `language` choice via the user-update path (Settings -> Profile or dedicated Language section) and surface it in the session so SSR resolves the right locale
- [ ] T016 [US3] Verify FR-013: adding a language requires only a new `messages/<code>.json` + a locale registration - document the mechanism in `README.md`

**Checkpoint**: Multi-language works - English base + French, switcher, persistence, fallback

---

## Phase 4: User Story 1 - Accounts, Roles, and Admin Dashboard (Priority: P1)

**Goal**: Accounts/roles/admin dashboard already exist in the boilerplate; this story's tasks are the i18n integration + hardening so the story stays fully functional in both languages.

**Independent Test**: Register the first account (admin), open `/dashboard`, and confirm the UI renders correctly in English and French.

### Implementation for User Story 1

- [ ] T017 [P] [US1] Localize the register/login forms (`src/components/register-form.tsx`, `login-form.tsx`, `oauth-buttons.tsx`, `auth-shell.tsx`) - swap hardcoded strings for translation keys from `messages/en.json`
- [ ] T018 [P] [US1] Localize the dashboard UI (`src/components/dashboard/user-management.tsx`, `user-dialog.tsx`) - pagination, search placeholder, dialog labels, role names
- [ ] T019 [US1] Verify admin guard rails still hold after i18n (last-admin delete/demote rejection, self-demote block) and error messages render under the right fields in both languages

**Checkpoint**: US1 fully functional in English + French

---

## Phase 5: User Story 2 - Command Palette (Priority: P1)

**Goal**: Command palette exists; this story localizes its labels/actions and keeps keyboard behavior intact.

**Independent Test**: Press Ctrl+K, type "s" - Settings highlights in both English and French label sets.

### Implementation for User Story 2

- [ ] T020 [P] [US2] Localize `src/components/command-palette.tsx` - page labels, action labels (theme, sign out), placeholder text via translation keys
- [ ] T021 [US2] Verify type-ahead matching works on the translated labels (prefix > contains > keyword) and the palette stays keyboard-only

**Checkpoint**: US2 fully functional in English + French

---

## Phase 6: User Story 4 - GDPR / CCPA Compliance Suite (Priority: P2)

**Goal**: Consent banner (two choices), legal pages, data export, account deletion, compliance document templates, age gate.

**Independent Test**: First visit shows a two-choice consent banner; signed-in user exports data, deletes account; register form blocks until the age checkbox is checked.

### Implementation for User Story 4

- [ ] T022 [P] [US4] Simplify `src/components/cookie-consent.tsx` to exactly two choices (Accept all / Essential only), remove the per-category dialog, keep the `cookie-consent` cookie payload compatible with `src/lib/consent.ts`
- [ ] T023 [P] [US4] Add the minimum-age confirmation checkbox ("I am at least 13 years old") to `src/components/register-form.tsx`, blocking submit until checked (FR-028); no DOB collection
- [ ] T024 [P] [US4] Add `docs/compliance/records-of-processing.md`, `docs/compliance/breach-response.md`, `docs/compliance/dpa-checklist.md` fill-in templates (FR-026) referencing the app's actual data inventory
- [ ] T025 [P] [US4] Update the legal pages (`src/lib/legal.ts`, `src/app/legal/`) to state the minimum age (FR-016) and localize them via i18n keys
- [ ] T026 [US4] Verify data export (Settings -> Profile) and account deletion (Danger zone) still work end-to-end; localize both flows' UI text

**Checkpoint**: US4 compliant and functional

---

## Phase 7: User Story 5 - Production Hardening (Priority: P3)

**Goal**: Security notifications, audit log, retention purge, critical-flow tests, Dockerfile + deployment guides.

**Independent Test**: Changing the password fires a security email; admin actions appear in the audit log; `pnpm test` covers sign-up/sign-in/admin guard; Docker build succeeds.

### Tests for User Story 5 (REQUIRED by spec FR-023)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T027 [P] [US5] Write critical-flow component tests with vitest + RTL in `src/tests/` (or colocated `__tests__`): sign-up incl. age-gate checkbox, sign-in, admin-guard redirect for non-admin, GDPR self-service (consent render, export/delete entry points)
- [ ] T028 [P] [US5] Add a `test` script (`vitest run`) to `package.json` and wire `pnpm test` into `.github/workflows/ci.yaml` after lint + typecheck (SC-007)

### Implementation for User Story 5

- [ ] T029 [P] [US5] Add `notifySecurityEmails` boolean to `user.additionalFields` in `convex/auth.ts` + schema mirror (default true), and gate security emails on it
- [ ] T030 [US5] Add a `hooks.after` handler in `convex/auth.ts` sending a security notification email via `sendActionEmail` on password change (`/change-password`); 2FA enable/disable already sends - extend to account deletion from the delete-account mutation in `convex/users.ts`
- [ ] T031 [P] [US5] Add the audit-log table to `convex/schema.ts` (actorId, actorEmail, action, targetId, targetEmail, `_creationTime`) and write entries transactionally in `convex/users.ts` admin mutations (create/update/delete/role change) per data-model.md
- [ ] T032 [P] [US5] Add an admin-only paginated audit-log query in `convex/users.ts` (server-side role check) and a read-only audit view in `src/components/dashboard/` (shadcn table)
- [ ] T033 [P] [US5] Create `convex/crons.ts` with a daily off-peak cron (e.g. `{ hourUTC: 4 }`) purging expired sessions via `components.betterAuth.adapter.deleteMany` (where `expiresAt < now`); dormant-account purge gated on `RETENTION_DORMANT_DAYS` (opt-in)
- [ ] T034 [P] [US5] Add `RETENTION_DORMANT_DAYS` to the Convex env docs in `.env.example` comment + README env table (contracts/feature-toggles.md)
- [ ] T035 [P] [US5] Create a multi-stage `Dockerfile` (Next.js standalone output, `.dockerignore` excluding `.next`/`node_modules`/`.convex`) and `docs/deployment-docker.md`, `docs/deployment-netlify.md`, `docs/deployment-vercel.md` guides (FR-027)

**Checkpoint**: US5 hardened and CI-verified

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T036 [P] Update `README.md`: i18n section (English base + French, how to add languages), compliance docs section, deployment guides links, roadmap tick-offs (i18n, age gate, audit log, security notifications, retention, tests, Dockerfile)
- [ ] T037 [P] Add `next.config.ts` i18n notes and `src/env.js`/`.env.example` updates only for new opt-in vars (none required for i18n; `RETENTION_DORMANT_DAYS` is Convex-side)
- [ ] T038 Run `specs/001-production-ready-boilerplate/quickstart.md` scenarios end-to-end (fresh clone -> dashboard, palette, language switch EN/FR, consent, export/delete, age gate, security email, audit log, `pnpm test`, Docker build)
- [ ] T039 Run `pnpm check`, `pnpm format:write`, and the `specs/001-production-ready-boilerplate/checklists/production.md` review pass; fix any flagged spec/requirements gaps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US3 Multi-Language (Phase 3)**: Depends on Foundational - immediate focus (user request: English base + French)
- **US1/US2 (Phase 4/5)**: Depend on Foundational + US3 string extraction (they localize components US3 already touched) - run after US3
- **US4 (Phase 6)**: Depends on Foundational; i18n-localized components benefit from US3 - run after US3
- **US5 (Phase 7)**: Depends on Foundational; tests require vitest setup (T003) - can run in parallel with US3/US4 once foundation is done
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

- **US3 (P2, immediate focus)**: Can start after Foundational - no dependencies on other stories
- **US1 (P1)**: Existing functionality + i18n localization - no hard dependencies
- **US2 (P1)**: Existing functionality + i18n localization - no hard dependencies
- **US4 (P2)**: Consent/age gate/legal localization - no hard dependencies
- **US5 (P3)**: Independent (tests, cron, audit, notifications, Dockerfile)

### Within Each User Story

- Models/additionalFields before services
- Services before endpoints/UI
- Core implementation before integration
- Story complete before moving to next priority (unless user directs otherwise)

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational completes, US3, US4, and US5 can start in parallel (different files)
- T010/T012, T017/T018, T022/T023/T024/T025, T027/T028/T029, T031/T032/T033/T034/T035 are parallel groups
- Different user stories can be worked on in parallel by different implementers

---

## Parallel Example: User Story 3 (Multi-Language)

```bash
# Launch independent extraction and translation prep together:
Task: "Create src/components/language-switcher.tsx (T010)"
Task: "Translate messages/fr.json namespaces (T012)"

# Then, after T011 extracts strings:
Task: "Wire the switcher into Settings/header (T013)"
Task: "Persist user language choice and surface in session (T015)"
```

---

## Implementation Strategy

### MVP First (User request: Multi-Language)

1. Complete Phase 1: Setup (next-intl + message files)
2. Complete Phase 2: Foundational (plugin, request config, provider, language field) - CRITICAL
3. Complete Phase 3: US3 Multi-Language (English base + French)
4. **STOP and VALIDATE**: Switch to French, reload, verify persistence + fallback
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational -> i18n foundation ready
2. Add US3 (multi-language) -> Test independently -> Deploy/Demo
3. Add US4 (GDPR suite) -> Test independently -> Deploy/Demo
4. Add US5 (hardening) -> Test independently -> Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US3 (multi-language, immediate focus)
   - Developer B: US4 (GDPR suite)
   - Developer C: US5 (hardening - tests, cron, audit, Docker)
3. Stories complete and integrate independently; US1/US2 localization follows US3's extracted strings

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (US5 tests)
- Commit after each task or logical group (project rule: commit after each feature; push to `origin`)
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Project rules: form errors under the input (not toasts), shadcn/ui first, no em dashes in code/docs, run `pnpm check` before finishing
