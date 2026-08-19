# Research: Production-Ready Boilerplate

**Branch**: `001-production-ready-boilerplate` | **Date**: 2026-08-19

Research decisions for the production-ready boilerplate feature. Each entry records the
decision, the rationale, and the alternatives evaluated.

---

## 1. Internationalization (i18n) approach

**Decision**: Use **next-intl** (App Router plugin) with JSON message files (`messages/en.json`,
`messages/fr.json`), a request config that resolves the locale from the user preference
(cookie) with browser-locale detection and an English fallback, and `NextIntlClientProvider`
in the root layout. The runtime language switcher writes the locale cookie; messages are
type-safe via the plugin's generated types.

**Rationale**:
- next-intl is the de facto standard for Next.js App Router i18n: first-class plugin
  integration (`createNextIntlPlugin`), works in both Server and Client Components
  (`getTranslations` / `useTranslations`), and handles locale resolution centrally in one
  `i18n/request.ts` file - exactly the "one mechanism, add languages via config" shape the
  spec requires (FR-010 to FR-013, FR-025).
- It provides date/number formatting and pluralization out of the box, which a hand-rolled
  dictionary would force us to rebuild.
- Message files are plain JSON: adding French (or any language) means adding a file and
  registering the locale - no code changes, satisfying FR-013.

**Alternatives considered**:
- **Custom lightweight dictionary** (a `t()` map + resolver): fewer dependencies, but no
  date/number formatting, no RTL/i18n edge handling, and the resolver logic (locale
  detection, fallback, persistence) is exactly what next-intl already solves. Rejected:
  reinventing a well-solved problem adds maintenance, not value.
- **react-i18next**: mature and popular, but its provider-based architecture fits the App
  Router less naturally than next-intl's request-scoped config, and it duplicates
  next-intl's feature set. Rejected: next-intl is more idiomatic for App Router.

**Notes**:
- Locale resolution order (FR-011): saved preference (cookie) > browser locale (if
  supported) > English fallback.
- Missing keys fall back to English automatically (next-intl `onError` + fallback locale),
  satisfying FR-012.
- Signed-out visitors get browser-locale detection; signed-in users get a persisted choice
  (cookie), satisfying the clarified US3 + FR-011.

---

## 2. Testing framework (critical-flow coverage)

**Decision**: Add **vitest + React Testing Library** with `jsdom`, `@vitejs/plugin-react`,
and `vite-tsconfig-paths`; a `vitest.config.mts`; and a `test` script (`vitest run`). Tests
cover the critical flows listed in FR-023: sign-up (incl. age-gate checkbox), sign-in,
admin guard, and GDPR self-service (consent, export, delete). CI (`ci.yaml`) runs the test
script after lint/typecheck.

**Rationale**:
- Official Next.js guidance recommends Vitest + RTL for unit/component testing of App
  Router apps; the setup is minimal (a config file + dev dependencies) and integrates with
  the existing TypeScript + pnpm toolchain.
- The project rule "No test script exists; do not invent one" is superseded for this
  feature: FR-023 and SC-007 explicitly require automated critical-flow tests, so adding
  the framework and script is a deliberate, spec-driven decision (recorded in the plan's
  Constitution Check).
- Component tests for client components (forms, dialogs, banners) run fast in CI without a
  browser.

**Alternatives considered**:
- **Jest**: equally capable but heavier configuration for ESM/TS and slower startup than
  vitest; the Next.js docs now lead with vitest. Rejected.
- **Playwright E2E only**: best for full user journeys, but slow and heavy for every CI
  push; the spec only requires critical-flow tests. Chosen approach: component-level tests
  now, with E2E left as an explicit non-goal (assumption in spec).
- **No tests**: rejected - violates FR-023/SC-007.

**Notes**:
- Async Server Components are not supported by vitest; critical flows are tested at the
  client-component level (forms, banners, guards render with mocked auth state). The
  admin-guard test asserts the dashboard component's behavior given admin vs. non-admin
  session context, not a full server render.

---

## 3. Retention purge (expired sessions, dormant accounts)

