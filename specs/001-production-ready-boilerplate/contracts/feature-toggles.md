# Contracts: Feature Toggles & Configuration

**Branch**: `001-production-ready-boilerplate` | **Date**: 2026-08-19

This contract documents the configuration surface consumers use to enable/disable features
without code changes (constitution Principle III: opt-in, toggleable features). Env var
naming and semantics are part of the boilerplate's public contract - do not rename or
re-purpose them.

## Env vars (Next.js side - `src/env.js` + `.env.example`)

| Var | Where | Default | Effect when set |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Next.js | `http://localhost:3000` | Canonical URL for SEO metadata |
| `NEXT_PUBLIC_CONVEX_URL` | Next.js (auto) | - | Convex deployment URL (written by `npx convex dev`) |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Next.js (auto) | - | Convex site URL (written by `npx convex dev`) |

## Env vars (Convex side - set with `npx convex env set`)

| Var | Default | Effect when set |
|---|---|---|
| `SITE_URL` | - | Auth base URL (`http://localhost:3000` in dev) |
| `BETTER_AUTH_SECRET` | - | Auth secret (required in production) |
| `BETTER_AUTH_<PROVIDER>_CLIENT_ID` / `..._SECRET` | unset | Enables that OAuth provider everywhere (login buttons, Settings -> Account) |
| `RESEND_API_KEY` | unset | Enables real transactional email; unset = dev console-log fallback |
| `RESEND_EMAIL_FROM` | Resend shared domain | From-address for transactional email |
| `ENVIRONMENT` | unset (= dev) | `"production"` gates token-bearing URL logging |
| `RETENTION_DORMANT_DAYS` | unset (= disabled) | NEW: enables dormant-account purge after N days of inactivity |

## Cookie contracts

| Cookie | Scope | Payload | Purpose |
|---|---|---|---|
| `cookie-consent` | All visitors | `{ essential: true, optional: boolean }` | Consent choice (two choices: accept all / essential only). Existing `readConsent()` consumers unaffected |
| `locale` | All visitors | `"en"` \| `"fr"` | Runtime language choice (FR-010/FR-011). Written by the language switcher; read by `i18n/request.ts` |

## Language contract (i18n)

- Enabled locales: `en` (default/fallback), `fr` (v1).
- Adding a language = add `messages/<code>.json` + register the locale in the config. No
  application code changes (FR-013).
- Locale resolution order (FR-011): saved `locale` cookie > browser locale (if enabled) >
  `en` fallback.
- Missing keys fall back to `en` (FR-012); never render a raw key.

## Consent gating contract (FR-015)

- Non-essential storage/scripts MUST be gated on `readConsent().optional === true`.
- The better-auth session cookie and technical cookies are strictly necessary and exempt.
- The banner offers exactly two choices; there is no per-category dialog.

## Audit log contract (FR-021)

- Admin mutations write one entry transactionally: `actorId`, `actorEmail`, `action`,
  `targetId`, `targetEmail`, timestamp.
- Read via admin-only paginated query; never exposed to non-admins.
- Actions use the `user.<verb>` namespace (e.g. `user.create`, `user.role.change`).
