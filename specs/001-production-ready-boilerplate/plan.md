# Implementation Plan: Production-Ready Boilerplate

**Branch**: `001-production-ready-boilerplate` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-production-ready-boilerplate/spec.md`

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the execution workflow.

## Summary

The boilerplate must be production-ready out of the box: accounts/roles/admin dashboard (already built), a keyboard command palette (already built), multi-language support (new - English + French with browser-locale detection), a GDPR/CCPA compliance suite (partially built - needs two-choice consent simplification, compliance document templates, age-gate checkbox, retention purge), and production hardening (security notifications, admin audit log, CI tests, Dockerfile + deployment guides for Docker/Netlify/Vercel).

The core promise (fresh clone to working dashboard) is already delivered; this feature closes the remaining gaps so the boilerplate can claim "production-ready" end to end.

## Technical Context

**Language/Version**: TypeScript (Next.js 15 App Router, React 19)

**Primary Dependencies**: Convex (backend + reactive data), better-auth (auth, on Convex), Tailwind CSS v4 + shadcn/ui (base-ui), next-themes, react-easy-crop, Resend (email), Zod

**Storage**: Convex (app tables in `convex/schema.ts`; auth tables inside the better-auth component at `convex/betterAuth/`)

**Testing**: No test framework installed yet - vitest + React Testing Library is the planned fit for critical-flow tests (sign-up, sign-in, admin guard, GDPR self-service)

**Target Platform**: Web (Node host; Docker, Netlify, Vercel deployment guides)

**Project Type**: Web application (boilerplate/SaaS starter)

**Performance Goals**: Language switch reflects immediately (no full reload); command palette responsive under 100ms locally; no regression to existing page loads

**Constraints**: No em dashes (plain ASCII docs); no test framework invented - vitest is a suggestion, must be added deliberately; features must stay opt-in/toggleable per constitution principle III; auth tables only via the component adapter

**Scale/Scope**: Small SaaS boilerplate; single tenant with roles; 10k-user class

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle I (Production-Ready Defaults): PASS - the feature's entire purpose is keeping the fresh-clone path working while closing gaps.
- Principle II (Boilerplate, Not a Niche Product): PASS - everything added stays generic (compliance templates, i18n framework, deploy guides); no product-specific logic.
- Principle III (Opt-In, Toggleable Features): PASS - i18n languages, OAuth providers, email provider, retention purge are env/config-driven; consumers choose what to use.
- Principle IV (Security-First): PASS - audit log, security notifications, rate limits, age gate, and consent gating are all security/privacy hardening.
- Principle V (UX & UI Consistency): PASS - consent banner, language switcher, and age-gate checkbox use existing shadcn/ui components and inline-error patterns.

Re-check after design: confirm no new required env var breaks the documented quick start, and that disabling i18n still yields a fully functional single-language app.

## Project Structure

### Documentation (this feature)

```text
specs/001-production-ready-boilerplate/
├── plan.md              # This file
├── spec.md              # Feature specification (clarified)
├── checklists/
│   ├── requirements.md  # Built-in spec-quality checklist
│   └── [domain].md      # Custom checklists (e.g. i18n, gdpr)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (repository root)

```text
convex/
├── schema.ts            # App tables (empty today - add retention/audit-log tables here)
├── users.ts             # Admin CRUD, guard rails, GDPR export, delete-account (extend: audit log writes)
├── email.ts             # Resend helper (extend: security notifications)
├── auth.ts              # better-auth options (extend: age gate, security-notification hooks)
├── cron.ts              # NEW: retention purge (expired sessions) + dormant-account opt-in job
└── _generated/          # Generated - never edited

src/
├── lib/
│   ├── app.ts           # App settings (brand) - unchanged
│   ├── i18n.ts          # NEW: locale dictionary + resolver (EN/FR, browser-locale detection, fallback)
│   └── consent.ts       # Cookie consent (simplify to two choices: accept all / essential only)
├── components/
│   ├── language-switcher.tsx   # NEW: runtime language switcher (signed-in users)
│   ├── age-gate.tsx            # NEW: minimum-age checkbox on register
│   └── settings/               # Security section: security notifications, audit log view (admin)
├── app/
│   ├── register/        # Add age-gate checkbox
│   ├── legal/           # Privacy/terms templates (fill-in via src/lib/legal.ts)
│   └── docs/            # NEW (or /public/docs): GDPR compliance templates (records of processing, breach response, DPA checklist)
├── tests/               # NEW: vitest + RTL critical-flow tests (sign-up, sign-in, admin guard, GDPR flows)
└── env.js               # Add i18n/retention env vars if any

Dockerfile              # NEW
.github/workflows/ci.yaml # Extend: run tests in CI
docs/deployment-*.md    # NEW: Docker, Netlify, Vercel guides (or extend README)
```

**Structure Decision**: Single Next.js + Convex project (existing layout preserved). New capabilities map onto existing files (`convex/email.ts`, `convex/users.ts`, `src/lib/`) rather than introducing new top-level modules, keeping the boilerplate easy to navigate. Tests get their own top-level `src/tests/` directory so the framework addition is self-contained.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | - | - |

(No constitution violations: the feature adds standard capabilities - i18n, cron, tests, docs - each justified by the spec's success criteria and the constitution's principles.)