**Decision**: Implement a **Convex cron job** (`convex/crons.ts`, `crons.daily`) that runs a
mutation purging expired sessions via the better-auth component adapter
(`components.betterAuth.adapter.deleteMany` with `where: expiresAt < now`), plus an
**opt-in** dormant-account purge (disabled by default, gated by a Convex env var such as
`RETENTION_DORMANT_DAYS`). Expired sessions are purged unconditionally (default behavior);
dormant-account purge only runs when the env var is set.

**Rationale**:
- Convex has first-class cron jobs (`cronJobs()` in `convex/crons.ts`) with daily/interval
  schedules; "clean up data at a regular interval" is the documented use case.
- Auth tables live inside the better-auth component; app code MUST go through the
  component's public adapter (`deleteMany` with `where`), which is the constitution-mandated
  access path (Security & Privacy Requirements).
- Purging only sessions whose `expiresAt` has passed cannot log out active users
  (FR-022), and running it daily keeps the sessions table small.
- Opt-in dormant purge respects Principle III (toggleable features) and the spec's
  assumption that dormant-account purge is "documented but disabled by default."

**Alternatives considered**:
- **Purge on read** (delete expired sessions lazily when listing sessions): cheap, but
  leaves stale rows for users who never revisit; does not satisfy "purged by a scheduled
  retention job" (FR-022). Rejected as the primary mechanism (can still be an optimization).
- **External cron hitting an API route**: adds an unauthenticated endpoint to the public
  surface and an external dependency. Rejected - Convex crons are built in.
- **Manual/scheduled via `npx convex run`**: operationally fragile. Rejected.

**Notes**:
- Cron schedule: `crons.daily("purge expired sessions", { hourUTC: 4 }, internal...)`
  (off-peak, minute left for Convex to pick - avoids the top-of-hour).
- The purge mutation must be an `internal` mutation to avoid exposing it on the public API.

---

## 4. Deployment artifacts (Dockerfile + guides)

**Decision**: Add a **Dockerfile** using Next.js standalone output (`output: 'standalone'`)
with a multi-stage build (deps -> build -> runner), plus deployment guides for **Docker,
Netlify, and Vercel** (as docs, e.g. `docs/deployment-docker.md`, `-netlify.md`,
`-vercel.md`, linked from the README). Env vars follow the existing split: Next.js
`NEXT_PUBLIC_*` in the host environment, auth/email secrets on the Convex deployment.

**Rationale**:
- `output: 'standalone'` produces a minimal self-contained Node server, which is the
  canonical Docker-friendly Next.js setup; multi-stage keeps the image small.
- The spec (FR-027) and the clarification require Docker + Netlify + Vercel coverage;
  guides document the env-var mapping and the Convex secrets step so a fresh deploy works.

**Alternatives considered**:
- **Documentation only** (no Dockerfile): rejected by the user's clarification (Dockerfile +
  guides).
- **Platform-specific Dockerfiles** (e.g. Netlify build image): unnecessary complexity for a
  boilerplate; one generic Node image plus per-platform guides is simpler and constitution
  Principle II-compliant.

**Notes**:
- Convex is deployed separately (`npx convex deploy`); the Next.js host only needs
  `NEXT_PUBLIC_CONVEX_URL` / `NEXT_PUBLIC_CONVEX_SITE_URL` plus `NEXT_PUBLIC_APP_URL`.
- `.dockerignore` must exclude `.next`, `node_modules`, `.convex`, `.git`.

---

## 5. Security notifications (password change, 2FA, account deletion)

**Decision**: Extend the existing email helper (`convex/email.ts` -> `sendActionEmail`) and
the better-auth hooks in `convex/auth.ts` to send security notification emails for: password
change (`/change-password` after hook), 2FA enable/disable (already implemented), and
account deletion (from the delete-account mutation in `convex/users.ts`). Respect the
existing notification preference pattern (`notifyVerificationEmails` /
`notifyResetEmails`); a new `notifySecurityEmails` additional field (default true) gates
these.

**Rationale**:
- The email plumbing (Resend + dev console fallback, `ENVIRONMENT` gating) already exists
  and is reused - no new email infrastructure (FR-020).
- The 2FA enable/disable hook already demonstrates the `hooks.after` pattern in
  `convex/auth.ts`; password change uses the same endpoint-hook pattern.
