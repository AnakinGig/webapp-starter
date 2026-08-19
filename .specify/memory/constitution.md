<!--
  Sync Impact Report
  - Version change: unversioned scaffold -> 1.0.0 (initial adoption)
  - Modified principles: none (first real content)
  - Added sections: Core Principles (I-V), Security & Privacy Requirements, Development Workflow & Quality Gates, Governance
  - Removed sections: none
  - TODOs: none - all placeholders resolved; RATIFICATION_DATE set to adoption date 2026-08-19
-->

# Webapp Starter Constitution

## Core Principles

### I. Production-Ready Defaults
The boilerplate ships accounts, roles, and an admin dashboard that work out of the box - so consumers can skip the plumbing and build their actual product. Every change MUST keep the starter runnable: a fresh clone following the documented quick-start steps (README) must boot, sign up a first admin, and reach the dashboard. Features MUST NOT land half-wired or behind undocumented setup steps.

### II. Boilerplate, Not a Niche Product
This is a foundation for building other products, so the core MUST stay generic and brand-agnostic. All branding (name, logo, contact, legal entity, tagline) MUST live in `src/lib/app.ts` so consumers can rebrand in one file. Product-specific logic MUST NOT leak into the boilerplate core; it belongs in the consumer's app tables (`convex/schema.ts`) and pages.

### III. Opt-In, Toggleable Features
Small features MUST be easy to enable or disable without code changes - via environment variables (e.g. `BETTER_AUTH_<PROVIDER>_CLIENT_ID/SECRET` for OAuth, `RESEND_API_KEY` for email) or a single config flag. A disabled feature MUST hide its UI, skip its backend work, and require no code edits to re-enable. Env-driven feature catalogues (like `convex/oauth.ts`) MUST be extended in place, never hardcoded per instance.

### IV. Security-First (NON-NEGOTIABLE)
Every feature MUST pass a threat-model pass before shipping: auth bypass, privilege escalation, mass assignment, password oracles, missing rate limits, cascading deletes. Authorization MUST be enforced server-side (in Convex functions), never only in the UI. Client input MUST NOT be trusted for identity or role - derive it from the session. Sensitive endpoints MUST be rate-limited, and brute-forceable dialogs (password confirm, 2FA) MUST have tight limits. Security-sensitive responses MUST NOT reveal whether an account has a password, an email, or a provider.

### V. UX & UI Consistency
UI MUST be built from shadcn/ui components first. Form and API errors MUST render inline under the offending field (with `aria-invalid`), not in toasts; toasts are for success. Client-side validation MUST mirror server rules where safe, and cheap checks MUST run on blur so users get feedback as fast as possible - with the server always re-validating. Binary settings MUST use a Switch, and disabled buttons MUST carry a tooltip explaining why.

## Security & Privacy Requirements

- Data access is Convex-only: queries/mutations in `convex/` are the sole way data changes hands; auth tables are reached ONLY through the better-auth component's public adapter (`ctx.runQuery/runMutation` with `components.betterAuth.adapter.*`).
- Passwords are hashed by better-auth; the app MUST never store or log plaintext credentials. Tokens, reset links, and verification links MUST NOT be logged in production (`ENVIRONMENT=production` gates the dev console-log fallback).
- Account hygiene: deleting a user MUST cascade their sessions and accounts; the last admin MUST NOT be deletable or demotable; self-delete MUST re-confirm the password server-side with failed-attempt throttling.
- GDPR/CCPA posture: the app MUST support erasure (self-service delete), rectification (verified email change), portability (JSON export with credentials redacted), and consent (cookie banner gating non-essential storage). Retention and purge jobs (expired sessions, dormant accounts) MUST be documented and scheduled before production.
- App tables store only what the product needs; data minimization is a standing review item for every feature.

## Development Workflow & Quality Gates

- `pnpm check` (lint + typecheck) MUST pass before a feature is considered done; format with Prettier.
- Commit after every feature with a concise message and push to `origin` (branch detected with `git branch --show-current`). README.md MUST be updated in the same commit whenever a feature changes setup, env vars, routes, or the roadmap; new env vars MUST also be added to `.env.example` and `src/env.js`.
- Convex functions MUST use relative imports (path aliases do not resolve in the Convex bundler) and MUST NOT edit `convex/_generated/` or `convex/betterAuth/_generated/`.
- Documentation MUST use plain ASCII: the em dash is forbidden; write "-".
- The global UI/UX notes (`~/.agents/ui-ux-notes.md`, the `ui-ux` skill) MUST be read and applied before this file's project rules.

## Governance

This constitution supersedes ad-hoc practices and MUST be honored by every contributor and AI agent working in this repository. Amendments are proposed as explicit changes to this file and MUST include: the principle(s) affected, the rationale, and a version bump (MAJOR for removed or redefined principles, MINOR for added or expanded sections, PATCH for clarifications). Compliance MUST be re-checked on every feature commit - a feature that violates a principle is not complete. When in doubt, prefer the safer interpretation: security and data privacy win over convenience.

**Version**: 1.0.0 | **Ratified**: 2026-08-19 | **Last Amended**: 2026-08-19
