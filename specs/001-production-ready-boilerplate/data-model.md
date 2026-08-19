# Data Model: Production-Ready Boilerplate

**Branch**: `001-production-ready-boilerplate` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

Entities relevant to this feature. Auth entities (User, Session, Account) already exist in
the better-auth component (`convex/betterAuth/schema.ts`); this document records the fields
this feature touches plus the new app entities.

## User (exists, extended)

Stored in the better-auth component's `user` table. The custom `role` field already exists.
This feature adds:

| Field | Type | Notes |
|---|---|---|
| `role` | string (`admin` \| `user`) | Exists; not changed |
| `notifyVerificationEmails` | boolean | Exists (default true) |
| `notifyResetEmails` | boolean | Exists (default true) |
| `notifySecurityEmails` | boolean | NEW (default true) - gates security notification emails (FR-020) |
| `language` | string | NEW (locale code, e.g. `en`/`fr`) - runtime language choice (FR-010, FR-011). For signed-in users this is persisted on the user; for signed-out visitors the choice lives in a cookie only |

Validation:
- `language` accepts only enabled locales (`en`, `fr`); unknown values fall back to English.
- `notifySecurityEmails` is a boolean; the client mirrors it with a Switch (constitution V).

## Session (exists)

Stored in the component's `session` table. No schema change; the retention cron purges rows
where `expiresAt < now` via the component adapter (FR-022). Freshness (`createdAt`) already
drives the re-auth ("Confirm access") flow.

## Account / Connected Account (exists)

Stored in the component's `account` table. No change; referenced by the GDPR export (which
redacts credentials) and account linking.

## Consent Choice (exists as cookie, no table)

The `cookie-consent` cookie stores the visitor's choice. Format unchanged by this feature;
the UI simplifies to two choices (Accept all / Essential only). Categories retained in the
cookie payload for backward compatibility:

| Field | Meaning |
|---|---|
| `essential` | Always true (session + technical cookies are strictly necessary) |
| `optional` | True if the visitor chose "Accept all" |

## Audit Log Entry (NEW app table - `convex/schema.ts`)

| Field | Type | Notes |
|---|---|---|
| `_id` | Convex id | Generated |
| `_creationTime` | number | Generated (also serves as timestamp) |
| `actorId` | string | Admin user id who performed the action |
| `actorEmail` | string | Denormalized for readable logs |
| `action` | string | e.g. `user.create`, `user.update`, `user.delete`, `user.role.change` |
| `targetId` | string | The affected user id |
| `targetEmail` | string | Denormalized target email |

Validation / rules:
- Written in the same mutation transaction as the admin action (FR-021) - never async/lossy.
- Read-only via an admin-only paginated query (server-side role check, Principle IV).
- Retention: covered by the general retention policy; not purged in v1 unless the purge job
  is extended (documented).

## Retention / Purge (no new table)

- Sessions: purged by a daily Convex cron when `expiresAt < now` (FR-022).
- Dormant accounts: opt-in via Convex env var `RETENTION_DORMANT_DAYS` (unset = disabled);
  when set, the cron deletes accounts whose `updatedAt`/last sign-in is older than N days,
  cascading sessions/accounts (per Principle III, toggleable).

## GDPR Data Export (no new table)

Generated on demand from User + Session + Account rows via the existing export query;
credentials (password hash, OAuth tokens) redacted (FR-017).

## Relationships

```
User 1---N Session          (a user's devices)
User 1---N Account          (connected OAuth providers)
User 1---N AuditLogEntry    (admin actions targeting that user)
ConsentChoice 1---1 Visitor (cookie-scoped, not linked to a User)
```

## State transitions

- **User role**: `user` -> `admin` (admin edit) | `admin` -> `user` (blocked for last admin).
- **Language**: `en` <-> `fr` (runtime switch, persisted on user or cookie).
- **Audit log entry**: append-only, no transitions.
