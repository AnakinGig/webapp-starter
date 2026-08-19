# Quickstart: Production-Ready Boilerplate

**Branch**: `001-production-ready-boilerplate` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

Runnable validation scenarios proving the feature works end-to-end. This is a validation
guide, not implementation - details live in [data-model.md](data-model.md) and
[contracts/feature-toggles.md](contracts/feature-toggles.md).

## Prerequisites

- Node.js 20+, pnpm, a Convex account, and a running dev environment:
  `npx convex dev` in one terminal, `pnpm dev` in another.
- `pnpm check` passes before starting.
- Convex env vars set per the contracts doc (secrets live on the deployment).

## Scenario 1 - Fresh clone to working admin dashboard (SC-001)

1. Clone the repo and run `pnpm install`.
2. Run `npx convex dev` then `pnpm dev`.
3. Register the first account.
4. **Expected**: the first account is admin; `/dashboard` opens and lists the user;
   `/settings` opens; a second registration gets the `user` role and `/dashboard`
   redirects non-admins.

## Scenario 2 - Command palette (SC-005)

1. From any page press Ctrl+K (Cmd+K on macOS).
2. Type "s" -> Settings highlights; type "si" -> "Sign in" (if signed out).
3. **Expected**: palette opens with focused search; arrow keys + Enter navigate; Escape
   closes; signed-in-only actions are hidden for guests.

## Scenario 3 - Multi-language (FR-010 to FR-013, FR-025)

1. As a signed-in user, open Settings and switch the language to French.
2. **Expected**: UI text switches immediately (no full reload); the choice persists after
   reload; the login page (signed-out) shows the browser-locale language or English.
3. Remove the `fr` message file temporarily - **Expected**: missing keys fall back to
   English, never raw keys.
4. Add a third language file - **Expected**: it appears without code changes.

## Scenario 4 - GDPR/CCPA suite (FR-014 to FR-018, FR-026, FR-028)

1. First visit: **Expected** - consent banner with exactly two choices (Accept all /
   Essential only); non-essential storage loads only after "Accept all".
2. Footer: **Expected** - Privacy Policy, Terms, and Cookie settings links present.
3. Settings -> Profile: **Expected** - "Export JSON" downloads profile/sessions/accounts
   with credentials redacted.
4. Settings -> Profile -> Danger zone: **Expected** - account deletion asks for the password
   (password accounts) or an explicit confirm (OAuth-only), then cascades sessions/accounts
   and signs out.
5. Register form: **Expected** - minimum-age checkbox blocks submission until checked.
6. Docs: **Expected** - `docs/compliance/` templates (records of processing, breach
   response, DPA checklist) present and fill-in.

## Scenario 5 - Production hardening (FR-020 to FR-023, FR-027)

1. Change the password, toggle 2FA, or delete an account - **Expected**: a security
   notification email fires for each (dev: check function logs; prod: check inbox), gated by
   `notifySecurityEmails`.
2. As admin, create/edit/delete a user - **Expected**: each action appears in the admin
   audit-log view with actor, action, target, and timestamp.
3. Run the retention cron manually (`npx convex run <purge mutation>` with a session whose
   `expiresAt` is in the past) - **Expected**: expired sessions removed, active sessions
   untouched (FR-022).
4. Run `pnpm test` - **Expected**: critical-flow tests (sign-up incl. age gate, sign-in,
   admin guard, GDPR flows) pass.
5. Build the Docker image (`docker build .`) and follow the Docker/Netlify/Vercel guides -
   **Expected**: the app runs with documented env vars; Convex secrets set on the deployment.

## Scenario 6 - CI (SC-007)

1. Push a change - **Expected**: `ci.yaml` runs lint + typecheck + tests and blocks on
   failure.

## Expected outcomes summary

| Scenario | Success criteria covered |
|---|---|
| 1. Fresh clone -> dashboard | SC-001 |
| 2. Command palette | SC-005 |
| 3. Multi-language | SC-002, SC-003 |
| 4. GDPR suite | SC-004 |
| 5. Hardening | SC-006, SC-008 |
| 6. CI | SC-007 |

## References

- Data model: [data-model.md](data-model.md)
- Contracts: [contracts/feature-toggles.md](contracts/feature-toggles.md)
- Spec: [spec.md](spec.md)