- Account deletion is a Convex mutation, so its notification is sent from the mutation
  (same as the existing flows) - the security email must not depend on better-auth's
  `databaseHooks` since deletion runs in app code.

**Alternatives considered**:
- **Separate notification service**: overkill for a boilerplate. Rejected - reuse the hook
  pattern.
- **Always send, no preference**: the app already has per-category email prefs; a security
  category keeps the pattern consistent (and users who opted out of everything still get
  security-critical mail - the pref defaults to true and the client mirrors it).

**Notes**:
- Never log the token-bearing URLs in production (`ENVIRONMENT=production` gate already
  enforced in `email.ts`).
- Recipient is always the account email; a stolen-session scenario is exactly why these
  notifications exist (README roadmap: "Security notifications" item).

---

## 6. Audit log (admin actions)

**Decision**: Add an **audit log** table to `convex/schema.ts` (`webapp_audit_log` with
actor id/email, action, target id/type, timestamp) and write one entry per admin mutation in
`convex/users.ts` (create/update/delete user, role changes) inside the same mutation
transaction. Expose a read-only admin query (paginated) and an admin-only UI view in the
dashboard. Log retention follows the same retention policy as other operational data
(covered by the purge job or documented as out of scope for v1).

**Rationale**:
- Audit entries written transactionally with the action cannot be lost if the action
  succeeds (FR-021).
- Recording actor, action, target, and timestamp satisfies the spec's "who, what, and when"
  without over-engineering (no diff tracking in v1).
- Admin-only read (server-side role check, per constitution Principle IV) prevents data
  leakage.

**Alternatives considered**:
- **Full before/after diff logging**: more useful forensically but much larger scope;
  deferred (noted in spec as a nice-to-have). Rejected for v1.
- **External log service**: unnecessary dependency for a boilerplate. Rejected.

**Notes**:
- Table naming follows the app-table convention in `convex/schema.ts` (no reserved
  prefixes needed; the schema is currently empty and defines app tables).
- The dashboard UI for the audit log is a simple paginated table (shadcn/ui), consistent
  with the user-management table.

---

## 7. Consent simplification (two choices) and age gate

**Decision**: Simplify the cookie consent flow to **two choices** - "Accept all" and
"Essential only" - in `src/lib/consent.ts` and the banner component (remove the per-category
dialog), per the clarification. Add a **minimum-age confirmation checkbox** ("I am at least
13 years old") to the register form, blocking submission until checked (FR-028); no DOB
collection.

**Rationale**:
- The clarification explicitly chose two-choice consent; the current per-category dialog
  becomes a two-button banner with the same persisted cookie (`cookie-consent`), so
  existing consent-gating code keeps working.
- A checkbox satisfies the minimum-age notice without adding personal data (aligns with the
  data-minimization principle and the clarified age-gate approach).

**Alternatives considered**:
- **Keep per-category dialog**: rejected by the user's clarification (Option A).
- **Date-of-birth field**: rejected by the user's clarification (Option A) - extra personal
  data with retention obligations.

**Notes**:
- The consent cookie format can stay identical (`cookie-consent` with essential/optional
  flags) so existing consumers of `readConsent()` are unaffected.
- The age-gate checkbox is required only on the email/password register form (OAuth signup
  is a redirect flow); the legal pages state the minimum age (FR-016 update).

---

## 8. Compliance document templates (GDPR artifacts)

**Decision**: Ship generic, fill-in compliance document templates in the repo
(`docs/compliance/records-of-processing.md`, `docs/compliance/breach-response.md`,
`docs/compliance/dpa-checklist.md`) with placeholders for the consumer's entity details,
plus a README section pointing at them. These are documentation artifacts, not runtime
pages (FR-026).

**Rationale**:
- The clarification chose "mechanisms + generic compliance document templates"; templates
  in `docs/` are the lowest-friction way to ship them without cluttering the app's runtime
  routes.
- They stay generic (Principle II) - the consumer fills in legal entity, region, processor
  list, etc.

**Alternatives considered**:
- **Runtime pages under `/legal/`**: the privacy/terms pages already exist there; adding
  operational compliance docs as public pages is not needed and would leak internal
  processes. Rejected - docs/ is the right home.

**Notes**:
- The templates reference the app's actual data inventory (from README GDPR section) so
  they are grounded, not generic filler.
